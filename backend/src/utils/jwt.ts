import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { unauthorized } from './http-error.js';

/** Contenu utile transporté par le jeton d'authentification. */
export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

/** Jeton décodé et vérifié. */
export interface VerifiedToken extends TokenPayload {
  /** Identifiant unique du jeton (permet sa révocation). */
  jti: string;
  /** Date d'émission (en secondes depuis l'epoch). */
  iat: number;
  /** Date d'expiration (en secondes depuis l'epoch). */
  exp: number;
}

interface DecodedToken extends VerifiedToken {
  iat: number;
}

/** Durée de vie du jeton : 7 jours. */
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("La variable d'environnement JWT_SECRET est obligatoire.");
  }

  return secret;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function decodeBase64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

/** Génère un jeton JWT signé (HS256) pour l'utilisateur donné. */
export function signToken(payload: TokenPayload): string {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(
    JSON.stringify({
      ...payload,
      jti: randomUUID(),
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    } satisfies DecodedToken)
  );
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

/**
 * Vérifie un jeton JWT et renvoie son contenu utile.
 * Lève une erreur 401 si le jeton est absent, malformé, expiré ou falsifié.
 */
export function verifyToken(token: string): VerifiedToken {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw unauthorized('Jeton d’authentification invalide.');
  }

  const [header, body, signature] = parts as [string, string, string];
  const expected = sign(`${header}.${body}`);

  const providedBuffer = decodeBase64url(signature);
  const expectedBuffer = decodeBase64url(expected);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw unauthorized('Jeton d’authentification invalide.');
  }

  let decoded: DecodedToken;
  try {
    decoded = JSON.parse(decodeBase64url(body).toString('utf8')) as DecodedToken;
  } catch {
    throw unauthorized('Jeton d’authentification invalide.');
  }

  if (typeof decoded.exp !== 'number' || decoded.exp * 1000 < Date.now()) {
    throw unauthorized('Session expirée, veuillez vous reconnecter.');
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    jti: decoded.jti,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}
