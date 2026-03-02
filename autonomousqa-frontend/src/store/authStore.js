import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('aq_user') || 'null'),
    token: localStorage.getItem('aq_token') || null,
    isAuthenticated: !!localStorage.getItem('aq_token'),

    setAuth: (user, token) => {
        localStorage.setItem('aq_user', JSON.stringify(user));
        localStorage.setItem('aq_token', token);
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('aq_user');
        localStorage.removeItem('aq_token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
        const user = { ...get().user, ...updates };
        localStorage.setItem('aq_user', JSON.stringify(user));
        set({ user });
    },
}));
