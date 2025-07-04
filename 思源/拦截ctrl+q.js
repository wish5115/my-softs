// 拦截ctrl/meta + q 退出事件
// see https://ld246.com/article/1751671702656
(()=>{
    document.addEventListener('keydown', async (e) => {
        // 判断是否按下了 Ctrl+Q 或 Meta+Q
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyQ' && !e.shiftKey && !e.altKey) {
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
})();
