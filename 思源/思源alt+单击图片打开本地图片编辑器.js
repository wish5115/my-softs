// 思源alt+单击图片打开本地图片编辑器
// 特色：打开编辑器后会等待编辑器的关闭，关闭后自动刷新思源文档
// 仅支持electron端，及Windows和Mac系统
// windows调用画图，Mac调用预览
// see https://ld246.com/article/1733636224439
(()=>{
    if(isElectron() && (isMac() || isWindows())); else return;

    // 监听鼠标单击事件
    document.addEventListener('mousedown', function(event) {
        if(!event.altKey || event.button !== 0 || event.target.tagName !== 'IMG' || !event.target.closest('.protyle')) return;
        openPaint(event.target.dataset?.src, () => {
            Refresh();
        });
    });
    
    // 刷新文档
    function Refresh() {
        let keyInit = {
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            key: 'F5',
            keyCode: 116
        }
        keyInit["bubbles"] = true;
        let keydownEvent = new KeyboardEvent('keydown', keyInit);
        document.getElementsByTagName("body")[0].dispatchEvent(keydownEvent);
        let keyUpEvent = new KeyboardEvent('keyup', keyInit);
        document.getElementsByTagName("body")[0].dispatchEvent(keyUpEvent);
    }
    
    function isElectron() {
        return navigator.userAgent.includes('Electron');
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    function isWindows() {
        return document.body.classList.contains("body--win32");
    }

    // 使用画图和预览打开思源图片
    function openPaint(file, onClose) {
        if(!file) return;
        const { exec, spawn } = require('child_process');
        const path = require('path');
        const os = require('os');
    
        // 使用绝对路径确保文件能被正确找到
        if(file.startsWith('file://')) file = file.replace('file://', '');
        const imagePath = path.resolve(siyuan.config.system.dataDir, file);
    
        if (os.platform() === 'win32') {
            // 对于 Windows, 使用 mspaint
            appName = 'mspaint';
            viewer = spawn(appName, [imagePath]);
            // 可选：监听标准输出和错误输出
            viewer.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });
    
            viewer.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
    
            // 监听关闭事件
            viewer.on('close', (code) => {
                if(onClose) onClose();
            });
        } else if (os.platform() === 'darwin') {
            // 创建 AppleScript 代码
            const appleScriptCode = `
            tell application "Preview"
                activate
                open POSIX file "${imagePath.replace(/"/g, '\\"')}"
                set windowIsOpen to true
                repeat while windowIsOpen
                    try
                        if (count of windows) is 0 then
                            set windowIsOpen to false
                        end if
                    on error
                        set windowIsOpen to false
                    end try
                    delay 0.5 -- 检查间隔时间（秒）
                end repeat
                quit
            end tell`;
    
            // 执行 AppleScript
            exec(`osascript -e '${appleScriptCode.replace(/'/g, "\\'")}'`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing AppleScript: ${stderr}`);
                    return;
                }
                if(onClose) onClose();
            });
        }
    }
})();