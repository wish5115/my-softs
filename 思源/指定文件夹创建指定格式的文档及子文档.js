// 指定文件夹创建指定格式的文档及子文档
// 修改自 https://ld246.com/article/1759842778037
(()=>{
  // 配置参数
  const config = {
    token: '', // 替换为你的API Token
    notebookId: '20240224233354-t4fptpl', // 替换为目标笔记本ID
    parentPath: '/English/学习笔记', // 替换为目标父文档的路径
    apiUrl: 'api/filetree/createDocWithMd', // 思源笔记API的URL
    newDocTpl: `<iframe src="/widgets/listChildDocs/" data-subtype="widget" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`,
    subDocNames: ['第一篇', '第二篇', '第三篇'],
    subDocTpl: `## 文章\n## 生词\n## 笔记\n`,
    openType: 'newWindow', // newTab 新标签打开 newWindow 新窗口打开 为空不打开
    newWindow: {width: 490, height: 568, pin: true}, // 新窗口设置，宽高为0将使用思源默认宽高，pin是否置顶
    btnPos: 'dock', // 按钮位置 toolbar 工具栏 dock 左侧边栏 
  };

  if(isMobile()) return; // 不支持手机版

  // 当新窗口时置顶窗口
  if(config.newWindow.pin && localStorage.getItem('__custom_new_win') === 'true'){
    pinWindow();
    return;
  }

  // 调用函数在工具栏添加按钮
  setTimeout(()=>addCreateSubDocButton(), 2000);
  
  // 该函数用于获取当前日期并返回符合要求的文件名（如：23.10.11.未命名）
  function getFileName() {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份
    const day = now.getDate().toString().padStart(2, '0'); // 日期
    return `${year}-${month}-${day}`;
  }
  
  // 获取当前时间，格式化为 YYYY-MM-DD HH:MM:SS
  function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  // 创建子文档
  async function createSubDocument(content = '', openType = '', parentPath = '', fileName = '') {
    const { token, notebookId, apiUrl } = config;  // 解构获取配置参数
    parentPath = parentPath || config.parentPath;
  
    fileName = fileName || getFileName();  // 获取文件名
    const currentTime = getCurrentTime();  // 获取当前时间
  
    // 将时间添加到文档内容中
    const markdownContent = content; // 默认内容，可以根据需要修改
  
    // 请求数据，子文档的路径是相对父文档的路径
    const requestData = {
      notebook: notebookId,
      path: `${parentPath}/${fileName}`,  // 子文档的路径
      markdown: markdownContent,  // 子文档内容
    };
  
    // 调用思源笔记 API 创建子文档
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(requestData),
    });
  
    const result = await response.json();
  
    if (result.code === 0) {
      console.log('子文档创建成功:', result.data);
      const newDocId = result.data;  // 获取新创建文档的 ID
      if(openType === 'newTab') openDocumentInEditor(newDocId);  // 调用编辑窗口
      if(openType === 'newWindow') openDocumentInNewWindow(newDocId);
      return {path:`${parentPath}/${fileName}`, id: newDocId};
    } else {
      console.error('子文档创建失败:', result.msg);
    }
  }
  
  // 在编辑窗口打开文档
  function openDocumentInEditor(docId) {
    const url = `siyuan://blocks/${docId}`;
    window.open(url, '_blank');  // 使用 window.open 来打开新的窗口
    console.log(`正在打开文档编辑窗口: ${url}`);
  }

  function openDocumentInNewWindow(docId) {
    openNewWindowById(docId, {width: config.newWindow.width, height: config.newWindow.height});
    localStorage.setItem('__custom_new_win', true);
    setTimeout(()=>localStorage.removeItem('__custom_new_win'), 5000);
  }
  
  // 插入按钮，点击时创建子文档
  function addCreateSubDocButton() {
    let createSubDocBtn;
    if(config.btnPos === 'toolbar') {
      let barSync = document.getElementById("barSync");
      barSync.insertAdjacentHTML(
        "afterEnd",
        '<div id="barCreateSubDoc_simulate" class="toolbar__item ariaLabel" aria-label="创建子文档/Create Sub Document" ></div>'
      );
      createSubDocBtn = document.getElementById("barCreateSubDoc_simulate");
      createSubDocBtn.innerHTML = `<svg><use xlink:href="#iconCalendar"></use></svg>`;
    } else {
      const html = `<span data-height="null" data-width="273" data-type="barCreateSubDoc_simulate" data-index="0" data-hotkey="" data-hotkeylangid="" data-title="" class="dock__item ariaLabel" aria-label="创建带日期的子文档">
                        <svg><use xlink:href="#iconCalendar"></use></svg>
                    </span>
      `;
      const dockItems = document.querySelector('#dockLeft .dock__items');
      dockItems.querySelector('.dock__item--pin').insertAdjacentHTML('beforebegin', html);
      createSubDocBtn = dockItems.querySelector('[data-type="barCreateSubDoc_simulate"]');
    }
    createSubDocBtn.addEventListener("click", async function (e) {
      e.stopPropagation();
    
      // 禁用按钮，防止重复点击
      createSubDocBtn.style.opacity = "0.5";
      createSubDocBtn.style.pointerEvents = "none";
    
      try {
        const dateFileName = getFileName();
        const parentPath = `${config.parentPath}/${dateFileName}`;

        const ids = await requestApi('/api/filetree/getIDsByHPath', {notebook:config.notebookId, path:parentPath});
        if(ids?.data?.length > 0) {
          if(config.openType) {
            const docId = ids?.data[0];
            if(config.openType === 'newTab') openDocumentInEditor(docId);  // 调用编辑窗口
            if(config.openType === 'newWindow') openDocumentInNewWindow(docId);
            return;
          } else {
            throw new Error('创建文件识别，文件已存在');
          }
        }
    
        // 创建父文档（日期文件夹）
        const {path:parentDocPath, id:parentId} = await createSubDocument(
          config.newDocTpl,
          config.openType,
          config.parentPath,
          dateFileName
        );
    
        if (!parentDocPath) return;
    
        // 创建子文档
        if (config.subDocNames && config.subDocNames.length > 0) {
          let paths = [];
          for (const name of config.subDocNames) {
            const {id} = await createSubDocument(
              config.subDocTpl,
              '',
              parentPath,
              name
            );
            const path = await requestApi('/api/filetree/getPathByID', {id});
            if(path?.data?.path) paths.push(path?.data?.path);
          }
          if(paths.length > 0) {
            // 排序
            await requestApi('/api/filetree/changeSort', {
                "paths": paths,
                "notebook": config.notebookId
            });

            // 刷新文档树
            const li = document.querySelector('.sy__file > .fn__flex-1 li[data-node-id="'+parentId+'"]');
            const arrow = li.querySelector('.b3-list-item__toggle:has(svg.b3-list-item__arrow--open)');
            arrow.click();
            arrow.click();
          }
        }
    
      } catch (err) {
        console.error("创建文档失败:", err);
      } finally {
        // 重新启用按钮
        createSubDocBtn.style.opacity = "1";
        createSubDocBtn.style.pointerEvents = "auto";
      }
    }, false);
  }

  async function requestApi(url, data, method = 'POST') {
      return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
  }

  function isMobile() {
      return !!document.getElementById("sidebar");
  }

  function isBrowser() {
      return !navigator.userAgent.startsWith("SiYuan") ||
          navigator.userAgent.indexOf("iPad") > -1 ||
          (/Android/.test(navigator.userAgent) && !/(?:Mobile)/.test(navigator.userAgent));
  }

  // see https://github.com/siyuan-note/siyuan/blob/26568e33cf3a5e1f847b799118bfcdbb9c31db6a/app/src/window/openNewWindow.ts#L36
  // options = {position:{x:0, y:0}, width:0, height:0}
  async function openNewWindowById(id, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 50));
    let ids = id;
    if (typeof ids === "string") {
        ids = [ids];
    }
    const json = [];
    for (let i = 0; i < ids.length; i++) {
        const response = await requestApi("/api/block/getBlockInfo", {id: ids[i]});
        if (response.code === 3) {
            showMessage(response.msg);
            return;
        }
        json.push({
            title: response.data.rootTitle,
            docIcon: response.data.rootIcon,
            pin: false,
            active: true,
            instance: "Tab",
            action: "Tab",
            children: {
                notebookId: response.data.box,
                blockId: ids[i],
                rootId: response.data.rootID,
                mode: "wysiwyg",
                instance: "Editor",
                action: response.data.rootID === ids[i] ? 'cb-get-scroll' : 'cb-get-all'
            }
        });
    }
    if(!isBrowser()) {
      const ipcRenderer = require('electron').ipcRenderer;
      ipcRenderer.send('siyuan-open-window', {
          position: options.position,
          width: options.width,
          height: options.height,
          url: `${window.location.protocol}//${window.location.host}/stage/build/app/window.html?v=${window.siyuan.config.system.kernelVersion}&json=${encodeURIComponent(JSON.stringify(json))}`
      });
    }
  }
  function showMessage(message, isError = false, delay = 7000) {
      return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
          "method": "POST",
          "body": JSON.stringify({"msg": message, "timeout": delay})
      });
  }
  function pinWindow() {
    const pinButton = document.getElementById("pinWindow");
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('siyuan-cmd', 'setAlwaysOnTopTrue');
    pinButton.querySelector("use").setAttribute("xlink:href", '#iconUnpin');
    pinButton.setAttribute("aria-label", window.siyuan.languages.unpin);
  }
})();