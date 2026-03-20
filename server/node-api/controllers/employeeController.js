const Employee = require('../models/Employee');

// GET /api/employees
const getEmployees = async (req, res) => {
    const { eligible_tl } = req.query;
    try {
        let filter = {};
        if (eligible_tl === 'true') {
            // Exclude employees who have an active project with role 'TL'
            filter = {
                'active_projects': {
                    $not: {
                        $elemMatch: { role: 'TL' }
                    }
                }
            };
        }
        const employees = await Employee.find(filter).sort({ createdAt: -1 });
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/employees
const createEmployee = async (req, res) => {
    const { name, email, skills, experience, role, availability, past_projects } = req.body;
    try {
        const existing = await Employee.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Employee with this email already exists' });

        const employee = new Employee({ name, email, skills, experience, role, availability, past_projects });
        await employee.save();
        res.status(201).json(employee);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getEmployees, createEmployee, deleteEmployee };
