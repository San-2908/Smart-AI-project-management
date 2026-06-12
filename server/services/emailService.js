const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Using Gmail SMTP — configure EMAIL_USER and EMAIL_PASS in .env
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Use App Password if 2FA is enabled
      }
    });
  }

  async sendFollowUp({ to, leadName, subject, body }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  EMAIL_USER or EMAIL_PASS not configured in .env');
      return { success: false, message: 'Email credentials not configured. Add EMAIL_USER and EMAIL_PASS to .env' };
    }

    const mailOptions = {
      from: `"Agentic CRM" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || `Follow-up: ${leadName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
          <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 20px; color: white;">🚀 Agentic CRM</h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.7);">Automated Follow-up</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">Hi ${leadName},</p>
            <div style="color: #cbd5e1; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${body}</div>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="color: #64748b; font-size: 11px; margin: 0;">This email was sent via Agentic CRM System</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();
