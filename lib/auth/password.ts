import bcrypt from "bcryptjs";

/**
 * Hashes a password using bcrypt.
 * 
 * Uses bcrypt with a salt rounds of 10 (minimum recommended for security).
 * Each call generates a unique hash even for the same password due to salt.
 * 
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password string
 * 
 * @example
 * ```typescript
 * const hashedPassword = await hashPassword("myPassword123");
 * // Store hashedPassword in database
 * ```
 * 
 * @throws {Error} If password hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error(
      `Failed to hash password: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Compares a plain text password with a hashed password.
 * 
 * Uses bcrypt to securely compare passwords without storing or transmitting
 * the plain text password.
 * 
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = await comparePassword("myPassword123", storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 * 
 * @throws {Error} If password comparison fails
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    throw new Error(
      `Failed to compare password: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

