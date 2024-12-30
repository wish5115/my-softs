// 新窗口缩小至屏幕一半
// see https://ld246.com/article/1732239161536/comment/1735555418141?r=wilsons#comments
(()=>{
    if(isNewWindow()) {
        if(!isElectron()) {
            resizeWindow();
        }
    } else {
        if(isElectron()) {
            OnWindowOpenResizeWindow();
        }
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