const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    skills: { type: String },
    experience: { type: Number, default: 0 },
    role: { type: String },
    availability: { type: String, default: 'Available' },
    past_projects: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
