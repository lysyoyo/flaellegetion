import { initializeApp, getApps, cert, getApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin/app'; // Or just rely on module imports

const formatPrivateKey = (key: string | undefined) => {
    if (!key) return undefined;

    // Remove quotes if they exist at the start/end
    let cleanKey = key.replace(/^['"]|['"]$/g, '');

    // Replace literal escaped newlines with actual newlines
    cleanKey = cleanKey.replace(/\\n/g, '\n');

    // If it's still a single line but looks like a key, force insert newlines
    if (!cleanKey.includes('\n') && cleanKey.includes('PRIVATE KEY')) {
        cleanKey = cleanKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
            .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
    }

    return cleanKey;
};

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || process.env.PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY)
};

export function initAdmin() {
    if (getApps().length === 0) {
        // Option 1: Env Var for Service Account File (e.g., Docker/Render with file path)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
            // It's a file path
            try {
                initializeApp({
                    credential: applicationDefault()
                });
                console.log("Firebase Admin Initialized with GOOGLE_APPLICATION_CREDENTIALS (File)");
                return getApp();
            } catch (error) {
                console.error("Failed to init with applicationDefault:", error);
            }
        }

        // Option 2: Full JSON in Env Var (FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS content)
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
            (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{') ? process.env.GOOGLE_APPLICATION_CREDENTIALS : null);

        if (serviceAccountJson) {
            try {
                const creds = JSON.parse(serviceAccountJson);
                initializeApp({
                    credential: cert(creds)
                });
                console.log("Firebase Admin Initialized with JSON Env Var");
                return getApp();
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
                // Fallthrough to individual vars
            }
        }

        // Option 3: Manual Env Vars (Individual fields)
        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            try {
                initializeApp({
                    credential: cert(serviceAccount),
                });
                console.log("Firebase Admin Initialized with Individual Env Vars");
            } catch (e) {
                console.error("Failed to init with Individual Env Vars:", e);
            }
        } else {
            console.warn("Missing Firebase Admin Env Vars. Backend operations may fail.");
            console.warn("Checked: PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY");
        }
    }
    return getApp();
}

export function getAdminDb() {
    initAdmin();
    return getFirestore();
}
