import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request, props: { params: Promise<{ collection: string }> }) {
    const params = await props.params;
    try {
        const db = getAdminDb();
        const { collection } = params;

        const snapshot = await db.collection(collection).get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error(`GET ${params.collection} Error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, props: { params: Promise<{ collection: string }> }) {
    const params = await props.params;
    try {
        const db = getAdminDb();
        const { collection } = params;
        const body = await request.json();

        const docRef = await db.collection(collection).add(body);

        return NextResponse.json({ id: docRef.id, ...body }, { status: 201 });
    } catch (error: any) {
        console.error(`POST ${params.collection} Error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
