import { create } from 'zustand';
import { signInWithPopup, signOut as firebaseSignOut, GithubAuthProvider } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import { auth as authApi } from '../lib/api';

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
    githubAccessToken: localStorage.getItem('aq_github_token') || null,
    isAuthenticated: !!getToken(),

    setAuth: (user, token, githubToken = null) => {
        try {
            localStorage.setItem('aq_user', JSON.stringify(user));
            localStorage.setItem('aq_token', token);
            if (githubToken) {
                localStorage.setItem('aq_github_token', githubToken);
            }
        } catch {}
        set({ user, token, githubAccessToken: githubToken || get().githubAccessToken, isAuthenticated: true });
    },

    loginWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            const idToken = await firebaseUser.getIdToken();

            // Exchange Firebase token for gateway JWT
            const gatewayResult = await authApi.firebaseLogin({
                idToken,
                name: firebaseUser.displayName,
                photo: firebaseUser.photoURL,
            });

            get().setAuth(gatewayResult.user, gatewayResult.token, gatewayResult.githubAccessToken);
            return { success: true };
        } catch (error) {
            console.error("Google login failed", error);
            return { success: false, error: error.message };
        }
    },

    loginWithGithub: async () => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const credential = GithubAuthProvider.credentialFromResult(result);
            const githubToken = credential.accessToken;
            
            const firebaseUser = result.user;
            const idToken = await firebaseUser.getIdToken();
            
            // Exchange Firebase token for gateway JWT, passing along the GitHub access token
            const gatewayResult = await authApi.firebaseLogin({
                idToken,
                name: firebaseUser.displayName,
                photo: firebaseUser.photoURL,
                githubAccessToken: githubToken,
            });

            get().setAuth(gatewayResult.user, gatewayResult.token, githubToken || gatewayResult.githubAccessToken);
            return { success: true };
        } catch (error) {
            console.error("GitHub login failed", error);
            return { success: false, error: error.message };
        }
    },

    logout: async () => {
        try {
            await firebaseSignOut(auth);
            localStorage.removeItem('aq_user');
            localStorage.removeItem('aq_token');
            localStorage.removeItem('aq_github_token');
        } catch {}
        set({ user: null, token: null, githubAccessToken: null, isAuthenticated: false });
    },

    disconnectGithub: () => {
        try {
            localStorage.removeItem('aq_github_token');
        } catch {}
        set({ githubAccessToken: null });
    },

    updateUser: (updates) => {
        const user = { ...get().user, ...updates };
        try {
            localStorage.setItem('aq_user', JSON.stringify(user));
        } catch {}
        set({ user });
    },
}));
