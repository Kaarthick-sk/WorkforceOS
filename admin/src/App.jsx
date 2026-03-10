import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import CreateProject from './pages/CreateProject';
import ProjectList from './pages/ProjectList';

function AdminRoute({ children }) {
    const token = localStorage.getItem('adminToken');
    return token ? children : <Navigate to="/" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AdminLogin />} />
                <Route
                    path="/dashboard"
                    element={<AdminRoute><AdminDashboard /></AdminRoute>}
                />
                <Route
                    path="/employees"
                    element={<AdminRoute><EmployeeManagement /></AdminRoute>}
                />
                <Route
                    path="/projects"
                    element={<AdminRoute><ProjectList /></AdminRoute>}
                />
                <Route
                    path="/create-project"
                    element={<AdminRoute><CreateProject /></AdminRoute>}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
