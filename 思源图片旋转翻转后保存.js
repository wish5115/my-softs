// 功能：思源图片旋转/翻转后保存
// 版本: 0.0.2
// 更新记录
// 0.0.2 解决缓存问题造成操作后图片无法实时更新问题，同时改进了手机版免刷新更新图片
// 注意事项：该操作会覆盖原图，请严格测试后谨慎使用，操作前做好备份，由此造成的任何后果均与作者无关。
// 支持jpg,png,webp,bmp,gif(非动画)
(async () => {
  // 使用方法：
  // 1. 下载js放到 data/public目录或在线路径，可根据下面的参数compressionJsPath进行配置
  // 2. 把该代码片段放到思源js代码片段中即可
  // 3. 在思源中操作完成（比如，旋转或翻转）后，点击右下角的保存按钮即可
  
  // 图片压缩js路径或URL地址配置
  // 图片压缩js下载地址（去掉https://ghp.ci/国内代理地址，即为github下载地址）
  // https://ghp.ci/https://raw.githubusercontent.com/Donaldcwl/browser-image-compression/refs/heads/master/dist/browser-image-compression.js
  const compressionJsPath = '/public/browser-image-compression.js';

  // 图片保存后是否自动关闭弹窗, true关闭，false不关闭
  const isCloseViewerAfterSave = true;
  
  // 图片压缩选项
  // 更多参数可参考 https://github.com/Donaldcwl/browser-image-compression?tab=readme-ov-file#main-function
  const compressionOptions = {
      // 文件最大大小，会把图片压缩到该值以内
      maxSizeMB: 2,
      // 图片最大宽度或高度，会等比缩放，限制在这个数值以内
      maxWidthOrHeight: 1920,
      // 压缩图片的质量，该值应在 0 到 1 之间，【注意】这里如果设置小于1，多次操作后质量可能会逐渐下降
      initialQuality: 1,
      // 是否使用work线程，加快压缩速度
      useWebWorker: true,
      // worker线程js地址
      libURL: compressionJsPath,
      //是否为 JPEG 图像保留 Exif 元数据，例如相机型号、焦距等
      preserveExif: false,
      // 保持宽高不变
      alwaysKeepResolution: true,
  }

  // 控制逻辑
  if(siyuan.config.readonly) return;
  observeViewerContainer((viewer) => {
      const closeBtn = viewer.querySelector(".viewer-toolbar li.viewer-close");
      if(!closeBtn) return;
      // 创建保存按钮
      const li = document.createElement('li');
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      li.classList.add('viewer-save');
      li.innerHTML = '<svg style="width:16px;height:24px;color:#fff" t="1730798161057" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4590" width="24" height="24"><path d="M704 128l192 192v512a64 64 0 0 1-64 64H192a64 64 0 0 1-64-64V192a64 64 0 0 1 64-64h512z m-64 64H384v96h256V192z m64 26.496V352H320V192H192v640h128V512h384v320h128V346.496l-128-128zM640 832V576H384v256h256z" fill="#dfe0e1" fill-opacity=".9" p-id="4591" data-spm-anchor-id="a313x.search_index.0.i10.61b73a81jze9QE"></path></svg>';
      li.onclick = () => {
          const image = viewer.querySelector(".viewer-canvas img");
          saveImage(image, (filePath) => {
              reloadImages(filePath, 100);
              if(isCloseViewerAfterSave) closeBtn.click();
          });
      };
      closeBtn.parentElement.insertBefore(li, closeBtn);
  });

  // 功能函数区
  function saveImage(image, callback) {
    const filePath = parseUrl(image.src);
    if(['http:', 'https:'].includes(filePath.protocol) && filePath.host !== location.host) {
        showMessage('仅支持本地文件');
        return;
    }
    if(filePath.protocol === 'file:' && !isElectron()) {
        showMessage('仅在Electron环境支持file协议的图片');
        return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    const width = image.naturalWidth;
    const height = image.naturalHeight;
  
    const transform = image.style.transform || image.style.webkitTransform;
  
    let rotation = 0;
    let scaleX = 1;
    let scaleY = 1;
  
    if (transform && transform !== 'none') {
      const values = transform.match(/(rotate\(|scaleX\(|scaleY\()([-+]?\d*\.?\d+)(deg)?\)/g);
      if (values) {
        values.forEach(value => {
          const [fullMatch, func, num, unit] = value.match(/(rotate\(|scaleX\(|scaleY\()([-+]?\d*\.?\d+)(deg)?\)/);
          if (func === 'rotate(') {
            rotation = parseFloat(num);
          } else if (func === 'scaleX(') {
            scaleX = parseFloat(num);
          } else if (func === 'scaleY(') {
            scaleY = parseFloat(num);
          }
        });
      }
    }
  
    // 简化旋转角度到0-360度范围内
    rotation = rotation % 360;
  
    // 处理负角度
    if (rotation < 0) {
      rotation += 360;
    }
  
    // 根据旋转角度调整画布尺寸
    let canvasWidth = width;
    let canvasHeight = height;
    if ([90, 270].includes(rotation)) {
      canvasWidth = height;
      canvasHeight = width;
    }
  
    // 设置画布尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  
    // 应用旋转和翻转
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-width / 2, -height / 2);
  
    // 绘制图片到canvas
    ctx.drawImage(image, 0, 0, width, height);
  
    // 恢复到保存前的状态，确保连续操作不会受到影响
    ctx.restore();

    if(filePath.protocol !== 'file:') filePath.path = filePath.path.replace('/', '');
  
    // 将Data存到文件
    canvas.toBlob(async (blob) => {
        let path = '/data/' + filePath.path;
        if(filePath.protocol === 'file:') path = 'file://' + filePath.path;
        if(!compressionJsPath){
          await putFile(path, blob);
        } else {
            try {
              if(!document.querySelector('#browser-image-compression')){
                 await loadScript(compressionJsPath, 'browser-image-compression');
              }
              const compressedFile = await imageCompression(blob, compressionOptions);
              await putFile(path, compressedFile);
            } catch (error) {
              console.error('Error compressing image:', error);
            }
        }
        if(callback) callback(filePath);
    }, 'image/'+filePath.extension.replace('jpg', 'jpeg'));
  }
  // 动态加载 browser-image-compression.js
  async function loadScript(url, id) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      if(id) script.id = id;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
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
  function reloadImages(filePath, delay) {
      const imgs = document.querySelectorAll('.protyle-wysiwyg [data-type="img"] img[src*="'+filePath.path+'"]');
      if(imgs.length > 0) {
          setTimeout(()=>{
              imgs.forEach(async img => {
                  let src = '';
                  if(filePath.protocol === 'file:'){
                      src = img.src;
                  } else {
                      src = filePath.path + filePath.search;
                  }
                  src = src + (src.indexOf('?')===-1?'?':'&') + 't=' + new Date().getTime();
                  img.src = src;
                  img.dataset.src = src;
                  updateBlock(img.closest('[data-type][data-node-id]'));
              });
          }, delay||0);
      }
  }
  function updateBlock(node) {
      fetchSyncPost('/api/block/updateBlock', {
          "dataType": "dom",
          "data": node.outerHTML,
          "id": node.dataset.nodeId
      })
  }
  function putFile(storagePath, data) {
      if(storagePath.startsWith('file://')) {
          return putLocalFileSync(storagePath.replace('file://', ''), data);
      }
      const formData = new FormData();
      formData.append("path", storagePath);
      formData.append("file", new Blob([data]));
      return fetch("/api/file/putFile", {
          method: "POST",
          body: formData,
      }).then((response) => {
          if (response.ok) {
              //console.log("File saved successfully");
          }
          else {
              throw new Error("Failed to save file");
          }
      }).catch((error) => {
          console.error(error);
      });
  }
  let fs;
  async function putLocalFileSync(filePath, data) {
    try {
        // 将 Blob 转换为 ArrayBuffer
        const arrayBuffer = await data.arrayBuffer();
        // 将 ArrayBuffer 转换为 Buffer
        const buffer = Buffer.from(arrayBuffer);
        // 使用 fs.writeFileSync 方法同步地写入文件
        if(!fs) fs = require('fs');
        fs.writeFileSync(filePath, buffer);
    } catch (error) {
       console.error(`Error writing file to ${filePath}:`, error);
    }
  }
  function isElectron() {
      return navigator.userAgent.includes('Electron');
  }
  function isMobile() {
      return !!document.getElementById("sidebar");
  }
  function showMessage(message, delay) {
      fetchSyncPost("/api/notification/pushMsg", {
        "msg": message,
        "timeout": delay || 7000
      });
  }
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
  function observeViewerContainer(callback) {
    // 创建一个新的MutationObserver实例
    const observer = new MutationObserver((mutationsList, observer) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          // 检查是否有新的 .viewer-container 元素被添加
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('viewer-container')) {
              callback(node); // 调用回调函数
              break; // 找到后退出循环
            }
          }
        }
      }
    });
    // 配置观察选项，这里观察直接子节点的变化
    const config = { childList: true };
    // 开始观察body元素
    observer.observe(document.body, config);
  }
})();