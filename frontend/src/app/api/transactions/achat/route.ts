import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const db = getAdminDb();
        const body = await request.json();
        const { produit_id, quantite, prix_unitaire, prix_total, produit_nom, arrivage_id } = body;

        if (!produit_id || !quantite) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.runTransaction(async (t) => {
            const productRef = db.collection('produits').doc(produit_id);
            const productDoc = await t.get(productRef);

            if (!productDoc.exists) {
                throw new Error("Product does not exist");
            }

            const currentStock = productDoc.data()?.quantite || 0;

            // 1. Update Stock & Cost Price
            // Note: prix_unitaire here acts as the NEW cost price (buying price)
            t.update(productRef, {
                quantite: currentStock + quantite,
                prix_achat: prix_unitaire // Updating to latest purchase price
            });

            // 2. Create Purchase Record
            const now = new Date().toISOString();

            const purchaseRef = db.collection('achats').doc();
            const purchaseData: any = {
                produit_id,
                produit_nom: produit_nom || productDoc.data()?.nom,
                quantite,
                prix_unitaire,
                prix_total,
                date: now,
                created_at: Timestamp.now()
            };

            // Link to Arrivage if provided (IMPORTANT)
            if (arrivage_id) {
                purchaseData.arrivage_id = arrivage_id;
            }

            t.set(purchaseRef, purchaseData);
        });

        return NextResponse.json({ status: "success", message: "Achat recorded successfully" });

    } catch (error: any) {
        console.error("Transaction API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
