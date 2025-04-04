// 思源alt+单击图片打开本地图片编辑器
// 特色：打开编辑器后会等待编辑器的关闭，关闭后自动刷新思源文档
// 仅支持electron端，及Windows和Mac系统
// 默认windows调用画图，Mac调用预览
// see https://ld246.com/article/1733636224439
(()=>{
    // 关闭图片编辑器后的延迟时间，单位毫秒，防止未保存完成
    const delayTimeAfterCloseEditor = 100;
    
    // windows 下调用的编辑器APP，默认 mspaint
    // 注意：Windows下的路径分隔符\要用\\表示，比如 C:\\path\\some.exe
    const windowsApp = 'mspaint';
    
    // Mac下调用的编辑器APP，默认 Preview
    // 这里是应用程序名，可在应用右键简介或应用包的Info.list里查看
    const macosApp = 'Preview';
    
    // 判断是否支持的平台
    if(isElectron() && (isMac() || isWindows())); else return;

    // 监听鼠标单击事件
    document.addEventListener('mousedown', function(event) {
        if(!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0 || event.target.tagName !== 'IMG' || !event.target.closest('.protyle')) return;
        const src = event.target.src;
        const filePath = parseUrl(src);
        if(['http:', 'https:'].includes(filePath.protocol) && filePath.host !== location.host) {
            showMessage('仅支持本地文件');
            return;
        }
        if(filePath.protocol === 'file:' && !isElectron()) {
            showMessage('仅在Electron环境支持file协议的图片');
            return;
        }
        openPaint(filePath.path, () => {
            reloadImages(filePath, delayTimeAfterCloseEditor);
        });
    });

    // 重新加载图片
    function reloadImages(filePath, delay) {
      const imgs = document.querySelectorAll('.protyle-wysiwyg [data-type="img"] img[src*="'+filePath.path.replace(/^\//, '')+'"]');
      if(imgs.length > 0) {
          setTimeout(()=>{
              imgs.forEach(async img => {
                  let src = '';
                  if(filePath.protocol === 'file:'){
                      src = img.src;
                  } else {
                      src = filePath.path.replace(/^\//, '') + filePath.search;
                  }
                  src = src.replace(/t=\d+/ig, '').replace('&+', '&').replace(/[&?]+$/, '');
                  src = src + (src.indexOf('?')===-1?'?':'&') + 't=' + new Date().getTime();
                  img.src = src;
                  img.dataset.src = src;
                  updateBlock(img.closest('[data-type][data-node-id]'));
              });
          }, delay||0);
      }
    }

    // 更新图片所在块
    function updateBlock(node) {
      fetchSyncPost('/api/block/updateBlock', {
          "dataType": "dom",
          "data": node.outerHTML,
          "id": node.dataset.nodeId
      })
    }

    // 解析URL
    function parseUrl(url) {
        // 创建一个URL对象
        const parsedUrl = new URL(url);
      
        // 获取路径部分
        const pathname = parsedUrl.pathname;
      
        // 获取文件名和扩展名
        const filenameWithExtension = pathname.split('/').pop();
        const [filename, extension] = filenameWithExtension.split('.');
      
        return {
          path: decodeURIComponent(pathname),
          filename: decodeURIComponent(filenameWithExtension),
          extension: extension,
          search: parsedUrl.search,
          protocol: parsedUrl.protocol,
          host: parsedUrl.host,
        };
      }

    // 显示通知信息
    function showMessage(message, delay) {
      fetchSyncPost("/api/notification/pushMsg", {
        "msg": message,
        "timeout": delay || 7000
      });
    }

    // 是否electron平台
    function isElectron() {
        return navigator.userAgent.includes('Electron');
    }

    // 是否macOS
    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    // 是否Windows系统
    function isWindows() {
        return document.body.classList.contains("body--win32");
    }

    // 使用画图和预览打开思源图片
    const { exec, spawn } = require('child_process');
    const path = require('path');
    const os = require('os');
    function openPaint(file, onClose) {
        if(!file) return;
    
        // 使用绝对路径确保文件能被正确找到
        if(file.startsWith('file://')) file = file.replace('file://', '');
        if(file.startsWith('/assets')) file = file.replace(/^\//, '');
        const imagePath = path.resolve(siyuan.config.system.dataDir, file);
    
        if (os.platform() === 'win32') {
            // 对于 Windows, 默认使用 mspaint
            viewer = spawn(windowsApp, [imagePath]);
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
            // 创建 AppleScript 代码，默认使用 Preview
            const appleScriptCode = `
            tell application "${macosApp}"
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

    // 请求api
    async function fetchSyncPost(url, data, returnType = 'json') {
      const init = {
          method: "POST",
      };
      if (data) {
          if (data instanceof FormData) {
              init.body = data;
          } else {
              init.body = JSON.stringify(data);
          }
      }
      try {
          const res = await fetch(url, init);
          const res2 = returnType === 'json' ? await res.json() : await res.text();
          return res2;
      } catch(e) {
          console.log(e);
          return returnType === 'json' ? {code:e.code||1, msg: e.message||"", data: null} : "";
      }
  }
})();