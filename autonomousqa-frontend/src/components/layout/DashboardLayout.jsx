import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            document.body.style.background =
                `radial-gradient(800px circle at ${e.clientX}px ${e.clientY}px, rgba(212,168,83,0.065), transparent 60%), #09090b`;
        };
        const handleMouseLeave = () => {
            document.body.style.background = '#09090b';
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            document.body.style.background = '';
        };
    }, []);

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
                position: 'relative',
                zIndex: 1,
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
