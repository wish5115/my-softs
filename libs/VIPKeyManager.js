// 使用 CryptoJS 的版本
// version 1.0.1
class VIPKeyManager {
    constructor(secretKey = 'your-secret-key-2024') {
        this.secretKey = secretKey;
    }
    /**
     * 使用 CryptoJS 的 Base64 编码（自动处理 UTF-8）
     */
    base64Encode(str) {
        const wordArray = CryptoJS.enc.Utf8.parse(str);
        return CryptoJS.enc.Base64.stringify(wordArray);
    }
    /**
     * 使用 CryptoJS 的 Base64 解码
     */
    base64Decode(str) {
        const wordArray = CryptoJS.enc.Base64.parse(str);
        return CryptoJS.enc.Utf8.stringify(wordArray);
    }
    /**
     * 使用 CryptoJS 的 SHA256
     */
    sha256(str) {
        return CryptoJS.SHA256(str).toString();
    }
    /**
     * 生成 VIP Key
     */
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
        const signature = this.sha256(signatureData).substring(0, 16);
        const keyData = JSON.stringify(data);
        const encodedData = this.base64Encode(keyData);

        return `VIP-${encodedData}-${signature}`;
    }
    /**
     * 验证 VIP Key
     */
    verifyKey(vipKey) {
        try {
            if (!vipKey || typeof vipKey !== 'string') {
                return { valid: false, error: '无效的Key格式' };
            }
            if (!vipKey.startsWith('VIP-')) {
                return { valid: false, error: '无效的Key格式' };
            }
            const parts = vipKey.split('-');
            if (parts.length !== 3) {
                return { valid: false, error: `Key格式错误` };
            }
            const encodedData = parts[1];
            const providedSignature = parts[2];
            if (!encodedData || encodedData.trim() === '') {
                return { valid: false, error: '编码数据为空' };
            }
            // 解码数据
            let keyData;
            try {
                keyData = this.base64Decode(encodedData);
            } catch (decodeError) {
                return {
                    valid: false,
                    error: `Base64解码失败: ${decodeError.message}`
                };
            }
            // 解析 JSON
            let data;
            try {
                data = JSON.parse(keyData);
            } catch (jsonError) {
                return {
                    valid: false,
                    error: `JSON解析失败: ${jsonError.message}`
                };
            }
            const { userId, level, expireTime, timestamp, permanent } = data;
            if (!userId || !level) {
                return { valid: false, error: '缺少必要字段' };
            }
            // 验证签名
            const signatureData = `${userId}|${level}|${expireTime}|${this.secretKey}`;
            const expectedSignature = this.sha256(signatureData).substring(0, 16);
            if (providedSignature !== expectedSignature) {
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
                            expireDate: new Date(expireTime).toLocaleString('zh-CN')
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
                    permanent: permanent || false,
                    createDate: new Date(timestamp).toLocaleString('zh-CN'),
                    expireDate: permanent ? '永不过期' : new Date(expireTime).toLocaleString('zh-CN'),
                    remainingDays
                }
            };
        } catch (error) {
            return {
                valid: false,
                error: `解析Key失败: ${error.message}`
            };
        }
    }
}