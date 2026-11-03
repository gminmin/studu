import 'server-only';

import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length) return getApp();

  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  let projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  let credential;

  // Firebase Admin v13 validates the original service-account field names.
  if (clientEmail || privateKey) {
    if (!clientEmail || !privateKey) {
      throw new Error('Set both FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.');
    }
    credential = cert({
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    } as unknown as Parameters<typeof cert>[0]);
  } else if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!serviceAccount.client_email || !serviceAccount.private_key) throw new Error('Service account fields are missing.');
      projectId = projectId || serviceAccount.project_id;
      credential = cert({
        project_id: projectId,
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
      } as unknown as Parameters<typeof cert>[0]);
    } catch (error) {
      throw new Error(`FIREBASE_ADMIN_SERVICE_ACCOUNT is invalid: ${(error as Error).message}`);
    }
  } else if (process.env.VERCEL) {
    throw new Error('FIREBASE_ADMIN_CREDENTIALS_MISSING: Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in Vercel Production.');
  } else {
    credential = applicationDefault();
  }

  return initializeApp({ credential, projectId });
}

export async function verifyFirebaseIdToken(idToken: string): Promise<string> {
  const decodedToken = await getAuth(getAdminApp()).verifyIdToken(idToken);
  return decodedToken.uid;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function getFirebaseAdminDiagnostics() {
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '';
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT?.trim() || '';
  let serviceAccountJsonParseable = false;
  let serviceAccountHasRequiredFields = false;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as {
        client_email?: string;
        private_key?: string;
      };
      serviceAccountJsonParseable = true;
      serviceAccountHasRequiredFields = Boolean(serviceAccount.client_email && serviceAccount.private_key);
    } catch {
      // Report only the shape; never expose the secret value.
    }
  }

  return {
    vercel: Boolean(process.env.VERCEL),
    projectId,
    projectIdPresent: Boolean(projectId),
    clientEmailPresent: Boolean(clientEmail),
    clientEmailDomain: clientEmail.includes('@') ? clientEmail.split('@').pop() : null,
    privateKeyPresent: Boolean(privateKey),
    privateKeyLength: privateKey.length,
    privateKeyHasPemBegin: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
    privateKeyHasPemEnd: privateKey.includes('-----END PRIVATE KEY-----'),
    privateKeyHadLiteralEscapes: rawPrivateKey.includes('\\n'),
    serviceAccountJsonPresent: Boolean(serviceAccountJson),
    serviceAccountJsonParseable,
    serviceAccountHasRequiredFields,
  };
}
