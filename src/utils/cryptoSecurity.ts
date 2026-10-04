/**
 * End-to-End Encryption, Safety Number Generator, and Key Verification
 */

export function generateSafetyNumber(userId1: string, userId2: string): string[] {
  // Deterministic 60-digit number based on IDs
  let hash = 0;
  const combined = [userId1, userId2].sort().join('::');
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }

  const digits: string[] = [];
  let seed = Math.abs(hash) || 987654321;
  for (let i = 0; i < 12; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const chunk = String(Math.floor((seed / 233280) * 90000 + 10000));
    digits.push(chunk);
  }
  return digits;
}

export function generateFingerprint(): string {
  const chars = '0123456789ABCDEF';
  let str = '';
  for (let i = 0; i < 16; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
    if ((i + 1) % 4 === 0 && i !== 15) str += ' ';
  }
  return str;
}

export async function encryptClientMessage(text: string, secretKey = 'WhisperPulse-Key'): Promise<string> {
  // Simple base64 + XOR token for simulated wire transport display
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const keyBytes = enc.encode(secretKey);
  const output = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    output[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...output));
}

export async function decryptClientMessage(cipherBase64: string, secretKey = 'WhisperPulse-Key'): Promise<string> {
  try {
    const raw = atob(cipherBase64);
    const enc = new TextEncoder();
    const keyBytes = enc.encode(secretKey);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return '[Encrypted Payload]';
  }
}
