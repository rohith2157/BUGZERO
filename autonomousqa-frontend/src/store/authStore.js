import { create } from 'zustand';

function safeParseUser() {
    try {
        return JSON.parse(localStorage.getItem('aq_user') || 'null');
    } catch {
        localStorage.removeItem('aq_user');
        return null;
    }
}

function getToken() {
    try { return localStorage.getItem('aq_token'); } catch { return null; }
}

export const useAuthStore = create((set, get) => ({
    user: safeParseUser(),
    token: getToken(),
    isAuthenticated: !!getToken(),

    setAuth: (user, token) => {
        try {
            localStorage.setItem('aq_user', JSON.stringify(user));
            localStorage.setItem('aq_token', token);
        } catch {}
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        try {
            localStorage.removeItem('aq_user');
            localStorage.removeItem('aq_token');
        } catch {}
        set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
        const user = { ...get().user, ...updates };
        try {
            localStorage.setItem('aq_user', JSON.stringify(user));
        } catch {}
        set({ user });
    },
}));
