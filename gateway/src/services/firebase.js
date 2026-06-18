import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Option 1: Service account JSON file (recommended for production)
// Option 2: GOOGLE_APPLICATION_CREDENTIALS env var
// Option 3: Application Default Credentials (when running on GCP)

let initialized = false;

function initFirebase() {
  if (initialized) return;
  
  try {
    // Try to initialize with service account from env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      // Initialize with project ID only (works for token verification with public keys)
      admin.initializeApp({
        projectId: 'bugzero-a04e1',
      });
    }
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (err) {
    if (err.code === 'app/duplicate-app') {
      initialized = true;
    } else {
      console.error('⚠️  Firebase Admin SDK init failed:', err.message);
      console.error('   Set FIREBASE_SERVICE_ACCOUNT env var with the service account JSON');
    }
  }
}

initFirebase();

/**
 * Verify a Firebase ID token and return the decoded claims
 * @param {string} idToken - Firebase ID token from the client
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
export async function verifyFirebaseToken(idToken) {
  if (!initialized) initFirebase();
  return admin.auth().verifyIdToken(idToken);
}

export default admin;
