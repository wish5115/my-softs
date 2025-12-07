const fs = require('fs');
const path = require('path');
const http = require('http');
const { checkPrimeSync } = require('crypto');

// 配置
const PLUGINS_DIR = 'your workspance/data/plugins';
const API_HOST = '127.0.0.1';
const API_PORT = 6806;
const API_TOKEN = '';
const API_PATH = '/api/petal/setPetalEnabled';
const HOTRELOAD_FILE = '.hotreload';
const DEBOUNCE_DELAY = 300; // 防抖延迟（毫秒）

// 存储每个插件的监控器和防抖定时器
const pluginWatchers = new Map(); // pluginName -> [watcher1, watcher2, ...]
const debounceTimers = new Map(); // pluginName -> timer

/**
 * 调用思源API
 */
function callAPI(packageName, enabled) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            packageName,
            enabled,
            frontend: 'desktop'
        });

        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Authorization': 'token ' + (process.env.SY_API_TOKEN || API_TOKEN)
            }
        };

        const timestamp = new Date().toLocaleTimeString();
        //console.log(`[${timestamp}] 🚀 发送请求: ${JSON.stringify(options)}`);

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    //console.log(`[${timestamp}] ✅ 请求成功: ${body}`);
                    resolve(response);
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
 * 重载插件
 */
async function reloadPlugin(pluginName) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🔄 检测到插件变化: ${pluginName}`);

    try {
        // 先禁用
        console.log(`[${timestamp}]    ⏸️  禁用插件...`);
        await callAPI(pluginName, false);

        // 短暂延迟后重新启用
        await new Promise(resolve => setTimeout(resolve, 100));

        // 再启用
        console.log(`[${timestamp}]    ▶️  启用插件...`);
        await callAPI(pluginName, true);

        console.log(`[${timestamp}]    ✅ 插件已重载: ${pluginName}\n`);
    } catch (error) {
        console.error(`[${timestamp}]    ❌ 重载失败: ${error.message}\n`);
    }
}

/**
 * 防抖处理文件变化
 */
function handleFileChange(pluginName, filePath) {
    // 忽略 .hotreload 文件本身的变化
    if (path.basename(filePath) === HOTRELOAD_FILE) {
        return;
    }

    // 清除之前的定时器
    if (debounceTimers.has(pluginName)) {
        clearTimeout(debounceTimers.get(pluginName));
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
        debounceTimers.delete(pluginName);
        reloadPlugin(pluginName);
    }, DEBOUNCE_DELAY);

    debounceTimers.set(pluginName, timer);
}

/**
 * 递归获取所有子目录
 */
function getAllSubDirs(dir) {
    const dirs = [dir];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subDir = path.join(dir, entry.name);
                dirs.push(...getAllSubDirs(subDir));
            }
        }
    } catch (error) {
        // 忽略无法访问的目录
    }

    return dirs;
}

/**
 * 监控插件目录
 */
function watchPlugin(pluginName) {
    const pluginDir = path.join(PLUGINS_DIR, pluginName);
    const watchers = [];

    // 获取所有需要监控的目录
    const dirsToWatch = getAllSubDirs(pluginDir);

    for (const dir of dirsToWatch) {
        try {
            const watcher = fs.watch(dir, (eventType, filename) => {
                if (filename) {
                    const filePath = path.join(dir, filename);
                    handleFileChange(pluginName, filePath);
                }
            });

            watcher.on('error', (error) => {
                console.error(`监控错误 [${pluginName}]: ${error.message}`);
            });

            watchers.push(watcher);
        } catch (error) {
            // 忽略无法监控的目录
        }
    }

    pluginWatchers.set(pluginName, watchers);
    console.log(`👀 开始监控插件: ${pluginName} (${watchers.length} 个目录)`);
}

/**
 * 停止监控插件
 */
function unwatchPlugin(pluginName) {
    const watchers = pluginWatchers.get(pluginName);
    if (watchers) {
        for (const watcher of watchers) {
            watcher.close();
        }
        pluginWatchers.delete(pluginName);
        console.log(`🚫 停止监控插件: ${pluginName}`);
    }

    // 清除防抖定时器
    if (debounceTimers.has(pluginName)) {
        clearTimeout(debounceTimers.get(pluginName));
        debounceTimers.delete(pluginName);
    }
}

/**
 * 检查插件是否需要热重载
 */
function checkHotReload(pluginName) {
    const hotreloadPath = path.join(PLUGINS_DIR, pluginName, HOTRELOAD_FILE);
    return fs.existsSync(hotreloadPath);
}

/**
 * 扫描并更新插件监控状态
 */
function scanPlugins() {
    try {
        const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
        const currentPlugins = new Set();

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const pluginName = entry.name;
                currentPlugins.add(pluginName);

                const shouldWatch = checkHotReload(pluginName);
                const isWatching = pluginWatchers.has(pluginName);

                if (shouldWatch && !isWatching) {
                    // 需要开始监控
                    watchPlugin(pluginName);
                } else if (!shouldWatch && isWatching) {
                    // 需要停止监控
                    unwatchPlugin(pluginName);
                }
            }
        }

        // 清理已删除的插件
        for (const pluginName of pluginWatchers.keys()) {
            if (!currentPlugins.has(pluginName)) {
                unwatchPlugin(pluginName);
            }
        }
    } catch (error) {
        console.error(`扫描插件目录失败: ${error.message}`);
    }
}

/**
 * 监控 plugins 目录变化
 */
function watchPluginsDir() {
    console.log(`\n📁 监控插件目录: ${PLUGINS_DIR}\n`);
    console.log('=' .repeat(50));

    // 初始扫描
    scanPlugins();

    // 监控 plugins 目录的变化
    fs.watch(PLUGINS_DIR, (eventType, filename) => {
        if (filename) {
            // 延迟扫描，等待文件系统操作完成
            setTimeout(scanPlugins, 100);
        }
    });

    console.log('=' .repeat(50));
    console.log('\n🚀 热重载监控已启动，按 Ctrl+C 退出\n');
}

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n\n🛑 正在停止监控...');
    for (const pluginName of pluginWatchers.keys()) {
        unwatchPlugin(pluginName);
    }
    console.log('👋 再见！\n');
    process.exit(0);
});

// 启动监控
watchPluginsDir();