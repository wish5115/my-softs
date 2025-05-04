// name 检查代码片段是否需要更新（用户端）
// version 0.0.3
// updateUrl https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/snippets_new_version_checker.js
// updateDesc 检查前先检查当前的代码是否已更新，当已更新时，清除新版本记录；监听代码更新事件，已更新的清除新版本记录。
// 更新记录
// 0.0.2 修复bug；把匹配到最后一个为准改为匹配到第一个为准以尽早结束查找。
// 0.0.3 检查前先检查当前的代码是否已更新，当已更新时，清除新版本记录；监听代码更新事件，已更新的清除新版本记录。
// author Wilsons
// see https://ld246.com/article/1746326048445

// 原理
// 1 首先在页面加载1分钟后，会扫描所有代码片段的版本信息，放到全局变量里。
// 2 在版本信息中加入必要的字段。
// 3 然后页面加载2分钟后，开始对全局变量中的版本分配随机延迟时间和初始化检查时间（注意这个随机延迟时间是逐渐增大，以保证后续每次执行周期内只对一个代码执行检查更新，并在默认3小时内检查一遍所有的代码版本）。
// 4 然后设置定时器，每x时间检查一次，这个x是根据总间隔时间/总脚本数计算出来的，然后根据延迟时间和上次扫描时间，判断某个代码片段是否需要检查更新。
// 5 需要更新时会拉取远程代码文件，并解析出版本信息，如果需要更新则更新全局变量里的版本信息，并更新本次检查时间。
// 6 然后，当你打开思源代码片段窗口时，会读取全局变量中的版本信息，发现有新版本的代码则显示到代码片段窗口的顶部。
// 7 然后，如果你对某个更新的片段感兴趣，可以进去查看更新信息。

