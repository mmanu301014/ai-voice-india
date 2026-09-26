/**
 * AI VOICE INDIA — Firebase Initialization
 *
 * Initializes Firebase app and Google Auth provider safely.
 * Gracefully handles missing or unconfigured VITE_FIREBASE_* environment variables
 * so the frontend application never crashes on load.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let auth = null;
let googleProvider = null;

function getFirebaseAuth() {
  if (auth) return auth;
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey || apiKey.includes('your_firebase')) {
    return null;
  }
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    return auth;
  } catch (err) {
    console.warn('[Firebase] Auth initialization skipped:', err?.message || err);
    return null;
  }
}

// Initial safe attempt
try {
  getFirebaseAuth();
} catch (e) {
  console.warn('[Firebase] Initial load safely caught:', e);
}

export { auth };

/**
 * signInWithGoogle — opens Google account picker popup.
 * Returns the Firebase ID token string if successful.
 */
export async function signInWithGoogle() {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth || !googleProvider) {
    throw new Error('Google Sign-In is not configured. Please add VITE_FIREBASE_API_KEY to your environment variables.');
  }

  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const user = result.user;

    const email = user.email;
    if (!email) {
      throw new Error('Google account did not provide an email address. Please use an account with a verified email.');
    }

    const idToken = await user.getIdToken();
    console.log('[Firebase] Google sign-in successful for:', email);

    return {
      idToken,
      email,
      name:     user.displayName  || email.split('@')[0],
      photoURL: user.photoURL     || '',
    };
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      const cancelled = new Error('Sign-in was cancelled.');
      cancelled.code = 'CANCELLED';
      throw cancelled;
    }
    if (err.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error during Google sign-in. Please check your internet connection.');
    }
    if (!err.code) throw err;
    console.error('[Firebase] Google sign-in error:', err.code, err.message);
    throw new Error('Google sign-in failed. Please try again.');
  }
}

/**
 * firebaseLogout — signs the user out of Firebase session.
 * Call alongside clearing the backend JWT.
 */
export async function firebaseLogout() {
  try {
    const firebaseAuth = getFirebaseAuth();
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
  } catch {
    // Silently ignore — local JWT cleanup is what matters
  }
}
