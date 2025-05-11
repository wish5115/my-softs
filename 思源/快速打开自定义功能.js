// name 快速打开自定义功能
// see https://ld246.com/article/1745488922117
// version 0.0.3.1
// updateDesc 0.0.3.1 增加eruda调试工具
// updateDesc 0.0.3 增加 刷新页面，全屏，宽屏，断点调试，打开网页版等功能
// updateDesc 0.0.2 增加快捷键支持，把思源命令面板的命令移植过来
// updateUrl https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/%E5%BF%AB%E9%80%9F%E6%89%93%E5%BC%80%E8%87%AA%E5%AE%9A%E4%B9%89%E5%8A%9F%E8%83%BD.js
// 使用帮助
// 建议把代码放到runjs插件的代码块中方便修改和添加菜单项（当然直接把该代码放到js代码片段中也行，代码片段修改后需要刷新页面）
// 然后，把下面的这行代码放到js代码片段中加载时运行即可（注意，外部调用runjs代码块，先要给块命名，然后保存为可调用的方法）
// runjs调用 runJs.plugin.call('quickOpen')
// runjs中修改代码后，只需点击「块菜单——>Run JS——> 运行代码」即可
//                  或将光标聚焦在代码块中，然后按 alt + F5 即可运行当前的代码块
// 如何添加新菜单？
// 只需要“自定义菜单区 开始”和“自定义菜单区 结束”直接添加 addMenu('菜单名', ()=>{})即可
// 比如：addMenu('demo1', (event, functions, option, selection)=>{alert('demo1')}, 'D', 'shortcut'); 这里第三个参数D代表当菜单出现时按D键直接选中demo1这个菜单
// 注意，弹出菜单可能使编辑器失去焦点，有些操作可能需要编辑器聚焦才有效，如果有问题，可以试试用setTimeout(()=>{},0)来延迟下。
(async (menus = [], pressKey = '' /* 👈修改快捷键可在这里修改pressKey，默认ctrl+; 修改后pressKey后需要刷新页面 */)=>{
    ///////////////////////////////// 自定义菜单区 开始 /////////////////////////////////
    // 打开本代码片编辑窗口
    addMenu('打开本代码编辑窗口', (event, {getProtyleEl, showErrorMessage}) => {
        // 如果在runjs代码块中，设置这个代码块的可调用方法名，如果不在runjs中保持空或注释即可
        const runjsCallableName = 'quickOpen';
  
        // 如果在代码片段中，设置这个代码片段的名字，如果不在代码片段中保持空或注释即可
        const snippetName = '快速打开自定义功能';
  
        // 当二者都配置的话，runjs优先（代码片段修改代码后需要刷新页面，runjs只需要按alt+f5即可）
        if(typeof runjsCallableName !== 'undefined' && runjsCallableName) {
            const codeBlockId = window.siyuan.ws.app.plugins.find(item=>item.name==='sy-run-js')?.data["Callable.json"]?.quickOpen;
            if(!codeBlockId) showErrorMessage('没有找到'+runjsCallableName+'的代码块');
            window.open('siyuan://blocks/'+codeBlockId);
        } else {
            openAny.clicks('#barWorkspace', '[data-id="config"]', '[data-name="appearance"]', '#codeSnippet', '[data-key="dialog-setting"] svg.b3-dialog__close', '[data-type="js"]').input(typeof snippetName === 'undefined' ? '' : snippetName, '[data-action="search"][data-type="js"]');
        }
    }, 'E');

    // 移动当前文档到
    addMenu('移动当前文档到', (event, {getProtyleEl}) => {
        openAny.click('[data-type="doc"]', getProtyleEl()).click('[data-name="titleMenu"] button[data-id="move"]');
    }, 'M');
  
    // Bing搜索
    addMenu('Bing搜索', (event, {getSelectedText}) => {
        // 搜索引擎URL，%s% 是搜索关键词
        const searchUrl = 'https://cn.bing.com/search?q=%s%&form=QBRE';
        window.open(searchUrl.replace('%s%', getSelectedText()));
    }, 'B');
  
    // 问DeepSeek
    addMenu('问DeepSeek', (event, {getSelectedText}) => {
        // ai引擎URL，%s% 是查询关键词，支持deepseek-r1
        const aiUrl = 'https://chat.baidu.com/search?word=%s%';
        window.open(aiUrl.replace('%s%', getSelectedText()));
    }, 'D');
  
    // 打开翻译
    addMenu('打开翻译', (event, {getSelectedText}) => {
        // 翻译引擎URL，%s% 是翻译关键词
        const fanyiUrl = 'https://fanyi.baidu.com/mtpe-individual/multimodal?query=%s%';
        window.open(fanyiUrl.replace('%s%', getSelectedText()));
    }, 'T');
  
    // 打开查词
    addMenu('打开查词', (event, {getSelectedText}) => {
        const url = 'https://www.iciba.com/word?w=%s%';
        window.open(url.replace('%s%', getSelectedText()));
    });
    
    // 刷新页面
    addMenu('刷新页面', (event, {}) => {
        window.reload();
    }, 'R');

    // 全屏
    addMenu('全屏', (event, {}, menuItem) => {
        if(event?.isWillShow) {
            if (isFullScreen()) {
                menuItem.label = '退出全屏';
            } else {
                menuItem.label = '全屏';
            }
            return;
        }
        if(isFullScreen()){
            exitFullscreen();
        } else {
            requestFullScreen(document.querySelector('html'));
        }
    }, 'F', '', '', true);
    
    // 宽屏
    addMenu('宽屏', async (event, {showMsgBox}, menuItem) => {
        // 需要先安装宽屏代码片段后才行 https://ld246.com/article/1746079460404#%E4%BB%A3%E7%A0%81
        if(event?.isWillShow) {
            const editor = getEditor();
            if ((editor?.firstElementChild?.offsetWidth||0) + 40 >= (editor?.offsetWidth||0)) {
                menuItem.label = '取消宽屏';
            } else {
                menuItem.label = '宽屏';
            }
            return;
        }
        if(!document.querySelector('.dock__item[aria-label$="宽屏风格"]')) {
            await showMsgBox('请先安装宽屏代码片段！<a href="" target="_blank">点击这里安装</a>', '异常提醒', '', null);
            return;
        }
        openAny.click('.dock__item[aria-label$="宽屏风格"]');
    }, 'W', '', '', true);
    
    // 打开网页版
    addMenu('打开网页版', (event, {}) => {
        window.open(window.location.origin);
    });

    // 延迟断点
    addMenu('debugger', (event, {}) => {
        setTimeout('debugger', 5000);
    });

    // eruda see https://eruda.liriliri.io/zh/docs/
    addMenu('eruda console', (event, {}) => {
        const shouldLoad = event?.isLoading ? localStorage.getItem('eruda_running') === 'true' : !window.eruda;
        if(shouldLoad) {
            const src = 'https://cdn.bootcdn.net/ajax/libs/eruda/3.4.1/eruda.js';
            const script = document.createElement('script');
            script.onload = () => {
                window.eruda.init();
                window.eruda.position({x: window.innerWidth-40, y: window.innerHeight-80});
                localStorage.setItem('eruda_running', true);
            }
            script.src = src;
            document.head.appendChild(script);
        } else {
            if(event?.isLoading) return;
            if(window.eruda._isInit) {
                window.eruda.destroy();
                localStorage.setItem('eruda_running', false);
            } else {
                window.eruda.init();
                window.eruda.position({x: window.innerWidth-40, y: window.innerHeight-80});
                localStorage.setItem('eruda_running', true);
            }
        }
    }, '', '', '', '', true);

    // vConsole
    addMenu('vConsole', (event, {}) => {
        const shouldLoad = event?.isLoading ? localStorage.getItem('vconsole_running') === 'true' : !window.VConsole;
        if(shouldLoad) {
            const src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js';
            const script = document.createElement('script');
            script.onload = () => {
                window.vConsole = new window.VConsole();
                localStorage.setItem('vconsole_running', true);
            }
            script.src = src;
            document.head.appendChild(script);
        } else {
            if(event?.isLoading) return;
            if(window?.vConsole?.isInited) {
                window.vConsole.destroy();
                localStorage.setItem('vconsole_running', false);
            } else {
                window.vConsole = new window.VConsole();
                localStorage.setItem('vconsole_running', true);
            }
        }
    }, '', '', '', '', true);
    
    // 打开设置
    addMenu('打开设置', (event, {}) => {
        openAny.pressByKeymap('config');
    });
  
    // 打开日记
    addMenu('打开日记', (event, {}) => {
        // 在这里输入你想在哪个笔记本中打开今日日记
        const noteBookName = '我的笔记';
        // 这里用wwhenExist先等待指定元素出现，否则需要在do内调用 await new OpenAny().whenExist()等待目标出现
        openAny.click('#barWorkspace').whenExist('[data-name="barWorkspace"]').do(()=>{
            const subMenuItems = [...openAny.queryElAll('[data-id="dailyNote"] .b3-menu__label')];
            const notebutton = subMenuItems.find(item => item.textContent === noteBookName)?.closest('button.b3-menu__item');
            // 返回链元素，供下一个链click调用，也可以直接在这里click，不用再次调用下一个链click
            return notebutton;
        }).click();
    });
  
    // 打开集市
    addMenu('打开集市', (event, {}) => {
        openAny.clicks('#barWorkspace', '[data-id="config"]', '[data-name="bazaar"]');
    });
  
    // 打开代码片段
    addMenu('打开代码片段', (event, {}) => {
        openAny.clicks('#barWorkspace', '[data-id="config"]', '[data-name="appearance"]', '#codeSnippet', '[data-key="dialog-setting"] svg.b3-dialog__close');
    }, 'S');
  
    // 打开快捷键设置
    addMenu('打开快捷键设置', (event, {}) => {
        openAny.clicks('#barWorkspace', '[data-id="config"]', '[data-name="keymap"]');
    });
  
    // 打开搜索
    addMenu('打开思源搜索', (event, {}) => {
        openAny.press('alt+p');
    });
  
    // 打开仅搜索文档
    addMenu('打开仅搜索文档', (event, {}) => {
        // 请参考 ctrl+shif+p 全局搜索仅搜文档，然后把这个快捷键填进来
        const pressKey = openAny.fn.isMac() ? 'meta+shift+p' : 'ctrl+shift+p'
        openAny.press(pressKey);
    }, 'P');

    // 模式切换
    addMenu('模式切换', (event, {}) => {
        const isPreview = document.querySelector('.protyle-preview:not(.fn__none) .protyle-preview__action');
        if(!isPreview) openAny.press('alt+meta+9'); else openAny.press('alt+meta+7');
    }, '7');
  
    // 打开链滴
    addMenu('打开链滴', (event, {}) => {
        window.open('https://ld246.com');
    });
  
    // 打开我的博客
    addMenu('打开我的博客', (event, {}) => {
        window.open('https://pipe.b3log.org/blogs/wilsons');
    });
  
    // 打开思源工作空间
    addMenu('打开思源工作空间', (event, {showFileInFolder}) => {
        showFileInFolder(window.siyuan.config.system.workspaceDir);
    });
  
    // 打开计算器
    addMenu('打开计算器', (event, {runCmd, isMac}) => {
        let cmd = `start calc`;
        if(isMac()) cmd = `open -a Calculator`;
        runCmd(cmd);
    }, 'C');
  
    // 字母大小写转换
    addMenu('字母大小写转换', (event, {getEditor}, option, {selectedText, selection, range}) => {
        let text = selectedText;
        if(/[a-z]/.test(text)) {
            text = text.toUpperCase();
        } else {
            text = text.toLowerCase();
        }
        // 替换选中的文本
        range.deleteContents();
        range.insertNode(document.createTextNode(text));

        // 恢复选中范围
        selection.removeAllRanges();
        selection.addRange(range);
        //const editor = getEditor();
        //openAny.sendText(text, editor);
    });

    ///////////////////////////////// 自定义菜单区 结束 /////////////////////////////////

    // 等待openAny加载完毕  
    await waitFor(() => typeof openAny !== 'undefined');

    // 生成菜单列表
    const handler = async (event, functions)=>{
        event.preventDefault();
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        const lastSelected = await getStorageVal('local-quickopen-selected');console.log(lastSelected,2222);
        if(lastSelected) {
            const lastSelectedItem = menus.find(item=>item.selected);
            if(lastSelectedItem) lastSelectedItem.selected=false;
            const selectedItem = menus.find(item=>item.value===lastSelected);
            if(selectedItem) selectedItem.selected=true;
        }
        functions.whenElementExist('.open-any-menu-title:not([data-reward="true"])').then((title)=>{
            const search = title.querySelector('.open-any-menu-search');
            if(search) {
                search.style.width = 'calc(100% - 74px)';
                generateReward(title);
                title.dataset.reward = true;
            }
        });
        // 显示菜单前回调
        menus.forEach(menu => menu.runOnShow && menu.callback({isWillShow: true}, functions, menu, {selectedText, selection, range}));
        // 显示菜单        
        const selectedOption = await functions.showOptionsMenu(menus, {width:'min(800px, 100%)',maxWidth:'min(1000px, 100%)', height:'min(800px, calc(100% - 80px))', maxHeight:'min(800px, calc(100% - 80px))', search:true, menuItemStyle: 'text-align:left'});
        if (selectedOption !== null) {
            if(typeof selectedOption.callback === 'function') {
                selectedOption.callback(event, functions, selectedOption, {selectedText, selection, range});
                setStorageVal('local-quickopen-selected', selectedOption.value);console.log(selectedOption.value,1111);
            } else {
                alert(selectedOption.callback+' 不是有效的函数');
            }
        }
    };
    pressKey = pressKey || (openAny.fn.isMac() ? 'meta+;' : 'ctrl+;');
    openAny.removeKeymap(pressKey); // 注意，这里未提供callback时，会删除同名的所有监听
    openAny.addKeymap(pressKey, handler);

    // 把命令面板的命令移植过来
    // see https://github.com/siyuan-note/siyuan/blob/e47b8efc2f2611163beca9fad4ee5424001515ff/app/src/boot/globalEvent/command/panel.ts#L49
    Object.keys(window.siyuan.config.keymap.general).forEach((key) => {
        let keys;
        if (isMobile()) {
            keys = ["addToDatabase", "fileTree", "outline", "bookmark", "tag", "dailyNote", "inbox", "backlinks",
                "dataHistory", "editReadonly", "enter", "enterBack", "globalSearch", "lockScreen", "mainMenu", "move",
                "newFile", "recentDocs", "replace", "riffCard", "search", "selectOpen1", "syncNow"];
        } else {
            keys = ["addToDatabase", "fileTree", "outline", "bookmark", "tag", "dailyNote", "inbox", "backlinks",
                "graphView", "globalGraph", "closeAll", "closeLeft", "closeOthers", "closeRight", "closeTab",
                "closeUnmodified", "config", "dataHistory", "editReadonly", "enter", "enterBack", "globalSearch", "goBack",
                "goForward", "goToEditTabNext", "goToEditTabPrev", "goToTab1", "goToTab2", "goToTab3", "goToTab4",
                "goToTab5", "goToTab6", "goToTab7", "goToTab8", "goToTab9", "goToTabNext", "goToTabPrev", "lockScreen",
                "mainMenu", "move", "newFile", "recentDocs", "replace", "riffCard", "search", "selectOpen1", "syncNow",
                "splitLR", "splitMoveB", "splitMoveR", "splitTB", "tabToWindow", "stickSearch", "toggleDock", "unsplitAll",
                "unsplit"];
            if (!isBrowser()) {
                keys.push("toggleWin");
            }
        }
        if (keys.includes(key)) {
            addMenu(window.siyuan.languages[key], (event, functions, option, selection)=>runSiyuanCommand(key, '', event, functions, option, selection), '', !isMobile()?window.siyuan.config.keymap.general[key].custom:'', window.siyuan.languages[key]);
        }
    });
    Object.keys(window.siyuan.config.keymap.editor.general).forEach((key) => {
        if (["switchReadonly", "switchAdjust"].includes(key)) {
            addMenu(window.siyuan.languages[key], (event, functions, option, selection)=>runSiyuanCommand(key, '', event, functions, option, selection), '', !isMobile()?updateHotkeyTip(window.siyuan.config.keymap.editor.general[key].custom):'', window.siyuan.languages[key]);
        }
    });
    window.siyuan.ws.app.plugins.forEach(plugin => {
        plugin.commands.forEach(command => {
            addMenu(`${plugin.displayName}: ${command.langText || plugin.i18n[command.langKey]}`, (event, functions, option, selection)=>runSiyuanCommand(command, 'plugin', event, functions, option, selection), '', !isMobile()?updateHotkeyTip(command.customHotkey):'', `${plugin.displayName}: ${command.langText || plugin.i18n[command.langKey]}`);
        });
    });
  
    // 生成拼音和拼音首字母
    setTimeout(async ()=>{
        let pinyinCache = await getFile('/data/storage/quickopen_pinyin_catche.json') || '{}';
        pinyinCache = JSON.parse(pinyinCache);
        if(pinyinCache.code && pinyinCache.code !== 0) pinyinCache = {};
        let hasNewCache = false;
        for (const menu of menus) {
            try {
                const words = encodeURIComponent(menu.label);
                if(!pinyinCache[menu.label]) pinyinCache[menu.label] = {};
                // 生成汉字拼音
                let pinyin = pinyinCache[menu.label]?.pinyin;
                if(!pinyin) {
                    pinyin = await (await fetch('https://tools.getquicker.cn/api/Chinese/GetPinyin?source='+words+'&tone=false&forName=false')).text();
                    if(pinyin) {
                        pinyinCache[menu.label].pinyin = pinyin;
                        hasNewCache = true;
                    }
                }
                if(pinyin) menu.pinyin = pinyin;
                // 生成拼音首字母
                let pinyinFirst = pinyinCache[menu.label]?.pinyinFirst;
                if(!pinyinFirst) {
                    pinyinFirst = await (await fetch('https://tools.getquicker.cn/api/Chinese/GetFirstPinyin?source='+words)).text();
                    if(pinyinFirst) {
                        pinyinCache[menu.label].pinyinFirst = pinyinFirst;
                        hasNewCache = true;
                    }
                }
                if(pinyinFirst) menu.pinyinFirst = pinyinFirst;
            } catch(e) {
                console.warn(e);
                return;
            }
        }
        if(hasNewCache) {
            putFile('/data/storage/quickopen_pinyin_catche.json', JSON.stringify(pinyinCache));
        }
    }, 0);

    // 执行加载时执行的菜单
    setTimeout(async ()=>{
        menus.forEach(menu => menu.runOnLoad && menu.callback({isLoading: true}, openAny.fn, menu, {}));
    }, 0);

    // 添加菜单函数
    function addMenu(name, callback, key, shortcut, value, runOnShow = false, runOnLoad = false) {
        menus.push({ label: name, value: value||name, key: key || '', shortcut: shortcut, callback: callback, runOnShow, runOnLoad });
    }

    function runSiyuanCommand(command, type, event, functions, option, selection) {
        if(type === 'plugin') {
            if (command.callback) {
                command.callback();
            } else if (command.globalCallback) {
                command.globalCallback();
            }
        } else {
            // 这里有些操作可能需要编辑器聚焦才有效，因此使用setTimeout(()=>{},0)来延迟下
            setTimeout(()=>{
                openAny.click('#barCommand').click(`#commands [data-command="${command}"]`);
            }, 0);
        }
    }

    // see https://github.com/siyuan-note/siyuan/blob/1317020c1791edf440da7f836d366567e03dd843/app/src/protyle/util/compatibility.ts#L409
    async function setStorageVal(key, val, cb) {
        if (window.siyuan.config.readonly) {
            return;
        }
        const result = await fetchSyncPost("/api/storage/setLocalStorageVal", {
            app: window.siyuan.ws.app.appId,
            key,
            val,
        });
        if(result && result.code === 0) {
            if (cb) {
                cb();
            }
            return result;
        }
    }
  
    // see https://github.com/siyuan-note/siyuan/blob/e47b8efc2f2611163beca9fad4ee5424001515ff/app/src/protyle/util/compatibility.ts#L258
    async function getStorageVal(key) {
        const result = await fetchSyncPost("/api/storage/getLocalStorage");
        if(result && result.code === 0 && result.data) {
            return result.data[key];
        }
    }

    async function fetchSyncPost(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    // 获取文件
    async function getFile(path) {
        return fetch("/api/file/getFile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path,
            }),
        }).then((response) => {
            if (response.ok) {
                return response.text();
            } else {
                throw new Error("Failed to get file content");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    // 存储文件，支持创建文件夹，当isDir true时创建文件夹，忽略文件
     async function putFile(path, content = '', isDir = false) {
        const formData = new FormData();
        formData.append("path", path);
        formData.append("isDir", isDir)
        formData.append("file", new Blob([content]));
        const result = await fetch("/api/file/putFile", {
            method: "POST",
            body: formData,
        });
        const json = await result.json();
        return json;
    }

    function waitFor(conditionFn, timeoutMs=5000) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          if(typeof conditionFn === 'string') 
              conditionFn = () => document.querySelector(conditionFn);
          const result = conditionFn();
          if (result) resolve(result);
          else if (Date.now() - start > timeoutMs) reject();
          else requestAnimationFrame(check); // 利用浏览器刷新周期
        };
        check();
      });
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }

    function isBrowser() {
        return !navigator.userAgent.startsWith("SiYuan") ||
            navigator.userAgent.indexOf("iPad") > -1 ||
            (/Android/.test(navigator.userAgent) && !/(?:Mobile)/.test(navigator.userAgent));
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    function updateHotkeyTip(hotkey) {
        if (isMac()) {
            return hotkey;
        }
  
        const KEY_MAP = new Map(Object.entries({
            "⌘": "Ctrl",
            "⌃": "Ctrl",
            "⇧": "Shift",
            "⌥": "Alt",
            "⇥": "Tab",
            "⌫": "Backspace",
            "⌦": "Delete",
            "↩": "Enter",
        }));
  
        const keys = [];
  
        if ((hotkey.indexOf("⌘") > -1 || hotkey.indexOf("⌃") > -1)) keys.push(KEY_MAP.get("⌘"));
        if (hotkey.indexOf("⇧") > -1) keys.push(KEY_MAP.get("⇧"));
        if (hotkey.indexOf("⌥") > -1) keys.push(KEY_MAP.get("⌥"));
  
        // 不能去最后一个，需匹配 F2
        const lastKey = hotkey.replace(/⌘|⇧|⌥|⌃/g, "");
        if (lastKey) {
            keys.push(KEY_MAP.get(lastKey) || lastKey);
        }
  
        return keys.join("+");
    }

    function requestFullScreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { // Firefox
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { // IE/Edge
            element.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari, Opera */
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) { /* IE/Edge Legacy */
        document.msExitFullscreen();
      }
    }

    function isFullScreen() {
      return !!document.fullscreenElement;
    }

    function getEditor() {
        return document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr');
    }

    function generateReward(node) {
        const a = document.createElement('a');
        a.href = 'https://ld246.com/article/1745488922117#%E6%89%93%E8%B5%8F%E4%BD%9C%E8%80%85';
        a.textContent = '打赏作者';
        a.target = '_blank';
        a.style.position = 'absolute';
        a.style.right = '0';
        a.style.top = '22px';
        node.appendChild(a);
    }
})();