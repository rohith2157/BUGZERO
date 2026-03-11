import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
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
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AnimatePresence mode="wait">
                    <Routes>
                        {/* Landing (no sidebar) */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />

                        {/* Dashboard routes (with sidebar) - Protected */}
                        <Route element={<ProtectedRoute />}>
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
                        </Route>

                        {/* Catch-all redirect to dashboard if logged in, otherwise landing */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </AnimatePresence>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
