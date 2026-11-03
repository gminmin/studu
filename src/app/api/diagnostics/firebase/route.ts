import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, getFirebaseAdminDiagnostics } from '@/lib/firebase/admin';

export async function GET() {
  const diagnostics = getFirebaseAdminDiagnostics();

  try {
    const [authUsers, firestoreDocuments] = await Promise.all([
      getAdminAuth().listUsers(1),
      getAdminFirestore().collection('users').limit(1).get(),
    ]);

    return NextResponse.json({
      ok: true,
      diagnostics,
      connection: {
        auth: 'ok',
        firestore: 'ok',
        authSampleCount: authUsers.users.length,
        firestoreSampleCount: firestoreDocuments.size,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const typedError = error as { code?: string; message?: string };
    return NextResponse.json({
      ok: false,
      diagnostics,
      connection: {
        auth: 'unknown',
        firestore: 'unknown',
      },
      error: {
        code: typedError.code || null,
        message: typedError.message || 'Unknown Firebase Admin error',
      },
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
