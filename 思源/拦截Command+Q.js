// 拦截Command+Q退出事件
// 仅 Mac 系统上有这个问题
// Mac 上任何应用按 Command+Q（即 Meta+Q）均退出应用。
// 感谢 @JeffreyChen 的提醒。
// version 0.0.3
// see https://ld246.com/article/1751671702656
(()=>{
    if(!(isMac() && isElectron())) return;
    document.addEventListener('keydown', async (e) => {
        // 判断是否按下了 Command+Q（即Meta+Q）
        if (e.metaKey && e.code === 'KeyQ' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            // 阻止事件冒泡和默认行为
            e.stopPropagation();
            e.preventDefault();
            if(window.confirm('即将退出思源，您确定要退出吗？')) {
                // 内核退出
                await requestApi('/api/system/exit');
                // 渲染进程退出
                exitApp();
            }
        }
    }, true);
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    // see https://github.com/siyuan-note/siyuan/blob/a2a678c5fbb560e3b265dc2c690f568bcf15a663/app/stage/auth.html#L421
    function exitApp() {
        try {
            const {ipcRenderer} = require('electron')
            ipcRenderer.send('siyuan-quit', window.location.port)
        } catch (e) {
            if ((window.webkit && window.webkit.messageHandlers) || window.JSAndroid || window.JSHarmony) {
                window.location.href = 'siyuan://api/system/exit'
            } else {
                window.location.reload()
            }
        }
    }
    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }
    function isElectron() {
        return navigator.userAgent.includes('Electron');
    }
})();