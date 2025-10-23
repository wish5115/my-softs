// AI英语学习助手
// 修改自 https://ld246.com/article/1759842778037
(()=>{
  // 配置参数
  const config = {
    token: '', // 替换为你的API Token
    notebookId: '20240224233354-t4fptpl', // 替换为目标笔记本ID
    parentPath: '/English/学习笔记', // 替换为目标父文档的路径
    parentId: '20251012024801-ikdc75v', // 父文档id,enableCopy2WeekDocs true时必填
    apiUrl: 'api/filetree/createDocWithMd', // 思源笔记API的URL
    newDocTpl: `<iframe src="/widgets/listChildDocs/" data-subtype="widget" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`,
    subDocNames: ['第一篇', '第二篇', '第三篇'],
    subDocTpl: `## 文章\n## 生词\n## 总结\n## 笔记\n`,
    subDocTags: 'english,study',
	FSRSMaxDay: 14, // 间隔重复算法最大天数（最近学习的文章个数也取这个字段）
	skipTodayDocOnCopy: true, // 复制时跳过今天的文档
    openType: 'newWindow', // newTab 新标签打开 newWindow 新窗口打开 为空不打开
    newWindow: {width: 490, height: 568, pin: true}, // 新窗口设置，宽高为0将使用思源默认宽高，pin是否置顶
    btnPos: 'dock', // 按钮位置 toolbar 工具栏 dock 左侧边栏
    enableCopy2WeekDocs: true, // 是否开启复制两周内文档功能
	mergeLn: true, // 生词是否合并换行为空格
    knownVocabulary: 2500, // 已掌握词汇量
	wordsBetween: ["生词", "总结"],
	articleBetween: ["文章", "生词"],
    // 复制内容模板 {{__content1__}} {{__content2__}} 是动态输入内容模板
    copyTpl: `
## 说明
我开始学习时约掌握{{__knowWordsNum__}}左右的词汇量，目前已学习{{__learnDays__}}天。
现在请按照我下面的要求帮我生成学习内容，随机生成适合我目前水平阅读的3篇不同题材的分级阅读文章。

## 生成内容要求
1. 根据间隔重复算法帮我生成今天要复习的单词
2. 根据我目前的水平生成3篇不同题材的分级阅读文章，题材不限，随机生成。

## 生成文章要求
1. 文章包含标题
2. 遵循“i+1”可理解输入的方式生成文章
3. 按照 News in Levels 2-3 的标准生成文章
4. 根据用户目前水平决定是否出现**学术高频词**（如 AWL 词汇等）
5. 按照星级词汇或高频词汇的标准生成文章
6. 文章长度在300-500词左右，可根据用户水平和需要决定
7. 文末列出生词表及短语词组等并说明其用法（生词表仅列出本次新增的新词即可）
8. 根据需要增加新词量，但注意新词量不要太少，3篇至少要10个左右
9. 文章风格不要与之前的重复

## 生成文章的格式如下

\`\`\`
# <标题>
## 文章
<文章>
## 生词
<生词>
## 总结
## 笔记
\`\`\`

列如：

\`\`\`
# The Alley After the Rain
## 文章
The rain stopped. Small drops still hung in the narrow alley...
## 生词
alley
roof
...
## 总结
## 笔记
\`\`\`

## 数据参考

### 最近2周学习过的单词
{{__content1__}}

### 所有学习过的单词
{{__content2__}}

### 最近学习过的文章
{{__content3__}}
---

下面请开始生成学习内容：
    `,
  };

  // 当新窗口时置顶窗口
  if(config.newWindow.pin && localStorage.getItem('__custom_new_win') === 'true'){
    pinWindow();
    return;
  }

  // 调用函数在工具栏添加按钮
  setTimeout(()=>addCreateSubDocButton(), 2000);

  // 监控并重置新窗口打开大小
//   OnNewWindowOpenThenResizeWindow(config.newWindow.width, config.newWindow.height);
//   function OnNewWindowOpenThenResizeWindow(width, height) {
//     const ipcRenderer = require('electron').ipcRenderer;
//     const originalSend = ipcRenderer.send;
//     // 重写 ipcRenderer.send 方法
//     ipcRenderer.send = async function (...args) {
//         if(args[0] === 'siyuan-open-window' && !args[1].width && !args[1].height){
//             args[1].width = width;
//             args[1].height = height;
//             originalSend.apply(ipcRenderer, args);
//         } else {
//             originalSend.apply(ipcRenderer, args);
//         }
//     };
//   }
  
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
  async function createSubDocument(content = '', openType = '', parentPath = '', fileName = '', tags = '') {
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
      tags: tags,
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
	if(openType && isMobile()) showMessage('创建成功');
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

  // 复制ai提示词
  async function copyAiPrompt() {
  	  // 获取文档PATH
	  const path = (await requestApi('/api/filetree/getPathByID', {id:config?.parentId}))?.data?.path;
	  if(!path) return;
	  // 获取笔记列表
	  let docs = await requestApi('/api/filetree/listDocTree', {
		  "notebook": config.notebookId,
		  "path": path.replace('.sy', '')
	  });
	  docs?.data?.tree?.reverse(); // 注意如果这里不是最近添加的文档在前，不需要翻转
	  if(config.skipTodayDocOnCopy) docs?.data?.tree?.shift();
	  const twoWeekDocs = docs?.data?.tree.slice(0, config.FSRSMaxDay);
	  const twoWeekIds = twoWeekDocs.map(d => d.id);
	  const docIds = [], pIds = {};
	  for(const doc of docs?.data?.tree) {
		if(!doc?.children) continue;
		for(const d of doc?.children) {
		  if(d.id) {
			  docIds.push(d.id);
			  pIds[d.id] = doc.id;
		  }
		}
	  }
	  // 拼接生词文本
	  let newWords = [], allWords = [], articles = [], usedPids = [], usedIds = [];
	  all:for(const id of docIds) {
		// 获取文档块列表
		const docBlocks = await requestApi('/api/block/getChildBlocks', {id});
		if(docBlocks && docBlocks?.data?.length > 0) {
		  // 获取生词
		  let start = false;
		  for(const block of docBlocks?.data) {
			if(block.content === config.wordsBetween[1]) break;
			if(start) {
			  if(twoWeekIds.includes(pIds[id])) {
				  // 输出日期标题
				  if(!usedPids.includes(pIds[id])) {
					  const docInfo = await requestApi('/api/block/getDocInfo', {id:pIds[id]});
					  if(docInfo?.data?.name) {
						  //newWords.push('### ' + docInfo?.data?.name + '\n');
						  // 注意如果这里不是最近添加的文档在前，usedPids.length+1 即可
						  let index = twoWeekIds.findIndex(i => i === pIds[id]);
						  index = index > 0 ? index : 0;
						  newWords.push('### Day' + (twoWeekIds.length-index) + '\n');
						  usedPids.push(pIds[id]);
					  }
				  }
				  // 输出块
				  if(block.markdown) newWords.push(config.mergeLn?block.markdown.trim():block.markdown);
			  }
			  if(block.markdown) allWords.push(config.mergeLn?block.markdown.trim():block.markdown);
			  continue;
			}
			if(block.content === config.wordsBetween[0]) {
			  start = true;
			  continue;
			}
		  }
		  // 获取文章
		  start = false;
		  let count = 0;
		  for(const block of docBlocks?.data) {
			count++;
			if(count > config.FSRSMaxDay || block.content === config.articleBetween[1]) break;
			if(start) {
			  if(!usedIds.includes(id)) {
				  const docInfo = await requestApi('/api/block/getDocInfo', {id});
				  if(docInfo?.data?.name) {
					  articles.push('\n#### ' + docInfo?.data?.name);
					  usedIds.push(id);
				  }
			  }
			  articles.push(block.markdown);
			  continue;
			}
			if(block.content === config.articleBetween[0]) {
			  start = true;
			  continue;
			}
		  }
		}
	  }
	  if(config.mergeLn) newWords = newWords.map(w => w.replace(/\n(?=.*\S)/g, ' / '));
	  if(config.mergeLn) allWords = allWords.map(w => w.replace(/\n(?=.*\S)/g, ' / '));
	  // const content1 = newWords.join(!config.mergeLn?'\n':' / ');
	  // const content2 = allWords.join(!config.mergeLn?'\n':' / ');
	  const allWordsLength = allWords.reduce((sum, str) => sum + str.split('/').length, 0);
	  const content1 = newWords.join('\n');
	  const content2 = allWords.join('\n');
	  const content3 = articles.join('\n');
	  const text = config.copyTpl.trim()
		  .replace('{{__content1__}}', content1)
		  .replace('{{__content2__}}', content2)
		  .replace('{{__content3__}}', content3)
		  .replace('{{__knowWordsNum__}}', config.knownVocabulary + allWordsLength)
		  .replace('{{__learnDays__}}', docs?.data?.tree?.length || 1);
	  copyToClipboard(text);
	  showMessage('复制成功');
  }
  
  // 插入按钮，点击时创建子文档
  function addCreateSubDocButton() {
    let createSubDocBtn, copyBtn;
	if(isMobile()) {
		// 手机版
		const newNote = document.querySelector('#menu #menuNewNotebook');
		if(config.enableCopy2WeekDocs) {
			const html = `<div id="copyWordsBtn" class="b3-menu__item">
		                <svg class="b3-menu__icon"><use xlink:href="#iconCopy"></use></svg><span class="b3-menu__label">复制生词</span>
		              </div>`;
			newNote.insertAdjacentHTML('afterend', html);
			copyBtn = newNote.parentElement.querySelector('#copyWordsBtn');
		}
		const html = `<div id="newLearnsBtn" class="b3-menu__item">
		                <svg class="b3-menu__icon"><use xlink:href="#iconCalendar"></use></svg><span class="b3-menu__label">新建学习</span>
		              </div>`;
		newNote.insertAdjacentHTML('afterend', html);
		createSubDocBtn = newNote.parentElement.querySelector('#newLearnsBtn');
	} else {
		// pc
		if(config.btnPos === 'toolbar') {
	      let barSync = document.getElementById("barSync");
	      barSync.insertAdjacentHTML(
	        "afterEnd",
	        '<div id="barCreateSubDoc_simulate" class="toolbar__item ariaLabel" aria-label="创建子文档" ></div>'
	      );
	      createSubDocBtn = document.getElementById("barCreateSubDoc_simulate");
	      createSubDocBtn.innerHTML = `<svg><use xlink:href="#iconCalendar"></use></svg>`;
		  if(config.enableCopy2WeekDocs) {
			  barSync.insertAdjacentHTML(
		        "afterEnd",
		        '<div id="barCreateSubDoc_copy2WeekDocs" class="toolbar__item ariaLabel" aria-label="复制两周内的文档" ></div>'
		      );
			  copyBtn = document.getElementById("barCreateSubDoc_copy2WeekDocs");
	          copyBtn.innerHTML = `<svg><use xlink:href="#iconCalendar"></use></svg>`;
			  
		  }
	    } else {
	      const html = `<span data-height="null" data-width="273" data-type="barCreateSubDoc_simulate" data-index="0" data-hotkey="" data-hotkeylangid="" data-title="" class="dock__item ariaLabel" aria-label="创建带日期的子文档">
	                        <svg><use xlink:href="#iconCalendar"></use></svg>
	                    </span>
	      `;
	      const dockItems = document.querySelector('#dockLeft .dock__items');
	      dockItems.querySelector('.dock__item--pin').insertAdjacentHTML('beforebegin', html);
	      createSubDocBtn = dockItems.querySelector('[data-type="barCreateSubDoc_simulate"]');
	      if(config.enableCopy2WeekDocs) {
	        const html = `<span data-height="null" data-width="273" data-type="barCreateSubDoc_copy2WeekDocs" data-index="0" data-hotkey="" data-hotkeylangid="" data-title="" class="dock__item ariaLabel" aria-label="复制两周内的文档">
	                        <svg><use xlink:href="#iconCopy"></use></svg>
	                      </span>
	        `;
	        dockItems.querySelector('.dock__item--pin').insertAdjacentHTML('beforebegin', html);
	        copyBtn = dockItems.querySelector('[data-type="barCreateSubDoc_copy2WeekDocs"]');
	      }
	    }
	}
	copyBtn.addEventListener('click', async (e) => {
	  e.preventDefault();
	  e.stopPropagation();
		if(isMobile()) closePanel();
	  copyAiPrompt();
    });

	// 创建文档和子文档
    createSubDocBtn?.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();
    
      // 禁用按钮，防止重复点击
      createSubDocBtn.style.opacity = "0.5";
      createSubDocBtn.style.pointerEvents = "none";
    
      try {
        const dateFileName = getFileName();
        const parentPath = `${config.parentPath}/${dateFileName}`;

        let parentDocPath = '', parentId = '';
		const ids = await requestApi('/api/filetree/getIDsByHPath', {notebook:config.notebookId, path:parentPath});
        let hasSubDocs = true;
		if(ids?.data?.length > 0) {
			const docId = ids?.data[0];
			parentDocPath = parentPath;
			parentId = docId;
			// 判断是否存在子文档
			const path = (await requestApi('/api/filetree/getPathByID', {id:docId}))?.data?.path;
			if(path){
				const children = await requestApi('/api/filetree/listDocTree', {
				  "notebook": config.notebookId,
				  "path": path.replace('.sy', '')
				});
				// 子文档不存在
				if(!children?.data?.tree?.length) {
					hasSubDocs = false;

					// 判断父是否存在listChildDocs widget 块
					const res = await querySql(`select * from blocks where root_id='${docId}' and type='widget' and markdown like '%<iframe src="/widgets/listChildDocs/"%' limit 1`);
					if(!res || !res?.length) {
						// 添加listChildDocs widget 块
						const r = await requestApi('/api/block/appendBlock', {data:config.newDocTpl, dataType:'markdown', parentID: docId});
						if(!r || r.code !== 0) console.error('添加listChildDocs widget 块失败', r);
					}
				}
			}
		}
		// 当父文档存在，并且有子文档时
		if(ids?.data?.length > 0 && hasSubDocs) {
          if(config.openType) {
			if(isMobile()) {
				showMessage('已创建');
				return;
			}
            if(config.openType === 'newTab') openDocumentInEditor(parentId);  // 调用编辑窗口
            if(config.openType === 'newWindow') openDocumentInNewWindow(parentId);
            return;
          } else {
            throw new Error('创建文件识别，文件已存在');
          }
        }
    
        // 父文档不存在，则创建父文档（日期文件夹）
		if(!ids?.data?.length) {
			const {path:pDocPath, id:pId} = await createSubDocument(
	          config.newDocTpl,
	          config.openType,
	          config.parentPath,
	          dateFileName
	        );
	        if (!pDocPath) return;
			parentDocPath = pDocPath;
			parentId = pId;
		}
        
        // 创建子文档
        if (config.subDocNames && config.subDocNames.length > 0) {
          let paths = [];
          for (const name of config.subDocNames) {
            const {id} = await createSubDocument(
              config.subDocTpl,
              '',
              parentPath,
              name,
              config.subDocTags
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

  function copyToClipboard(contents) {
    if ('clipboard' in navigator) {
        navigator?.clipboard?.writeText(contents);
        return;
    }
	const textarea = document.createElement('textarea');
	textarea.value = contents;
	document.body.appendChild(textarea);
	textarea.select();
	document.execCommand('copy');
	document.body.removeChild(textarea);
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
  function daysFromToday(dateStr) {
	  const today = new Date();
	  today.setHours(0, 0, 0, 0); // 今天零点
	
	  const target = new Date(dateStr);
	  target.setHours(0, 0, 0, 0); // 目标日期零点
	
	  const diffMs = today - target; // 毫秒差
	  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	
	  return diffDays;
  }
  function isMobile() {
    return !!document.getElementById("sidebar");
  }
  function whenElementExist(selector, node = document, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        function check() {
            let el;
            try {
                el = typeof selector === 'function' ? selector() : node.querySelector(selector);
            } catch (err) { return resolve(null); }
            if (el) resolve(el);
            else if (Date.now() - start >= timeout) resolve(null);
            else requestAnimationFrame(check);
        }
        check();
    });
  }
	function closePanel() {
		document.getElementById("menu").style.transform = "";
		document.getElementById("sidebar").style.transform = "";
		document.getElementById("model").style.transform = "";
		const maskElement = document.querySelector(".side-mask");
		maskElement.classList.add("fn__none");
		maskElement.style.opacity = "";
		window.siyuan.menus.menu.remove();
	}
	async function querySql(sql) {
	    const result = await requestApi('/api/query/sql', { "stmt": sql });
	    if (result.code !== 0) {
	        console.error("查询数据库出错", result.msg);
	        return [];
	    }
	    return result.data;
	}
})();