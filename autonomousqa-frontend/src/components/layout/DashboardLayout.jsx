import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuthStore } from '../../store/authStore';
import { InfiniteGridBackground } from '../ui/infinite-grid';

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div style={{
                flex: 1,
                marginLeft: collapsed ? 68 : 240,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <TopBar />

                <InfiniteGridBackground gridSize={65}>
                    <main style={{
                        flex: 1,
                        padding: '28px 32px',
                        overflowY: 'auto',
                        width: '100%',
                        height: '100%'
                    }}>
                        <Outlet />
                    </main>
                </InfiniteGridBackground>

            </div>
        </div>
    );
}
