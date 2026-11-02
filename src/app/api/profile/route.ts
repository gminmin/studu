import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore, verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { AVATAR_BACKGROUNDS, AVATAR_CHARACTERS, DEFAULT_AVATAR_PROFILE, type AvatarProfile } from '@/lib/avatar';

async function getUid(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/, '') || '';
  if (!token) throw new Error('UNAUTHORIZED');
  return verifyFirebaseIdToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const snapshot = await getAdminFirestore().doc(`users/${uid}/profile/main`).get();
    const saved = snapshot.data();
    const characterId = AVATAR_CHARACTERS.some((item) => item.id === saved?.characterId)
      ? saved!.characterId
      : DEFAULT_AVATAR_PROFILE.characterId;
    const backgroundId = AVATAR_BACKGROUNDS.some((item) => item.id === saved?.backgroundId)
      ? saved!.backgroundId
      : DEFAULT_AVATAR_PROFILE.backgroundId;
    return NextResponse.json({ profile: { characterId, backgroundId } satisfies AvatarProfile });
  } catch (error) {
    if ((error as Error)?.message === 'UNAUTHORIZED') return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    console.error('API /api/profile GET error:', error);
    return NextResponse.json({ error: '프로필을 불러오지 못했어요.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const { characterId, backgroundId } = await req.json();
    if (!AVATAR_CHARACTERS.some((item) => item.id === characterId) || !AVATAR_BACKGROUNDS.some((item) => item.id === backgroundId)) {
      return NextResponse.json({ error: '아바타 설정을 확인해주세요.' }, { status: 400 });
    }
    const profile: AvatarProfile = { characterId, backgroundId };
    await getAdminFirestore().doc(`users/${uid}/profile/main`).set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ profile });
  } catch (error) {
    if ((error as Error)?.message === 'UNAUTHORIZED') return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    console.error('API /api/profile POST error:', error);
    return NextResponse.json({ error: '아바타를 저장하지 못했어요.' }, { status: 500 });
  }
}
