// 调用示例
// checkNewVersion();
// checkNewVersion(document.currentScript);
// 在异步中，要先把document.currentScript通过同步获取后放到变量里，
// 然后再把变量传给checkNewVersion函数

//// 格式
// name 代码名称
// version 版本号
// updateUrl 更新地址
// updateDesc 更新描述

// 或

/**
 * name 代码名称
 * version 版本号
 * updateUrl 更新地址
 * updateDesc 更新描述
 */

// 原理
// 首先会扫描自身的版本信息，放到全局变量里
// 在版本信息中加入上次扫描时间和延迟检查时间
// 延迟时间是从30分钟到90分钟随机产生的，因此会把不同代码检查时间分散开
// 然后设置定时器，每1小时检查一次，根据延迟时间和上次扫描时间，判断某个代码片段是否需要检查更新
// 需要更新时会拉取远程代码文件，并解析出版本信息，如果需要更新则更新全局变量里的版本信息，每更新一次，下次检查会推迟约4个小时
// 然后，当你打开代码片段窗口时，会读取全局变量中的版本信息，发现有更新的代码则显示到代码片段的顶部
// 然后，如果你对某个片段感兴趣，可以进去查看版本信息（暂不支持css代码片段的检查更新）
function checkNewVersion(script = document.currentScript) {
    // 扫描本代码的版本信息
    const textContent = script?.textContent || '';
    if (!textContent) return;
    const meta = {}; const lines = textContent.split('\n');
    for (const line of lines) {
        const match = line.match(/^(?: \*|\/\/)\s*(\w+)[ :：]\s*([\s\S]+)$/i);
        if (match) { const key = match[1]?.trim()?.toLowerCase(); const value = match[2]?.trim(); meta[key] = value; }
    }
    const currentName = meta.name;
    const currentVersion = meta.version;
    const updateUrl = meta.updateurl;
    if (!currentName || !currentVersion || !updateUrl) {console.warn('没有检查到有效的版本字段'); return;}
    if (!window.snippetsNewVersions) window.snippetsNewVersions = {};
    if (!window.snippetsNewVersions.versionList) window.snippetsNewVersions.versionList = {};
    window.snippetsNewVersions.versionList[currentName + updateUrl] = {
        name: currentName,
        version: currentVersion,
        url: updateUrl,
        newVersion: '',
        updateDesc: '',
        checkDelay: getRandomInt(),
        lastCheck: Date.now(),
    }
    // 注册检查函数
    if (!window.snippetsNewVersions.checkFunction) {
        window.snippetsNewVersions.checkFunction = checkNewVersion;
        // 设置定时检查版本
        setInterval(() => {
            Object.entries(window?.snippetsNewVersions?.versionList).forEach(([key, snippet]) => {
                if (snippet.lastCheck + snippet.checkDelay < Date.now()) {
                    checkAndUpdateNewVersion(snippet.name, snippet.version, snippet.url);
                    snippet.lastCheck = Date.now();
                }
            });
        }, 3600 * 1000);
        // 监听代码片段打开窗口
        new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.matches('[data-key="dialog-snippets"]')) {
                            const container = node.querySelector('.b3-dialog__body');
                            if (container && window?.snippetsNewVersions?.versionList) {
                                let snippetsNewVersionList = '';
                                Object.entries(window?.snippetsNewVersions?.versionList).forEach(([key, snippet]) => {
                                    if (snippet.newVersion) snippetsNewVersionList += `<div style="padding:2px 10px;">${snippet.name} 有新版本 V${snippet.newVersion}${snippet.updateDesc.replace(/(.+)/, '，$1')} <a href="${snippet.url}" target="_blank">查看</a></div>`;
                                });
                                if (snippetsNewVersionList) container.insertAdjacentHTML('afterbegin', `<div style="max-height:200px;overflow:auto;">${snippetsNewVersionList}</div>`);
                            }
                        }
                    });
                }
            }
        }).observe(document.body, { childList: true });
    }
    // 功能函数
    function checkAndUpdateNewVersion(currentName, currentVersion, updateUrl) {
        fetch(updateUrl + (updateUrl.indexOf('?') !== -1 ? '&' : '?') + 't=' + Date.now()).then(response => response.text()).then(text => {
            let remoteVersion = '', updateDesc = '';
            const remoteLines = text.split('\n');
            for (const line of remoteLines) {
                const match = line.match(/^(?: \*|\/\/)\s*version[ :：]\s*([\s\S]+)$/i);
                if (match) remoteVersion = match[1]?.trim();
                const matchDesc = line.match(/^(?: \*|\/\/)\s*updateDesc[ :：]\s*([\s\S]+)$/i);
                if (matchDesc) updateDesc = matchDesc[1]?.trim();
                if (remoteVersion && updateDesc) break;
            }
            if (!remoteVersion) {console.warn('没有获取到远程版本信息'); return;}
            function isNewerVersion(current, remote) {
                function normalize(v) {
                    return v.replace(/^(v|V|version|ver)[\s:=\-_]*|[^\d.]+/g, '').split('.').filter(Boolean).map(Number).join('.');
                }
                const curr = normalize(current).split('.').map(Number);
                const rem = normalize(remote).split('.').map(Number);
                for (let i = 0; i < Math.max(curr.length, rem.length); i++) {
                    if ((rem[i] || 0) > (curr[i] || 0)) return true;
                    if ((rem[i] || 0) < (curr[i] || 0)) return false;
                }
                return false;
            }
            if (isNewerVersion(currentVersion, remoteVersion)) {
                if (!window.snippetsNewVersions) window.snippetsNewVersions = {};
                if (!window.snippetsNewVersions.versionList) window.snippetsNewVersions.versionList = {};
                if (!window.snippetsNewVersions.versionList[currentName + updateUrl]) window.snippetsNewVersions.versionList[currentName + updateUrl] = {};
                window.snippetsNewVersions.versionList[currentName + updateUrl].newVersion = remoteVersion;
                window.snippetsNewVersions.versionList[currentName + updateUrl].updateDesc = updateDesc;
                window.snippetsNewVersions.versionList[currentName + updateUrl].checkDelay += 3600 * 3000;
            }
        }).catch(err => { console.warn(err); });
    }
    function getRandomInt(min = 30 * 60 * 1000, max = 90 * 60 * 1000) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}