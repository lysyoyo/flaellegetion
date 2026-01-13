import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const db = getAdminDb();
        const body = await request.json();
        const { produit_id, quantite, prix_unitaire, prix_total, benefice, arrivage_id, produit_nom } = body;

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
            if (currentStock < quantite) {
                throw new Error(`Stock insufficient. Available: ${currentStock}`);
            }

            // 1. Decrement Stock
            t.update(productRef, { quantite: currentStock - quantite });

            // 2. Create Sale Record
            const now = new Date().toISOString();

            const saleRef = db.collection('ventes').doc();
            const saleData: any = {
                produit_id,
                produit_nom: produit_nom || productDoc.data()?.nom,
                quantite,
                prix_unitaire,
                prix_total,
                benefice,
                date: now,
                created_at: Timestamp.now()
            };

            if (arrivage_id) {
                saleData.arrivage_id = arrivage_id;
            }

            t.set(saleRef, saleData);
        });

        return NextResponse.json({ status: "success", message: "Vente recorded successfully" });

    } catch (error: any) {
        console.error("Transaction API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
