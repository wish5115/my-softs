// 拦截思源全局退出快捷键，防止意外退出
// Ma上是Command+Q，windows上是Alt+F4
// 感谢 @JeffreyChen 的提醒
// version 0.0.4
// see https://ld246.com/article/1751671702656
(()=>{
    if(!isElectron()) return;
    document.addEventListener('keydown', async (e) => {
        // 判断是否按下了 Command+Q（即Meta+Q）或 Alt+F4（windows）
        if (
            (isMac() && e.metaKey && e.code === 'KeyQ' && !e.ctrlKey && !e.shiftKey && !e.altKey) ||
            (isWindows() && e.altKey && e.code === 'F4' && !e.ctrlKey && !e.metaKey && !e.shiftKey)
        ) {
            // 阻止事件冒泡和默认行为
            e.stopPropagation();
            e.preventDefault();
            confirmExit();
        }
    }, true);
    async function confirmExit() {
        if(window.confirm('即将退出思源，您确定要退出吗？')) {
            // 内核退出
            await requestApi('/api/system/exit');
            // 渲染进程退出
            exitApp();
        }
    }
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
    function isWindows() {
        return document.body.classList.contains("body--win32");
    }
})();