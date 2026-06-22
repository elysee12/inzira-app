import * as crypto from 'crypto';

export class PasswordUtil {
  /**
   * Generate a secure random password
   * Format: 2 uppercase + 4 lowercase + 2 digits + 2 special chars = 10 characters
   */
  static generateSecurePassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%&*';

    const getRandomChar = (charset: string) => {
      const randomIndex = crypto.randomInt(0, charset.length);
      return charset[randomIndex];
    };

    // Build password parts
    const parts: string[] = [
      getRandomChar(uppercase),
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(lowercase),
      getRandomChar(lowercase),
      getRandomChar(lowercase),
      getRandomChar(digits),
      getRandomChar(digits),
      getRandomChar(special),
      getRandomChar(special),
    ];

    // Shuffle using Fisher-Yates algorithm
    for (let i = parts.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }

    return parts.join('');
  }
}
