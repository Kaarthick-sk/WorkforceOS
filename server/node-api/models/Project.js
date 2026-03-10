const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  project: { type: String, required: true },
  company: { type: String, required: true },
  tl: { type: String, required: true },
  members: { type: [String], default: [] },
  assigned_date: { type: String },
  period_alloted: { type: String },
  completion_date: { type: String, default: '' },
  prob_statement: { type: String },
  requirements: { type: String },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
