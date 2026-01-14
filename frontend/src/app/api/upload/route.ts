import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        initAdmin(); // Ensure Admin SDK is initialized

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_STORAGE_BUCKET);
        const fileRef = bucket.file(filename);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        await fileRef.makePublic();

        // Construct public URL
        // Format: https://storage.googleapis.com/<bucket-name>/<filename>
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
