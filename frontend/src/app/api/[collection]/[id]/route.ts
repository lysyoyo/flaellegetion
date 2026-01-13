import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request, props: { params: Promise<{ collection: string; id: string }> }) {
    const params = await props.params;
    try {
        const db = getAdminDb();
        const { collection, id } = params;

        const doc = await db.collection(collection).doc(id).get();
        if (!doc.exists) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ collection: string; id: string }> }) {
    const params = await props.params;
    try {
        const db = getAdminDb();
        const { collection, id } = params;
        const body = await request.json();

        await db.collection(collection).doc(id).update(body);

        return NextResponse.json({ id, ...body });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ collection: string; id: string }> }) {
    const params = await props.params;
    try {
        const db = getAdminDb();
        const { collection, id } = params;

        await db.collection(collection).doc(id).delete();

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
