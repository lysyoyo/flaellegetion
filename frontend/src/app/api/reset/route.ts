import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function DELETE() {
    try {
        const db = getAdminDb();
        const collections = ['produits', 'arrivages', 'ventes', 'achats', 'transactions'];

        const batch = db.batch();
        let operationCount = 0;

        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
                operationCount++;
            });
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ message: "All data reset successfully", count: operationCount });
    } catch (error: any) {
        console.error("Factory Reset Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
