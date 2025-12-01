// 使用 CryptoJS 的版本
// version 1.0.0
class CryptoJSVIPManager {
  constructor(secretKey = 'your-secret-key-2024') {
    this.secretKey = secretKey;
  }
  // 使用 CryptoJS 的 SHA256
  sha256(message) {
    return CryptoJS.SHA256(message).toString();
  }
  generateKey(options = {}) {
    const {
      userId = 'anonymous',
      duration = null,
      level = 'standard'
    } = options;
    const timestamp = Date.now();
    const expireTime = duration === null 
      ? null 
      : timestamp + (duration * 24 * 60 * 60 * 1000);
    const data = {
      userId,
      level,
      expireTime,
      timestamp,
      permanent: expireTime === null
    };
    const signatureData = `${userId}|${level}|${expireTime}|${this.secretKey}`;
    const signature = this.sha256(signatureData);
    const keyData = JSON.stringify(data);
    const encodedData = btoa(keyData);
    
    return `VIP-${encodedData}-${signature.substring(0, 16)}`;
  }
  verifyKey(vipKey) {
    try {
      if (!vipKey || !vipKey.startsWith('VIP-')) {
        return { valid: false, error: '无效的Key格式' };
      }
      const parts = vipKey.split('-');
      if (parts.length !== 3) {
        return { valid: false, error: 'Key格式错误' };
      }
      const encodedData = parts[1];
      const providedSignature = parts[2];
      const keyData = atob(encodedData);
      const data = JSON.parse(keyData);
      const { userId, level, expireTime, timestamp, permanent } = data;
      // 验证签名
      const signatureData = `${userId}|${level}|${expireTime}|${this.secretKey}`;
      const expectedSignature = this.sha256(signatureData);
      if (!expectedSignature.startsWith(providedSignature)) {
        return { valid: false, error: '签名验证失败' };
      }
      // 检查过期
      if (!permanent && expireTime !== null) {
        const now = Date.now();
        if (now > expireTime) {
          return {
            valid: false,
            error: 'VIP Key已过期',
            data: {
              userId,
              level,
              expireDate: new Date(expireTime).toLocaleString()
            }
          };
        }
      }
      const remainingDays = permanent 
        ? '永久' 
        : Math.ceil((expireTime - Date.now()) / (24 * 60 * 60 * 1000));
      return {
        valid: true,
        data: {
          userId,
          level,
          permanent,
          createDate: new Date(timestamp).toLocaleString(),
          expireDate: permanent ? '永不过期' : new Date(expireTime).toLocaleString(),
          remainingDays
        }
      };
    } catch (error) {
      return { valid: false, error: '解析Key失败: ' + error.message };
    }
  }
}