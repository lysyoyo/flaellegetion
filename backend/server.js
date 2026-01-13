require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// For simplicity, using the web config, but ideally use service account
// --- FIREBASE INITIALIZATION ---

let credential;

// OPTION 1: Try to load from specific JSON file (Robust Method)
try {
  const serviceAccount = require('./flaellegetion-firebase-adminsdk-fbsvc-248b71a430.json');
  console.log("[INFO] Using Service Account File: flaellegetion-firebase-adminsdk-fbsvc-248b71a430.json");
  credential = admin.credential.cert(serviceAccount);
} catch (e) {
  console.log("[INFO] No JSON file found, trying Environment Variables...");

  // OPTION 2: Environment Variables (Fallback)
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
    console.error("[CRITICAL] No private key found in ENV or JSON file.");
  } else {
    credential = admin.credential.cert({
      type: "service_account",
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
    });
  }
}

admin.initializeApp({
  credential: credential,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET // Ensure storage bucket is used if needed
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const cors = require('cors');
const multer = require('multer');
const { getStorage } = require('firebase-admin/storage');

app.use(cors());

// Health Check / Root Route
app.get('/', (req, res) => {
  res.send('Gestion Flaelle API is running');
});

// Configure Multer for memory storage (file uploads)
const upload = multer({ storage: multer.memoryStorage() });

// --- Transactional Endpoints ---

// POST /api/transactions/vente
app.post('/api/transactions/vente', async (req, res) => {
  const { produit_id, quantite, prix_unitaire, prix_total, benefice, arrivage_id, produit_nom } = req.body;

  if (!produit_id || !quantite) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.runTransaction(async (t) => {
      const productRef = db.collection('produits').doc(produit_id);
      const productDoc = await t.get(productRef);

      if (!productDoc.exists) {
        throw new Error("Product does not exist");
      }

      const currentStock = productDoc.data().quantite || 0;
      if (currentStock < quantite) {
        throw new Error(`Stock insufficient. Available: ${currentStock}`);
      }

      // 1. Decrement Stock
      t.update(productRef, { quantite: currentStock - quantite });

      // 2. transform dates
      const now = new Date().toISOString();
      const firestoreNow = admin.firestore.Timestamp.now();

      // 3. Create Sale Record
      const saleRef = db.collection('ventes').doc();
      const saleData = {
        produit_id,
        produit_nom: produit_nom || productDoc.data().nom,
        quantite,
        prix_unitaire,
        prix_total,
        benefice,
        date: now,
        created_at: firestoreNow
      };

      if (arrivage_id) {
        saleData.arrivage_id = arrivage_id;
      }

      t.set(saleRef, saleData);
    });

    res.status(200).json({ status: "success", message: "Vente recorded successfully" });
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions/achat
app.post('/api/transactions/achat', async (req, res) => {
  const { produit_id, quantite, prix_unitaire, prix_total, produit_nom, arrivage_id } = req.body;

  if (!produit_id || !quantite) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.runTransaction(async (t) => {
      const productRef = db.collection('produits').doc(produit_id);
      const productDoc = await t.get(productRef);

      if (!productDoc.exists) {
        throw new Error("Product does not exist");
      }

      const currentStock = productDoc.data().quantite || 0;

      // 1. Update Stock & Cost Price
      // Note: prix_unitaire here acts as the NEW cost price (buying price)
      t.update(productRef, {
        quantite: currentStock + quantite,
        prix_achat: prix_unitaire // Updating to latest purchase price
      });

      // 2. Create Purchase Record
      const now = new Date().toISOString();
      const firestoreNow = admin.firestore.Timestamp.now();

      const purchaseRef = db.collection('achats').doc();
      t.set(purchaseRef, {
        produit_id,
        produit_nom: produit_nom || productDoc.data().nom,
        quantite,
        prix_unitaire,
        prix_total,
        date: now,
        created_at: firestoreNow
      });
    });

    res.status(200).json({ status: "success", message: "Achat recorded successfully" });
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Generic CRUD Endpoints ---

// GET (Read all or single)
app.get('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const snapshot = await admin.firestore().collection(collection).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    console.error(`[GET ${req.params.collection} Error]:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const doc = await admin.firestore().collection(collection).doc(id).get();
    if (!doc.exists) return res.status(404).send('Not Found');
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST (Create)
app.post('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const result = await admin.firestore().collection(collection).add(req.body);
    res.status(201).json({ id: result.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (Update)
app.put('/api/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    await admin.firestore().collection(collection).doc(id).update(req.body);
    res.json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (Remove)
app.delete('/api/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    await admin.firestore().collection(collection).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- UPLOAD ROUTE ---
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const bucket = getStorage().bucket();
    const filename = `uploads/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (e) => {
      console.error(e);
      res.status(500).json({ error: e.message });
    });

    stream.on('finish', async () => {
      // Make the file public (optional, logic depends on security rules)
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      res.json({ url: publicUrl });
    });

    stream.end(req.file.buffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add more routes as needed

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});