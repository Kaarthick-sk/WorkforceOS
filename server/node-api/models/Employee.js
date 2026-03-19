const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    skills: { type: String },
    experience: { type: Number, default: 0 },
    role: { type: String },
    availability: { type: String, default: 'Available' },
    past_projects: { type: String },
    active_projects: [{
        project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        role: { type: String },
        commitment: { type: String }
    }],
    engagement_level: { type: String, enum: ['strongly engaged', 'moderate engagement', 'minimal engagement', 'Not Assigned'], default: 'Not Assigned' }

    past_projects: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
