import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Facebook Auth Provider
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Get the ID token
        const idToken = await user.getIdToken();
        
        return {
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                provider: 'google'
            },
            idToken
        };
    } catch (error) {
        // Silently ignore popup close errors from COOP policies
        if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup')) {
            console.log('Popup closed by user');
            throw new Error('Sign in cancelled');
        }
        console.error('Google sign-in error:', error);
        throw error;
    }
};

// Sign in with Facebook
export const signInWithFacebook = async () => {
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        const user = result.user;
        
        // Get the ID token
        const idToken = await user.getIdToken();
        
        return {
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                provider: 'facebook'
            },
            idToken
        };
    } catch (error) {
        // Silently ignore popup close errors from COOP policies
        if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup')) {
            console.log('Popup closed by user');
            throw new Error('Sign in cancelled');
        }
        console.error('Facebook sign-in error:', error);
        throw error;
    }
};

// Sign out
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

// Get current user
export const getCurrentUser = () => {
    return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};

export { auth, googleProvider, facebookProvider };
export default app;