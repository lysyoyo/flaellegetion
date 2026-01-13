import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Handle private key newlines for Vercel/Env
    privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
};

export function initAdmin() {
    if (getApps().length === 0) {
        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            initializeApp({
                credential: cert(serviceAccount),
                // storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET
            });
            console.log("Firebase Admin Initialized with Env Vars");
        } else {
            // Fallback for local dev without env vars set (might rely on GOOGLE_APPLICATION_CREDENTIALS if properly set, 
            // but prefer explicit error to avoid confusion)
            console.warn("Missing Firebase Admin Env Vars. Backend operations may fail.");
        }
    }
    return getApp();
}

export function getAdminDb() {
    initAdmin();
    return getFirestore();
}
