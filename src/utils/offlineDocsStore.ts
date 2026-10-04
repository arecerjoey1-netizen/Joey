/**
 * Offline Document Storage & Caching Layer
 * Allows full offline access, editing, and syncing.
 */

export interface OfflineDoc {
  id: string;
  name: string;
  type: 'pdf' | 'markdown' | 'text' | 'sheet';
  size: string;
  content: string;
  lastModified: number;
  cachedOffline: boolean;
  driveFileId?: string;
  driveSynced?: boolean;
}

const STORAGE_KEY = 'whisperpulse_offline_documents_v1';

const INITIAL_DOCS: OfflineDoc[] = [
  {
    id: 'doc-1',
    name: 'End_to_End_Protocol_v4.pdf',
    type: 'pdf',
    size: '1.4 MB',
    content: `# WhisperPulse End-to-End Encryption Specification

## 1. Overview
All one-on-one and group voice calls and media exchanges use the Double Ratchet Algorithm combined with Curve25519, AES-256-GCM, and SHA-512 authentication.

## 2. Ephemeral Media
Disappearing media assets are stored only in volatile device RAM with strict memory wiping upon expiration. View-once items are immediately shredded post-render.

## 3. Cross-Platform Sync
Ephemeral state counters and ratchet public keys synchronize across verified desktop and mobile endpoints over cryptographically authenticated secure channels.

## 4. Biometric Binding
Cryptographic private keys are protected by the hardware secure enclave / WebAuthn biometric layer.`,
    lastModified: Date.now() - 1000 * 60 * 60 * 3,
    cachedOffline: true,
  },
  {
    id: 'doc-2',
    name: 'Executive_Meeting_Notes.md',
    type: 'markdown',
    size: '48 KB',
    content: `# Security Steering Committee Notes

- **Date:** October 2026
- **Status:** Approved

### Action Items
1. Enforce 24-hour default disappearing messages for financial discussions.
2. Verify Safety Numbers for all international external participants.
3. Test offline document cache resilience during field operations.
4. Integrate real-time spell-check with haptic confirmation.`,
    lastModified: Date.now() - 1000 * 60 * 60 * 12,
    cachedOffline: true,
  },
  {
    id: 'doc-3',
    name: 'Cross_Device_Sync_Architecture.sheet',
    type: 'sheet',
    size: '110 KB',
    content: `Device,Status,Last Sync,Encryption State
iPhone 16 Pro,Primary,Active Now,Verified 🔒
MacBook Pro M3,Secondary,2 min ago,Verified 🔒
Pixel 9 Fold,Linked,Yesterday,Verified 🔒
Web App (Chrome),Linked,Active Now,Verified 🔒`,
    lastModified: Date.now() - 1000 * 60 * 60 * 24,
    cachedOffline: true,
  },
];

export function getOfflineDocs(): OfflineDoc[] {
  if (typeof window === 'undefined') return INITIAL_DOCS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DOCS));
      return INITIAL_DOCS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_DOCS;
  }
}

export function saveOfflineDoc(doc: OfflineDoc): OfflineDoc[] {
  const current = getOfflineDocs();
  const index = current.findIndex((d) => d.id === doc.id);
  let updated: OfflineDoc[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...doc, lastModified: Date.now() };
  } else {
    updated = [doc, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save offline document:', e);
  }
  return updated;
}

export function deleteOfflineDoc(id: string): OfflineDoc[] {
  const current = getOfflineDocs();
  const updated = current.filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete offline document:', e);
  }
  return updated;
}
