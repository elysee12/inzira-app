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

  /**
   * Generate a simple memorable password for CHW
   * Format: CHW@1234 (CHW@ followed by 4 random digits)
   * Example: CHW@7823
   */
  static generateCHWPassword(): string {
    const randomDigits = crypto.randomInt(1000, 9999); // 4 digits between 1000-9999
    return `CHW@${randomDigits}`;
  }

  /**
   * Generate a simple memorable password for Nurse
   * Format: LastName@123 (Last name followed by @ and 3 random digits)
   * Example: Uwase@456
   * If name has no space, uses first 5 chars
   */
  static generateNursePassword(fullName: string): string {
    // Get last name (or first 5 chars if no space)
    const nameParts = fullName.trim().split(' ');
    let baseName = '';
    
    if (nameParts.length > 1) {
      // Use last name
      baseName = nameParts[nameParts.length - 1];
    } else {
      // Use first 5 characters of name
      baseName = nameParts[0].substring(0, 5);
    }
    
    // Capitalize first letter
    baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();
    
    const randomDigits = crypto.randomInt(100, 999); // 3 digits between 100-999
    return `${baseName}@${randomDigits}`;
  }
}
