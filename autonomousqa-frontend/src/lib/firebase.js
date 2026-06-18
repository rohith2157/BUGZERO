import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAR3F5xeMDiiogltI829RyxWw19TUhg6TQ",
  authDomain: "bugzero-a04e1.firebaseapp.com",
  projectId: "bugzero-a04e1",
  storageBucket: "bugzero-a04e1.firebasestorage.app",
  messagingSenderId: "483649525986",
  appId: "1:483649525986:web:f64635ee47d7545e0f66bb",
  measurementId: "G-7B3PD0Q1H1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();

const githubProvider = new GithubAuthProvider();
// CRITICAL: Request 'repo' scope to read the user's Github Repositories
githubProvider.addScope('repo');

export { app, analytics, auth, googleProvider, githubProvider };
