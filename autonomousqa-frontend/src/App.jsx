import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import DashboardLayout from './components/layout/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewTest from './pages/NewTest';
import LiveTest from './pages/LiveTest';
import Report from './pages/Report';
import Compliance from './pages/Compliance';
import Performance from './pages/Performance';
import Playbooks from './pages/Playbooks';
import Settings from './pages/Settings';
import History from './pages/History';

function App() {
    useEffect(() => {
        const handleMouseMove = (e) => {
            document.querySelectorAll('.glass-card').forEach((card) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            });
        };
        const handleMouseLeave = (e) => {
            if (e.target.classList?.contains('glass-card')) {
                e.target.style.setProperty('--mouse-x', '-9999px');
                e.target.style.setProperty('--mouse-y', '-9999px');
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave, true);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave, true);
        };
    }, []);

    return (
        <BrowserRouter>
            <AnimatePresence mode="wait">
                <Routes>
                    {/* Landing (no sidebar) */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />

                    {/* Dashboard routes (with sidebar) */}
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/tests/new" element={<NewTest />} />
                        <Route path="/tests/:id" element={<LiveTest />} />
                        <Route path="/tests/:id/report" element={<Report />} />
                        <Route path="/tests/:id/compliance" element={<Compliance />} />
                        <Route path="/tests/:id/performance" element={<Performance />} />
                        <Route path="/playbooks" element={<Playbooks />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/history" element={<History />} />
                    </Route>

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </BrowserRouter>
    );
}

export default App;
