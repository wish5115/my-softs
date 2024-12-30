// 思源启动软件时最大化显示
// see https://ld246.com/article/1732239161536
(()=>{
    // true,仅在启动软件时最大化，刷新时不最大化; false,刷新页面时也最大化
    const onlyStart = true;

    if(isNewWindow()) return;

    if(onlyStart) {
        const hasMaxmized = sessionStorage.getItem("hasMaxmized") || '';
        if(hasMaxmized === 'yes') return;
    }
    
    try {
        if(typeof require === 'function') {
            const electron = require('electron');
            if(typeof electron === 'object') {
                const ipcRenderer = electron.ipcRenderer;
                if (ipcRenderer) {
                    ipcRenderer.send('siyuan-cmd', 'maximize');
                    sessionStorage.setItem("hasMaxmized", "yes");
                }
            }
        }
    } catch (e) {
        console.log(e);
    }

    function isNewWindow() {
        return !document.querySelector("#toolbar");
    }
})();