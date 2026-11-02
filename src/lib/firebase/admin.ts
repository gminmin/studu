import 'server-only';

import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length) return getApp();

  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  let projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  let credential;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!serviceAccount.client_email || !serviceAccount.private_key) throw new Error('Service account fields are missing.');
      projectId = projectId || serviceAccount.project_id;
      credential = cert({
        projectId,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      });
    } catch (error) {
      throw new Error(`FIREBASE_ADMIN_SERVICE_ACCOUNT is invalid: ${(error as Error).message}`);
    }
  } else if (clientEmail || privateKey) {
    if (!clientEmail || !privateKey) {
      throw new Error('Set both FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.');
    }
    credential = cert({ projectId, clientEmail, privateKey });
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
