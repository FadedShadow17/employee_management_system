import crypto from 'crypto';

/**
 * Field-Level Encryption Utility
 *
 * Uses AES-256-GCM (Authenticated Encryption with Associated Data)
 * - Provides both confidentiality and integrity
 * - Each encryption uses a unique IV (Initialization Vector)
 * - Auth tag prevents tampering
 *
 * Key Management:
 * - ENCRYPTION_KEY must be set in environment variables
 * - Key is 32 bytes (256 bits) hex-encoded (64 hex chars)
 * - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * - In production: use a KMS (AWS KMS, HashiCorp Vault) for key rotation
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;       // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING = 'hex';
const SEPARATOR = ':';      // Separates IV:authTag:ciphertext

/**
 * Get encryption key from environment
 * Falls back to a derived key from JWT_SECRET for development
 */
const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
    }
    return key;
  }

  // Development fallback: derive key from JWT_SECRET (NOT for production!)
  if (process.env.JWT_SECRET) {
    return crypto.scryptSync(process.env.JWT_SECRET, 'ems-encryption-salt', 32);
  }

  throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set for field encryption');
};

/**
 * Encrypt a string value
 * @param {string} plaintext - Value to encrypt
 * @returns {string} Encrypted value in format: iv:authTag:ciphertext
 */
export const encrypt = (plaintext) => {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }

  const text = String(plaintext);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(text, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag().toString(ENCODING);

  // Format: iv:authTag:ciphertext
  return `${iv.toString(ENCODING)}${SEPARATOR}${authTag}${SEPARATOR}${encrypted}`;
};

/**
 * Decrypt an encrypted value
 * @param {string} encryptedValue - Value in format: iv:authTag:ciphertext
 * @returns {string} Decrypted plaintext
 */
export const decrypt = (encryptedValue) => {
  if (encryptedValue === null || encryptedValue === undefined || encryptedValue === '') {
    return encryptedValue;
  }

  // Check if value is actually encrypted (contains separators)
  if (!String(encryptedValue).includes(SEPARATOR)) {
    // Return as-is (not encrypted, likely legacy data)
    return encryptedValue;
  }

  try {
    const key = getEncryptionKey();
    const parts = String(encryptedValue).split(SEPARATOR);

    if (parts.length !== 3) {
      return encryptedValue; // Not in expected format, return as-is
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, ENCODING);
    const authTag = Buffer.from(authTagHex, ENCODING);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    // If decryption fails, return original value (could be legacy unencrypted data)
    console.error('Decryption failed:', err.message);
    return encryptedValue;
  }
};

/**
 * Encrypt a numeric value (stores as encrypted string)
 * @param {number} value - Number to encrypt
 * @returns {string} Encrypted value
 */
export const encryptNumber = (value) => {
  if (value === null || value === undefined) return value;
  return encrypt(String(value));
};

/**
 * Decrypt a numeric value
 * @param {string} encryptedValue - Encrypted string
 * @returns {number} Decrypted number
 */
export const decryptNumber = (encryptedValue) => {
  if (encryptedValue === null || encryptedValue === undefined) return encryptedValue;
  const decrypted = decrypt(String(encryptedValue));
  const num = Number(decrypted);
  return isNaN(num) ? 0 : num;
};

/**
 * Encrypt an object's fields
 * @param {object} obj - Object with fields to encrypt
 * @param {string[]} fields - Field names to encrypt
 * @returns {object} New object with specified fields encrypted
 */
export const encryptFields = (obj, fields) => {
  if (!obj) return obj;
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(String(result[field]));
    }
  }
  return result;
};

/**
 * Decrypt an object's fields
 * @param {object} obj - Object with encrypted fields
 * @param {string[]} fields - Field names to decrypt
 * @returns {object} New object with specified fields decrypted
 */
export const decryptFields = (obj, fields) => {
  if (!obj) return obj;
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = decrypt(String(result[field]));
    }
  }
  return result;
};

/**
 * Hash a value (one-way, for searching encrypted fields)
 * Useful for creating searchable indexes on encrypted data
 * @param {string} value - Value to hash
 * @returns {string} HMAC hash of the value
 */
export const hmacHash = (value) => {
  if (!value) return value;
  const key = getEncryptionKey();
  return crypto.createHmac('sha256', key).update(String(value)).digest('hex');
};

/**
 * Check if a value appears to be encrypted
 * @param {string} value - Value to check
 * @returns {boolean}
 */
export const isEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(SEPARATOR);
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
};
