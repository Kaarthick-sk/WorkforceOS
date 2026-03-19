const axios = require('axios');

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
        const response = await axios.post(`${process.env.RAG_API}/analyze-project`, req.body);
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
