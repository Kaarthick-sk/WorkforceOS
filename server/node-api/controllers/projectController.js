const Project = require('../models/Project');
const Employee = require('../models/Employee');
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

// POST /api/projects/recommend
const recommendTeam = async (req, res) => {
    const { requirements, deadline } = req.body;
    try {
        // Collect all employee statuses for RAG filtering
        const employees = await Employee.find();
        const employeeStatuses = employees.map(emp => {
            const isTL = emp.active_projects.some(ap => ap.role === 'TL');
            const fullCommitment = emp.active_projects.some(ap => ap.commitment === 'full');
            const partialCommitment = emp.active_projects.some(ap => ap.commitment === 'partial');
            const veryLessCommitment = emp.active_projects.some(ap => ap.commitment === 'very_less');

            let commitment = 'none';
            if (fullCommitment) commitment = 'full';
            else if (partialCommitment) commitment = 'partial';
            else if (veryLessCommitment) commitment = 'very_less';

            return { name: emp.name, is_tl: isTL, commitment };
        });

        const ragRes = await axios.post(`${process.env.RAG_API}/recommend-members`, {
            requirements: requirements || '',
            deadline: deadline || '',
            employee_statuses: employeeStatuses
        });

        res.json(ragRes.data);
    } catch (err) {
        console.error('RAG service error:', err.message);
        res.status(500).json({ message: 'RAG service unavailable' });
    }
};

// POST /api/projects
const createProject = async (req, res) => {
    const {
        company, project, prob_statement, requirements,
        deadline, period_alloted, tl, tlPassword, members
    } = req.body;

    try {
        if (!company || !project || !tl) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // PART 3 & 10: TL CONSTRAINT LOGIC
        // A user can be TL of ONLY ONE active project
        const tlEmployee = await Employee.findOne({ name: tl });
        if (tlEmployee && tlEmployee.active_projects.some(p => p.role === 'TL')) {
            return res.status(400).json({ message: `${tl} is already a TL in another active project.` });
        }

        const assigned_date = new Date().toISOString().split('T')[0];

        // Format members correctly
        const formattedMembers = (members || []).map(m => ({
            name: typeof m === 'string' ? m : m.name,
            priority: m.priority || 0,
            commitment: m.commitment || 'partial',
            role: m.role || 'member'
        }));

        // Add TL to members with "full" commitment
        formattedMembers.push({
            name: tl,
            priority: 100,
            commitment: 'full',
            role: 'TL'
        });

        const newProject = new Project({
            project, company, tl,
            members: formattedMembers,
            assigned_date,
            period_alloted: period_alloted || deadline || '',
            prob_statement: prob_statement || '',
            requirements: requirements || '',
            status: 'Active'
        });

        await newProject.save();

        // PART 5.2: Update Employee records
        for (const m of formattedMembers) {
            const emp = await Employee.findOne({ name: m.name });
            if (emp) {
                emp.active_projects.push({
                    project_id: newProject._id,
                    role: m.role,
                    commitment: m.commitment
                });

                // Update engagement status
                if (m.commitment === 'full') emp.engagement_level = 'strongly engaged';
                else if (m.commitment === 'partial' && emp.engagement_level !== 'strongly engaged') emp.engagement_level = 'moderate engagement';
                else if (m.commitment === 'very_less' && !['strongly engaged', 'moderate engagement'].includes(emp.engagement_level)) emp.engagement_level = 'minimal engagement';

                await emp.save();
            }
        }

        // Create TL user account if password provided
        if (tlPassword) {
            const username = tl.toLowerCase().replace(/\s+/g, '_');
            const existingUser = await User.findOne({ username });
            if (!existingUser) {
                const tlUser = new User({
                    username, password: tlPassword, fullname: tl, role: 'user', project: newProject._id
                });
                await tlUser.save();
            } else {
                existingUser.project = newProject._id;
                existingUser.fullname = tl;
                await existingUser.save();
            }
        }

        res.status(201).json({
            message: 'Project created successfully',
            project: newProject,
            tlCredentials: { username: tl.toLowerCase().replace(/\s+/g, '_') }
        });
    } catch (err) {
        console.error('❌ Error creating project:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/projects/:id/allocation
const updateAllocation = async (req, res) => {
    const { members } = req.body;
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.members = members;
        await project.save();

        // Sync with Employee records
        for (const m of members) {
            const emp = await Employee.findOne({ name: m.name });
            if (emp) {
                const pIdx = emp.active_projects.findIndex(p => p.project_id.toString() === req.params.id);
                if (pIdx > -1) {
                    emp.active_projects[pIdx].commitment = m.commitment;
                }

                // Re-calculate engagement status based on all active projects
                const commitments = emp.active_projects.map(p => p.commitment);
                if (commitments.includes('full')) emp.engagement_level = 'strongly engaged';
                else if (commitments.includes('partial')) emp.engagement_level = 'moderate engagement';
                else if (commitments.includes('very_less')) emp.engagement_level = 'minimal engagement';
                else emp.engagement_level = 'Not Assigned';

                await emp.save();
            }
        }

        res.json({ message: 'Allocation updated successfully', project });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const oldProject = await Project.findById(req.params.id);
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // PART 6: PROJECT COMPLETION LOGIC
        if (project.status === 'Completed' && oldProject.status !== 'Completed') {
            project.completion_date = new Date().toISOString().split('T')[0];
            await project.save();

            // Free all employees
            for (const m of project.members) {
                const emp = await Employee.findOne({ name: m.name });
                if (emp) {
                    emp.active_projects = emp.active_projects.filter(p => p.project_id.toString() !== req.params.id);

                    // Re-calculate engagement
                    const commitments = emp.active_projects.map(p => p.commitment);
                    if (commitments.includes('full')) emp.engagement_level = 'strongly engaged';
                    else if (commitments.includes('partial')) emp.engagement_level = 'moderate engagement';
                    else if (commitments.includes('very_less')) emp.engagement_level = 'minimal engagement';
                    else emp.engagement_level = 'Not Assigned';

                    await emp.save();
                }
            }
        }

        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (project) {
            // Free all employees before deleting
            for (const m of project.members) {
                const emp = await Employee.findOne({ name: m.name });
                if (emp) {
                    emp.active_projects = emp.active_projects.filter(p => p.project_id.toString() !== req.params.id);
                    await emp.save();
                }
            }
        }
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    getProjects, getProjectById, getProjectByUser, createProject,
    updateProject, deleteProject, recommendTeam, updateAllocation
};
