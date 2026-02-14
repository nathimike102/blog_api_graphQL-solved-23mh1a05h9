// Security Utilities
const crypto = require('crypto');

/**
 * Generate secure random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate CSRF token
 */
const generateCSRFToken = () => {
  return generateSecureToken(32);
};

/**
 * Verify CSRF token
 */
const verifyCSRFToken = (token, sessionToken) => {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
};

/**
 * Hash data with SHA256
 */
const hashSHA256 = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Hash data with HMAC
 */
const hashHMAC = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Encrypt data with AES-256-GCM
 */
const encrypt = (data, encryptionKey) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    data: encrypted,
    authTag: authTag.toString('hex'),
  };
};

/**
 * Decrypt data with AES-256-GCM
 */
const decrypt = (encrypted, encryptionKey) => {
  const cipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    Buffer.from(encrypted.iv, 'hex')
  );
  
  cipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  
  let decrypted = cipher.update(encrypted.data, 'hex', 'utf8');
  decrypted += cipher.final('utf8');
  
  return JSON.parse(decrypted);
};

/**
 * Check if password is strong
 */
const isPasswordStrong = (password) => {
  const rules = [
    { regex: /.{8,}/, message: 'At least 8 characters' },
    { regex: /[a-z]/, message: 'At least one lowercase letter' },
    { regex: /[A-Z]/, message: 'At least one uppercase letter' },
    { regex: /\d/, message: 'At least one number' },
    { regex: /[@$!%*?&]/, message: 'At least one special character' },
  ];
  
  const results = {
    isStrong: true,
    failedRules: [],
  };
  
  for (const rule of rules) {
    if (!rule.regex.test(password)) {
      results.isStrong = false;
      results.failedRules.push(rule.message);
    }
  }
  
  return results;
};

/**
 * Sanitize SQL input (basic protection)
 */
const sanitizeSQLInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/['";\\]/g, (char) => {
    const escapeMap = {
      "'": "''",
      '"': '""',
      '\\': '\\\\',
      ';': '',
    };
    return escapeMap[char] || char;
  });
};

/**
 * Validate IP address
 */
const isValidIP = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([\da-f]{0,4}:){7}[\da-f]{0,4}$/i;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * Check if IP is in CIDR range
 */
const isIPInCIDR = (ip, cidr) => {
  const [network, prefix] = cidr.split('/');
  const networkParts = network.split('.').map(Number);
  const ipParts = ip.split('.').map(Number);
  const maskBits = 32 - parseInt(prefix, 10);
  
  for (let i = 0; i < 4; i++) {
    const networkMask = (networkParts[i] >> (i === 3 ? maskBits : 0)) << (i === 3 ? maskBits : 0);
    const ipMask = (ipParts[i] >> (i === 3 ? maskBits : 0)) << (i === 3 ? maskBits : 0);
    
    if (networkMask !== ipMask) return false;
  }
  
  return true;
};

module.exports = {
  generateSecureToken,
  generateCSRFToken,
  verifyCSRFToken,
  hashSHA256,
  hashHMAC,
  encrypt,
  decrypt,
  isPasswordStrong,
  sanitizeSQLInput,
  isValidIP,
  isIPInCIDR,
};
