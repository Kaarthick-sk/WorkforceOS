const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check for hardcoded admin first
        if (username === 'admin' && password === 'admin') {
            const token = jwt.sign(
                { id: 'admin', username: 'admin', role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            return res.json({
                token,
                user: { id: 'admin', username: 'admin', role: 'admin' }
            });
        }

        const user = await User.findOne({ username }).populate('project');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                fullname: user.fullname,
                role: user.role,
                project: user.project
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { login };
