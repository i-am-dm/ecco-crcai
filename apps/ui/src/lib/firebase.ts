import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { config } from '@/config';

// Initialize Firebase only if config is provided
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

try {
  if (config.firebase.apiKey && config.firebase.projectId) {
    app = initializeApp(config.firebase);
    auth = getAuth(app);
  } else {
    console.warn('Firebase configuration not found. Auth features will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { auth };
