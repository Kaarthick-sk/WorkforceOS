const axios = require('axios');
const Project = require('../models/Project');

// POST /api/rag/recommend-members
const recommendMembers = async (req, res) => {
    try {
        const response = await axios.post(`${process.env.RAG_API}/recommend-members`, req.body);
        res.json(response.data);
    } catch (err) {
        res.status(503).json({ message: 'RAG service unavailable', error: err.message });
    }
};

// POST /api/rag/analyze-project
const analyzeProject = async (req, res) => {
    try {
        const projects = await Project.find();
        console.log("📊 Projects count for RAG:", projects.length);
        
        const payload = {
            ...req.body,
            projects: projects
        };
        
        const response = await axios.post(`${process.env.RAG_API}/analyze-project`, payload);
        res.json(response.data);
    } catch (err) {
        res.status(503).json({ message: 'RAG service unavailable', error: err.message });
    }
};

// POST /api/rag/project-summary
const projectSummary = async (req, res) => {
    try {
        const response = await axios.post(`${process.env.RAG_API}/project-summary`, req.body);
        res.json(response.data);
    } catch (err) {
        res.status(503).json({ message: 'RAG service unavailable', error: err.message });
    }
};

module.exports = { recommendMembers, analyzeProject, projectSummary };
