import crypto from 'crypto';

/**
 * Hash password menggunakan SHA-256 dengan Salt kriptografis
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

/**
 * Verifikasi kecocokan password dengan hash dan salt
 */
export function verifyPassword(password: string, storedHash: string, storedSalt?: string): boolean {
  if (!storedSalt) {
    // Fallback jika password plaintext lama sebelum migrasi
    return password === storedHash;
  }
  const { hash } = hashPassword(password, storedSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Buat session token aman dengan tanda tangan HMAC
 */
const SECRET_KEY = process.env.SESSION_SECRET || 'gkka_secure_church_secret_2026_key';

export function generateSecureToken(userId: string, roleCode: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${roleCode}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export function verifySecureToken(token: string): { valid: boolean; userId?: string; roleCode?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false };

    const [userId, roleCode, timestamp, signature] = parts;
    const payload = `${userId}:${roleCode}:${timestamp}`;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');

    const isValidSig = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );

    if (!isValidSig) return { valid: false };

    // Validasi kedaluwarsa sesi (7 hari)
    const age = Date.now() - Number(timestamp);
    if (age > 7 * 24 * 60 * 60 * 1000) {
      return { valid: false };
    }

    return { valid: true, userId, roleCode };
  } catch {
    return { valid: false };
  }
}

/**
 * Rate Limiter sederhana di memori untuk mencegah Brute-Force Login & DoS
 */
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, maxAttempts = 5, blockDurationMs = 15 * 60 * 1000): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { attempts: 1, blockedUntil: 0 });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Jika sedang diblokir
  if (record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Jika masa blokir sudah lewat, reset
  if (record.blockedUntil > 0 && record.blockedUntil <= now) {
    rateLimitMap.set(key, { attempts: 1, blockedUntil: 0 });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  record.attempts += 1;

  if (record.attempts > maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    const retryAfterSeconds = Math.ceil(blockDurationMs / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.attempts };
}

export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Sanitasi string input untuk mencegah XSS & injeksi karakter berbahaya
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Hapus tag < dan >
    .trim();
}
