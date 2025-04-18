// 模拟连续点击 openAny
// see https://ld246.com/article/1744896396694
// version 0.0.2
// 0.0.2 增加toolbar出现事件；选项菜单；输入框；改进事件传递机制，默认捕获阶段触发；增加鼠标事件；增加newSetStyle函数
// 支持多个选择符的链式点击或文本输入或模拟按键等

// 调用方式：
// 注意：选择符不一定要全局唯一，只要能达到目的且不会产生歧义及副作用即可
// openAny.click('').clicks('','').clicks(['']).press('alt+p').pressByKeymap('config').sleep(100).invoke(({})=>{}).el('').input('').sendText('');
// openAny.setKeymap('alt+z', (event)=>{}) // 注册快捷键
// new OpenAny().click(''); // new 新实例方式调用，推荐
// openAny.showMessage().click(''); // 开启出错是发送通知消息，参数true显示消息，false不显示消息，默认true （但未调用此方法时，openAny默认是false）
// openAny.resetChain().click(''); // 如果某些未知异常导致openAny假死状态时，可以通过resetChain复活，如果是new OpenAny().xxx();方式没有这个问题

// 也可以多个分别分开调用，比如：
/*
   await openAny.click('');
   await openAny.click('');
   await openAny.press('');

   // 注意，分开调用必须用await，否则不能保证执行顺序。
*/
// 或用try...catch捕获错误，比如：
/*
    try {
        await openAny
            .click('#valid1')
            .click('#invalid');
    } catch (e) {
        console.error("捕获错误:", e);
    }

    // 注意，这里必须加await，否则捕获不到异常，只能在控制台打印
*/

// 注册快捷键
// openAny.setKeymap('alt+z', (event)=>{event.preventDefault();openAny.press('alt+p')})

// 举例说明
// 打开设置
// openAny.click('#barWorkspace').click('[data-id="config"]');
// 从命令窗口打开设置
// openAny.click('#barCommand').el('[data-key="dialog-commandpanel"] .search__header input').input('设置').click('#commands [data-command="config"]');
// 调用思源keymap打开设置窗口（这里的config是siyuan.config.keymap中的值）
// openAny.pressByKeymap('config');
// 或 openAny.pressByFnName('config'); // 这里的pressByFnName是pressByKeymap的别名
// 或 openAny.press('keymap.config'); 或 openAny.press('fn.config'); // 这里有keymap和fn前缀时会自动调用上面的方法
// 或 openAny.press('keymap.general.config'); 同全名方式调用，这里的general是从siyuan.config.keymap后面的键，如果是general也可以省略
// 打开代码片段窗口
// openAny.clicks('#barWorkspace', '[data-id="config"]', '[data-name="appearance"]', '#codeSnippet', '[data-key="dialog-setting"] svg.b3-dialog__close');
// alt+z 实现文本标记和加粗
// openAny.setKeymap('alt+z', (event)=>{event.preventDefault();openAny.clicks('[data-type="strong"]', '[data-type="mark"]')});
// alt+z 给文字添加颜色和背景色
// openAny.setKeymap('alt+z', (event)=>{event.preventDefault();openAny.press('meta+alt+x', document.activeElement).clicks('.protyle-util [style="color:var(--b3-font-color9)"]', '.protyle-util [style="background-color:var(--b3-font-background6)"]').invoke(()=>document.querySelector('.protyle-util:not(.fn__none)').classList.add('fn__none'))});
/* 快速切换预览模式和编辑模式
    openAny.setKeymap('alt+meta+0', (event)=>{
        event.preventDefault();
        const isPreview = document.querySelector('.protyle-preview:not(.fn__none) .protyle-preview__action');
        if(!isPreview) openAny.press('alt+meta+9'); else openAny.press('alt+meta+7');
    });
*/
// 转移快捷键（注册快捷键）
// openAny.setKeymap('alt+z', (event)=>{event.preventDefault();openAny.press('alt+p')})

// 常用函数说明
/*
click 第二个参数可传入父选择符或元素对象时，表示第一个选择符在父元素内查询
clicks 第二个参数传入选择符或元素对象时，第一个参数必须用数组表示
press 第二个参数传入选择符或元素对象时，表示在哪个元素上触发事件
invoke 返回值在this.prev中，函数参数用{}括起来，比如：invoke({sleep})
el 获取元素，传给this.prev，第二个参数可传入父选择符或元素对象时，表示第一个选择符在父元素内查询
getEl 可以不传参数获取上一个选择符，如果传参数则获取参数对应的dom元素
queryEl 同querySelector
queryElAll 同querySelectorAll
sendText 第二个参数可传选择符或元素对象
addFunction 扩展函数，添加函数到this.functions，同时会出现在invoke和setKeymap事件回调中
setKeymap 回调函数的第一个参数是event,第二个参数是this.functions。同invoke一样，参数用{}包裹
*/

