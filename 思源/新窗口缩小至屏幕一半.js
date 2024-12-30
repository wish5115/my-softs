// 新窗口缩小至屏幕一半.js
// see https://ld246.com/article/1732239161536/comment/1735555418141?r=wilsons#comments
(()=>{
    if(!isNewWindow()) return;

    resizeWindow();

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
})();