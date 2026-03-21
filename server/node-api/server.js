require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const dns = require('dns');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const ragRoutes = require('./routes/ragRoutes');
const Employee = require('./models/Employee');
const Project = require('./models/Project');

const app = express();

// Force IPv4 resolution for localhost issues on Windows
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/rag', ragRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'Node API running' }));

const PORT = process.env.PORT || 5001;

// Connect MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, async () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);

            // Auto-sync employees to RAG on startup (with robust retry)
            const syncRAG = async (retries = 10) => {
                try {
                    const ragUrl = process.env.RAG_API || 'http://127.0.0.1:8000';
                    
                    // Sync Employees
                    const employees = await Employee.find();
                    if (employees.length > 0) {
                        await axios.post(`${ragUrl}/load-employees`, employees);
                        console.log(`🤖 Synced ${employees.length} employees to RAG service`);
                    }

                    // Sync Projects
                    const projects = await Project.find();
                    if (projects.length > 0) {
                        await axios.post(`${ragUrl}/load-projects`, projects);
                        console.log(`📊 Synced ${projects.length} projects to RAG service`);
                    }
                } catch (err) {
                    if (retries > 0) {
                        console.log(`⏳ RAG sync failed (${err.message}). Retrying in 5s... (${retries} left)`);
                        setTimeout(() => syncRAG(retries - 1), 5000);
                    } else {
                        console.warn(`⚠️ RAG sync finally failed (${process.env.RAG_API || 'http://127.0.0.1:8000'}): ${err.message}`);
                    }
                }
            };

            // Give RAG service time to initialize its model
            setTimeout(() => syncRAG(), 3000);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
