require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const ragRoutes = require('./routes/ragRoutes');

const app = express();

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

const axios = require('axios');
const Employee = require('./models/Employee');

const PORT = process.env.PORT || 5001;

// Connect MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, async () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);

            // Auto-sync employees to RAG on startup
            try {
                const employees = await Employee.find();
                if (employees.length > 0) {
                    const ragUrl = process.env.RAG_API || 'http://localhost:8000';
                    await axios.post(`${ragUrl}/load-employees`, employees);
                    console.log(`🤖 Synced ${employees.length} employees to RAG service at ${ragUrl}`);
                }
            } catch (err) {
                console.warn('⚠️ RAG sync on startup failed - ensure RAG service is running.');
            }
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
