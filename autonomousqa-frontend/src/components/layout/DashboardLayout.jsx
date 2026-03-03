import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);

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
                <main style={{
                    flex: 1,
                    padding: '28px 32px',
                    overflowY: 'auto',
                }} className="grid-pattern">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