(async ()=>{
    // 设置多久检查一次（单位小时），默认3小时检查一次
    // 低于1小时的，可以设置为小数，比如，半小时，可设置为0.5 或 20/60，20分钟等
    const interval = 3;

    // 扫描所有代码片段
    setTimeout( async ()=>{
        const allSnippets = document.querySelectorAll('[id^="snippetCSS"],[id^="snippetJS"]');
        for (const snippet of allSnippets) {
            generateVersionList(snippet);
            await sleep(100);
        }
    }, 60000);

    // 设置定时器
    let initTimer, intervalTimer;
    let totalInterval = interval * 3600 * 1000;
    // 初始化代码片段延迟间隔
    const initInterval = (totalInterval) => {
        const scriptNum = Object.keys(window?.snippetsNewVersions?.versionList||{})?.length;
        if(!scriptNum) return;
        const realInterval = Math.floor(totalInterval / (scriptNum || 1));
        const randomIntervals  = generateRandomTimestamps(totalInterval, realInterval);
        Object.entries(window?.snippetsNewVersions?.versionList).forEach(([key, snippet]) => {
            snippet.checkDelay = randomIntervals.pop();
            snippet.lastCheck = Date.now();
        });
        return realInterval;
    };
    // 开始检查版本更新状态
    const checkNewVersionOnInterval = () => {
        Object.entries(window?.snippetsNewVersions?.versionList).forEach(([key, snippet]) => {
            if (snippet.lastCheck + snippet.checkDelay < Date.now()) {
                const snippetEl = document.getElementById(snippet.id);
                if(snippetEl?.textContent) {
                    const version = getVersionFromTextContent(snippetEl.textContent);
                    snippet.version = version;
                }
                checkAndUpdateNewVersion(snippet.name, snippet.version, snippet.url);
                snippet.lastCheck = Date.now();
            }
        });
    }
    // 用户设置检查更新间隔时间
    if(!window.snippetsNewVersions) window.snippetsNewVersions = {};
    window.snippetsNewVersions.setInterval = (interval) => {
        interval = Math.floor(interval * 3600 * 1000);
        const realInterval = initInterval(interval);
        if(!realInterval) return;
        if(initTimer) clearTimeout(initTimer);
        if(intervalTimer) clearInterval(intervalTimer);
        intervalTimer = setInterval(() => {
            checkNewVersionOnInterval();
        }, realInterval);
    };
    // 设置定时检查版本
    initTimer = setTimeout(() => {
        const realInterval = initInterval(totalInterval);
        if(!realInterval) return;
        intervalTimer = setInterval(() => {
            checkNewVersionOnInterval();
        }, realInterval);
    }, 120000);

    // 监听代码片段被打开
    setTimeout(() => {
        observeSnippetsChange();
    }, 2000);

    // 功能函数
    // 检查并更新版本号
    function checkAndUpdateNewVersion(currentName, currentVersion, updateUrl) {
        fetch(updateUrl + (updateUrl.indexOf('?') !== -1 ? '&' : '?') + 't=' + Date.now()).then(response => response.text()).then(text => {
            let remoteVersion = '', remoteUpdateUrl = '', remoteUpdateDesc = '';
            let matchVersion, matchUrl, matchDesc;
            let remoteLines = text.split('\n');
            remoteLines = remoteLines.slice(0, 200); // 默认扫描200行
            for (const line of remoteLines) {
                if(!matchVersion) {
                    matchVersion = line.match(/^(?:\/\*| \*|\/\/)\s*version[ :：]\s*(.+?)(?:\*\/)?\r*$/i);
                    if (matchVersion) remoteVersion = matchVersion[1]?.trim();
                }
                if(!matchUrl) {
                    matchUrl = line.match(/^(?:\/\*| \*|\/\/)\s*updateUrl[ :：]\s*(.+?)(?:\*\/)?\r*$/i);
                    if (matchUrl) remoteUpdateUrl = matchUrl[1]?.trim();
                }
                if(!matchDesc) {
                    matchDesc = line.match(/^(?:\/\*| \*|\/\/)\s*updateDesc[ :：]\s*(.+?)(?:\*\/)?\r*$/i);
                    if (matchDesc) remoteUpdateDesc = matchDesc[1]?.trim();
                }
                if (matchVersion && matchUrl && matchDesc) break;
            }
            if (!remoteVersion) {console.warn('没有获取到远程版本信息'); return;}
            if (!window.snippetsNewVersions) window.snippetsNewVersions = {};
            if (!window.snippetsNewVersions.versionList) window.snippetsNewVersions.versionList = {};
            if (isNewerVersion(currentVersion, remoteVersion)) {
                if (!window.snippetsNewVersions.versionList[currentName + updateUrl]) window.snippetsNewVersions.versionList[currentName + updateUrl] = {};
                window.snippetsNewVersions.versionList[currentName + updateUrl].newVersion = remoteVersion;
                if(remoteUpdateUrl) window.snippetsNewVersions.versionList[currentName + updateUrl].scriptUrl = remoteUpdateUrl;
                window.snippetsNewVersions.versionList[currentName + updateUrl].updateDesc = remoteUpdateDesc;
            } else {
                // 无更新时，清空新版本
                window.snippetsNewVersions.versionList[currentName + updateUrl].newVersion = '';
            }
        }).catch(err => { console.warn(err); });
    }
    // 监听代码片段窗口被打开
    function observeSnippetsChange() {
        // 监听代码片段打开窗口
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // 监听代码片段窗口被打开
                        if (node.nodeType === Node.ELEMENT_NODE && mutation.target.tagName === 'BODY' && node.matches('[data-key="dialog-snippets"]')) {
                            const container = node.querySelector('.b3-dialog__body');
                            if (container && window?.snippetsNewVersions?.versionList) {
                                let snippetsNewVersionList = '';
                                Object.entries(window?.snippetsNewVersions?.versionList).forEach(([key, snippet]) => {
                                    if (snippet.newVersion) snippetsNewVersionList += `<div style="padding:2px 10px;">[${snippet.type}] ${snippet.name} 有新版本 V${snippet.newVersion}${snippet.updateDesc.replace(/(.+)/, '，$1')} <a href="${snippet.scriptUrl||snippet.url}" target="_blank">查看</a></div>`;
                                });
                                if (snippetsNewVersionList) container.insertAdjacentHTML('afterbegin', `<div style="max-height:200px;overflow:auto;">${snippetsNewVersionList}</div>`);
                            }
                        }
                        // 监听代码片段被更新
                        if (node.nodeType === Node.ELEMENT_NODE && mutation.target.tagName === 'HEAD' && node.matches('[id^="snippetJS"],[id^="snippetCSS"]')) {
                            const version = getVersionFromTextContent(node?.textContent||'');
                            if(version) {
                                const snippetVersion = Object.values(window?.snippetsNewVersions?.versionList||{}).find(item=>item.id===node.id);
                                const newVersion = snippetVersion?.newVersion;
                                if(newVersion && (version === newVersion || isNewerVersion(version, newVersion))) {
                                    snippetVersion.newVersion = ''; // 更新后清空新版本
                                }
                            }
                        }
                    });
                }
            }
        });
        observer.observe(document.body, { childList: true });
        observer.observe(document.head, { childList: true });
    }
    // 生成遵循协议的版本列表
    function generateVersionList(snippet) {
        // 扫描本代码的版本信息
        const textContent = snippet?.textContent || '';
        if (!textContent) return;
        const meta = {};
        const matchKeys = [];
        let lines = textContent.split('\n');
        lines = lines.slice(0, 200); // 默认扫描200行
        for (const line of lines) {
            if(['name','version', 'updateurl'].every(item=>matchKeys.includes(item))) break;
            const match = line.match(/^(?:\/\*| \*|\/\/)\s*(\w+)[ :：]\s*(.+?)(?:\*\/)?\r*$/i);
            if (match) {
                const key = match[1]?.trim()?.toLowerCase();
                const value = match[2]?.trim();
                if(!matchKeys.includes(key)) {
                    meta[key] = value;
                    matchKeys.push(key);
                }
            }
        }
        const currentName = meta.name;
        const currentVersion = meta.version;
        const updateUrl = meta.updateurl;
        if (!currentName || !currentVersion || !updateUrl) return;
        if (!window.snippetsNewVersions) window.snippetsNewVersions = {};
        if (!window.snippetsNewVersions.versionList) window.snippetsNewVersions.versionList = {};
        window.snippetsNewVersions.versionList[currentName + updateUrl] = {
            name: currentName,
            version: currentVersion,
            url: updateUrl,
            scriptUrl: updateUrl,
            newVersion: '',
            updateDesc: '',
            type: snippet.tagName === 'SCRIPT' ? 'JS' : 'CSS',
            id: snippet.id,
            checkDelay: totalInterval+60000,
            lastCheck: Date.now(),
        }
    }
    function getVersionFromTextContent(text) {
        if (!text) return '';
        let lines = text.split('\n');
        lines = lines.slice(0, 200); // 默认扫描200行
        for (const line of lines) {
            const matchVersion = line.match(/^(?:\/\*| \*|\/\/)\s*version[ :：]\s*(.+?)(?:\*\/)?\r*$/i);
            if (matchVersion) {
                const remoteVersion = matchVersion[1]?.trim();
                return remoteVersion;
            }
        }
    }

    // 辅助函数
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
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function generateRandomTimestamps(totalTime, interval) {
        const timestamps = [];
        let current = interval;
        while (current <= totalTime) {
            timestamps.push(current);
            current += interval;
        }
        return shuffleArray(timestamps);
    }
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // 随机索引
            [array[i], array[j]] = [array[j], array[i]];  // 交换
        }
        return array;
    }
})();