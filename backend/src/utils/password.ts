import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const ALGORITHM = 'scrypt';
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hache un mot de passe avec scrypt (module natif Node.js, aucune dépendance
 * externe). Format stocké : `scrypt$<sel hex>$<empreinte hex>`.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer;
  return `${ALGORITHM}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/** Vérifie un mot de passe en clair contre son empreinte stockée. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = stored.split('$');

  if (algorithm !== ALGORITHM || !saltHex || !hashHex) {
    return false;
  }

  const derived = (await scrypt(plain, Buffer.from(saltHex, 'hex'), KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hashHex, 'hex');

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
