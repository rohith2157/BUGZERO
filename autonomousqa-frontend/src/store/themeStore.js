import { create } from 'zustand';

const useThemeStore = create((set) => ({
    theme: localStorage.getItem('aq-theme') || 'dark',
    toggleTheme: () => set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('aq-theme', next);
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
    }),
    initTheme: () => {
        const saved = localStorage.getItem('aq-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        return set({ theme: saved });
    },
}));

export default useThemeStore;
