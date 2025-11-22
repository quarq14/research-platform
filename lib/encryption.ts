/**
 * API Key Encryption Utilities
 * Provides secure encryption/decryption for user API keys
 */

import crypto from 'crypto'

// Algorithm for encryption
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64
const KEY_LENGTH = 32

/**
 * Get encryption secret from environment
 */
function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET_KEY
  if (!secret) {
    throw new Error(
      'ENCRYPTION_SECRET_KEY is not set in environment variables. Please add it to .env.local'
    )
  }
  return secret
}

/**
 * Derive encryption key from secret
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Encrypt an API key
 * @param apiKey - The API key to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:encryptedData (all base64 encoded)
 */
export function encryptApiKey(apiKey: string): string {
  try {
    const secret = getEncryptionSecret()

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive key from secret
    const key = deriveKey(secret, salt)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the API key
    let encrypted = cipher.update(apiKey, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    // Get auth tag
    const authTag = cipher.getAuthTag()

    // Combine salt, IV, auth tag, and encrypted data
    const combined = `${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`

    return combined
  } catch (error) {
    console.error('Error encrypting API key:', error)
    throw new Error('Failed to encrypt API key')
  }
}

/**
 * Decrypt an API key
 * @param encryptedData - The encrypted string from encryptApiKey
 * @returns Decrypted API key
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    const secret = getEncryptionSecret()

    // Split the combined data
    const parts = encryptedData.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format')
    }

    const [saltBase64, ivBase64, authTagBase64, encrypted] = parts

    // Convert from base64
    const salt = Buffer.from(saltBase64, 'base64')
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')

    // Derive key from secret
    const key = deriveKey(secret, salt)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt the API key
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Error decrypting API key:', error)
    throw new Error('Failed to decrypt API key')
  }
}

/**
 * Validate an API key format (basic validation)
 * @param apiKey - The API key to validate
 * @returns True if the format looks valid
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // Basic validation: should be a non-empty string
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  // Should be at least 10 characters
  if (apiKey.length < 10) {
    return false
  }

  // Should not contain obvious placeholders
  const invalidPatterns = [
    'your-api-key',
    'your_api_key',
    'example',
    'test-key',
    'placeholder',
  ]

  for (const pattern of invalidPatterns) {
    if (apiKey.toLowerCase().includes(pattern)) {
      return false
    }
  }

  return true
}

/**
 * Mask an API key for display (show only first and last few characters)
 * @param apiKey - The API key to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked API key (e.g., "sk_li...xyz")
 */
export function maskApiKey(apiKey: string, visibleChars: number = 4): string {
  if (!apiKey) return ''

  if (apiKey.length <= visibleChars * 2) {
    return '*'.repeat(apiKey.length)
  }

  const start = apiKey.slice(0, visibleChars)
  const end = apiKey.slice(-visibleChars)
  return `${start}...${end}`
}

/**
 * Generate a test encryption key (for development only)
 * Usage: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64')
}

/**
 * Test encryption/decryption
 */
export function testEncryption(): boolean {
  try {
    const testKey = 'sk_test_1234567890abcdef'
    const encrypted = encryptApiKey(testKey)
    const decrypted = decryptApiKey(encrypted)

    return decrypted === testKey
  } catch (error) {
    console.error('Encryption test failed:', error)
    return false
  }
}
