import { create } from 'zustand';

function getInitialTheme() {
    try {
        const saved = localStorage.getItem('aq-theme');
        if (saved) return saved;
    } catch {}
    
    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

const useThemeStore = create((set) => ({
    theme: getInitialTheme(),
    toggleTheme: () => set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem('aq-theme', next);
        } catch {}
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
    }),
    initTheme: () => {
        const saved = getInitialTheme();
        document.documentElement.setAttribute('data-theme', saved);
        return set({ theme: saved });
    },
}));

export default useThemeStore;
