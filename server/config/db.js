/**
 * MongoDB Connection Configuration
 * Uses DNS-over-HTTPS (Google DoH) to bypass restricted networks
 * that block both *.mongodb.net DNS and port 53 to external DNS servers
 */

const mongoose = require('mongoose');
const https = require('https');
const dns = require('dns');

/**
 * Resolve a DNS record using Google DNS-over-HTTPS (port 443)
 * Works even on networks that block port 53 (traditional DNS)
 */
function dohResolve(name, type = 'A') {
    return new Promise((resolve, reject) => {
        const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.Answer && parsed.Answer.length > 0) {
                        resolve(parsed.Answer);
                    } else {
                        reject(new Error(`No ${type} records found for ${name}`));
                    }
                } catch (e) {
                    reject(new Error(`DoH parse error: ${e.message}`));
                }
            });
        }).on('error', (e) => {
            reject(new Error(`DoH request failed: ${e.message}`));
        });
    });
}

/**
 * Resolve hostname to IPv4 address via DoH, following CNAME chains
 */
async function resolveToIPv4(hostname) {
    const answers = await dohResolve(hostname, 'A');
    // Find the actual A record (type 1) among possible CNAME records (type 5)
    const aRecord = answers.find(a => a.type === 1);
    if (aRecord) return aRecord.data;
    // If no type-1 found, look for something that looks like an IP
    for (const a of answers) {
        if (/^\d+\.\d+\.\d+\.\d+$/.test(a.data)) return a.data;
    }
    throw new Error(`No IPv4 address found for ${hostname}`);
}

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    // Save originals
    const originalResolveSrv = dns.resolveSrv;
    const originalResolveTxt = dns.resolveTxt;
    const originalResolve4 = dns.resolve4;
    const originalResolve = dns.resolve;
    const originalLookup = dns.lookup;

    // The MongoDB driver uses dns.promises.resolve(address, 'SRV') and dns.promises.resolve(address, 'TXT')
    // dns.promises wraps the callback-based dns functions, so we need to patch BOTH
    const originalPromisesResolve = dns.promises.resolve;
    const originalPromisesLookup = dns.promises.lookup;

    // Override callback-based DNS functions
    dns.resolveSrv = (hostname, callback) => {
        dohResolve(hostname, 'SRV')
            .then(answers => {
                const records = answers.map(a => {
                    const parts = a.data.split(' ');
                    return {
                        priority: parseInt(parts[0]),
                        weight: parseInt(parts[1]),
                        port: parseInt(parts[2]),
                        name: parts[3].replace(/\.$/, ''),
                    };
                });
                callback(null, records);
            })
            .catch(err => callback(err));
    };

    dns.resolveTxt = (hostname, callback) => {
        dohResolve(hostname, 'TXT')
            .then(answers => {
                const records = answers.map(a => [a.data.replace(/"/g, '')]);
                callback(null, records);
            })
            .catch(err => callback(err));
    };

    dns.resolve4 = (hostname, ...args) => {
        const callback = args[args.length - 1];
        resolveToIPv4(hostname)
            .then(ip => callback(null, [ip]))
            .catch(err => callback(err));
    };

    dns.resolve = (hostname, rrtype, callback) => {
        if (typeof rrtype === 'function') {
            callback = rrtype;
            rrtype = 'A';
        }
        if (rrtype === 'SRV') {
            dns.resolveSrv(hostname, callback);
        } else if (rrtype === 'TXT') {
            dns.resolveTxt(hostname, callback);
        } else if (rrtype === 'A') {
            dns.resolve4(hostname, callback);
        } else {
            originalResolve(hostname, rrtype, callback);
        }
    };

    // Override dns.promises.resolve - THIS is what the MongoDB driver actually calls
    dns.promises.resolve = async (hostname, rrtype) => {
        if (rrtype === 'SRV') {
            const answers = await dohResolve(hostname, 'SRV');
            return answers.map(a => {
                const parts = a.data.split(' ');
                return {
                    priority: parseInt(parts[0]),
                    weight: parseInt(parts[1]),
                    port: parseInt(parts[2]),
                    name: parts[3].replace(/\.$/, ''),
                };
            });
        } else if (rrtype === 'TXT') {
            const answers = await dohResolve(hostname, 'TXT');
            return answers.map(a => [a.data.replace(/"/g, '')]);
        } else if (rrtype === 'A' || !rrtype) {
            const ip = await resolveToIPv4(hostname);
            return [ip];
        }
        return originalPromisesResolve(hostname, rrtype);
    };

    // Override dns.lookup for hostname->IP resolution (used by TCP/TLS connections)
    dns.lookup = (hostname, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        if (hostname.includes('mongodb.net')) {
            resolveToIPv4(hostname)
                .then(ip => callback(null, ip, 4))
                .catch(() => originalLookup(hostname, options, callback));
        } else {
            originalLookup(hostname, options, callback);
        }
    };

    // Override dns.promises.lookup too
    dns.promises.lookup = async (hostname, options) => {
        if (hostname.includes('mongodb.net')) {
            try {
                const ip = await resolveToIPv4(hostname);
                return { address: ip, family: 4 };
            } catch {
                return originalPromisesLookup(hostname, options);
            }
        }
        return originalPromisesLookup(hostname, options);
    };

    try {
        if (!uri) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        console.log("🔄 Connecting to MongoDB (via DNS-over-HTTPS)...");

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            family: 4,
        });

        console.log("✅ MongoDB Connected Successfully!");
        console.log(`🌐 Host: ${conn.connection.host}`);
        console.log(`📂 Database: ${conn.connection.name}`);

    } catch (error) {
        console.error("\n❌ MONGODB CONNECTION FAILED");
        console.error("====================================");

        if (error.message.includes("authentication")) {
            console.error("👉 Problem: Wrong username/password");
            console.error("👉 Fix: Check Database Access in MongoDB Atlas");
        }
        else if (error.message.includes("querySrv") || error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
            console.error("👉 Problem: DNS resolution failed");
            console.error("👉 Fix:");
            console.error("   1. Check internet connectivity");
            console.error("   2. Verify your Atlas cluster name in MONGODB_URI");
        }
        else if (error.message.includes("timed out") || error.message.includes("ReplicaSetNoPrimary")) {
            console.error("👉 Problem: Network cannot reach MongoDB Atlas");
            console.error("👉 Fix:");
            console.error("   1. Use mobile hotspot or VPN");
            console.error("   2. Ensure 0.0.0.0/0 is in IP whitelist on Atlas");
        }
        else {
            console.error("👉 Error:", error.message);
        }

        console.error("====================================\n");

        if (process.env.NODE_ENV === "production") {
            process.exit(1);
        } else {
            console.warn("⚠️ Running without DB connection (DEV MODE)");
        }
    } finally {
        // Restore original DNS functions
        dns.resolveSrv = originalResolveSrv;
        dns.resolveTxt = originalResolveTxt;
        dns.resolve4 = originalResolve4;
        dns.resolve = originalResolve;
        dns.lookup = originalLookup;
        dns.promises.resolve = originalPromisesResolve;
        dns.promises.lookup = originalPromisesLookup;
    }
};

module.exports = connectDB;