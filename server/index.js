if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  globalThis.crypto = webcrypto;
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const { Project, Task, Lead } = require('./models/Schemas');
const notionService = require('./services/notionService');

const connectDB = require('./config/db');

// Initialize MongoDB
connectDB();

let isConnected = () => mongoose.connection.readyState === 1;

// System Status Logger Middleware
app.use((req, res, next) => {
  const dbStatus = isConnected() ? '✅' : '❌';
  console.log(`${new Date().toLocaleTimeString()} | DB: ${dbStatus} | ${req.method} ${req.url}`);
  next();
});

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);



// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Agentic PM API is running' });
});

const plannerAgent = require('./services/agents/plannerAgent');

app.post('/api/plan', async (req, res) => {
  const { idea } = req.body;
  if (!idea) return res.status(400).json({ error: 'Idea is required' });
  
  try {
    const plan = await plannerAgent.generatePlan(idea);
    // Save to DB only if connected
    let savedProject = plan;
    if (isConnected()) {
      savedProject = await Project.create(plan);
    }
    // Sync to Notion
    const notionPageId = await notionService.createProjectPage(plan);
    
    res.json({ success: true, plan: savedProject, notionPageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const taskAgent = require('./services/agents/taskAgent');

app.post('/api/tasks', async (req, res) => {
  const { plan, projectId, notionPageId } = req.body;
  try {
    const tasks = await taskAgent.breakdownTasks(plan);
    
    // Save to DB only if connected
    if (isConnected() && projectId) {
      const tasksWithId = tasks.map(t => ({ ...t, projectId }));
      await Task.insertMany(tasksWithId);
    }
    
    // Sync to Notion if notionPageId exists
    if (notionPageId) {
      await notionService.syncTasks(notionPageId, tasks);
    }

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const codeAgent = require('./services/agents/codeAgent');
const reviewAgent = require('./services/agents/reviewAgent');

app.post('/api/generate-code', async (req, res) => {
  const { task, techStack } = req.body;
  try {
    const code = await codeAgent.generateCode(task, techStack);
    const review = await reviewAgent.reviewCode(code, task);
    res.json({ success: true, code, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const crmAgent = require('./services/agents/crmAgent');

app.post('/api/crm/score', async (req, res) => {
  const { leadData } = req.body;
  try {
    const analysis = await crmAgent.scoreLead(leadData);
    // Save lead to DB only if connected
    if (isConnected()) {
      await Lead.create({ ...leadData, ...analysis });
    }
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const emailService = require('./services/emailService');

app.post('/api/crm/communicate', async (req, res) => {
  const { lead, context } = req.body;
  try {
    const message = await crmAgent.generateCommunication(lead, context);
    
    // Send email to lead
    let emailResult = { success: false, message: 'No email address provided' };
    if (lead.email) {
      emailResult = await emailService.sendFollowUp({
        to: lead.email,
        leadName: lead.name,
        subject: `Follow-up regarding your inquiry`,
        body: message
      });
    }
    
    res.json({ success: true, message, emailSent: emailResult.success, emailInfo: emailResult.message || emailResult.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

