// name 模拟连续点击 openAny
// 支持多个选择符的链式点击或文本输入或模拟按键等
// see https://ld246.com/article/1744896396694
// version 0.0.6.2
// updateDesc 0.0.6.1 增加showMyStatusMsg
// updateDesc 0.0.6.1 改进whenElementExist，增加whenElementExistBySleep, whenElementExistOrNull, whenElementExistOrNullBySleep，改进showMessage函数等
// updateDesc 0.0.6 增加observeElement，修复潜在bug，新增observeElement, putFile, getFile, getCursorElement, showMsgBox等
// updateDesc 0.0.5.2 修复按esc时，三大ui的关闭问题（当多个实例时，现在支持仅关闭最上层的实例，一层一层关）
// updateDesc 0.0.5.1 修复openAny.addKeymap方法注册的事件，无法被openAny.press触发的问题
// updateDesc 0.0.5 选项菜单增加快捷键支持，参数增加closeMenu调用及disableClose参数在需要时可禁用关闭
// updateDesc 0.0.4 支持模拟鼠标操作，比如 ctrl+mouseleft, ctrl+mouseright，打开本地文件，交互对话框等；setKeymap更改为addKeymap；新增removeKeymap;
// updateDesc 0.0.3.2 优化细节，修复bug
// updateDesc 0.0.3.1 改进输入框和选项菜单样式和支持手机版
// updateDesc 0.0.3 改进promise执行链，更加健壮和可调试性，增加catch方法
// updateDesc 0.0.2 增加toolbar出现事件；选项菜单；输入框；改进事件传递机制，默认捕获阶段触发；增加鼠标事件；增加newSetStyle函数
// updateUrl https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/%E6%A8%A1%E6%8B%9F%E8%BF%9E%E7%BB%AD%E7%82%B9%E5%87%BBopenAny.js

// 调用方式：
// 注意：选择符不一定要全局唯一，只要能达到目的且不会产生歧义及副作用即可
// openAny.click('').clicks('','').clicks(['']).press('alt+p').pressByKeymap('config').sleep(100).invoke(({})=>{}).el('').input('').sendText('');
// openAny.addKeymap('alt+z', (event)=>{}) // 注册快捷键
// openAny.invoke(({sleep, ...args})=>{}) // 通过函数执行某些操作，返回值放在openAny.prev中，通过await openAny.getPrev()可以获取或者在下一个链中获取
// new OpenAny().click(''); // new 新实例方式调用，推荐
// openAny.showMessage().click(''); // 开启出错是发送通知消息，参数true显示消息，false不显示消息，默认true （但未调用此方法时，openAny默认是false）
// openAny.resetChain().click(''); // 如果某些未知异常导致openAny假死状态时，可以通过resetChain复活，如果是new OpenAny().xxx();方式没有这个问题

// 也可以多个分别分开调用，比如：
/*
   await openAny.click('');
   await openAny.click('');
   await openAny.press('');

   // 注意，分开调用时，如果没用await中间混入了其他代码可能导致执行顺序混乱，但openAny的执行顺序还是调用的顺序，建议混用时使用await以保证代码清晰度。
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

    或者
    openAny.click('').click('').catch((e)=>{console.error("捕获错误:", e);});
*/

// 注册快捷键
// openAny.addKeymap('alt+z', (event)=>{event.preventDefault();openAny.press('alt+p')})

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
// openAny.addKeymap('alt+z', (event)=>{event.preventDefault();openAny.clicks('[data-type="strong"]', '[data-type="mark"]')});
// alt+z 给文字添加颜色和背景色
// openAny.addKeymap('alt+z', (event)=>{event.preventDefault();openAny.press('meta+alt+x', document.activeElement).clicks('.protyle-util [style="color:var(--b3-font-color9)"]', '.protyle-util [style="background-color:var(--b3-font-background6)"]').invoke(()=>document.querySelector('.protyle-util:not(.fn__none)').classList.add('fn__none'))});
// 触发选中文本，并给文本加粗
// openAny.selectText('some text', document.activeElement).press('meta+b', document.activeElement);
/* 快速切换预览模式和编辑模式
    openAny.addKeymap('alt+meta+0', (event)=>{
        event.preventDefault();
        const isPreview = document.querySelector('.protyle-preview:not(.fn__none) .protyle-preview__action');
        if(!isPreview) openAny.press('alt+meta+9'); else openAny.press('alt+meta+7');
    });
*/
// 转移快捷键（注册快捷键）
// openAny.addKeymap('alt+z', (event)=>{event.preventDefault();openAny.press('alt+p')})

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
addFunction 扩展函数，添加函数到this.functions，同时会出现在invoke和addKeymap事件回调中
addKeymap 回调函数的第一个参数是event,第二个参数是this.functions。同invoke一样，参数用{}包裹
*/

