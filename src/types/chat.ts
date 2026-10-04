export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface DocumentMeta {
  name: string;
  size: string;
  type: string;
  content?: string;
  driveId?: string;
  cachedOffline?: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  isEncrypted: boolean;
  isDisappearing?: boolean;
  disappearingDuration?: number; // in seconds: 5, 10, 86400, etc.
  expiresAt?: number;
  isViewOnce?: boolean;
  isViewed?: boolean;
  mediaType?: MediaType;
  mediaUrl?: string;
  documentMeta?: DocumentMeta;
  audioDuration?: number;
  ttsAudioBase64?: string;
  reactions?: Record<string, string[]>;
}

export interface GroupParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  status?: string;
}

export interface GroupPrivacySettings {
  adminsOnlySend: boolean;
  adminsOnlyEdit: boolean;
  whoCanAdd: 'all' | 'admins';
  readReceipts: boolean;
  disappearingDefault: number; // 0, 5, 10, 86400
}

export interface ChatConversation {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
  disappearingDefault: number;
  privacySettings?: GroupPrivacySettings;
  participants?: GroupParticipant[];
  isPinned?: boolean;
  isMuted?: boolean;
  isGeminiBot?: boolean;
  geminiModel?: string;
  geminiRole?: string;
  verifiedSafetyNumber?: boolean;
  safetyCodeMatrix?: string[];
  lastMessage?: ChatMessage;
  customWallpaper?: string;
  customWallpaperDoodle?: boolean;
}

export interface LinkedDevice {
  id: string;
  name: string;
  platform: 'mac' | 'windows' | 'ios' | 'android' | 'web';
  location: string;
  lastActive: string;
  isCurrent: boolean;
  status: 'active' | 'syncing' | 'idle';
}

export interface CallSession {
  id: string;
  chatId: string;
  contactName: string;
  contactAvatar: string;
  isIncoming: boolean;
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  isMuted: boolean;
  isSpeakerOn: boolean;
  isHold: boolean;
  durationSeconds: number;
  isGeminiLive: boolean;
  isE2EVerified: boolean;
}
