const Project = require('../models/Project');
const User = require('../models/User');
const axios = require('axios');

// GET /api/projects
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/projects/user/:userId
const getProjectByUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Search by project reference OR by TL name (fullname) OR by username pattern (fallback)
        const usernamePattern = user.username.replace(/_/g, ' ');
        const projects = await Project.find({
            $or: [
                { _id: user.project },
                { tl: user.fullname },
                { tl: { $regex: new RegExp('^' + usernamePattern + '$', 'i') } }
            ]
        }).sort({ createdAt: -1 });

        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/projects
const createProject = async (req, res) => {
    const {
        company, project, prob_statement, requirements,
        deadline, period_alloted, tl, tlPassword
    } = req.body;

    console.log(`Attempting to create project: ${project} for company: ${company}`);

    try {
        // Validation
        if (!company || !project || !tl) {
            return res.status(400).json({ message: 'Missing required fields: company, project, and tl are mandatory.' });
        }

        // Call RAG to recommend members
        let recommendedMembers = [];
        try {
            console.log('Fetching team recommendations from RAG service...');
            const ragRes = await axios.post(`${process.env.RAG_API}/recommend-members`, {
                requirements: requirements || '',
                deadline: deadline || period_alloted || ''
            });
            recommendedMembers = ragRes.data.recommended_members || [];
            console.log(`RAG recommendations: ${recommendedMembers.length} members found.`);
        } catch (ragErr) {
            console.warn('RAG service unavailable, proceeding without recommendations:', ragErr.message);
        }

        const assigned_date = new Date().toISOString().split('T')[0];

        const newProject = new Project({
            project,
            company,
            tl,
            members: recommendedMembers,
            assigned_date,
            period_alloted: period_alloted || deadline || '',
            completion_date: '',
            prob_statement: prob_statement || '',
            requirements: requirements || '',
            status: 'Pending'
        });

        await newProject.save();
        console.log(`✅ Project saved: ${newProject._id}`);

        // Create TL user account if password provided
        if (tlPassword) {
            const username = tl.toLowerCase().replace(/\s+/g, '_');
            const existingUser = await User.findOne({ username });

            if (!existingUser) {
                const tlUser = new User({
                    username,
                    password: tlPassword,
                    fullname: tl,
                    role: 'user',
                    project: newProject._id
                });
                await tlUser.save();
                console.log(`✅ TL account created: ${username}`);
            } else {
                console.log(`ℹ️ TL account ${username} already exists. Updating project ref.`);
                existingUser.project = newProject._id;
                existingUser.fullname = tl; // Ensure fullname is set
                await existingUser.save();
            }
        }

        res.status(201).json({
            message: 'Project created successfully',
            project: newProject,
            tlCredentials: { username: tl.toLowerCase().replace(/\s+/g, '_') },
            recommendedMembers
        });
    } catch (err) {
        console.error('❌ Error creating project:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getProjects, getProjectById, getProjectByUser, createProject, updateProject, deleteProject };
