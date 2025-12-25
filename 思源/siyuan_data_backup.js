/**
 * siyuan_data_backup.js (v2 Optimized)
 * 
 * 改进：
 * 1. S3 改为流式上传 (UNSIGNED-PAYLOAD)，不再占用巨量内存，无需担心 chunkSize。
 * 2. WebDAV 增加自动创建递归目录功能。
 * 3. 增加进程显式退出机制，防止报错卡死。
 * 4. 增加网络超时设置。
 */

// =================配置区域=================

const CONFIG = {
    // 备份源目录
    dataPath: '/你的目录/思源笔记/data',
    
    // 忽略的文件
    ignores: ['node_modules', '.DS_Store', 'cache', 'temp/*', 'plugins', 'assets', 'trash', 'widgets'],

    // 存储类型: 's3' | 'webdav' | 'local'
    type: 'local',

    // 备份配置
    backupPath: {
        // 本地配置
        local: {
            destination: '你的路径/backups/siyuan_mini_backups/' 
        },
        // s3配置
        s3: {
            endpoint: 'https://s3.cn-east-1.qiniucs.com',
            region: 'cn-east-1',
            bucket: 'siyuan-data-backups',
            accessKeyId: '你的秘钥ID',
            secretAccessKey: '你的秘钥',
            pathPrefix: 'siyuan_mini_backups/daily/' // 支持深层路径
        },
        // webdav配置
        // 这里WebDav推荐https://infini-cloud.net，注册成功即得20G永久空间，然后在My Page页面输入 QEU7Z 这个推荐码后再额外赠送5G永久空间
        webdav: {
            url: 'https://jike.teracloud.jp/dav/',
            username: '你的用户名',
            password: '你的密码',
            pathPrefix: 'siyuan_mini_backups/daily/' // 支持深层路径
        }
    }
};

// =================主逻辑=================

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { URL } = require('url');
const { Transform } = require('stream');

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `backup-${timestamp}.zip`;
    const tempZipPath = path.join(require('os').tmpdir(), zipFileName);

    console.log(`[1/3] 开始打包目录: ${CONFIG.dataPath}`);

    try {
        await createZip(CONFIG.dataPath, tempZipPath, CONFIG.ignores);
        
        const stats = fs.statSync(tempZipPath);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`[2/3] 打包完成: ${tempZipPath} (${fileSizeMB} MB)`);

        console.log(`[3/3] 开始传输到: ${CONFIG.type}`);
        
        switch (CONFIG.type) {
            case 's3':
                await uploadToS3(tempZipPath, zipFileName, CONFIG.backupPath.s3);
                break;
            case 'webdav':
                await uploadToWebDAV(tempZipPath, zipFileName, CONFIG.backupPath.webdav);
                break;
            case 'local':
                await copyToLocal(tempZipPath, zipFileName, CONFIG.backupPath.local);
                break;
            default:
                throw new Error(`未知的存储类型: ${CONFIG.type}`);
        }

        console.log('\n✅ 备份流程全部成功完成！');
        process.exit(0); // 显式成功退出

    } catch (err) {
        console.error('\n❌ 备份失败:', err.message);
        // 如果是 S3 错误，打印更多详情
        if (err.details) console.error('错误详情:', err.details);
        
        // 清理临时文件
        try {
            if (fs.existsSync(tempZipPath) && CONFIG.type !== 'local') {
                fs.unlinkSync(tempZipPath);
                console.log('临时文件已清理');
            }
        } catch (e) {}

        process.exit(1); // 显式失败退出
    }
}

// =================工具函数=================

function createZip(sourceDir, destFile, ignoreList) {
    return new Promise((resolve, reject) => {
        const absSource = path.resolve(sourceDir);
        const parentDir = path.dirname(absSource);
        const folderName = path.basename(absSource);

        const excludeArgs = [];
        if (ignoreList && ignoreList.length > 0) {
            excludeArgs.push('-x');
            ignoreList.forEach(item => {
                excludeArgs.push(path.join(folderName, item).replace(/\\/g, '/') + '*');
            });
        }

        const args = ['-r', '-q', destFile, folderName, ...excludeArgs];
        const child = spawn('zip', args, { cwd: parentDir, stdio: 'inherit' });

        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Zip process exited with code ${code}`));
        });
        child.on('error', (err) => reject(new Error(`无法执行 zip: ${err.message}`)));
    });
}

function copyToLocal(sourcePath, fileName, config) {
    const destDir = path.resolve(config.destination);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`\n文件已复制到: ${destPath}`);
    return Promise.resolve();
}

/**
 * 创建一个用于显示进度的 PassThrough 流
 */
function createMonitorStream(totalSize, label = '上传中') {
    let loaded = 0;
    return new Transform({
        transform(chunk, encoding, callback) {
            loaded += chunk.length;
            const percent = ((loaded / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r🚀 ${label}: ${percent}% [${(loaded/1024/1024).toFixed(2)} MB]`);
            this.push(chunk);
            callback();
        }
    });
}

// ================= WebDAV 模块 (含自动建目录) =================

