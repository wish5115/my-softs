// 拦截ctrl/meta + q 退出事件
document.addEventListener('keydown', async (e) => {
    // 判断是否按下了 Ctrl+Q 或 Meta+Q
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyQ') {
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
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
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
}, true);