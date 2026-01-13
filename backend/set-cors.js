require('dotenv').config();
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');

// --- FIREBASE INITIALIZATION (Copied from server.js) ---
let credential;

try {
    const serviceAccount = require('./flaellegetion-firebase-adminsdk-fbsvc-248b71a430.json');
    console.log("[INFO] Using Service Account File: flaellegetion-firebase-adminsdk-fbsvc-248b71a430.json");
    credential = admin.credential.cert(serviceAccount);
} catch (e) {
    console.log("[INFO] No JSON file found, trying Environment Variables...");
    // Fallback to env vars if needed, similar to server.js
    const formatPrivateKey = (key) => {
        if (!key) return undefined;
        let cleanKey = key.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
        if (!cleanKey.includes('\n')) {
            cleanKey = cleanKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
                .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
        }
        return cleanKey;
    };

    const privateKey = formatPrivateKey(process.env.PRIVATE_KEY);
    if (!privateKey) {
        console.error("[CRITICAL] No private key found.");
        process.exit(1);
    } else {
        credential = admin.credential.cert({
            projectId: process.env.PROJECT_ID,
            clientEmail: process.env.CLIENT_EMAIL,
            privateKey: privateKey,
        });
    }
}

admin.initializeApp({
    credential: credential,
    credential: credential,
    storageBucket: 'flaellegetion.appspot.com' // Canonical bucket name for Admin SDK
});

// Try to load frontend .env for shared vars
require('dotenv').config({ path: '../frontend/.env' });

async function setCors() {
    try {
        const storage = getStorage();
        const bucket = storage.bucket();

        console.log("Attempting to list actual buckets in project...");
        try {
            // Access the underlying GCS client
            const [buckets] = await bucket.storage.getBuckets();
            console.log(`Found ${buckets.length} buckets:`);
            buckets.forEach(b => console.log(` - ${b.name}`));

            if (buckets.length > 0) {
                console.log(`Using existing bucket: ${buckets[0].name}`);
                await configureBucket(buckets[0]);
            } else {
                console.log("No buckets found! Please go to Firebase Console > Storage and create a bucket.");
            }
        } catch (e) {
            console.error("List buckets failed (permissions?):", e.message);
            // Fallback
            console.log(`Fallback: Trying default name: ${bucket.name}`);
            await configureBucket(bucket);
        }
    } catch (error) {
        console.error("Error setting CORS:", error);
    }
}

async function configureBucket(bucket) {
    console.log(`Configuring CORS for bucket: ${bucket.name}`);
    try {
        await bucket.setCorsConfiguration([
            {
                origin: ["*"],
                method: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
                responseHeader: ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],
                maxAgeSeconds: 3600
            }
        ]);
        console.log("CORS configuration set successfully!");
    } catch (e) {
        console.error("Failed to set CORS on " + bucket.name, e);
    }
}


setCors();
