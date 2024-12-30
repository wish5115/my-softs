// 思源启动软件时最大化显示
// see https://ld246.com/article/1732239161536
(()=>{
    // true,仅在启动软件时最大化，刷新时不最大化; false,刷新页面时也最大化
    const onlyStart = true;

    if(isNewWindow()) {
        // 新窗口
        if(!isElectron()) {
            resizeWindow();
        }
        return;
    } else {
        // 主窗口
        if(isElectron()) {
            OnWindowOpenResizeWindow();
        }
    }

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

    function resizeWindow() {
        // 获取屏幕的宽度和高度
        const screenWidth = screen.width;
        const screenHeight = screen.height;

        // 计算新窗口的宽度和高度（屏幕的一半）
        const windowWidth = screenWidth / 2;
        const windowHeight = screenHeight / 2;

        // 计算新窗口的位置（居中显示）
        const windowLeft = (screenWidth - windowWidth) / 2;
        const windowTop = (screenHeight - windowHeight) / 2;

        // 调整窗口大小和位置
        window.resizeTo(windowWidth, windowHeight);
        window.moveTo(windowLeft, windowTop);
    }

    function isNewWindow() {
        return !document.querySelector("#toolbar");
    }

    function isElectron() {
        return navigator.userAgent.includes('Electron');
    }

    function getNewWindowSize() {
        // 获取屏幕的宽度和高度
        const screenWidth = screen.width;
        const screenHeight = screen.height;

        // 计算新窗口的宽度和高度（屏幕的一半）
        const windowWidth = screenWidth / 2;
        const windowHeight = screenHeight / 2;

        return {width: windowWidth, height: windowHeight};
    }

    function OnWindowOpenResizeWindow() {
        const ipcRenderer = require('electron').ipcRenderer;
        const originalSend = ipcRenderer.send;
        // 重写 ipcRenderer.send 方法
        ipcRenderer.send = async function (...args) {
            if(args[0] === 'siyuan-open-window' && !args[1].width && !args[1].height){
                const newWinSize = getNewWindowSize();
                args[1].width = newWinSize.width;
                args[1].height = newWinSize.height;
                originalSend.apply(ipcRenderer, args);
            } else {
                originalSend.apply(ipcRenderer, args);
            }
        };
    }
})();