async function uploadToWebDAV(sourcePath, fileName, config) {
    const stat = fs.statSync(sourcePath);
    const totalSize = stat.size;
    
    // 1. 确保远程目录存在 (递归创建)
    if (config.pathPrefix) {
        await ensureWebDAVDir(config, config.pathPrefix);
    }

    // 2. 上传文件
    return new Promise((resolve, reject) => {
        let targetUrl = config.url.endsWith('/') ? config.url : config.url + '/';
        if (config.pathPrefix) targetUrl += config.pathPrefix;
        if (!targetUrl.endsWith('/')) targetUrl += '/';
        targetUrl += fileName;

        const parsedUrl = new URL(targetUrl);
        const auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
        
        const options = {
            method: 'PUT',
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/zip',
                'Content-Length': totalSize
            },
            timeout: 30000 // 30秒无响应则超时
        };

        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const req = lib.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                process.stdout.write('\n');
                resolve();
            } else {
                reject(new Error(`WebDAV Upload Error: ${res.statusCode} ${res.statusMessage}`));
            }
        });

        req.on('timeout', () => { req.destroy(new Error('WebDAV 请求超时')); });
        req.on('error', reject);

        // 管道流: 文件 -> 进度条 -> 网络请求
        const fileStream = fs.createReadStream(sourcePath);
        const progress = createMonitorStream(totalSize, 'WebDAV 上传');
        
        fileStream.pipe(progress).pipe(req);
    });
}

/**
 * 递归检查并创建 WebDAV 目录
 */
async function ensureWebDAVDir(config, dirPath) {
    console.log(`Checking WebDAV directory: ${dirPath}`);
    const dirs = dirPath.split('/').filter(p => p);
    let currentPath = config.url.endsWith('/') ? config.url : config.url + '/';

    const auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
    const lib = config.url.startsWith('https') ? https : http;

    for (const dir of dirs) {
        currentPath += dir + '/';
        const parsedUrl = new URL(currentPath);

        // MKCOL 请求
        await new Promise((resolve, reject) => {
            const req = lib.request({
                method: 'MKCOL',
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                headers: { 'Authorization': auth },
                timeout: 10000
            }, (res) => {
                // 201 Created: 创建成功
                // 405 Method Not Allowed: 目录已存在 (标准 WebDAV 响应)
                // 301/302: 重定向也算通过
                if (res.statusCode === 201 || res.statusCode === 405 || res.statusCode === 301) {
                    resolve();
                } else {
                    reject(new Error(`无法创建 WebDAV 目录 ${dir}: ${res.statusCode} ${res.statusMessage}`));
                }
            });
            req.on('error', reject);
            req.end();
        });
    }
}

// ================= AWS S3 Signature V4 Stream Implementation =================

/**
 * S3 上传 (流式 + UNSIGNED-PAYLOAD)
 * 解决了大文件内存溢出问题，不需要事先计算 Payload Hash
 */
function uploadToS3(sourcePath, fileName, config) {
    return new Promise((resolve, reject) => {
        const stat = fs.statSync(sourcePath);
        const totalSize = stat.size;
        
        const key = (config.pathPrefix || '') + fileName;
        // 修正路径：确保开头有 /
        const objectKey = key.startsWith('/') ? key.substring(1) : key;
        
        const endpoint = new URL(config.endpoint);
        const host = endpoint.hostname;
        
        // 兼容 Path-Style (MinIO/Qiniu) 和 Virtual-Host-Style
        // 七牛云通常是 Path style: endpoint/bucket/key
        let uriPath = `/${objectKey}`;
        if (!host.startsWith(config.bucket)) {
             uriPath = `/${config.bucket}/${objectKey}`;
        }
        
        // --- 签名计算 ---
        const now = new Date();
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
        const dateStamp = amzDate.slice(0, 8);
        const region = config.region;
        const service = 's3';

        // 核心修改：Payload Hash 设为 UNSIGNED-PAYLOAD
        // 这样就不需要先读取整个文件来计算 Hash 了
        const payloadHash = 'UNSIGNED-PAYLOAD'; 

        const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
        const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
        const canonicalRequest = `PUT\n${uriPath}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

        const getSignatureKey = (key, date, regionName, serviceName) => {
            const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(date).digest();
            const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
            const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
            return crypto.createHmac('sha256', kService).update('aws4_request').digest();
        };

        const signingKey = getSignatureKey(config.secretAccessKey, dateStamp, region, service);
        const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
        const authorization = `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        // --- 发起请求 ---
        const options = {
            hostname: host,
            path: uriPath,
            method: 'PUT',
            headers: {
                'Host': host,
                'x-amz-date': amzDate,
                'x-amz-content-sha256': payloadHash, // 必须带上这个头
                'Authorization': authorization,
                'Content-Type': 'application/zip',
                'Content-Length': totalSize,
                'Expect': '100-continue' // 对于大文件，建议加这个
            },
            timeout: 60000 // 60秒 socket 空闲超时
        };

        const lib = endpoint.protocol === 'https:' ? https : http;
        const req = lib.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    process.stdout.write('\n'); 
                    resolve();
                } else {
                    const err = new Error(`S3 Upload Failed [${res.statusCode}]`);
                    err.details = body;
                    reject(err);
                }
            });
        });

        req.on('timeout', () => {
            req.destroy(new Error('S3 Connection Timeout'));
        });

        req.on('error', (e) => reject(new Error(`S3 Network Error: ${e.message}`)));

        // --- 管道流传输 ---
        const fileStream = fs.createReadStream(sourcePath);
        const progress = createMonitorStream(totalSize, 'S3 极速流式上传');

        // 文件流 -> 进度流 -> HTTP请求
        fileStream.pipe(progress).pipe(req);
    });
}

// 启动
main();
