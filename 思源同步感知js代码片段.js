// 功能：同步感知
// version 0.0.6
// help: https://ld246.com/article/1726193300954
// 更新记录
// 0.0.1 初始版本，增加文件改变时自动同步和用户手动同步时自动感知功能
// 0.0.2 增加本地同步时间过长时，忽略新的同步请求，以防止多个同步可能引起的干扰
// 0.0.3 增加发消息时，对关键信息进行简单加密，防止敏感信息外泄
// 0.0.4 增加同步失败时通知用户，可通过参数开关；增加断线消息补发；去掉控制台调试信息，增加即将同步时的云朵状态（红色代表即将在30秒后开始同步）
// 0.0.5 修复手动点击同步后，同步按钮红色颜色不消失的问题
// 0.0.6 改进仅当有两个及以上客户端同时在线时才同步，避免产生多余的同步快照
(async () => {

    /////////////////// 配置区 /////////////////////////////

    // appKey see https://docs.goeasy.io/2.x/common/account/developer-account
    const appKey = '';

    // 引入GoEasy SDK，推荐下载到本地，访问速度更快
    //const jsPath = 'https://cdn.goeasy.io/goeasy-lite-2.13.2.min.js';
    const jsPath = '/public/goeasy-lite-2.13.2.min.js';

    // 消息通道，通常不需要改
    const channel = 'siyuan_sync';

    // 是否自动同步，设为false后，修改内容时不会自动同步，但手动同步时会被其他客户端感知到
    const autoSync = true;

    // 自动同步间隔时间，单位秒，默认30秒，0则立即同步（注意设置过小容易导致冲突）
    // 该参数意思是文件无变化后autoSyncInterval秒后同步，文件一直变化不会同步
    //（注意，这个自动同步，仅在文件变化后才同步，文件无变化不同步，因此，无需担心性能问题，但如果设置过小频繁输入时可能会较耗资源）
    const autoSyncInterval = 30;

    // 当同步失败时是否通知用户？true通知，false不通知
    const notifyOnSyncFailed = true;

    // 需要同步的操作，可根据自己的需要增删，注释或删除该行即可关闭
    const syncActions = [
        // 文档操作
        '/api/transactions',
        '/api/filetree/createDoc',
        '/api/filetree/removeDoc',
        '/api/filetree/renameDoc',
        '/api/filetree/moveDocs',
        // 笔记操作
        '/api/notebook/createNotebook',
        '/api/notebook/removeNotebook',
        '/api/notebook/renameNotebook',
        '/api/notebook/changeSortNotebook',
        // 同步操作，已做了特殊处理，不会导致死循环
        '/api/sync/performSync',
        // 配置
        '/api/snippet/setSnippet',
        '/api/setting/setEditor',
        '/api/setting/setFiletree',
        '/api/setting/setFlashcard',
        '/api/setting/setAI',
        '/api/setting/setExport',
        '/api/setting/setAppearance',
        '/api/setting/setBazaar',
        '/api/setting/setKeymap',
        '/api/sync/setSyncProvider',
        // 资源操作
        //'/api/asset/removeUnusedAsset',
        // 文件回滚操作（非快照回滚）
        //'/api/history/rollbackDocHistory'
    ];

    /////////////////// 逻辑区 /////////////////////////////

    // 定义调试模式
    const debug = false;

    //// 定义全局变量 ////
    // goEasy 对象
    let goEasy,
        // 发送消息定时器，多次触发仅最后一次生效
        sendMessageTimer,
        // 防止本地同步过长时，新的同步重复执行
        isRemoteSyncing = false,
        // 防止多个远程同步请求重复运行
        isLocalSyncing = false;

    // 等待goEasy加载完毕执行
    loadJS(jsPath, function () {
        if (!checkGoEasy()) return;

        //初始化GoEasy对象
        goEasy = GoEasy.getInstance({
            host: 'hangzhou.goeasy.io', //新加坡host：singapore.goeasy.io
            appkey: appKey, //替换为您的应用appkey
            modules: ['pubsub']
        });
        //建立连接
        goEasy.connect({
            // see https://docs.goeasy.io/2.x/pubsub/advanced/resend#启用用户离线补发
            id: siyuan.ws.app.appId,
            data: {"workspaceDir": siyuan.config.system.workspaceDir, "name": siyuan.config.system.name},
            onSuccess: function () { //连接成功
                console.log("GoEasy connect successfully.") //连接成功
            },
            onFailed: function (error) { //连接失败
                console.log("Failed to connect GoEasy, code:" + error.code + ",error:" + error.content);
            }
        });
        //订阅消息
        goEasy.pubsub.subscribe({
            channel: channel,//替换为您自己的channel
            presence: { enable: true }, // 监听成员在线状态
            onMessage: async function (message) { //收到消息
                //console.log("Channel:" + channel + " content:" + message.content);
                try {
                    // 获取消息后检查数据格式
                    const data = JSON.parse(message.content);
                    if(!data.appId || !data.repoKey || !data.time || !data.action) {
                        console.log('message content error: ', message.content);
                        return;
                    }
                    // 获取消息后开始同步
                    data.repoKey = decrypt(genKeyByAppIdAndTime(data.appId, data.time), data.repoKey);
                    const appId = siyuan.ws.app.appId;
                    if (data.appId !== appId && data.repoKey === siyuan.config.repo.key && data.action === 'sync' && !isRemoteSyncing) {
                        isRemoteSyncing = true;
                        const result = await sync();
                        isRemoteSyncing = false;
                        if (result && result.code === 0) {
                            debugInfo('收到消息，已同步成功 data.appId:', data.appId);
                        } else {
                            if(notifyOnSyncFailed) showErrorMessage("从远程同步失败，请手动同步");
                            console.log('remote sync failed data.appId:', data.appId, result);
                        }
                    } else {
                        debugInfo('收到消息，但不符合同步条件，已忽略本次同步');
                    }
                } catch (e) {
                    isRemoteSyncing = false;
                    console.log('message data: ', message.content);
                    console.error(e);
                }
            },
            onSuccess: function () {
                console.log("Channel " + channel + " 订阅成功");
            },
            onFailed: function (error) {
                console.log("Channel " + channel + "订阅失败, 错误编码：" + error.code + " 错误信息：" + error.content)
            }
        });

        // 监控文件改变
        listenChange();

        // 监控同步按钮被点击
        listenSyncBtnClick();

        // 测试时使用
        //window.publishMsg = sendMessage;
        //window.goEasy = goEasy;
    });

    /////////////////// 功能函数 /////////////////////////////

    // 获取用户列表
    function getUsers() {
        return new Promise((resolve, reject) => {
            goEasy.pubsub.hereNow({
                channel: channel,
                limit: 20, // 可选项，定义返回的最新上线成员列表的数量，默认为10，最多支持返回最新上线的100个成员
                onSuccess: resolve, // 成功时 resolve
                onFailed: reject    // 失败时 reject
            });
        });
    }

    // 监听文件改变
    // see https://github.com/muhanstudio/siyuan-sync-aware/blob/27f8f7f8c33275c390de0aadca71edda3473f5bf/src/index.ts#L165
    async function listenChange() {
        let isFetchOverridden = false; // 标志变量，用于判断 fetch 是否已经被覆盖
        if (!isFetchOverridden) {
            const originalFetch = window.fetch;
            window.fetch = async function (url, ...args) {
                try {
                    // 正在同步时忽略重复同步
                    // if(url.endsWith('/api/sync/performSync') && isRemoteSyncing){
                    //     return;
                    // }
                    // const requestStart = new Date().getTime();
                    const response = await originalFetch(url, ...args);
                    // const requestEnd = new Date().getTime();
                    // console.log(`Request to ${url} took ${requestEnd - requestStart}ms`);
                    if (syncActions.some(item => url.endsWith(item))) {
                        // 开始同步，未开启同步则不同步，使用官方同步则不同步(provider==0为官方同步)
                        if (siyuan.config.sync.enabled && siyuan.config.sync.provider !== 0) {
                            let users;
                            try {
                                users = await getUsers();
                            } catch (e) {
                                console.warn(e);
                            }
                            if(users) {
                                // 当多个客户端端时执行
                                if(users.code === 200 && users.content?.amount > 1){
                                    //console.log('users: ', users);
                                    if (url.endsWith('/api/sync/performSync')) {
                                        // 同步感知，手动同步后通知远程客户端同步
                                        delaySendMessage();
                                    } else {
                                        // 自动同步，文件变化后本地先同步，然后通知远程客户端同步
                                        if (autoSync) delaySync();
                                    }
                                }
                            } else {
                                // 获取客户端异常时执行
                                if (url.endsWith('/api/sync/performSync')) {
                                    // 同步感知，手动同步后通知远程客户端同步
                                    delaySendMessage();
                                } else {
                                    // 自动同步，文件变化后本地先同步，然后通知远程客户端同步
                                    if (autoSync) delaySync();
                                }
                            }
                        } else {
                            debugInfo("监听到文件变动，但未开启同步，已忽略本次同步");
                        }
                    }
                    return response;
                } catch (error) {
                    throw error;
                }
            };
            isFetchOverridden = true; // 设置标志变量，表示 fetch 已经被覆盖
        }
    }

    // 监控同步按钮被点击
    function listenSyncBtnClick() {
        const syncBtn = document.querySelector(isMobile() ? "#toolbarSync" : "#barSync svg");
        syncBtn.addEventListener("click", async function () {
            willSync(false);
        });
    }

    // 延迟发送消息，在用户手动同步后，用于通知远程客户端也同步
    function delaySendMessage() {
        if (sendMessageTimer) clearTimeout(sendMessageTimer);
        debugInfo("监听到文件变动，即将在" + autoSyncInterval + "秒后同步数据");
        //willSync(false);
        sendMessageTimer = setTimeout(async () => {
            const appId = siyuan.ws.app.appId;
            const time = new Date().getTime();
            try {
                sendMessage({
                    appId: appId,
                    repoKey: encrypt(genKeyByAppIdAndTime(appId, time), siyuan.config.repo.key),
                    action: 'sync',
                    time: time,
                });
            } catch (e) {
                console.log('消息发送失败 appId:', appId);
                console.error(e);
            }
        }, autoSyncInterval * 1000);
    }

    // 延迟同步，在文件发生变化后，先本地同步，然后通知远程客户端同步
    function delaySync() {
        // 如果本地同步时间持续过长时，新的同步中则取消
        if (isLocalSyncing) {
            console.log('本地正在同步中，已忽略本次同步');
            return;
        }
        if (sendMessageTimer) clearTimeout(sendMessageTimer);
        debugInfo("监听到文件变动，即将在" + autoSyncInterval + "秒后同步数据");
        willSync(true);
        sendMessageTimer = setTimeout(async () => {
            willSync(false);
            const appId = siyuan.ws.app.appId;
            const time = new Date().getTime();
            try {
                isLocalSyncing = true;
                const result = await sync();
                isLocalSyncing = false;
                if (result && result.code === 0) {
                    sendMessage({
                        appId: appId,
                        repoKey: encrypt(genKeyByAppIdAndTime(appId, time), siyuan.config.repo.key),
                        action: 'sync',
                        time: time,
                    });
                } else {
                    if(notifyOnSyncFailed) showErrorMessage("本地同步失败，请手动同步");
                    console.log('local sync failed appId:', appId, result);
                }
            } catch (e) {
                isLocalSyncing = false;
                console.log('local sync error: ', e);
            }
        }, autoSyncInterval * 1000);
    }

    // 调用同步api
    async function sync(payload = {}) {
        // 添加by参数避免fetch监听时出现死循环
        return await fetchSyncPost('/api/sync/performSync?by=sync-js', payload || {});
    }

    // 发送websocket消息
    function sendMessage(msg) {
        if (!checkGoEasy()) return;
        let appId = '';
        if (typeof msg !== 'string') {
            appId = msg.appId;
            msg = JSON.stringify(msg);
        }
        //发送
        goEasy.pubsub.publish({
            channel: channel,//替换为您自己的channel
            message: msg,//替换为您想要发送的消息内容
            // see https://docs.goeasy.io/2.x/pubsub/advanced/resend#设置消息自动补发
            qos: 1, // 为1启用断线补发，0无需补发，默认为0。SDK需升级至2.6.2以上
            onSuccess: function () {
                debugInfo('消息发送成功 appId:', appId);
            },
            onFailed: function (error) {
                if(notifyOnSyncFailed) showErrorMessage("消息发送失败，请检查网络连接状态");
                console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
            }
        });
    }

    // 检查goEasy是否正确加载
    function checkGoEasy() {
        if (typeof goEasy === 'undefined' && typeof GoEasy === 'undefined') {
            showErrorMessage('GoEasy SDK加载失败，请检查网络连接');
            console.error('GoEasy SDK加载失败，请检查网络连接');
            return false;
        }
        return true;
    }

    // 即将开始同步
    function willSync(yes = true) {
        const syncBtn = document.querySelector(isMobile() ? "#toolbarSync" : "#barSync svg");
        if(yes) {
            if(syncBtn) syncBtn.style.color='red';
        } else {
            if(syncBtn) syncBtn.style.color='';
        }
    }

    // 动态加载js
    function loadJS(src, callback) {
        // 创建新的script元素
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;

        // 添加onload和onerror事件处理器
        script.onload = function () {
            callback(); // 加载成功后调用回调
        };
        script.onerror = function () {
            showErrorMessage('Failed to load script: ' + src);
            console.error('Failed to load script: ' + src);
        };
        // 将script元素添加到DOM中
        document.head.appendChild(script);
    }

    // 显示通知
    function showErrorMessage(message, delay) {
        fetchSyncPost("/api/notification/pushErrMsg", {
            "msg": message,
            "timeout": delay || 7000
        });
    }

    // 请求api
    // returnType json返回json格式，text返回文本格式
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = {
            method: "POST",
        };
        if (data) {
            if (data instanceof FormData) {
                init.body = data;
            } else {
                init.body = JSON.stringify(data);
            }
        }
        try {
            const res = await fetch(url, init);
            const res2 = returnType === 'json' ? await res.json() : await res.text();
            return res2;
        } catch (e) {
            console.log(e);
            return returnType === 'json' ? { code: e.code || 1, msg: e.message || "", data: null } : "";
        }
    }

    // 通过密码生成秘钥
    function genKeyByAppIdAndTime(appId, time) {
        // 密钥生成算法
        const key = '--sy-sync-js' + appId + appKey + channel + time;
        return encrypt(key.split('').reverse().join(''), key);
    }

    // 加密数据
    function encrypt(key, data) {
        let encrypted = '';
        for (let i = 0; i < data.length; i++) {
          const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
          encrypted += String.fromCharCode(charCode);
        }
        return btoa(encrypted); // 将加密后的字符串转换为 Base64 编码
    }

    // 解密数据
    function decrypt(key, encryptedData) {
        const decryptedData = atob(encryptedData); // 将 Base64 编码的字符串转换回来
        let decrypted = '';
        for (let i = 0; i < decryptedData.length; i++) {
          const charCode = decryptedData.charCodeAt(i) ^ key.charCodeAt(i % key.length);
          decrypted += String.fromCharCode(charCode);
        }
        return decrypted;
    }

    // 是否手机版
    function isMobile() {
        return document.getElementById("sidebar") ? true : false;
    }

    // 调试信息
    function debugInfo(msg1, msg2, msg3, msg4, msg5){
        if(debug) console.log(msg1, msg2, msg3);
    }
})();