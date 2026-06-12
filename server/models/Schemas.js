const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  objectives: [String],
  techStack: [String],
  phases: [{
    name: String,
    description: String,
    keyDeliverables: [String]
  }],
  estimatedTimeline: String,
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: String,
  description: String,
  phase: String,
  priority: String,
  status: { type: String, default: 'todo' }
});

const LeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  inquiry: String,
  score: Number,
  category: String,
  reasoning: String,
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Project: mongoose.model('Project', ProjectSchema),
  Task: mongoose.model('Task', TaskSchema),
  Lead: mongoose.model('Lead', LeadSchema),
  User: mongoose.model('User', UserSchema)
};
