import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const db = getAdminDb();
        const arrivageId = params.id;

        if (!arrivageId) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        console.log(`Starting cascade delete for Arrivage: ${arrivageId}`);

        // 1. Delete the Arrivage document itself
        await db.collection('arrivages').doc(arrivageId).delete();

        // 2. Delete linked Products (Stock)
        const productsSnapshot = await db.collection('produits').where('arrivage_id', '==', arrivageId).get();
        const productBatch = db.batch();
        let productCount = 0;
        productsSnapshot.docs.forEach((doc) => {
            productBatch.delete(doc.ref);
            productCount++;
        });
        if (productCount > 0) {
            await productBatch.commit();
            console.log(`Deleted ${productCount} linked products.`);
        }

        // 3. Delete linked Sales (Ventes)
        const salesSnapshot = await db.collection('ventes').where('arrivage_id', '==', arrivageId).get();
        const salesBatch = db.batch();
        let salesCount = 0;
        salesSnapshot.docs.forEach((doc) => {
            salesBatch.delete(doc.ref);
            salesCount++;
        });
        if (salesCount > 0) {
            await salesBatch.commit();
            console.log(`Deleted ${salesCount} linked sales.`);
        }

        // 4. Delete linked Purchases/Expenses (Achats) if any
        const achatsSnapshot = await db.collection('achats').where('arrivage_id', '==', arrivageId).get();
        const achatsBatch = db.batch();
        let achatsCount = 0;
        achatsSnapshot.docs.forEach((doc) => {
            achatsBatch.delete(doc.ref);
            achatsCount++;
        });
        if (achatsCount > 0) {
            await achatsBatch.commit();
            console.log(`Deleted ${achatsCount} linked purchases.`);
        }

        return NextResponse.json({
            success: true,
            message: `Arrivage deleted along with ${productCount} products and ${salesCount} sales.`
        });

    } catch (error: any) {
        console.error('Error deleting arrivage:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