(()=>{
    class OpenAny {
        prev = null;
		prevSelecor = '';
        keymaps=[];
        keymapKeydownBound = false;
        keymapMousedownBound = false;
        keymapMouseOverBound = false;
        isShowMessage = false;
        timeout = 5000;
        functions = {
            sleep,
            whenElementExist,
            whenElementExistBySleep,
            whenElementExistOrNull,
            whenElementExistOrNullBySleep,
            whenElementRemoved,
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
            showMsgBox,
            showBasicDialog,
            showDialog,
            showMessage,
            showErrorMessage,
            destroyDialog,
            showFileInFolder,
            openFile,
            runCmd,
            getEl,
            queryEl: this.queryEl,
            queryElAll: this.queryElAll,
            selectText,
            getSelectedText,
            isMac,
            isWindows,
            isBrowser,
            isMobile,
            isElectron,
            isReadOnly,
            getProtyleEl,
            getEditor,
            getCursorElement,
            observeElement,
            putFile,
            getFile,
            copyText,
            showMyStatusMsg,
        };

        constructor(params) {
            this.params = params;
            this.fn = this.functions;
            this._invokeReturn = null;
            this._cmdReturn = null;
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
            this._chain = this._chain.catch((e) => {
                if(typeof this._errorCallback === 'function') {
                    // 如果提供了错误回调函数，则调用之
                    this._errorCallback(e);
                    // 回调后清除错误回调函数
                    this._errorCallback = null;
                } else {
                    // todo 区分await，当await情况这里不通知和打印（目前无法区分await和不用await情况）
                    // 是否发送错误通知
                    if(this.isShowMessage) showErrorMessage(e?.message || '未知错误');
                    // 如果未提供错误回调函数，则打印异常方便调试
                    console.error(e);
                }
            });
            // 重置为全新的 Promise 链
            this._chain = Promise.resolve();
            this.prev = null;
            return this;
        }

        catch(callback) {
            if(typeof callback === 'function') {
                // 当使用catch函数时，注册errorCallback函数供发生错误时回调
                this._errorCallback = callback;
            }
            this._chain = this._chain.then(async () => {
                // 每次 catch() 后重置为错误回调函数为 null，避免影响下一次调用
                this._errorCallback = null;
            });
            return this;
        }

        // 主动抛出错误，自动重置链
        throwError(e) {
            const error = typeof e === 'string' ? new Error(e) : e;
            this.resetChain(); // 调用重置方法（已包含链清理逻辑）
            throw error; // 抛出错误，由外部捕获
        }

        showMessage(isShowMessage = true) {
            this.isShowMessage = isShowMessage;
            return this;
        }

        setTimeout(timeout) {
            this.timeout = timeout;
            return this;
        }

        // 模拟点击
        click(selector, parentElement, timeout) {
            // 将操作加入内部 Promise 链
            this._chain = this._chain.then(async () => {
                if(typeof selector === 'undefined') {
                    // ignore
                } else if(selector?.nodeType ===1) {
                    // 如果已经是dom元素
                    this.prev = selector;
                }  else if(typeof selector === 'function') {
                    this.prev = await selector();
                } else {
                    // 如果是选择符
                    selector = selector.trim();
                    try {
                        this.prev = await whenElementExist(selector, parentElement, timeout || this.timeout);
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
            let parentElement, timeout;
            if(Array.isArray(args[0]) && args[1]){
                parentElement = args[1];
                if(args[2]) timeout = args[2];
            }
            // 遍历所有选择器并依次调用 click 方法
            for (const selector of selectors) {
                this.click(selector, parentElement, timeout); // 调用 click 方法并添加到 promiseChain
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

        async #getElement(selector, parentElement, timeout) {
            if(typeof selector === 'undefined' || !selector) {
                this.throwError('元素selector不能为空');
            } else if(selector?.nodeType ===1) {
                // 如果已经是dom元素
                this.prev = selector;
            }  else if(typeof selector === 'function') {
                this.prev = await selector();
            } else {
                // 如果是选择符
                selector = selector.trim();
                try {
                    this.prev = await whenElementExist(selector, parentElement, timeout || this.timeout);
                } catch (e) {
                    this.throwError('元素 ' + selector + ' 等待超时，' + e.message);
                }
            }
        }

        el(selector, parentElement, timeout) {
			if(!selector) this.throwError('选择符不能为空');
			this.prevSelecor = selector;
            this._chain = this._chain.then(async () => {
                await this.#getElement(selector, parentElement, timeout);
            });
            return this;
        }

        waitFor(selector, parentElement, timeout, callback) {
            return this.whenElementExist(selector, parentElement, timeout, callback);
        }

        whenExist(selector, parentElement, timeout, callback) {
            return this.whenElementExist(selector, parentElement, timeout, callback);
        }

        whenElementExist(selector, parentElement, timeout, callback) {
            this._chain = this._chain.then(async () => {
                await this.#getElement(selector, parentElement, timeout);
                if(callback && typeof callback === 'function') {
                    callback({prev:this.prev, ...this.functions});
                }
            });
            return this;
        }

        observe(selector, callback, options, parent) {
            return this.observeElement(selector, callback, options, parent);
        }

        observeElement(selector, callback, options, observeElement) {
            this._chain = this._chain.then(async () => {
                observeElement(selector, callback, options, observeElement)
            });
            return this;
        }

        getEl(selector, parentElement, timeout) {
			return this._chain = this._chain.then(async () => {
                if(!selector) selector = this.prevSelecor;
                await this.#getElement(selector, parentElement, timeout);
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

        sendText(text='', selector, parentElement, timeout) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement, timeout);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                sendTextToEditable(this.prev, text);
            });
            return this;
        }

        selectText(text='', selector, parentElement, timeout) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement, timeout);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                selectText(text, this.prev, parentElement);
            });
            return this;
        }

        clear(selector, parentElement, timeout) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement, timeout);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                selectAll(this.prev);
                sendTextToEditable(this.prev, '');
            });
            return this;
        }

        input(text='', selector, parentElement, timeout) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement, timeout);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                this.prev.value = text;
                // 触发 input 事件
                const inputEvent = new Event('input', { bubbles: true });
                this.prev.dispatchEvent(inputEvent);
            });
            return this;
        }

        focus(selector, parentElement, timeout) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement, timeout);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                if(this.prev.focus) this.prev.focus();
                try {
                    const event = new Event('focus', { bubbles: true, cancelable: true });
                    this.prev.dispatchEvent(event);
                } catch(e) {}
            });
            return this;
        }

        selectAll(selector, parentElement, timeout) {
            this._chain = this._chain.then(async () => {
                if(selector) await this.#getElement(selector, parentElement, timeout);
                if(this.prev?.nodeType !== 1) this.throwError('元素 ' + this.prev + ' 不是有效的元素');
                selectAll(this.prev);
            });
            return this;
        }

        // 注意，invoke内部不能在openAny上使用await，使用await时需要用new OpenAny代替，，因为await会与上层链相互等待造成死锁
        invoke(callback) {
            this._chain = this._chain.then(async () => {
                if(typeof callback !== 'function') this.throwError('元素 ' + callback + ' 不是有效的函数');
                try {
                    this._invokeReturn = await callback.call(this, {prev:this.prev, ...this.functions});
                    this.prev = this._invokeReturn;
                    //this.prev = await callback({prev:this.prev, ...this.functions});
                } catch (e) {
                    this.throwError('执行函数时出错：' + e.message);
                }
            });
            return this;
        }

        do(callback) {
            return this.invoke(callback);
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

        /**
         * @deprecated 请使用 addKeymap 替代
         */
        setKeymap(keys, callback, node, options) {
            console.warn('setKeymap 已被弃用，请使用 addKeymap 替代');
            return this.addKeymap(keys, callback, node, options);
        }

        addKeymap(keys, callback, node, options) {
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
                callback,
                node,
                options
            });
            // 判断快捷键是否包含鼠标按键
            if(!this.keymapMousedownBound && keyCombination.some(key => ['mouseleft', 'mousemiddle', 'mouseright'].includes(key))) {
                (node||document).addEventListener('mousedown', this.handleKeyDown.bind(this, this.functions), options || true);
                this.keymapMousedownBound = true;
            } else if(!this.keymapMouseOverBound && keyCombination.includes('mouseover')) {
                (node||document).addEventListener('mouseover', this.handleKeyDown.bind(this, this.functions), options || true);
                this.keymapMouseOverBound = true;
            } else if(!this.keymapKeydownBound) {
                (node||document).addEventListener('keydown', this.handleKeyDown.bind(this, this.functions), options || true);
                this.keymapKeydownBound = true;
            }
            return this;
        }

        // 注意，这里未提供callback,node,option时，会删除同名的所有keys，尽量提供完整参数，防止误删除。
        removeKeymap(keys, callback = null, node = null, options = null) {
            if (typeof keys === 'undefined' || !keys) {
                this.throwError('参数keys不能为空');
            }
            // 解析快捷键字符串并排序
            const keyCombination = keys.toLowerCase().split('+').map(item => item.trim()).sort();
            // 过滤掉匹配的快捷键
            this.keymaps = this.keymaps.filter(keymap => {
                // 匹配按键组合
                const isKeysMatch = keymap.keys.join('+') === keyCombination.join('+');
                // 如果按键不匹配，直接保留
                if (!isKeysMatch) return true;
                // 比较其他字段：callback, node, options
                const isCallbackMatch = callback === null || keymap.callback.toString() === callback.toString();
                const isNodeMatch = node === null || keymap.node === node;
                const isOptionsMatch = options === null || options === keymap.options || JSON.stringify(keymap.options) === JSON.stringify(options);
                // 如果所有提供的条件都匹配，则移除此记录
                return !(isCallbackMatch && isNodeMatch && isOptionsMatch);
            });
            return this;
        }

        // 处理键盘按下事件
        handleKeyDown(functions, event) {
            const pressedKeys = [];
            // 收集修饰键（无论事件类型）
            if (event.altKey) pressedKeys.push('alt');
            if (event.ctrlKey) pressedKeys.push('ctrl');
            if (event.shiftKey) pressedKeys.push('shift');
            if (event.metaKey) pressedKeys.push('meta');
            // 根据事件类型处理主键
            switch (event.type) {
                case 'mousedown':
                    // 处理鼠标按键（左键、中键、右键）
                    switch (event.button) {
                        case 0: pressedKeys.push('mouseleft'); break;
                        case 1: pressedKeys.push('mousemiddle'); break;
                        case 2: pressedKeys.push('mouseright'); break;
                    }
                    break;
                case 'mouseover':
                    // 添加 mouseover 作为触发条件
                    pressedKeys.push('mouseover');
                    break;
                case 'keydown':
                    // 处理键盘按键（通过 event.code 获取标准化键名）
                    const key = getKeyByCode(event.code);
                    if (key) pressedKeys.push(key.toLowerCase());
                    break;
            }
            pressedKeys.sort(); // 排序以确保组合顺序一致
            // 遍历映射表，匹配快捷键
            for (const { keys, callback } of this.keymaps) {
                if (keys.join('+') === pressedKeys.join('+')) {
                    try {
                        callback.call(this, event, functions);
                        //callback(event, functions); // 调用回调函数
                    } catch (e) {
                        this.throwError('执行函数时出错：' + e.message);
                    }
                }
            }
        }

        openFile(path) {
            this._chain = this._chain.then(async () => {
                openFile(path);
            });
            return this;
        }

        showFileInFolder(path) {
            this._chain = this._chain.then(async () => {
                showFileInFolder(path);
            });
            return this;
        }

        runCmd(cmd) {
            this._chain = this._chain.then(async () => {
                runCmd(cmd, (result)=>{
                    this._cmdReturn = result;
                    this.prev = result;
                });
            });
            return this;
        }

        getPrev() {
            return this._chain = this._chain.then(async () => {
                return this.prev;
            });
        }

        getInvokeReturn() {
            return this._chain = this._chain.then(async () => {
                return this._invokeReturn || null;
            });
        }

        getCmdReturn() {
            return this._chain = this._chain.then(async () => {
                return this._cmdReturn || null;
            });
        }

        // 实现 then 方法以便 await 整个链
        then(resolve, reject) {
            return this._chain.then(resolve, reject);
        }
    }

    window.openAny = new OpenAny({default: true});
    window.OpenAny = OpenAny;

    async function getEl(selector, parentElement, timeout) {
        if(typeof selector === 'undefined' || !selector) {
            return null;
        } else if(selector?.nodeType ===1) {
            // 如果已经是dom元素
            return selector;
        } else {
            // 如果是选择符
            selector = selector.trim();
            try {
                return await whenElementExist(selector, parentElement, timeout || 5000);
            } catch (e) {
                return null;
            }
        }
    }

    function press(keys = [], element) {
        if(typeof keys === 'string') keys = keys.split('+');
        keys = keys.map(item=>item.trim().toLowerCase());
        if(keys.some(item=>['mouseclick', 'mouseleft','mouseright','mousemiddle','mousedblclick', 'mouseover'].includes(item.toLowerCase()))) {
            pressWithMouse(keys, element);
            return;
        }
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

    function pressWithMouse(keys = [], element) {
        if (typeof keys === 'string') keys = keys.split('+');
        keys = keys.map(item => item.trim().toLowerCase());
        // 分离鼠标事件类型和修饰键
        const mouseEvents = ['mouseleft', 'mouseclick', 'mouseright', 'mousemiddle', 'mousedblclick', 'mouseover'];
        const hasMouseEvent = keys.some(k => mouseEvents.includes(k));
        if (!hasMouseEvent) {
            press(keys, element);
            return;
        }
        // 获取元素位置
        if (typeof element === 'string') element = document.querySelector(element);
        element = element || document.body;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // 事件配置
        const initConfig = {
            bubbles: true,
            cancelable: true,
            ctrlKey: keys.includes('ctrl'),
            altKey: keys.includes('alt'),
            metaKey: keys.includes('meta'),
            shiftKey: keys.includes('shift'),
            clientX: centerX,  // 自动居中
            clientY: centerY,
            view: window
        };
        // 确定事件类型和按钮
        let eventType = 'mousedown';
        const buttonMap = {
            mouseleft: { button: 0, buttons: 1 },
            mouseclick: { button: 0, buttons: 1 }, // 新增别名
            mouseright: { button: 2, buttons: 2 },
            mousemiddle: { button: 1, buttons: 4 },
            mousedblclick: { eventType: 'dblclick', detail: 2 },
            mouseover: { eventType: 'mouseover', relatedTarget: null }
        };
        // 处理多个鼠标事件（取第一个）
        const mainEvent = keys.find(k => mouseEvents.includes(k));
        Object.assign(initConfig, buttonMap[mainEvent]);
        // 派发事件序列
        if (mainEvent === 'mousedblclick') {
            // 双击需要两次点击事件
            ['mousedown', 'mouseup', 'click'].forEach(type => {
                element.dispatchEvent(new MouseEvent(type, initConfig));
            });
            const dblEvent = new MouseEvent('dblclick', { ...initConfig, detail: 2 });
            element.dispatchEvent(dblEvent);
        } else if (mainEvent === 'mouseover') {
            // 添加移动事件更真实
            element.dispatchEvent(new MouseEvent('mousemove', initConfig));
            const overEvent = new MouseEvent('mouseover', {
                ...initConfig,
                relatedTarget: document.body // 可根据需求调整
            });
            element.dispatchEvent(overEvent);
        } else {
            // 常规点击流程
            const types = ['mousedown', 'mouseup', 'click'];
            if (mainEvent === 'mouseright') types.push('contextmenu');
            types.forEach(type => {
                element.dispatchEvent(new MouseEvent(type, initConfig));
            });
        }
    }

    function getProtyleEl() {
        return document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)');
    }
    function getEditor() {
        return getProtyleEl()?.querySelector('.protyle-wysiwyg.protyle-wysiwyg--attr');
    }

    function getSelectedText(defaultText = '') {
        const selection = window.getSelection();
        if (selection.toString().trim() !== "") {
            return selection.toString(); // 返回选中的文本
        } else {
            return defaultText||""; // 如果没有选中任何内容
        }
    }
    
    function selectText(targetText, container, parentElement) {
        if(typeof parentElement === 'string') parentElement = document.querySelector(parentElement);
        if(typeof container === 'string') container = (parentElement||document).querySelector(container);
        const allText = container.textContent;
        const startGlobalIndex = allText.indexOf(targetText);
        if (startGlobalIndex === -1) return;
        let currentIndex = 0;
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let startNode, startOffset, endNode, endOffset;
        let node;
        while ((node = walker.nextNode())) {
          const nodeLength = node.nodeValue.length;
          // 判断起始位置是否在此节点
          if (currentIndex <= startGlobalIndex && currentIndex + nodeLength > startGlobalIndex) {
            startNode = node;
            startOffset = startGlobalIndex - currentIndex;
          }
          // 判断结束位置是否在此节点
          const endGlobalIndex = startGlobalIndex + targetText.length;
          if (currentIndex <= endGlobalIndex && currentIndex + nodeLength >= endGlobalIndex) {
            endNode = node;
            endOffset = endGlobalIndex - currentIndex;
            break;
          }
          currentIndex += nodeLength;
        }
        if (startNode && endNode) {
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
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

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    function isWindows() {
        return document.body.classList.contains("body--win32");
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    
    function isElectron() {
        return navigator.userAgent.includes('Electron');
    }
    
    function isBrowser() {
        return !navigator.userAgent.startsWith("SiYuan") ||
            navigator.userAgent.indexOf("iPad") > -1 ||
            (/Android/.test(navigator.userAgent) && !/(?:Mobile)/.test(navigator.userAgent));
    }

    function isReadOnly() {
        return window.siyuan.config.readonly;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function whenElementExist(selector, node, timeout = 5000, sleep = 0) {
        timeout = isNumber(timeout) ? parseInt(timeout) : 5000;
        sleep = isNumber(sleep) ? parseInt(sleep) : 0;
        return new Promise((resolve, reject) => {
            let isResolved = false;
            const check = () => {
                if(typeof node === 'string') node = document.querySelector(node);
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) {isResolved = true; resolve(el);} else if(!isResolved) sleep ? setTimeout(check, sleep) : requestAnimationFrame(check);
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
    // 默认每 40ms 检查一次
    function whenElementExistBySleep(selector, node, timeout = 5000, sleep = 40) {
        return whenElementExist(selector, node, timeout, sleep);
    }
    function whenElementExistOrNull(selector, node, timeout = 5000, sleep = 0) {
        timeout = isNumber(timeout) ? parseInt(timeout) : 5000;
        sleep = isNumber(sleep) ? parseInt(sleep) : 0;
        return new Promise(resolve => {
            const startTime = Date.now();
            const check = async () => {
                const el = typeof selector === 'function'
                    ? await selector()
                    : (node || document).querySelector(selector);
                if (el || Date.now() - startTime >= timeout) {
                    resolve(el || null);
                    return;
                }
                sleep ? setTimeout(check, sleep) : requestAnimationFrame(check);
            };
            check();
        });
    }
    function whenElementExistOrNullBySleep(selector, node, timeout = 5000, sleep = 40) {
        return whenElementExistOrNull(selector, node, timeout, sleep);
    }

    // 调用示例
    // observeElement('.tooltip.tooltip--memo:not(.fn__none)', ({element, mutationsList, stop})=>{
    //     console.log([element?.outerHTML,mutationsList, stop]);
    // });
    async function observeElement(selector, callback, options, observedEl, delay = 100) {
        let observer, selectorFn = selector;
        let isStopped = false;
        let lastElementExists = false; // 记录上一次元素是否存在
        // 转换选择器为函数
        if (typeof selector !== 'function') {
            selectorFn = () => {
                if (selector?.nodeType === 1) return selector;
                return typeof selector === 'string' ? document.querySelector(selector) : null;
            };
        }
        const stop = () => {
            isStopped = true;
            observer?.disconnect();
        };
        // 初始检查
        const initialElement = selectorFn();
        lastElementExists = !!initialElement;
        if (initialElement && typeof callback === 'function') {
            callback({ element: initialElement, mutationsList: null, stop });
            if (isStopped) return;
        }
        if (isStopped) return;
        // 核心优化：仅在元素存在状态变化时触发回调
        let ticking = false;
        observer = new MutationObserver((mutationsList) => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    const currentElement = selectorFn();
                    const currentExists = !!currentElement;
                    // 状态变化时才触发
                    if (currentExists !== lastElementExists) {
                        if (currentExists && typeof callback === 'function') {
                            callback({
                                element: currentElement,
                                mutationsList: currentExists ? mutationsList : [],
                                stop
                            });
                        }
                        lastElementExists = currentExists;
                    }
                    ticking = false;
                });
            }
        });
        if (isStopped) return;
        // 优化监听范围：只监听必要的变化
        if (typeof observedEl === 'string') {
            observedEl = await whenElementExist(observedEl);
            if (isStopped) return;
        }
        observer.observe(observedEl || document.body, options || {childList: true, subtree: true});
    }

    function whenElementRemoved(selector, callback, node = document.body, once = true) {
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                // 检查是否是子节点或后代节点被移除
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach((removedNode) => {
                        // 检查被移除的节点是否匹配 selector
                        if (removedNode.nodeType === Node.ELEMENT_NODE && removedNode.matches(selector)) {
                            if(typeof callback === 'function') callback(removedNode);
                            if(once) observer.disconnect();
                        }
                    });
                }
            });
        });
        // 配置观察选项：监听子节点和后代节点的变化
        const config = {
            childList: true, // 监听子节点的变化
            subtree: true,   // 扩展到所有后代节点
        };
        // 开始观察指定节点及其后代节点，默认为 <body>
        observer.observe(node, config);
        return () => {observer.disconnect()};
    }

    function isNumber(value, strict = false) {
        if (strict) {
            // 严格模式：必须是数字类型
            return typeof value === 'number' && !isNaN(value) && isFinite(value);
        } else {
            // 宽松模式：允许字符串形式的数字
            return !isNaN(parseFloat(value)) && isFinite(value);
        }
    }
    async function showMessageWithButton(message, isError = false, delay = 7000, text='',callback='', type='a') {
        const result = fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST", "body": JSON.stringify({"msg": message, "timeout": delay})
        });
        if(text && callback) {
            if(typeof callback === 'string') {const link=callback; callback = async () => window.open(link);}
           const whenElementExist = (selector, node, timeout=5000) => { return new Promise(resolve => {
                const startTime = Date.now(); const check = () => {
                    const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                    if (el || Date.now() - startTime >= timeout) {resolve(el||null);return} requestAnimationFrame(check);
                }; check();
            });};
            const msgContent = await whenElementExist("#message .b3-snackbar__content");
            if(!msgContent) return; const br = document.createElement("br");
            const button = document.createElement(type);button.style.cursor='pointer';
            if(type === 'button') button.classList.add('b3-button', 'b3-button--white');
            button.textContent = text; if(typeof callback === 'function') button.onclick = callback;
            msgContent.appendChild(br); msgContent.appendChild(button);
        }
        return result;
    }
    function showMessage(message, delay = 7000, isError = false, text='', callback='', type='a') {
        return showMessageWithButton(message, isError, delay, text, callback, type);
    }
    function showErrorMessage(message, delay = 7000, isError = true, text='', callback='', type='a') {
        return showMessageWithButton(message, isError, delay, text, callback, type);
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

    function getCursorElement() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // 获取选择范围的起始位置所在的节点
            const startContainer = range.startContainer;
            // 如果起始位置是文本节点，返回其父元素节点
            const cursorElement = startContainer.nodeType === Node.TEXT_NODE
                ? startContainer.parentElement
                : startContainer;
            return cursorElement;
        }
        return null;
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.warn('复制失败: ', err);
        }
    }

    // 自定义状态栏输出
    function showMyStatusMsg(html, delay = 7000, append = false) {
        let myStatus = document.querySelector('#status .my_status__msg');
        if(!myStatus) {
            const status = document.querySelector('#status');
            const statusCounter = status.querySelector('.status__counter');
            if(!statusCounter) return;
            const style = `
                color: var(--b3-theme-on-surface); white-space: nowrap;
                text-overflow: ellipsis; overflow: hidden;
                padding-left: 5px; padding-right: 5px; font-size: 12px;
            `;
            const myStatusHtml = `<div class="my_status__msg" style="${style}"></div>`;
            statusCounter.insertAdjacentHTML('beforebegin', myStatusHtml);
            myStatus = status.querySelector('.my_status__msg');
        }
        if(myStatus) append ? myStatus.innerHTML += html : myStatus.innerHTML = html;
        if(myStatus && delay > 0)  {
            if(myStatus.timer) clearTimeout(myStatus.timer);
            myStatus.timer = setTimeout(()=>myStatus.innerHTML = '', delay);
        }
    }

    async function putFile(path, content = '', isDir = false) {
        const formData = new FormData();
        formData.append("path", path);
        formData.append("isDir", isDir)
        formData.append("file", new Blob([content]));
        const result = await fetch("/api/file/putFile", { // 写入js到本地
            method: "POST",
            body: formData,
        });
        const json = await result.json();
        return json;
    }

    async function getFile(path, type = 'text') {
        return fetch("/api/file/getFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
        }).then((response) => {
            if (response.ok) {
                if(type==='json') return response.json();
                else if(type==='blob') return response.blob();
                else return response.text();
            } else {
                throw new Error("Failed to get file content");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    function newSetStyle() {
        let styleElement = null; // 保存当前样式元素的引用
        return (css = '') => {
        // 如果已存在样式元素，先移除它
        if (styleElement) {
            styleElement.parentNode.removeChild(styleElement);
        }
        // 创建新的样式元素
        if(css) {
            styleElement = document.createElement('style');
            styleElement.textContent = css;
            document.head.appendChild(styleElement);
        }
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
    // 定位文件或文件夹
    function showFileInFolder(filePath) {
        require('electron').ipcRenderer.send("siyuan-open-folder", filePath);
    }
    // 运行本地文件
    function runCmd(command, callback) {
        const { exec } = require('child_process');
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行错误: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            if (typeof callback === 'function') {
                callback(stdout);
            }
        });
    }
    // 打开本地文件
    // openFile('C:\\path\\to\\file.txt'); // Windows
    // openFile('/Applications/Preview.app'); // macOS
    // openFile('/path/to/file.pdf'); // Linux
    function openFile(target) {
        const { exec } = require('child_process');
        if (process.platform === 'win32') {
            // Windows
            exec(`start "" "${target}"`, (error, stdout, stderr) => {
                if (error) console.error(`执行错误: ${error.message}`);
                if (stderr) console.error(`stderr: ${stderr}`);
            });
        } else if (process.platform === 'darwin') {
            // macOS
            exec(`open -a "${target}"`, (error, stdout, stderr) => {
                if (error) console.error(`执行错误: ${error.message}`);
                if (stderr) console.error(`stderr: ${stderr}`);
            });
        } else {
            // Linux/其他
            exec(`xdg-open "${target}"`, (error, stdout, stderr) => {
                if (error) console.error(`执行错误: ${error.message}`);
                if (stderr) console.error(`stderr: ${stderr}`);
            });
        }
    }
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
    function showInputBox(defaultText = '', title = '', placeholder = '', lines = 1, enterSubmit = true) {
        return new Promise((resolve) => {
          // 创建模态框元素
          const mask = document.createElement('div');
          const content = document.createElement('div');
          const titleEl = document.createElement('p');
          titleEl.textContent = title;
          titleEl.style.marginBottom = '10px';
          const input = document.createElement(lines>1 ? 'textarea' : 'input');
          //const submitBtn = document.createElement('button');
          input.className = 'b3-text-field fn__block';
          const ctrl = !enterSubmit && lines > 1 ? 'ctrl+' : '';
          const ln = lines > 1 ? "\n" : "，";
          input.placeholder = placeholder || ctrl+"回车提交{1}，Esc或点击空白处取消"+ln+"支持Markdown语法";
          if(lines > 1) input.setAttribute('rows', lines);
          input.placeholder = input.placeholder.replace('{1}', lines > 1 && enterSubmit ? '，Shift+回车换行' : '');
          //submitBtn.className = 'b3-button fn__size200 b3-button--outline';
          // 添加基础样式
          Object.assign(mask.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'var(--b3-mask-background)', //rgba(0, 0, 0, 0.5)
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: (++siyuan.zIndex) || 999
          });
          Object.assign(content.style, {
            background: 'var(--b3-theme-background)',
            padding: '20px',
            borderRadius: '5px',
            minWidth: 'min(100%, 500px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.33)',
            border: siyuan.config.appearance.mode === 1 ? '1px solid #555' : 'none'
          });
          Object.assign(input.style, {
            flex: '1',
            padding: '8px',
            fontSize: '16px',
            marginRight: '10px',
            width: '100%'
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
          if(lines === 1) input.type = 'text';
          input.value = defaultText;
          //submitBtn.textContent = '提交';
          // 组装DOM结构
          if(title) content.appendChild(titleEl);
          content.appendChild(input);
          //content.appendChild(submitBtn);
          mask.appendChild(content);
          document.body.appendChild(mask);
          // 自动聚焦输入框
          setTimeout(() => {
            input.focus();
          }, 100);
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
            if(enterSubmit || lines === 1) {
                if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) handleConfirm();
            } else {
                if (e.key === 'Enter' && e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) handleConfirm();
            }
            if (e.key === 'Escape') handleCancel();
          };
          const cleanup = () => {
            if(!mask.matches('&:last-child')) return;
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
    //       { label: '选项 1', value: 'value1', key: 'a', pinyin: '', pinyinFirst: '', shortcut: '', callback: () => {} },
    //       { label: '选项 2', value: 'value2', key: 'b', pinyin: '', pinyinFirst: '', shortcut: '', callback: () => {} },
    //       { label: '选项 3', value: 'value3', key: 'c', pinyin: '', pinyinFirst: '', shortcut: '', callback: () => {} }
    //     ];
    //     const selectedOption = await showOptionsMenu(options);
    //     if (selectedOption === null) {
    //       console.log('用户取消了选择');
    //     } else {
    //       console.log(`用户选择了：${selectedOption.value}`);
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
            background-color: var(--b3-mask-background); /*rgba(0, 0, 0, 0.5);*/
            justify-content: center;
            align-items: center;
            z-index: ${(++siyuan.zIndex) || 999};
       }

       /* 菜单容器样式 */
        .open-any-menu {
            /*position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);*/
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: min(600px, 100%);
            min-width: min(300px, 100%);
            overflow-y: auto;
            max-height: min(800px, 100%);
       }
       [data-theme-mode="dark"] {
            /* 整个滚动条 */
            .open-any-menu::-webkit-scrollbar {
                width: 8px; /* 滚动条宽度 */
                height: 80px; /* 横向滚动条高度 */
            }

            /* 滚动条滑块 */
            .open-any-menu::-webkit-scrollbar-thumb {
                background: #CCCCCC; /* 滑块颜色 */
                border-radius: 8px; /* 滑块圆角 */
            }
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

       .open-any-menu-item:hover{
           background-color: #e0e0e0;
       }
       .open-any-menu-item.fn__selected {
            background-color: #d1e7fd;
       }
        .open-any-menu-title{
            color: #222;
            position: sticky;
            top: 0;
            background-color: white;
        }
        .open-any-menu-title:has(> *) {
            margin-bottom: 10px;
            padding-top: 20px;
        }
        .open-any-menu:has(.open-any-menu-title > *) {
            padding-top: 0;
        }
        .open-any-menu-item-key{margin-left: 2.5px;}
        .open-any-menu-body.search-empty::before {
            content: "没找到任何内容";
            float: left;
            color: #222;
        }
        .open-any-menu-search .open-any-menu-search-input{
            color: #222;
            background-color: white;
            font-size: 16px;
        }
        .open-any-menu-search .b3-text-field {
            box-shadow: none;
        }
        .open-any-menu-search .b3-text-field:not(.b3-text-field--text):focus{
            box-shadow: none;
            /*box-shadow: inset 0 0 0 1px #3575f0, 0 0 0 3px rgba(53, 117, 240, .12);*/
        }
        .open-any-menu-search .b3-text-field:not(.b3-text-field--text):hover{
            /*box-shadow: inset 0 0 0 .6px #222;*/
            box-shadow: none;
        }
        .open-any-menu-item-shortcut{
            float: right;
        }
   `);
   const setMenuItemStyle = newSetStyle();
    /**
     * 显示选项菜单并返回用户选择的结果
     * @param {Array<{label: string, value: any}>} options - 选项列表
     * @returns {Promise<any>} 用户选择的值
     */
    function showOptionsMenu(options, config = {}, selectedIndex) {
        return new Promise((resolve) => {
            // 创建 overlay 元素
            const overlay = document.createElement('div');
            overlay.className = 'open-any-overlay';
            // 创建 menu 元素
            const menu = document.createElement('div');
            menu.className = 'open-any-menu';
            const menuTitle = document.createElement('div');
            menuTitle.className = 'open-any-menu-title';
            const menuBody = document.createElement('div');
            menuBody.className = 'open-any-menu-body';
            // 将menuTitle 添加到 menu 中
            menu.appendChild(menuTitle);
            // 将menuBody 添加到 menu 中
            menu.appendChild(menuBody);
            // 将 menu 添加到 overlay 中
            overlay.appendChild(menu);
            // 将 overlay 添加到 body 的末尾
            document.body.appendChild(overlay);
            // 设置menuItem样式
            if (config?.menuItemStyle) {
                setMenuItemStyle(`.open-any-menu-item{${config.menuItemStyle}}`);
            }
            // 设置menu宽度等
            if (config?.width) menu.style.width = config.width;
            if (config?.height) menu.style.height = config.height;
            if (config?.maxWidth) menu.style.maxWidth = config.maxWidth;
            if (config?.maxHeight) menu.style.maxHeight = config.maxHeight;
            if (config?.minWidth) menu.style.minWidth = config.minWidth;
            if (config?.minHeight) menu.style.minHeight = config.minHeight;
            // 清空菜单内容
            let title = config?.title || '';
            if (typeof config === 'string') title = config;
            const titleHtml = title ? `<div class="open-any-menu-title-text">${title}</div>` : '';
            const searchHtml = config?.search ? `
                <div class="open-any-menu-search b3-form__icon">
                    <svg class="b3-form__icon-icon"><use xlink:href="#iconSearch"></use></svg>
                    <input type="text" style="width:100%" placeholder="${config?.searchPlaceholder||'搜索'}" class="open-any-menu-search-input b3-text-field b3-form__icon-input">
                </div>` : '';
            menuTitle.innerHTML = `${titleHtml}${searchHtml}`;
            const menuItems = [];
            const keys = {};
            let currentIndex, oldOption;
            // 计算选中项在可视区的显示位置
            const updateSelection = (direction, margin = 25) => {
                menuItems.forEach((item, index) => {
                    item.classList.toggle('fn__selected', index === currentIndex);
                    if (index !== currentIndex) return;
                    // 首尾项处理
                    if (currentIndex === 0) {
                        return menu.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    if (currentIndex === options.length - 1) {
                        return menu.scrollTo({ top: menu.scrollHeight, behavior: 'smooth' });
                    }
                    // 动态坐标系计算
                    const menuRect = menu.getBoundingClientRect();
                    const itemRect = item.getBoundingClientRect();
                    // 计算元素相对容器的可视位置
                    const visibleTop = itemRect.top - menuRect.top;
                    const visibleBottom = itemRect.bottom - menuRect.top;
                    const menuHeight = menuRect.height;
                    // 智能滚动判断
                    let targetScroll = menu.scrollTop;
                    // 顶部越界判断（包含 margin）
                    if (visibleTop < margin) {
                        targetScroll += visibleTop - margin;
                    }
                    // 底部越界判断（包含 margin）
                    else if (visibleBottom > menuHeight - margin) {
                        targetScroll += visibleBottom - (menuHeight - margin);
                    }
                    // 执行滚动
                    if (Math.abs(targetScroll - menu.scrollTop) > 1) {
                        menu.scrollTo({ top: targetScroll, behavior: 'smooth' });
                    }
                });
            };

            // 生成菜单项
            const generateMenuItems = () => {
                // 动态添加选项到菜单
                options.forEach((option, index) => {
                    const menuItem = document.createElement('div');
                    menuItem.className = 'open-any-menu-item';
                    menuItem.innerHTML = `<span class="open-any-menu-item-text">${option.label}</span><span class="open-any-menu-item-key">${option?.key?.toUpperCase()?.replace(/(.+)/, '($1)') || ''}</span><span class="open-any-menu-item-shortcut">${option?.shortcut||''}</span>`;
                    menuItem.addEventListener('click', (event) => {
                        //event.preventDefault(); // 阻止默认行为
                        option.index = index;
                        option.closeMenu = closeMenu;
                        resolve(option); // 返回用户选择的值
                        if(!option.disableClose) closeMenu();
                    });
                    menuBody.appendChild(menuItem);
                    // 保存菜单项到列表
                    menuItems.push(menuItem);
                    // 保存按键
                    if (option.key) keys[option.key.toLowerCase()] = index;
                    // 赋值当前选中项
                    if (option.selected) selectedIndex = index;
                });
                // 赋值选中项的索引
                currentIndex = isNumber(selectedIndex) ? selectedIndex : (options.length ? Math.floor((options.length - 1) / 2) : -1);
                oldOption = options[currentIndex];
                // 加载时更新选中项在可视区的位置
                setTimeout(() => {
                    if (currentIndex >= 0) {
                        menuItems[currentIndex].classList.toggle('fn__selected', true);
                        menuItems[currentIndex].scrollIntoView({ behavior: "smooth", block: "center" }); //updateSelection();
                    }
                }, 0);
            }
            generateMenuItems();

            // 监听搜索事件
            if (config?.search) {
                const menuSearchInput = menuTitle.querySelector('.open-any-menu-search-input');
                setTimeout(()=>menuSearchInput.focus(), 50);
                let isComposing = false; // 新增输入法状态标志
                const handleSearch = (event) => {
                    event.preventDefault();
                    if (isComposing) return; // 正在输入法输入时跳过
                    const searchTerms = event.target.value.trim();
                    let searchCount = menuItems.length;
                    let visiableIndexs = [];
                    const getIsVisible = (searchTerms, option) => {
                        if(searchTerms.includes('OR')) {
                            searchTerms = searchTerms.split('OR');
                            return (
                                searchTerms.some(searchTerm => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
                                searchTerms.some(searchTerm => option?.pinyin?.toLowerCase()?.includes(searchTerm.trim().toLowerCase())) ||
                                searchTerms.some(searchTerm => option?.pinyinFirst?.toLowerCase()?.includes(searchTerm.trim().toLowerCase()))
                            );
                        } else if(searchTerms.includes('AND') || searchTerms.includes(' ')) {
                            searchTerms = searchTerms.includes('AND') ? searchTerms.split('AND') : searchTerms.split(' ');
                            return (
                                searchTerms.every(searchTerm => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
                                searchTerms.every(searchTerm => option?.pinyin?.toLowerCase()?.includes(searchTerm.trim().toLowerCase())) ||
                                searchTerms.every(searchTerm => option?.pinyinFirst?.toLowerCase()?.includes(searchTerm.trim().toLowerCase()))
                            );
                        }
                        return (
                            option.label.toLowerCase().includes(searchTerms.trim().toLowerCase()) ||
                            option?.pinyin?.toLowerCase()?.includes(searchTerms.trim().toLowerCase()) ||
                            option?.pinyinFirst?.toLowerCase()?.includes(searchTerms.trim().toLowerCase())
                            //option?.key?.toLowerCase() === searchTerms.trim().toLowerCase() // 快捷键搜索
                        );
                    };
                    menuItems.forEach((menuItem, index) => {
                        const option = options[index];
                        const isVisible = getIsVisible(searchTerms, option);
                        menuItem.style.display = isVisible ? '' : 'none';
                        searchCount -= isVisible ? 0 : 1;
                        isVisible ? visiableIndexs.push(index) : '';
                    });
                    searchCount > 0 ? menuBody.classList.remove('search-empty') : menuBody.classList.add('search-empty');
    
                    // 找到可见项中是否存在之前选中项的索引
                    let newVisibleIndex = -1;
                    for (let i = 0; i < menuItems.length; i++) {
                        const option = options[i];
                        if (menuItems[i].style.display !== 'none' && option.label === oldOption?.label && option.value === oldOption?.value) {
                            newVisibleIndex = i;
                            break;
                        }
                    }
                    // 如果不存在已选中项，则取中间项的索引
                    if(newVisibleIndex === -1) {
                        const visiableIndex = Math.floor((visiableIndexs.length - 1) / 2);
                        newVisibleIndex = visiableIndexs[visiableIndex];
                    }
                    currentIndex = newVisibleIndex;
                    updateSelection();
                };
                // 新增输入法事件监听
                menuSearchInput.addEventListener('compositionstart', () => {
                    isComposing = true;
                });
                menuSearchInput.addEventListener('compositionend', (event) => {
                    isComposing = false;
                    // 输入法输入完成后主动触发一次搜索
                    handleSearch(event);
                });
                menuSearchInput.addEventListener('input', (event) => {
                    handleSearch(event);
                });
            }
    
            // 打开菜单
            overlay.style.display = 'flex';
    
            // 监听键盘事件
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') {
                    resolve(null); // 如果按下 Esc 键，返回 null
                    closeMenu();
                }
                // 方向键导航（支持跳过隐藏项）
                else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    let newIndex = currentIndex - 1;
                    while (newIndex >= 0 && menuItems[newIndex].style.display === 'none') newIndex--;
                    if (newIndex >= 0) {
                        currentIndex = newIndex;
                        updateSelection('up', menuTitle.children.length > 0 ? 45 : 25);
                    }
                }
                else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    let newIndex = currentIndex + 1;
                    while (newIndex < options.length && menuItems[newIndex].style.display === 'none') newIndex++;
                    if (newIndex < options.length) {
                        currentIndex = newIndex;
                        updateSelection('down');
                    }
                }
                // 回车确认
                else if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    if (currentIndex >= 0 && menuItems[currentIndex].style.display !== 'none') {
                        menuItems[currentIndex].click();
                    }
                } else if (keys[event.key.toLowerCase()] && !event.target.matches('.open-any-menu-search-input:focus')) {
                    event.preventDefault();
                    event.stopPropagation();
                    menuItems[keys[event.key.toLowerCase()]].click();
                }
            };
            document.addEventListener('keydown', handleKeyDown, true);
    
            // 关闭菜单时清理事件监听器
            function closeMenu() {
                if(!overlay.matches('&:last-child')) return;
                //overlay.style.display = 'none';
                overlay?.remove();
                document.removeEventListener('keydown', handleKeyDown, true);
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
    //实现dialog对话框
    /*
    options = {
        ...options,
        showAction?: boolean,
        comfirmBtnText?: boolean,
        cancelBtnText?: boolean,
        // 当点击确定后不想关闭对话框时，可设置为options.disableClose=true;即可
        confirmCallback?: (options?: IObject) => void
    }
    */
    // 创建基础对话框，showDialog基础上增加content容器和确定与取消按钮
    // 当点击确定后不想关闭对话框时，可设置为options.disableClose=true;即可
    function showBasicDialog(options = {}) {
        options.width = options?.width || "min(100%, 500px)";
        options.height = options?.height || "min(100vh, 300px)";
        const showAction = options?.showAction === false  ? false : true;
        const comfirmBtnText = options?.comfirmBtnText === null ? '' : (options?.comfirmBtnText || "确定");
        const cancelBtnText = options?.cancelBtnText === null ? '' : (options?.cancelBtnText || "取消");
        const actionHtml = showAction ? `
        <div class="b3-dialog__action">
            <button class="b3-button b3-button--cancel">${cancelBtnText}</button><div class="fn__space"></div>
            <button class="b3-button b3-button--text">${comfirmBtnText}</button>
        </div>` : '';
        options.content = `
        <div class="b3-dialog__content">
            ${options.content}
        </div>
        ${actionHtml}`;
        const element = showDialog(options);
        if(showAction) {
            element.querySelector(".b3-button--text").addEventListener("click", (event) => {
                if(typeof options.confirmCallback === 'function') options.confirmCallback(element, options);
                if (!options.disableClose) {
                    destroyDialog(element, options);
                }
                event.preventDefault();
                event.stopPropagation();
            });
            element.querySelector(".b3-button--cancel").addEventListener("click", (event) => {
                if (!options.disableClose) {
                    destroyDialog(element, options);
                }
                event.preventDefault();
                event.stopPropagation();
            });
        }
    }
    /*
    options = {
        title?: string,
        content: string,
        transparent?: boolean,
        width?: string,
        height?: string,
        left?: string,
        top?: string,
        destroyCallback?: (options?: IObject) => void,
        disableClose?: boolean,
        hideCloseIcon?: boolean,
        disableAnimation?: boolean,
        containerClassName?: string,
    }*/
    // 创建对话框
    // 当不想关闭对话框时，可设置为options.disableClose=true;即可
    function showDialog(options={}) {
        const disableClose = options.disableClose;
        const destroyCallback = options.destroyCallback;
        const element = document.createElement("div");
        let left = options.left;
        let top = options.top;
        element.innerHTML = `<div class="b3-dialog" style="z-index: ${++window.siyuan.zIndex};${typeof left === "string" ? "display:block" : ""}">
    <div class="b3-dialog__scrim"${options.transparent ? 'style="background-color:transparent"' : ""}></div>
    <div class="b3-dialog__container ${options.containerClassName || ""}" style="width:${options?.width || "auto"};height:${options.height || "auto"};
    left:${left || "auto"};top:${top || "auto"}">
    <svg ${(!!document.getElementById("sidebar") && options.title) ? 'style="top:0;right:0;"' : ""} class="b3-dialog__close${(disableClose || options.hideCloseIcon) ? " fn__none" : ""}"><use xlink:href="#iconCloseRound"></use></svg>
    <div class="resize__move b3-dialog__header${options?.title ? "" : " fn__none"}" onselectstart="return false;">${options?.title || ""}</div>
    <div class="b3-dialog__body">${options.content}</div>
    <div class="resize__rd"></div><div class="resize__ld"></div><div class="resize__lt"></div><div class="resize__rt"></div><div class="resize__r"></div><div class="resize__d"></div><div class="resize__t"></div><div class="resize__l"></div>
    </div></div>`;
        element.querySelector(".b3-dialog__scrim").addEventListener("click", (event) => {
            if (!disableClose) {
                destroyDialog(element, options);
            }
            event.preventDefault();
            event.stopPropagation();
        });
        if (!disableClose) {
            element.querySelector(".b3-dialog__close").addEventListener("click", (event) => {
                destroyDialog(element, options);
                event.preventDefault();
                event.stopPropagation();
            });
        }

        const keydownHandler = (element, options, event) => {
            if (event.key === "Escape") {
                if(!element.matches('&:last-child')) return;
                if (!options.disableClose) {
                    destroyDialog(element, options);
                }
            }
        };
        element.keydownBind = keydownHandler.bind(null, element, options);
        document.addEventListener("keydown", element.keydownBind, true);

        document.body.append(element);
        if (options.disableAnimation) {
            element.classList.add("b3-dialog--open");
        } else {
            setTimeout(() => {
                element.classList.add("b3-dialog--open");
            });
        }
        return element;
    }
    function destroyDialog(element, options) {
        element.classList.remove("b3-dialog--open");
        // 移除绑定的事件
        if(element.keydownBind) {
            document.removeEventListener("keydown", element.keydownBind, true);
            element.keydownBind = null;
        }
        setTimeout(() => {
            // av 修改列头emoji后点击关闭emoji图标
            if ((element.querySelector(".b3-dialog")).style.zIndex < window.siyuan.menus.menu.element.style.zIndex) {
                // https://github.com/siyuan-note/siyuan/issues/6783
                window.siyuan.menus.menu.remove();
            }
            element.remove();
            if (options.destroyCallback) {
                options.destroyCallback(options);
            }
            // https://github.com/siyuan-note/siyuan/issues/10475
            document.getElementById("drag")?.classList.remove("fn__hidden");
        }, 190);
    }
    /**
     * 显示一个消息框，返回 Promise<boolean>
     * @param {string} content - 内容
     * @param {string} [title=''] - 标题
     * @param {string} [confirmBtnText='确定'] - 确定按钮文字
     * @param {string} [cancelBtnText='取消'] - 取消按钮文字
     * @param {string} [width='518px'] - 宽度
     * @param {string} [height='158px'] - 高度
     * @returns {Promise<boolean>} 如果点击确定，resolve(true)，否则 reject(false) 或 resolve(false)
     */
    function showMsgBox(
        content,
        title = '',
        confirmBtnText = '确定',
        cancelBtnText = '取消',
        width = '518px',
        height = '158px'
    ) {
        return new Promise((resolve, reject) => {
            // 定义点击确定后的回调
            const confirmCallback = () => {
                resolve(true); // 用户点击了“确定”
            };
            // 定义点击取消或关闭后的回调
            const destroyCallback = () => {
                resolve(false);
            };
            // 调用基础弹窗方法
            showBasicDialog({
                title,
                content,
                confirmCallback,
                destroyCallback,
                confirmBtnText,
                cancelBtnText,
                showAction: true,
                width: isNumber(width) ? width+'px' : width,
                height: isNumber(height) ? height+'px' : height,
            });
        });
    }
    // 自动更新 开发者推广计划
    (async () => {
        try {
            if(window?.snippetsNewVersions?.newVersionLoader) return;
            await new Promise(resolve => setTimeout(resolve, 1500));
            if(window?.snippetsNewVersions?.setInterval) return;
            const urls = ['jsd.onmicrosoft.cn','cdn.jsdmirror.com','gcore.jsdelivr.net','fastly.jsdelivr.net','quantil.jsdelivr.net','originfastly.jsdelivr.net','cdn.mengze.vip','update.gf.qytechs.cn','jsd.nmmsl.top','cdn.bili33.top','jsdelivr.qaq.qa','jsdelivr.5210521.xyz','gitee.com','cdn.jsdmirror.cn','raw.githubusercontent.com'];
            function loadScript(index) {
                if (index >= urls.length) { console.warn('所有 CDN 节点都无法加载目标脚本。'); return;}
                const script = document.createElement('script'), prefixs = {'gitee.com':'wish163/mysoft/raw/','raw.githubusercontent.com':'wish5115/my-softs/refs/heads/','update.gf.qytechs.cn':'scripts/534829/checkNewVersion.user.js'};
                script.src = 'https://'+urls[index]+'/'+(prefixs[urls[index]]||'gh/wish5115/my-softs@')+(urls[index]==='update.gf.qytechs.cn'?'':'main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js'+(Math.random() < 0.2?'?t='+Date.now():''));
                script.onerror = () => { console.warn(`加载失败：${urls[index]}，尝试下一个节点...`); script.remove(); loadScript(index + 1);}; document.head.appendChild(script);
            } loadScript(0);
        } catch(e) {};
    })();
})();