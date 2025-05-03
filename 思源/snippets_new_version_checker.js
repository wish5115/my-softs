// name 检查代码片段是否需要更新（用户端）
// version 0.0.1
// updateUrl https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/snippets_new_version_checker.js
// updateDesc 初始发布
// author Wilsons
// see 

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
    observeSnippetsOpen();

    // 功能函数
    // 检查并更新版本号
    function checkAndUpdateNewVersion(currentName, currentVersion, updateUrl) {
        fetch(updateUrl + (updateUrl.indexOf('?') !== -1 ? '&' : '?') + 't=' + Date.now()).then(response => response.text()).then(text => {
            let remoteVersion = '', remoteUpdateUrl = '', remoteUpdateDesc = '';
            let remoteLines = text.split('\n');
            remoteLines = remoteLines.slice(0, 200); // 默认扫描200行
            for (const line of remoteLines) {
                const matchVersion = line.match(/^(?: \*|\/\/)\s*version[ :：]\s*([\s\S]+)$/i);
                if (matchVersion) remoteVersion = matchVersion[1]?.trim();
                const matchUrl = line.match(/^(?: \*|\/\/)\s*updateUrl[ :：]\s*([\s\S]+)$/i);
                if (matchUrl) remoteUpdateUrl = matchUrl[1]?.trim();
                const matchDesc = line.match(/^(?: \*|\/\/)\s*updateDesc[ :：]\s*([\s\S]+)$/i);
                if (matchDesc) remoteUpdateDesc = matchDesc[1]?.trim();
                if (matchVersion && matchUrl && matchDesc) break;
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
                if(remoteUpdateUrl) window.snippetsNewVersions.versionList[currentName + updateUrl].scriptUrl = remoteUpdateUrl;
                window.snippetsNewVersions.versionList[currentName + updateUrl].updateDesc = remoteUpdateDesc;
            }
        }).catch(err => { console.warn(err); });
    }
    // 监听代码片段窗口被打开
    function observeSnippetsOpen() {
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
                                    if (snippet.newVersion) snippetsNewVersionList += `<div style="padding:2px 10px;">[${snippet.type}] ${snippet.name} 有新版本 V${snippet.newVersion}${snippet.updateDesc.replace(/(.+)/, '，$1')} <a href="${snippet.scriptUrl||snippet.url}" target="_blank">查看</a></div>`;
                                });
                                if (snippetsNewVersionList) container.insertAdjacentHTML('afterbegin', `<div style="max-height:200px;overflow:auto;">${snippetsNewVersionList}</div>`);
                            }
                        }
                    });
                }
            }
        }).observe(document.body, { childList: true });
    }
    // 生成遵循协议的版本列表
    function generateVersionList(snippet) {
        // 扫描本代码的版本信息
        const textContent = snippet?.textContent || '';
        if (!textContent) return;
        const meta = {};
        let lines = textContent.split('\n');
        lines = lines.slice(0, 200); // 默认扫描200行
        for (const line of lines) {
            const match = line.match(/^(?: \*|\/\/)\s*(\w+)[ :：]\s*([\s\S]+)$/i);
            if (match) { const key = match[1]?.trim()?.toLowerCase(); const value = match[2]?.trim(); meta[key] = value; }
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
            checkDelay: totalInterval+60000,
            lastCheck: Date.now(),
        }
    }

    // 辅助函数
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