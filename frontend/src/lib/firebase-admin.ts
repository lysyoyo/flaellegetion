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
        // Option 1: Env Var for Service Account File (e.g., Docker/Render with file)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            try {
                // If it's a path, let's try to trust custom logic or just use cert(require(path)) if valid
                // But generally firebase-admin auto-detects GOOGLE_APPLICATION_CREDENTIALS if we use applicationDefault()
                // OR we can just do:
                initializeApp({
                    credential: applicationDefault()
                });
                console.log("Firebase Admin Initialized with GOOGLE_APPLICATION_CREDENTIALS");
                return getApp();
            } catch (error) {
                console.error("Failed to init with applicationDefault:", error);
                // Fallthrough to manual env vars
            }
        }

        // Option 2: Manual Env Vars (Vercel/Local without file)
        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            initializeApp({
                credential: cert(serviceAccount),
                // storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET
            });
            console.log("Firebase Admin Initialized with Env Vars");
        } else {
            console.warn("Missing Firebase Admin Env Vars. Backend operations may fail.");
        }
    }
    return getApp();
}

export function getAdminDb() {
    initAdmin();
    return getFirestore();
}
