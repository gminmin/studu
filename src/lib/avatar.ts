export const AVATAR_CHARACTERS = [
  { id: 'student', label: '학생', emoji: '🧑‍🎓' },
  { id: 'astronaut', label: '우주인', emoji: '🧑‍🚀' },
  { id: 'fox', label: '여우', emoji: '🦊' },
  { id: 'cat', label: '고양이', emoji: '🐱' },
  { id: 'panda', label: '판다', emoji: '🐼' },
  { id: 'frog', label: '개구리', emoji: '🐸' },
] as const;

export const AVATAR_BACKGROUNDS = [
  { id: 'teal', label: '청록', color: '#99F6E4' },
  { id: 'blue', label: '파랑', color: '#BFDBFE' },
  { id: 'pink', label: '분홍', color: '#FBCFE8' },
  { id: 'amber', label: '노랑', color: '#FDE68A' },
  { id: 'slate', label: '회색', color: '#E2E8F0' },
] as const;

export type AvatarCharacterId = typeof AVATAR_CHARACTERS[number]['id'];
export type AvatarBackgroundId = typeof AVATAR_BACKGROUNDS[number]['id'];

export interface AvatarProfile {
  characterId: AvatarCharacterId;
  backgroundId: AvatarBackgroundId;
}

export const DEFAULT_AVATAR_PROFILE: AvatarProfile = {
  characterId: 'student',
  backgroundId: 'teal',
};