(()=>{

    class OpenAny {
        prev = null;
		prevSelecor = '';
        keymaps=[];
        keymapBound = false;
        isShowMessage = false;
        functions = {
            sleep,
            whenElementExist,
            showMessage,
            showErrorMessage,
            querySql,
            fetchSyncPost,
            fetchSyncGet,
            requestApi,
            getProtyle,
            getCurrentDocId,
            getCurrentNotebookId,
            newSetStyle,
            onProtyleLoad,
            onToolbarShow,
            getCharsBeforeCursor,
            showInputBox,
            showOptionsMenu,
            queryEl: this.queryEl,
            queryElAll: this.queryElAll,
        };

        constructor(params) {
            this.params = params;
            this._chain = Promise.resolve(); // 先初始化 _chain
            this.resetChain(); // 再重置链（确保安全）
        }

        // 重置链但保留其他状态（同时处理未捕获的拒绝）
        resetChain() {
             // 确保 _chain 是 Promise 对象
            if (!(this._chain instanceof Promise)) {
                this._chain = Promise.resolve();
            }
            // 吞掉旧链的拒绝状态
            this._chain = this._chain.catch((e) => {setTimeout(()=>{throw e}, 0);});
            // 重置为全新的 Promise 链
            this._chain = Promise.resolve();
            this.prev = null;
            return this;
        }

        // 主动抛出错误，自动重置链
        throwError(e) {
            const error = typeof e === 'string' ? new Error(e) : e;
            this.resetChain(); // 调用重置方法（已包含链清理逻辑）
            if(this.isShowMessage) showErrorMessage(e?.message || e);
            throw error; // 抛出错误，由外部捕获
        }
        
        showMessage(isShowMessage = true) {
            this.isShowMessage = isShowMessage;
            return this;
        }

        // 模拟点击
        click(selector, parentElement) {
            // 将操作加入内部 Promise 链
            this._chain = this._chain.then(async () => {
                if(typeof selector === 'undefined') {
                    // ignore
                } else if(selector?.nodeType ===1) {
                    // 如果已经是dom元素
                    this.prev = selector;
                } else {
                    // 如果是选择符
                    selector = selector.trim();
                    try {
                        this.prev = await whenElementExist(selector, parentElement);
                    } catch (e) {
						this.throwError('元素 ' + selector + ' 等待超时，' + e.message);
                    }
                }
                // 模拟点击
                if(this.prev && this.prev?.nodeType ===1) {
                    if(this.prev.click) this.prev.click();
                    else this.prev.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                }
            });
            return this; // 返回实例以支持链式调用
        }

        /**
         * 批量点击
         * 支持两种调用方式：
         * 1. clicks(['selector1', 'selector2'])
         * 2. clicks('selector1', 'selector2')
         */
        clicks(...args) {
            // 将参数统一转换为数组
            const selectors = Array.isArray(args[0]) ? args[0] : args;
            // 当是数组参数时，第二个参数可传递父元素
            let parentElement;
            if(Array.isArray(args[0]) && args[1]){
                parentElement = args[1];
            }
            // 遍历所有选择器并依次调用 click 方法
            for (const selector of selectors) {
                this.click(selector, parentElement); // 调用 click 方法并添加到 promiseChain
            }
    
            return this; // 返回当前实例以支持链式调用
        }

        // 增加延迟
        sleep(delay) {
            delay = delay || 100;
            delay = parseInt(delay);
            this._chain = this._chain.then(async () => {
                await sleep(delay);
            });
            return this;
        }

        async #getElement(selector, parentElement) {
            if(typeof selector === 'undefined' || !selector) {
                this.throwError('元素selector不能为空');
            } else if(selector?.nodeType ===1) {
                // 如果已经是dom元素
                this.prev = selector;
            } else {
                // 如果是选择符
                selector = selector.trim();
                try {
                    this.prev = await whenElementExist(selector, parentElement);
                } catch (e) {
                    this.throwError('元素 ' + selector + ' 等待超时，' + e.message);
                }
            }
        }

        el(selector, parentElement) {
			if(!selector) this.throwError('选择符不能为空');
			this.prevSelecor = selector;
            this._chain = this._chain.then(async () => {
                await this.#getElement(selector, parentElement);
            });
            return this;
        }

        getEl(selector, parentElement) {
			return this._chain = this._chain.then(async () => {
                if(!selector) selector = this.prevSelecor;
                await this.#getElement(selector, parentElement);
                return this.prev;
            });
        }

        queryEl(selector, parentElement) {
            if(selector?.nodeType === 1) return selector;
            if(typeof selector === 'string') {
                selector = selector.trim();
                if(typeof parentElement === 'string') {
                    parentElement = document.querySelector(parentElement);
                }
                return (parentElement||document).querySelector(selector);
            }
            this.throwError('请传入一个有效的dom元素或选择符');
        }

        queryElAll(selector, parentElement) {
            if(typeof selector === 'string') {
                selector = selector.trim();
                if(typeof parentElement === 'string') {
                    parentElement = document.querySelector(parentElement);
                }
                return (parentElement||document).querySelectorAll(selector);
            }
            this.throwError('请传入一个有效的dom选择符');
        }

        sendText(text='', selector, parentElement) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                sendTextToEditable(this.prev, text);
            });
            return this;
        }

        clear(selector, parentElement) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                selectAll(this.prev);
                sendTextToEditable(this.prev, '');
            });
            return this;
        }

        input(text='', selector, parentElement) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                this.prev.value = text;
                // 触发 input 事件
                const inputEvent = new Event('input', { bubbles: true });
                this.prev.dispatchEvent(inputEvent);
            });
            return this;
        }

        selectAll(selector, parentElement) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                selectAll(this.prev);
            });
            return this;
        }

        async invoke(callback) {
            this._chain = this._chain.then(async () => {
                if(typeof callback !== 'function') this.throwError('元素 ' + callback + ' 不是有效的函数');
                this.functions.prev = this.prev
                try {
                    this.prev = await callback(this.functions);
                } catch (e) {
                    this.throwError('执行函数时出错：' + e.message);
                }
            });
            return this;
        }

        addFunction(fnName, fn) {
            if(typeof fnName === 'undefined' || !fnName) {
                this.throwError('参数fnName不能为空');
            }
            if(typeof fn !== 'function') {
                this.throwError('参数fn不是有效的函数');
            }
            this.functions[fnName] = fn;
            return this;
        }

        press(keys, element) {
            if(typeof keys === 'undefined' || !keys) {
                this.throwError('参数keys不能为空');
            }
            if(keys.toLowerCase().startsWith('keymap.')||keys.toLowerCase().startsWith('fn.')) {
                return this.pressByFnName(keys.split('.').slice(1).join('.'));
            }
            this._chain = this._chain.then(async () => {
                press(keys, element);
            });
            return this;
        }

        pressByKeymap(keymap) {
            if(typeof keymap === 'undefined' || !keymap) {
                this.throwError('参数keymap不能为空');
            }
            return this.pressByFnName(keymap);
        }
        
        pressByFnName(fnName) {
            if(typeof fnName === 'undefined' || !fnName) {
                this.throwError('参数fnName不能为空');
            }
            this._chain = this._chain.then(async () => {
				try{
					dispatchKeyEvent(fnName);
				}catch(e){
					this.throwError(e);
				}
            });
            return this;
        }

        setKeymap(keys, callback, node, options) {
            if(typeof keys === 'undefined' || !keys) {
                this.throwError('参数keys不能为空');
            }
            if(typeof callback !== 'function') {
                this.throwError('参数callback不是有效的函数');
            }
            // 解析快捷键字符串并排序
            const keyCombination = keys.toLowerCase().split('+').map(item=>item.trim()).sort();
            // 将快捷键组合和回调函数存储到映射表中
            this.keymaps.push({
                keys: keyCombination,
                callback
            });
            // 判断快捷键是否包含鼠标按键
            if(!this.keymapBound) {
                (node||window).addEventListener('keydown', this.handleKeyDown.bind(this, this.functions), options || true);
                (node||window).addEventListener('mousedown', this.handleKeyDown.bind(this, this.functions), options || true);
            }
            this.keymapBound = true;
            return this;
        }

        // 处理键盘按下事件
        handleKeyDown(functions, event) {
            // 获取当前按下的按键组合
            const pressedKeys = [];
            if (event.altKey) pressedKeys.push('alt');
            if (event.ctrlKey) pressedKeys.push('ctrl');
            if (event.shiftKey) pressedKeys.push('shift');
            if (event.metaKey) pressedKeys.push('meta');

            if(typeof event.button !== 'undefined') {
                // 添加鼠标按键
                switch (event.button) {
                    case 0: pressedKeys.push('mouseleft'); break; // 左键
                    case 1: pressedKeys.push('mousemiddle'); break; // 中键
                    case 2: pressedKeys.push('mouseright'); break; // 右键
                }
            } else {
                const key = getKeyByCode(event.code);
                pressedKeys.push(key.toLowerCase()); // 添加普通键
                //pressedKeys.push(event.key.toLowerCase()); // 添加普通键
            }

            pressedKeys.sort(); // 排序以确保顺序一致
        
            // 遍历快捷键映射表，查找匹配项
            for (const { keys, callback } of this.keymaps) {
                if (keys.join('+') === pressedKeys.join('+')) {
                    try {
                        callback(event, functions); // 调用回调函数
                    } catch (e) {
                        this.throwError('执行函数时出错：' + e.message);
                    }
                }
            }
        }
    
        // 实现 then 方法以便 await 整个链
        then(resolve, reject) {
            return this._chain.then(resolve, reject);
        }
    }
    
    window.openAny = new OpenAny({default: true});
    window.OpenAny = OpenAny;

    function press(keys = [], element) {
        if(typeof keys === 'string') keys = keys.split('+');
        keys = keys.map(item=>item.trim().toLowerCase());
        const key = keys.find(item=>!['ctrl','alt','meta','shift'].includes(item));
        const code = getCodeByKey(key);
        let keyInit = {
            ctrlKey: keys.includes('ctrl'),
            altKey: keys.includes('alt'),
            metaKey: keys.includes('meta'),
            shiftKey: keys.includes('shift'),
            key: getKeyByCode(code),
            keyCode: getKeyCodeByKey(key),
            code: code,
        }
        keyInit["bubbles"] = true;
        let keydownEvent = new KeyboardEvent('keydown', keyInit);
        if(typeof element === 'string') element = document.querySelector(element);
        (element || document.getElementsByTagName("body")[0]).dispatchEvent(keydownEvent);
        let keyUpEvent = new KeyboardEvent('keyup', keyInit);
        (element || document.getElementsByTagName("body")[0]).dispatchEvent(keyUpEvent);
    }
    
    function selectAll(element) {
        element.focus();
        document.execCommand('selectAll', false, null);
    }
    
    function sendTextToEditable(element, text) {
        // 聚焦到编辑器
        element.focus();
        // 发送文本
        document.execCommand('insertHTML', false, text);
        // // 按行分割文本
        // const texts = text.split('\n').filter(item=>item);
        // if(texts.length === 1) {
        //     // 插入单行文本
        //     document.execCommand('insertHTML', false, text);
        // } else {
        //     // 插入多行文本
        //     texts.forEach(text => {
        //         document.execCommand('insertHTML', false, text);
        //         pressKeyboard({key: 'Enter', keyCode: 13, code:'Enter'}, element);
        //         //pressKeyboard({key: 'Enter', keyCode: 13, code:'Enter'}, element);
        //     });
        // }
        // 触发 input 事件
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
    }

    function pressKeyboard(keyInit, element) {
        keyInit["bubbles"] = true;
        let keydownEvent = new KeyboardEvent('keydown', keyInit);
        element?.dispatchEvent(keydownEvent);
        let keyUpEvent = new KeyboardEvent('keyup', keyInit);
        element?.dispatchEvent(keyUpEvent);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function whenElementExist(selector, node, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let isResolved = false;
            const check = () => {
                if(typeof node === 'string') node = document.querySelector(node);
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) {isResolved = true; resolve(el);} else if(!isResolved) requestAnimationFrame(check);
            };
            check();
            if(timeout > 0) {
                setTimeout(() => {
                    if (!isResolved) {
                        reject(new Error(`Timeout: Element not found for selector "${selector}" within ${timeout}ms`));
                    }
                }, timeout);
            }
        });
    }
    function showMessage(message, delay = 7000, isError = false) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
    function showErrorMessage(message, delay = 7000, isError = true) {
        showMessage(message, delay, isError);
    }
    async function querySql(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
    async function fetchSyncPost(url, data, method = 'POST') {
        return requestApi(url, data);
    }
    async function fetchSyncGet(url, data, method = 'GET') {
        return requestApi(url, data);
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    function getProtyle() {
        try {
            if(document.getElementById("sidebar")) return siyuan.mobile.editor.protyle;
            const currDoc = siyuan?.layout?.centerLayout?.children.map(item=>item.children.find(item=>item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active')||item.panelElement.closest('[data-type="wnd"]')))).find(item=>item);
            return currDoc?.model.editor.protyle;
        } catch(e) {
            console.error(e);
            return null;
        }
    }
    function getCurrentDocId() {
        return getProtyle()?.element?.querySelector('.protyle-title')?.dataset?.nodeId;
    }
    function getCurrentNotebookId() {
        return getProtyle()?.notebookId;
    }

    function newSetStyle() {
        let styleElement = null; // 保存当前样式元素的引用
        return (css = '') => {
        // 如果已存在样式元素，先移除它
        if (styleElement) {
          styleElement.parentNode.removeChild(styleElement);
        }
        // 创建新的样式元素
        styleElement = document.createElement('style');
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
      };
    }

    function dispatchKeyEvent(functionName) {
      functionName = functionName.trim();
      functionName = functionName.replace(/\[["']|["']\]/g, '.').replace(/\.+/g, '.').replace(/\.+$/, '');
      if(!functionName.startsWith('general')&&!functionName.startsWith('editor')&&!functionName.startsWith('plugin')){
          functionName = 'general.' + functionName;
      }
      let functionNames = [];
      if(functionName.indexOf('.')!==-1){
          functionNames = functionName.split('.');
      }
      let hotkeyStr = window.top.siyuan.config.keymap;
      for(const fnName of functionNames) {
          hotkeyStr = hotkeyStr[fnName];
      }
      hotkeyStr = hotkeyStr.custom;
      let keyInit = parseHotKeyStr(hotkeyStr);
      keyInit["bubbles"] = true;
      let keydownEvent = new KeyboardEvent('keydown', keyInit);
      document.getElementsByTagName("body")[0].dispatchEvent(keydownEvent);
      let keyUpEvent = new KeyboardEvent('keyup', keyInit);
      document.getElementsByTagName("body")[0].dispatchEvent(keyUpEvent);
    }

    // 监听protyle加载，注意这个是开始加载时，不是加载完成
    // 调用示例 onProtyleLoad((protyle)=>console.log(protyle))
    function onProtyleLoad(callback, node) {
        let hasLoad = false;
        const observeCallback = (element) => {
            if(hasLoad) return;
            hasLoad = true;
            callback(element);
            setTimeout(()=>hasLoad=false, 200);
        };
      
        // 旧版本加载需要这个
        whenElementExist('.protyle:not(.fn__none)').then(observeCallback);
        // 监听加载protyle
        observeProtyleLoading(observeCallback, node);
    }

    function observeProtyleLoading(callback, parentElement) {
        // 如果 parentElement 是字符串，则将其转换为 DOM 元素
        if (typeof parentElement === 'string') {
            parentElement = document.querySelector(parentElement);
        }
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                // 检查是否是属性变化并且变化的属性是 class
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const targetElement = mutation.target; // 发生变化的目标元素
    
                    // 判断目标元素是否匹配指定选择器 .protyle:not(.fn__none)
                    if (targetElement.matches('.protyle:not(.fn__none)')) {
                        // 触发回调
                        callback(targetElement);
                    }
                }
            });
        });
        // 配置观察选项
        const config = {
            attributes: true, // 监听属性变化
            attributeFilter: ['class'], // 仅监听 class 属性
            subtree: true, // 监听父容器及其所有后代元素
        };
        // 启动观察，默认监听 document.body 或指定的父容器
        observer.observe(parentElement || document.body, config);
    }

    /**
     * 
     * @param {*} hotkeyStr 思源hotkey格式 Refer: https://github.com/siyuan-note/siyuan/blob/d0f011b1a5b12e5546421f8bd442606bf0b5ad86/app/src/protyle/util/hotKey.ts#L4
     * @returns KeyboardEventInit Refer: https://developer.mozilla.org/zh-CN/docs/Web/API/KeyboardEvent/KeyboardEvent
     */
    function parseHotKeyStr(hotkeyStr) {
      let result = {
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
        key: 'A',
        keyCode: 0
      }
      if (hotkeyStr == "" || hotkeyStr == undefined || hotkeyStr == null) {
        console.error("解析快捷键设置失败", hotkeyStr);
        throw new Error("解析快捷键设置失败");
      }
      let onlyKey = hotkeyStr;
      if (hotkeyStr.indexOf("⌘") != -1) {
        result.ctrlKey = true;
        onlyKey = onlyKey.replace("⌘", "");
      }
      if (hotkeyStr.indexOf("⌥") != -1) {
        result.altKey = true;
        onlyKey = onlyKey.replace("⌥", "");
      }
      if (hotkeyStr.indexOf("⇧") != -1) {
        result.shiftKey = true;
        onlyKey = onlyKey.replace("⇧", "");
      }
      // 未处理 windows btn （MetaKey） 
      result.key = onlyKey;
      // 在https://github.com/siyuan-note/siyuan/commit/70acd57c4b4701b973a8ca93fadf6c003b24c789#diff-558f9f531a326d2fd53151e3fc250ac4bd545452ba782b0c7c18765a37a4e2cc
      // 更改中，思源改为使用keyCode判断快捷键按下事件，这里进行了对应的转换
      // 另请参考该提交中涉及的文件
      result.keyCode = getSiYuanKeyCodeByKey(result.key);
      console.assert(result.keyCode != undefined, `keyCode转换错误,key为${result.key}`);
      switch (result.key) {
        case "→": {
          result.key = "ArrowRight";
          break;
        }
        case "←": {
          result.key = "ArrowLeft";
          break;
        }
        case "↑": {
          result.key = "ArrowUp";
          break;
        }
        case "↓": {
          result.key = "ArrowDown";
          break;
        }
        case "⌦": {
          result.key = "Delete";
          break;
        }
        case "⌫": {
          result.key = "Backspace";
          break;
        }
        case "↩": {
          result.key = "Enter";
          break;
        }
      }
      return result;
    }
    
    function getSiYuanKeyCodeByKey(key) {
        const keyCodeList = {
          "⌫": 8,
          "⇥": 9,
          "↩": 13,
          "⇧": 16,
          "⌘": 91,
          "⌥": 18,
          "Pause": 19,
          "CapsLock": 20,
          "Escape": 27,
          " ": 32,
          "PageUp": 33,
          "PageDown": 34,
          "End": 35,
          "Home": 36,
          "←": 37,
          "↑": 38,
          "→": 39,
          "↓": 40,
          "PrintScreen": 44,
          "Insert": 45,
          "⌦": 46,
          "0": 48,
          "1": 49,
          "2": 50,
          "3": 51,
          "4": 52,
          "5": 53,
          "6": 54,
          "7": 55,
          "8": 56,
          "9": 57,
          "A": 65,
          "B": 66,
          "C": 67,
          "D": 68,
          "E": 69,
          "F": 70,
          "G": 71,
          "H": 72,
          "I": 73,
          "J": 74,
          "K": 75,
          "L": 76,
          "M": 77,
          "N": 78,
          "O": 79,
          "P": 80,
          "Q": 81,
          "R": 82,
          "S": 83,
          "T": 84,
          "U": 85,
          "V": 86,
          "W": 87,
          "X": 88,
          "Y": 89,
          "Z": 90,
          "ContextMenu": 93,
          "MyComputer": 182,
          "MyCalculator": 183,
          ";": 186,
          "=": 187,
          ",": 188,
          "-": 189,
          ".": 190,
          "/": 191,
          "`": 192,
          "[": 219,
          "\\": 220,
          "]": 221,
          "'": 222,
          "*": 106,
          "+": 107,
          "-": 109,
          ".": 110,
          "/": 111,
          "F1": 112,
          "F2": 113,
          "F3": 114,
          "F4": 115,
          "F5": 116,
          "F6": 117,
          "F7": 118,
          "F8": 119,
          "F9": 120,
          "F10": 121,
          "F11": 122,
          "F12": 123,
          "NumLock": 144,
          "ScrollLock": 145
        };
        return keyCodeList[key] || 0;
    }

    function getKeyCodeByKey(key) {
        const eventKeyCodeMap = {
            // 字母键
            "A": 65, "B": 66, "C": 67, "D": 68, "E": 69,
            "F": 70, "G": 71, "H": 72, "I": 73, "J": 74,
            "K": 75, "L": 76, "M": 77, "N": 78, "O": 79,
            "P": 80, "Q": 81, "R": 82, "S": 83, "T": 84,
            "U": 85, "V": 86, "W": 87, "X": 88, "Y": 89,
            "Z": 90,
        
            // 数字键（主键盘区）
            "0": 48, "1": 49, "2": 50, "3": 51, "4": 52,
            "5": 53, "6": 54, "7": 55, "8": 56, "9": 57,
        
            // 功能键
            "F1": 112, "F2": 113, "F3": 114, "F4": 115, "F5": 116,
            "F6": 117, "F7": 118, "F8": 119, "F9": 120, "F10": 121,
            "F11": 122, "F12": 123,
        
            // 方向键
            "ArrowUp": 38, "ArrowDown": 40, "ArrowLeft": 37, "ArrowRight": 39,
        
            // 特殊键
            "Backspace": 8, "Tab": 9, "Enter": 13, "Shift": 16,
            "Control": 17, "Alt": 18, "CapsLock": 20, "Escape": 27,
            "Space": 32, "PageUp": 33, "PageDown": 34, "End": 35, "Home": 36,
            "Insert": 45, "Delete": 46,
        
            // 数字小键盘
            "Numpad0": 96, "Numpad1": 97, "Numpad2": 98, "Numpad3": 99,
            "Numpad4": 100, "Numpad5": 101, "Numpad6": 102, "Numpad7": 103,
            "Numpad8": 104, "Numpad9": 105, "NumpadAdd": 107, "NumpadSubtract": 109,
            "NumpadMultiply": 106, "NumpadDivide": 111, "NumpadDecimal": 110,
            "NumpadEnter": 13,
        
            // 标点符号键
            ";": 186, "=": 187, ",": 188, "-": 189, ".": 190, "/": 191,
            "`": 192, "[": 219, "\\": 220, "]": 221, "'": 222,
        
            // 其他键
            "ContextMenu": 93, "NumLock": 144, "ScrollLock": 145,
            "Pause": 19, "PrintScreen": 44
        };
        for (const [k, keyCode] of Object.entries(eventKeyCodeMap)) {
            if(k.toLowerCase() === key.toLowerCase()) {
                return keyCode;
            }
        }
        return eventKeyCodeMap[key] || 0;
    }

    function getCodeByKey(key, isGetMap = false) {
        const eventCodeMap = {
            // 字母键
            "A": "KeyA", "B": "KeyB", "C": "KeyC", "D": "KeyD", "E": "KeyE",
            "F": "KeyF", "G": "KeyG", "H": "KeyH", "I": "KeyI", "J": "KeyJ",
            "K": "KeyK", "L": "KeyL", "M": "KeyM", "N": "KeyN", "O": "KeyO",
            "P": "KeyP", "Q": "KeyQ", "R": "KeyR", "S": "KeyS", "T": "KeyT",
            "U": "KeyU", "V": "KeyV", "W": "KeyW", "X": "KeyX", "Y": "KeyY",
            "Z": "KeyZ",
        
            // 数字键（主键盘区）
            "0": "Digit0", "1": "Digit1", "2": "Digit2", "3": "Digit3", "4": "Digit4",
            "5": "Digit5", "6": "Digit6", "7": "Digit7", "8": "Digit8", "9": "Digit9",
        
            // 功能键
            "F1": "F1", "F2": "F2", "F3": "F3", "F4": "F4", "F5": "F5",
            "F6": "F6", "F7": "F7", "F8": "F8", "F9": "F9", "F10": "F10",
            "F11": "F11", "F12": "F12",
        
            // 方向键
            "ArrowUp": "ArrowUp", "ArrowDown": "ArrowDown", "ArrowLeft": "ArrowLeft", "ArrowRight": "ArrowRight",
        
            // 特殊键
            "Backspace": "Backspace", "Tab": "Tab", "Enter": "Enter", "Shift": "ShiftLeft",
            "Control": "ControlLeft", "Alt": "AltLeft", "CapsLock": "CapsLock", "Escape": "Escape",
            "Space": "Space", "PageUp": "PageUp", "PageDown": "PageDown", "End": "End", "Home": "Home",
            "Insert": "Insert", "Delete": "Delete",
        
            // 数字小键盘
            "Numpad0": "Numpad0", "Numpad1": "Numpad1", "Numpad2": "Numpad2", "Numpad3": "Numpad3",
            "Numpad4": "Numpad4", "Numpad5": "Numpad5", "Numpad6": "Numpad6", "Numpad7": "Numpad7",
            "Numpad8": "Numpad8", "Numpad9": "Numpad9", "NumpadAdd": "NumpadAdd", "NumpadSubtract": "NumpadSubtract",
            "NumpadMultiply": "NumpadMultiply", "NumpadDivide": "NumpadDivide", "NumpadDecimal": "NumpadDecimal",
            "NumpadEnter": "NumpadEnter",
        
            // 标点符号键
            ";": "Semicolon", "=": "Equal", ",": "Comma", "-": "Minus", ".": "Period", "/": "Slash",
            "`": "Backquote", "[": "BracketLeft", "\\": "Backslash", "]": "BracketRight", "'": "Quote",
        
            // 其他键
            "ContextMenu": "ContextMenu", "NumLock": "NumLock", "ScrollLock": "ScrollLock",
            "Pause": "Pause", "PrintScreen": "PrintScreen"
        };
        if(isGetMap) return eventCodeMap;
        for (const [k, c] of Object.entries(eventCodeMap)) {
            if(k.toLowerCase() === key.toLowerCase()) {
                return c;
            }
        }
        return eventCodeMap[key] || '';
    }

    function getKeyByCode(code) {
        const eventCodeMap = getCodeByKey('', true);
        for (const [k, c] of Object.entries(eventCodeMap)) {
            if(c.toLowerCase() === code.toLowerCase()) {
                return k;
            } 
        }
        return '';
    }

    ////////////// 扩展功能 ///////////////////////////////
    // 返回光标前n个字符（使用场景：比如文字补全）
    function getCharsBeforeCursor(count) {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.anchorNode.nodeType !== Node.TEXT_NODE) {
            return null; // 没有选中或不在文本节点内
        }
        const range = selection.getRangeAt(0);
        const textNode = selection.anchorNode;
        const cursorPosition = range.startOffset;
        // 如果光标在最前面，则无法获取字符
        if (cursorPosition === 0) {
            return null; // 或返回空字符串 ""
        }
        // 获取光标前的所有内容
        const textContent = textNode.textContent;
        // 计算起始位置（确保不会超出文本范围）
        const start = Math.max(0, cursorPosition - count);
        // 截取从 start 到 cursorPosition 的字符
        const charsBeforeCursor = textContent.substring(start, cursorPosition);
        return charsBeforeCursor;
    }
    // 当toolbar出现事件
    // onToolbarShow((selection, toolbar, protyle) => {
    //     console.log(selection, toolbar, protyle);
    // });
    function onToolbarShow(callback) {
        let isMouseupListenerActive = false; // 标志变量，用于跟踪是否已经绑定了 mouseup 事件
        const mouseupHandler = (event) => {
            // 获取当前选中的文本
            const selection = window.getSelection().toString().trim();
            if (!selection) {
                // 如果没有选中文本，重置标志变量并移除监听器
                isMouseupListenerActive = false;
                document.removeEventListener('mouseup', mouseupHandler);
                return;
            }

            // 查找最近的 .protyle 元素
            const protyle = event.target.closest('.protyle');
            if (!protyle) {
                // 如果没有找到 .protyle 元素，重置标志变量并移除监听器
                isMouseupListenerActive = false;
                document.removeEventListener('mouseup', mouseupHandler);
                return;
            }

            // 查找工具栏元素
            const toolbar = protyle.querySelector('.protyle-toolbar');
            if (!toolbar) {
                // 如果没有找到工具栏元素，重置标志变量并移除监听器
                isMouseupListenerActive = false;
                document.removeEventListener('mouseup', mouseupHandler);
                return;
            }

            // 执行回调函数
            if (typeof callback === 'function') {
                callback(selection, toolbar, protyle);
            }

            // 移除 mouseup 事件监听器，并重置标志变量
            isMouseupListenerActive = false;
            document.removeEventListener('mouseup', mouseupHandler);
        };
        document.addEventListener('selectionchange', () => {
            // 如果已经有 mouseup 监听器，直接返回，避免重复绑定
            if (isMouseupListenerActive) return;
            // 标记为已绑定 mouseup 监听器
            isMouseupListenerActive = true;

            // 绑定 mouseup 事件监听器
            document.addEventListener('mouseup', mouseupHandler);
        });
    }

    // 弹出输入框（使用场景：比如快捷输入，问ai等）
    // 使用示例
    // const result = await showInputBox('默认内容');
    // if (result !== null) {
    //   console.log('用户输入:', result);
    //   alert(`提交内容: ${result}`);
    // } else {
    //   console.log('用户取消了输入');
    // }
    function showInputBox(defaultText = '') {
        return new Promise((resolve) => {
          // 创建模态框元素
          const mask = document.createElement('div');
          const content = document.createElement('div');
          const input = document.createElement('input');
          //const submitBtn = document.createElement('button');
          input.className = 'b3-text-field fn__block';
          input.placeholder = '回车提交，Esc取消';
          //submitBtn.className = 'b3-button fn__size200 b3-button--outline';
          // 添加基础样式
          Object.assign(mask.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: (++siyuan.zIndex) || 999
          });
          Object.assign(content.style, {
            background: 'var(--b3-theme-background)',
            padding: '20px',
            borderRadius: '5px',
            minWidth: '300px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.33)',
            border: '1px solid #555'
          });
          Object.assign(input.style, {
            flex: '1',
            padding: '8px',
            fontSize: '16px',
            marginRight: '10px',
            width: '500px'
          });
        //   Object.assign(submitBtn.style, {
        //     padding: '8px 16px',
        //     background: '#007bff',
        //     color: 'white',
        //     border: 'none',
        //     borderRadius: '4px',
        //     cursor: 'pointer'
        //   });
          // 设置元素属性
          input.type = 'text';
          input.value = defaultText;
          //submitBtn.textContent = '提交';
          // 组装DOM结构
          content.appendChild(input);
          //content.appendChild(submitBtn);
          mask.appendChild(content);
          document.body.appendChild(mask);
          // 自动聚焦输入框
          input.focus();
          // 事件处理函数
          const handleConfirm = () => {
            const value = input.value.trim();
            cleanup();
            resolve(value);
          };
          const handleCancel = () => {
            cleanup();
            resolve(null);
          };
          const handleKeyDown = (e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') handleCancel();
          };
          const cleanup = () => {
            document.body.removeChild(mask);
            input.removeEventListener('keydown', handleKeyDown);
            //submitBtn.removeEventListener('click', handleConfirm);
            mask.removeEventListener('click', handleMaskClick);
          };
          const handleMaskClick = (e) => {
            if (e.target === mask) handleCancel();
          };
          // 绑定事件监听器
          input.addEventListener('keydown', handleKeyDown);
          //submitBtn.addEventListener('click', handleConfirm);
          mask.addEventListener('click', handleMaskClick);
        });
    }

    // 弹出选项菜单（使用场景：比如跳转搜索引擎或ai）
    // 使用示例：调用异步选项菜单
    // async function demo() {
    //     const options = [
    //       { label: '选项 1', value: 'value1' },
    //       { label: '选项 2', value: 'value2' },
    //       { label: '选项 3', value: 'value3' }
    //     ];
    //     const selectedValue = await showOptionsMenu(options);
    //     if (selectedValue === null) {
    //       console.log('用户取消了选择');
    //     } else {
    //       console.log(`用户选择了：${selectedValue}`);
    //     }
    // }
    const setMenuStyle = newSetStyle();
    setMenuStyle(`
        /* 遮罩层样式 */
       .open-any-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 999;
       }

       /* 菜单容器样式 */
       .open-any-menu {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 600px;
        min-width: 300px;
        overflow-y: auto;
        max-height: 800px;
       }

       /* 菜单项样式 */
       .open-any-menu-item {
        padding: 10px;
        margin: 5px 0;
        color: #222;
        background-color: #f0f0f0;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
       }

       .open-any-menu-item:hover {
        background-color: #d1e7fd;
       }
   `);
   document.body.insertAdjacentHTML('beforeend', `
    <div class="open-any-overlay" id="open-any-overlay">
        <div class="open-any-menu" id="open-any-menu">
        </div>
    </div>
    `);
    const overlay = document.getElementById('open-any-overlay');
    const menu = document.getElementById('open-any-menu');
    const openButton = document.getElementById('open-any-button');
    /**
     * 显示选项菜单并返回用户选择的结果
     * @param {Array<{label: string, value: any}>} options - 选项列表
     * @returns {Promise<any>} 用户选择的值
     */
    function showOptionsMenu(options) {
        return new Promise((resolve) => {
          // 清空菜单内容
          menu.innerHTML = '';
  
          // 动态添加选项到菜单
          options.forEach((option) => {
            const menuItem = document.createElement('div');
            menuItem.className = 'open-any-menu-item';
            menuItem.textContent = option.label;
            menuItem.addEventListener('click', () => {
              resolve(option.value); // 返回用户选择的值
              closeMenu();
            });
            menu.appendChild(menuItem);
          });
  
          // 打开菜单
          overlay.style.display = 'flex';
  
          // 监听键盘事件
          const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
              resolve(null); // 如果按下 Esc 键，返回 null
              closeMenu();
            }
          };
          document.addEventListener('keydown', handleKeyDown);
  
          // 关闭菜单时清理事件监听器
          function closeMenu() {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', handleKeyDown);
          }
  
          // 点击遮罩层外部关闭菜单
          overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
              resolve(null); // 返回 null
              closeMenu();
            }
          });
        });
    }
})();