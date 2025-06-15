// 行内js
// see https://ld246.com/article/1749806156975
// version 0.0.8
// 0.0.8 解决base64重复编码问题
// 0.0.7 改善输入时的体验，仅在执行和刷新时重新执行代码，输入期间不再执行代码
// 0.0.6 修复0.0.5逻辑上的bug
// 0.0.5 解决特殊字符导致报错解析错误的问题
// 0.0.4 彻底解决特殊字符思源被意外解析导致的错误问题
// 0.0.3 修复模板导入时的反撇号等错误
// 0.0.2 修复获取文档和块的bug
// 使用示例
// <span data-type="text" custom-js="
//     const weather = await fetch('https://wttr.in/?format=1');
//     const text = await weather.text();
//     return '''今日天气：''' + text.trim(); // 双引号可以用3个单引号代替
// ">Loading</span>
//或
// $Loading${: custom-js="return 'Hello Inline JS';"}
// todo 方案2：直接用inline-math前缀标记实现，应该更加兼容和稳定
(() => {
    // 是否插入时弹出编辑窗空，true 弹窗 false 不弹窗
    // 注意，从模板插入不会弹窗
    const showEditorBoxWhenInsert = true;

    // 代码编辑弹窗默认宽高
    const codeEditorWidth = '480px';
    const codeEditorHeight = '96px';

    // 是否允许输出空内容 true 允许 false 不允许
    const allowOutputEmpty = false;

    // 检查输出内容是否为空，延迟时间，单位毫秒
    const checkOutputEmptyDelay = 3000;

    ///////////////// 主流程 ///////////////////////////

    // 添加样式
    addStyle(`
        /* 去除公式内的样式，防止意外 */
        .b3-typography span[custom-js] :is(.katex, .katex *), .protyle-wysiwyg span[custom-js] :is(.katex, .katex *) {
            all: inherit!important;
        }
        /* 设置行内js整体折行效果 */
        /*.b3-typography span[data-type~=inline-math][custom-js], .protyle-wysiwyg span[data-type~=inline-math][custom-js] {
            display: inline-block;
        }*/
        /* 错误样式 */
        .inline-js-error-msg {
            color: ${window.siyuan.config.appearance.mode===0?'#F44336':'#FF5252'};
        }
    `);

    // 全局变量
    let lastCursorPos = null,
        lastInputChar = null,
        shareData = {};
    window.inlineJsShareData = shareData;

    // 执行js代码
    observeJsSpan(document.body, async (code, element) => {
        runJs(code, element);
    });

    // 运行js
    async function runJs(code, element) {
        if(!element) return;
        try {
            // 模拟行内公式
            if (!element.getAttribute("contenteditable")) {
                element.setAttribute("contenteditable", false);
            }
            if (!element?.dataset?.render) {
                element.dataset.render = true;
            }
            if (!element.classList.contains('render-node')) {
                element.classList.add('render-node');
            }
            if (!element?.dataset?.type || element?.dataset?.type.toLowerCase() !== 'inline-math') {
                element.dataset.type = 'inline-math';
            }
            if (!element?.dataset?.subtype) {
                element.dataset.subtype = 'math';
            }
            if (!element.clickHandle) element.addEventListener('click', () => {
                element.clickHandle = true;
                listenMathBoxShow(element);
                // 解决公式无法输入$的问题
                const observeDataChangeHandle = (code)=>{
                    element.setAttribute('data-content', base64Encode(element.getAttribute('data-content')));
                    //element.setAttribute('data-content', element.getAttribute('data-content').replace(/\$/g, '\\$'));
                    if(!element.observerDataChange) observeDataChange(element, observeDataChangeHandle);
                };
                observeDataChange(element, observeDataChangeHandle);
            });
            // 防止输入光标丢失问题
            if (lastCursorPos && lastInputChar && !element.textContent.startsWith('Loading')){
                if(lastInputChar === 'paste') {
                    lastCursorPos = null;
                } else {
                    // 由于这里没有重执行代码，其实这里不用恢复光标了，以防万一先保留吧
                    restoreCursorPos(element.closest('[data-node-id]'), lastCursorPos);
                }
                lastInputChar = null;
                return;
            }
            await runCode(element, code);
        } catch (error) {
            const errorMsg = "<span class='inline-js-error-msg'>行内js执行出错:" + error.toString() + "</span>";
            //const formatCode = code.replace(/_esc_newline_/ig, '\n').replace(/"/g, "'''");
            //element.setAttribute('custom-js', formatCode);
            updateDataContent(element, element.getAttribute('data-content'));
            //element.dataset.content = base64Encode(element.getAttribute('data-content'));
            //element.dataset.content = Lute.EscapeHTMLStr(errorMsg).replace(/\$/g, '\\$');
            element.innerHTML = errorMsg;
            restoreCursorPos(element.closest('[data-node-id]'), lastCursorPos);
            lastInputChar = null;
            console.error("行内js执行出错:", error);
        }
    }

    // 执行用户代码
    async function runCode(element, code) {
        // 动态生成的函数体
        const isBase64Str = isBase64(code);
        const formatCode = isBase64Str?base64Decode(code):code.replace(/_esc_newline_/ig, '\n').replace(/"/g, "'''");
        const functionBody = `
            return (async () => {
                ${isBase64Str?formatCode:formatCode.replace(/'''/g, '"')}
            })();
        `;

        // 创建动态函数
        const userFunction = new Function(
            "el",
            "element",
            "block",
            "doc",
            "protyle",
            "querySql",
            "fetchSyncPost",
            "updateBlock",
            "date",
            "sleep",
            "whenElementExistOrNull",
            "whenElementExistOrNullByObserver",
            "isMobile",
            "isMac",
            "isWindows",
            "addStyle",
            "insertCursorAfterElement",
            "insertToEditor",
            "getCursorElement",
            "getShareData",
            "setShareData",
            "shareData",
            "render",
            "updateDataContent",
            functionBody
        );

        // 调用动态函数
        const result = await userFunction(
            element,
            element,
            await getBlock(element),
            await getDoc(element),
            getProtyle(),
            querySql,
            fetchSyncPost,
            updateBlock,
            getDate(),
            sleep,
            whenElementExistOrNull,
            whenElementExistOrNullByObserver,
            isMobile,
            isMac,
            isWindows,
            addStyle,
            insertCursorAfterElement,
            insertToEditor,
            getCursorElement,
            getShareData,
            setShareData,
            shareData,
            render,
            updateDataContent
        );
        // 更新结果
        if(result !== undefined) {
            element.innerHTML = result; //`<span class="katex"><span class="katex-html" aria-hidden="true"><span class="base custom-js-content">${result}</span></span></span>`;
            updateDataContent(element, result);
            //element.dataset.content = Lute.EscapeHTMLStr(result).replace(/\$/g, '\\$');
        }
        // 未输出时输出提示信息
        if(!allowOutputEmpty) setTimeout(() => {
            if (!element.innerText.trim()) {
                element.innerHTML = '暂无内容输出';
                updateDataContent(element, element.innerHTML);
                //element.dataset.content = Lute.EscapeHTMLStr(element.innerHTML).replace(/\$/g, '\\$');
            }
        }, checkOutputEmptyDelay);
        //const content = element.querySelector('.custom-js-content');
        //if (!content) console.error("行内js输出错误: .custom-js-content元素不存在");
        //if (!content.innerText.trim()) content.innerHTML = '暂无输出内容';
        // 生成格式化的代码
        //element.setAttribute('custom-js', formatCode);
        //if (lastCursorPos) restoreCursorPos(lastCursorPos);
        if (lastCursorPos) restoreCursorPos(element.closest('[data-node-id]'), lastCursorPos);
    }

    ///////////////// 功能函数 ///////////////////////////

    function updateDataContent(element, content) {
        element.dataset.content = isBase64(content)?content:base64Encode(content); //Lute.EscapeHTMLStr(content).replace(/\$/g, '\\$');
    }

    function updateBlock(block, data = '', type = 'dom') {
        let blockEl, blockId = block;
        if (block?.nodeType === 1) {
            blockEl = block.closest("[data-node-id]");
            if (!blockEl) return;
            blockId = blockEl?.dataset?.nodeId;
        }
        if (!blockId) return;

        fetchSyncPost('/api/block/updateBlock', {
            "dataType": type || "dom",
            "data": data || blockEl.outerHTML,
            "id": blockId
        });
    }

    async function getBlock(element) {
        const blockEl = element.closest("[data-node-id]");
        const blockId = blockEl.dataset.nodeId;
        let block = await querySql(`select * from blocks where id = '${blockId}'`);
        block = block[0] || {};
        block.element = blockEl;
        block.id = blockId;
        return block;
    }

    async function getDoc(element) {
        const protyle = getProtyle();
        const docId = protyle.block.rootID;
        let doc = await querySql(`select * from blocks where id = '${docId}'`);
        doc = doc[0] || {};
        return doc;
    }

    async function querySql(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    function isWindows() {
        return document.body.classList.contains("body--win32");
    }

    function getDate() {
        const now = new Date();

        // 获取年、月、日、时、分、秒
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需加 1
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // 格式化日期和时间
        const today = `${year}-${month}-${day}`;
        const time = `${hours}:${minutes}:${seconds}`;
        const datetime = `${today} ${time}`;

        // 返回结果
        return {
            now: datetime,       // 年-月-日 时:分:秒
            today: today,        // 年-月-日
            datetime: datetime,  // 年-月-日 时:分:秒
            date: today,         // 年-月-日
            time: time           // 时:分:秒
        };
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getProtyle() {
        try {
            if (document.getElementById("sidebar")) return siyuan.mobile.editor.protyle;
            const currDoc = siyuan?.layout?.centerLayout?.children.map(item => item.children.find(item => item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active') || item.panelElement.closest('[data-type="wnd"]')))).find(item => item);
            return currDoc?.model.editor.protyle;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    // 请求api
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = { method: "POST" };
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
        } catch (e) {
            console.log(e);
            return returnType === 'json' ? { code: e.code || 1, msg: e.message || "", data: null } : "";
        }
    }

    function whenElementExistOrNull(selector, node, timeout = 5000) {
        return new Promise((resolve) => {
            let isResolved = false;
            let requestId, timeoutId; // 保存 requestAnimationFrame 的 ID
            const check = () => {
                try {
                    const el = typeof selector === 'function' ? selector() : (node || document).querySelector(selector);
                    if (el) {
                        isResolved = true;
                        cancelAnimationFrame(requestId); // 找到元素时取消未执行的动画帧
                        if (timeoutId) clearTimeout(timeoutId);
                        resolve(el);
                    } else if (!isResolved) {
                        requestId = requestAnimationFrame(check); // 保存新的动画帧 ID
                    }
                } catch (e) {
                    isResolved = true;
                    cancelAnimationFrame(requestId);
                    clearTimeout(timeoutId);
                    resolve(null);
                    return;
                }
            };
            check();
            timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    cancelAnimationFrame(requestId); // 超时后取消动画帧
                    resolve(null);
                }
            }, timeout);
        });
    }

    function whenElementExistOrNullByObserver(selector, node, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let disposed = false;
            let timer = null;
            const observer = new MutationObserver(() => {
                if (disposed) return;
                const el = typeof selector === 'function'
                    ? selector()
                    : (node || document).querySelector(selector);
                if (el) {
                    observer.disconnect();
                    clearTimeout(timer);
                    disposed = true;
                    resolve(el);
                }
            });
            observer.observe(node || document.body, {
                childList: true,
                subtree: true,
            });
            timer = setTimeout(() => {
                if (!disposed) {
                    observer.disconnect();
                    disposed = true;
                    resolve(null);
                }
            }, timeout);
            // 立即检查一次
            const initialEl = typeof selector === 'function' ? selector() : (node || document).querySelector(selector);
            if (initialEl) {
                observer.disconnect();
                clearTimeout(timer);
                disposed = true;
                return resolve(initialEl);
            }
        });
    }

    function addStyle(css) {
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    function insertCursorAfterElement(el) {
        const range = document.createRange();
        const selection = window.getSelection();

        range.setStartAfter(el);     // 设置 range 开始在元素之后
        range.collapse(true);        // 折叠为光标（不是选区）

        selection.removeAllRanges(); // 清除现有选区
        selection.addRange(range);   // 添加新的 range
    }

    function insertToEditor(text) {
        document.execCommand('insertHTML', false, text);
        const inputEvent = new Event('input', { bubbles: true });
        document.activeElement.dispatchEvent(inputEvent);
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

    async function getShareData(key) {
        return await whenElementExistOrNull(()=>shareData[key]);
    }

    function setShareData(key, value) {
        shareData[key] = value;
    }

    function render(element, html, append = false) {
        if (append) {
            element.innerHTML += html;
        } else {
            element.innerHTML = html;
        }
    }

    //////////////////// 监听custom-js 加载 /////////////////////////

    /**
     * 监听指定容器中 <span custom-js=""> 元素的创建，并执行其属性中的代码
     * @param {HTMLElement} target - 要监听的 DOM 容器（默认为 document.body）
     * @param {Function} [onExecute] - 自定义的代码执行回调函数（可选）
     */
    function observeJsSpan(target = document.body, onExecute = null) {
        // 创建 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                // 检查是否有新增的节点
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        // 确保节点是元素节点，并且符合 <span custom-js=""> 的条件
                        if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('data-node-id')) {
                            const spanElements = node.querySelectorAll('[custom-js], [data-type="inline-math"]');
                            if (spanElements.length > 0) {
                                spanElements.forEach((spanElement) => {
                                    // 获取 custom-code 属性
                                    let customCode = spanElement.getAttribute('custom-js');
                                    if (customCode) {
                                        if (typeof onExecute === 'function') {
                                            // 如果提供了自定义回调函数，则使用它执行代码
                                            let dataContent = spanElement?.dataset?.content;
                                            if(dataContent) {
                                                const code = isBase64(customCode)?base64Decode(customCode):customCode.replace(/'''/g, '"').replace(/_esc_newline_/ig, '\n');
                                                const content = isBase64(dataContent)?base64Decode(dataContent):Lute.UnEscapeHTMLStr(dataContent);
                                                if((isBase64(dataContent)?content:content.replace(/\\$/g, '$')) === code) dataContent = '';
                                                else dataContent = content;
                                            }
                                            const html = dataContent||'Loading...';
                                            spanElement.innerHTML = html === 'Loading' ? 'Loading...' : html;
                                            onExecute(customCode, spanElement);
                                        }
                                    }
                                    // 匹配意外情况（使用了base64编码后这种意外情况不会出现了）
                                    if (spanElement.matches('[data-type="inline-math"]') &&
                                        spanElement.nextSibling?.nodeType === Node.TEXT_NODE &&
                                        spanElement.nextSibling?.textContent?.includes('custom-js')) {
                                        const regex = /custom-js\s*=\s*(['"])(.*?)\1/i;
                                        const match = spanElement.nextSibling.textContent.match(regex);
                                        if (match) {
                                            let customCode = match[2] || '';
                                            if(spanElement) spanElement.innerHTML = 'Loading...';
                                            if(spanElement) onExecute(customCode, spanElement);
                                            const regex = /\{:\s*[^}]*?custom-js\s*=\s*(['"])(.*?)\1[^}]*?\}/g;
                                            spanElement.nextSibling.textContent = spanElement.nextSibling.textContent.replace(regex, '');
                                        }
                                    }
                                });
                            }
                        }
                        // 监听行内js直接添加
                        if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('custom-js')) {
                            if (typeof onExecute === 'function') {
                                // 如果提供了自定义回调函数，则使用它执行代码
                                let customCode = node.getAttribute('custom-js');
                                if (customCode) node.innerHTML = 'Loading...';
                                if (customCode) onExecute(customCode, node);
                            }
                        }
                        // katex被直接添加（修改时）
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('katex')) {
                            if (typeof onExecute === 'function') {
                                const element = node.closest('[custom-js]');
                                // 如果提供了自定义回调函数，则使用它执行代码
                                let customCode = element?.getAttribute('custom-js');
                                if (customCode) element.innerHTML = 'Loading...';
                                if (customCode) onExecute(customCode, element);
                            }
                        }
                    });
                }
            });
        });
        // 配置观察选项：监听子节点的添加和移除
        const config = { childList: true, subtree: true };
        // 开始观察目标容器
        observer.observe(target, config);
        // 返回一个方法，用于停止观察
        return () => observer.disconnect();
    }

    // 监控公式data-content数据变化
    function observeDataChange(element, callback) {
        if(element.observerDataChange) return;
        element.observerDataChange = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-content') {
                    element.observerDataChange.disconnect();
                    element.observerDataChange = null;
                    callback(element.getAttribute('data-content'));
                }
            }
        });
        element.observerDataChange.observe(element, {
            attributes: true // 观察属性变化
        });
    }

    // 暂未用到
    function observeDomChanges(element, callback) {
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' ||
                    (mutation.type === 'characterData' && mutation.target.nodeType !== Node.CDATA_SECTION_NODE)) {
                    observer.disconnect(); // 只监听一次（可选）
                    callback(Lute.UnEscapeHTMLStr(element.getAttribute('data-content')));
                    return;
                }
            }
        });
        observer.observe(element, {
            childList: true,         // 观察子节点的增删
            subtree: true,           // 深度观察所有后代节点
            characterData: true,     // 观察文本内容变化
            attributes: false        // 不需要观察属性变化
        });
        return observer; // 返回 observer 实例，方便外部手动 disconnect
    }

    ///////////////// 代码编辑框 ///////////////////////////

    // 监听行内js弹出框被打开
    function listenMathBoxShow(element) {
        observerProtyleUtil(async protyleUtil => {
            if (protyleUtil.querySelector('button[data-type="copy-tpl"]')) return;

            // 更新标题
            const resizeMove = protyleUtil.querySelector('.resize__move');
            resizeMove.textContent = resizeMove.textContent.replace(window.siyuan.languages["inline-math"], '行内JS')

            // 获取输入框内容
            const textarea = protyleUtil.querySelector('textarea');
            let code = element.getAttribute('custom-js');
            const isBase64Str = isBase64(code);
            if(isBase64Str) code = base64Decode(code);
            textarea.value = isBase64Str ? code : code.replace(/_esc_newline_/ig, '\n').replace(/'''/g, '"');
            textarea.select();
            textarea.style.width = codeEditorWidth || '480px';
            textarea.style.height = codeEditorHeight || '96px';

            // 拦截输入
            textarea.addEventListener('input', (event) => {
                event.preventDefault();
                event.stopPropagation();
                // 保存js数据
                element.setAttribute('custom-js', base64Encode(textarea.value));
                //element.setAttribute('custom-js', textarea.value.replace(/"/g, "'''"));
            }, true);

            // 拦截关闭
            // const close = protyleUtil.querySelector('[data-type="close"]');
            // close.addEventListener('click', (event)=>{
            //     event.preventDefault();
            //     event.stopPropagation();
            //     // your code
            // }, true);

            // 复制为模板按钮
            const refresh = protyleUtil.querySelector('[data-type="refresh"]');
            if (!refresh) return;
            // 创建 <span class="fn__space"></span> 元素
            const spanElement = document.createElement('span');
            spanElement.className = 'fn__space';
            // 创建 <button> 元素
            const buttonElement = document.createElement('button');
            buttonElement.dataset.type = 'copy-tpl';
            buttonElement.className = 'block__icon block__icon--show b3-tooltips b3-tooltips__nw';
            buttonElement.setAttribute('aria-label', '复制');
            const svg = `<svg><use xlink:href="#iconCopy"></use></svg>`;
            buttonElement.innerHTML = svg;
            buttonElement.onclick = () => {
                // 复制为模板
                const output = textarea.value.replace(/\n/g, '_esc_newline_').replace(/"/g, "'''");
                navigator.clipboard.writeText('$Loading${: custom-js="' + base64Encode(output) + '"}');
                buttonElement.innerHTML = '已复制';
                setTimeout(() => {
                    buttonElement.innerHTML = svg;
                }, 1500);
            };
            // 将 <span> 和 <button> 插入到 refresh 元素的后面
            await sleep(0);
            refresh.after(spanElement, buttonElement);

            // 帮助按钮
            const exportBtn = protyleUtil.querySelector('[data-type="export"]');
            const html = `<button data-type="help" class="block__icon block__icon--show b3-tooltips b3-tooltips__nw" aria-label="使用帮助"><svg><use xlink:href="#iconHelp"></use></svg></button>`;
            exportBtn.insertAdjacentHTML('beforebegin', html);
            exportBtn.remove();
            const helpBtn = protyleUtil.querySelector('[data-type="help"]');
            helpBtn.onclick = () => {
                window.open('https://ld246.com/article/1749806156975');
            };

            // 删除刷新按钮
            refresh.remove();
        });
    }

    // 等待元素出现
    function observerProtyleUtil(callback) {
        let hasEmit = false;
        // 1. 创建 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                // 2. 获取目标元素
                const targetElement = mutation.target;
                // 3. 检查目标元素是否是 .protyle .protyle-util
                if (targetElement.matches('.protyle .protyle-util')) {
                    // 4. 检查 .fn__none 类是否被删除
                    if (!targetElement.classList.contains('fn__none')) {
                        if (hasEmit) return;
                        hasEmit = true;
                        observer.disconnect();
                        callback(targetElement);
                        setTimeout(() => {
                            hasEmit = false;
                        }, 100);
                    }
                }
            });
        });
        // 5. 配置并启动监听
        observer.observe(document.body, {
            attributes: true, // 监听属性变化
            attributeFilter: ['class'], // 只监听 class 属性
            subtree: true,    // 监听所有后代元素
        });
    }

    ///////////////// 辅助功能 ///////////////////////////

    /**
     * 在 container 内记录当前光标位置：
     * - 返回一个对象 { path: number[], offset: number }
     * - path 是从 container 开始，到达光标所在节点的子节点索引数组
     */
    function saveCursorPos(container) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return null;
        const range = sel.getRangeAt(0);
        let node = range.startContainer;
        let offset = range.startOffset;

        // 如果光标在容器范围外，忽略
        if (!container.contains(node)) return null;

        // 构建从 container 到 node 的索引路径
        const path = [];
        while (node && node !== container) {
            const parent = node.parentNode;
            const idx = Array.prototype.indexOf.call(parent.childNodes, node);
            path.push(idx);
            node = parent;
        }
        path.reverse(); // 从 container 开始
        return { path, offset };
    }

    /**
     * 在 container 内按 path 找到节点，并把光标放到 offset
     */
    function restoreCursorPos(container, selInfo) {
        if (!selInfo) return;
        // 如果 container 自身都不在文档里，就没必要继续了
        if (!document.contains(container)) {
            return;
        }
        let node = container;
        // 按 path 向下遍历
        for (const idx of selInfo.path) {
            if (!node.childNodes[idx]) return;
            node = node.childNodes[idx];
        }
        // 此时 node 应该是我们想定位到的元素或文本节点
        // 再次确认它仍在文档里
        if (!document.contains(node)) {
            return;
        }
        const range = document.createRange();
        if (node.nodeType === Node.ELEMENT_NODE) {
            const childCount = node.childNodes.length;
            const off = Math.min(selInfo.offset, childCount);
            range.setStart(node, off);
        } else {
            const textLen = node.textContent.length;
            const off = Math.min(selInfo.offset, textLen);
            range.setStart(node, off);
        }
        range.collapse(true);
        // 最后一次检查：range.startContainer 必须在 container 里
        if (!container.contains(range.startContainer)) {
            return;
        }
        // 安全地添加选区
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        // 清理历史状态
        lastCursorPos = null;
    }
    // function restoreCursorPos(container, selInfo) {
    //     if (!selInfo) return;
    //     let node = container;
    //     // 按 path 向下遍历
    //     for (const idx of selInfo.path) {
    //         if (!node.childNodes[idx]) return;
    //         node = node.childNodes[idx];
    //     }
    //     // node 现在是原来保存的 startContainer 对应的新节点
    //     const range = document.createRange();
    //     // 如果是元素节点，offset 表示 childNodes 的位置
    //     if (node.nodeType === Node.ELEMENT_NODE) {
    //         const childCount = node.childNodes.length;
    //         const off = Math.min(selInfo.offset, childCount);
    //         range.setStart(node, off);
    //     } else {
    //         // 文本节点
    //         const texLen = node.textContent.length;
    //         const off = Math.min(selInfo.offset, texLen);
    //         range.setStart(node, off);
    //     }
    //     range.collapse(true);
    //     try {
    //         if (container.contains(range.startContainer)) {
    //             const sel = window.getSelection();
    //             sel.removeAllRanges();
    //             sel.addRange(range);
    //         }
    //     } catch (e) { }
    //     lastCursorPos = null;
    // }

    /**
     * 保存当前光标的屏幕坐标（暂无用到）
     * @returns {{x:number,y:number}|null}
     */
    // function saveCursorPos() {
    //   const sel = window.getSelection();
    //   if (!sel.rangeCount) return null;
    //   const range = sel.getRangeAt(0).cloneRange();
    //   range.collapse(true);
    //   const rects = range.getClientRects();
    //   // 如果光标位于空行或末尾，getClientRects 可能空，fallback 到 container
    //   const rect = rects[0] || range.startContainer.parentElement.getBoundingClientRect();
    //   return { x: rect.left + 1, y: rect.top + 1 };
    // }

    /**
     * 恢复光标到指定屏幕坐标（暂无用到）
     * @param {{x:number,y:number}} pos
     */
    // function restoreCursorPos(pos) {
    //   if (!pos) return;
    //   // 旧版 WebKit/Chrome：
    //   let range;
    //   if (document.caretRangeFromPoint) {
    //     range = document.caretRangeFromPoint(pos.x, pos.y);
    //   }
    //   // 标准 draft API（Firefox、现代 Chrome）：
    //   else if (document.caretPositionFromPoint) {
    //     const posInfo = document.caretPositionFromPoint(pos.x, pos.y);
    //     range = document.createRange();
    //     range.setStart(posInfo.offsetNode, posInfo.offset);
    //   }
    //   if (!range) return;
    //   range.collapse(true);
    //   const sel = window.getSelection();
    //   sel.removeAllRanges();
    //   sel.addRange(range);
    //   lastCursorPos = null;
    // }

    // 记录最后输入的光标位置
    let hasPasted = false;
    const recordLastCursorPos = async (event, char) => {
        const node = getCursorElement()?.closest('.protyle-wysiwyg [data-node-id]');
        if (node) {
            lastCursorPos = saveCursorPos(node);
            //deleteContentBackward deleteContentForward
            if(!char && event.inputType && event.inputType.startsWith('deleteContent')) {
                char = 'delete';
            }
            if(hasPasted && char === 'paste') return;
            hasPasted = true;
            setTimeout(() => { hasPasted = false; }, 100);
            lastInputChar = char || event.data;
        }
    };
    document.addEventListener('input', recordLastCursorPos, true);
    document.addEventListener('cut', (event)=>recordLastCursorPos(event, 'cut'), true);
    document.addEventListener('paste', (event)=>recordLastCursorPos(event, 'paste'), true);

    // 监控斜杠菜单被打开
    let lastFilterText = '';
    document.addEventListener('input', async (event) => {
        const cursorEl = getCursorElement();
        const cursorText = cursorEl?.textContent;
        if (cursorText.indexOf('/') !== -1 || cursorText.indexOf('、') !== -1) {
            const sp = cursorText.indexOf('/') !== -1 ? '/' : '、';
            const filterText = cursorText?.split(sp)?.pop()?.trim()?.toLowerCase() || '';
            if (filterText === '' || lastFilterText !== filterText) {
                lastFilterText = filterText;
                const filterTexts = '行内js 行级js inline-js hangneijs hangjijs';
                if (!filterText.toLowerCase().trim()||filterText.toLowerCase().split('').some(char=>filterTexts.includes(char))) {
                    const protyle = cursorEl.closest('.protyle');
                    const hintEl = protyle.querySelector('.protyle-hint');
                    const icon = `<svg class="b3-list-item__graphic" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M238.592 155.648H399.36v450.56C399.36 809.984 302.08 880.64 146.432 880.64c-37.888 0-87.04-6.144-118.784-17.408l18.432-130.048c22.528 7.168 51.2 12.288 82.944 12.288 67.584 0 110.592-30.72 110.592-141.312V155.648h-1.024z m301.056 547.84c41.984 22.528 110.592 44.032 179.2 44.032 73.728 0 113.664-30.72 113.664-78.848 0-43.008-33.792-69.632-119.808-99.328-118.784-40.96-197.632-107.52-197.632-211.968C515.072 235.52 617.472 143.36 785.408 143.36c81.92 0 139.264 16.384 182.272 35.84L931.84 308.224c-27.648-13.312-79.872-33.792-148.48-33.792-69.632 0-103.424 32.768-103.424 68.608 0 45.056 38.912 65.536 132.096 101.376 125.952 46.08 184.32 112.64 184.32 214.016 0 119.808-91.136 221.184-286.72 221.184-81.92 0-161.792-22.528-201.728-44.032l31.744-132.096z"></path></svg>`;
                    const html = `<button data-id="inlineJS" style="width: calc(100% - 16px)" class="b3-list-item b3-list-item--two" data-value="plugin"><div class="b3-list-item__first">${icon}<span class="b3-list-item__text">行级JS</span></div></button>`;
                    await sleep(40);
                    const hintListEl = hintEl?.firstElementChild;
                    if (!hintListEl) return;
                    if (hintEl.classList.contains('fn__none')) {
                        hintListEl.innerHTML = html;
                        hintListEl.querySelector('[data-id="inlineJS"]').classList.add('b3-list-item--focus');
                        hintEl.classList.remove('fn__none');
                    } else {
                        if (hintListEl.querySelector('[data-id="inlineJS"]')) return;
                        hintListEl.insertAdjacentHTML('beforeend', html);
                    }
                    const inlineJsEl = hintListEl.querySelector('[data-id="inlineJS"]');
                    inlineJsEl.addEventListener('click', async () => {
                        window.requestAnimationFrame(async () => {
                            insertToEditor(`$Loading\${: custom-js="${base64Encode(`return 'Hello Inline JS';`)}"}`);
                            const newJsEl = event.target.closest('.protyle').querySelector('.protyle-content [custom-js][data-content="Loading"]');
                            await sleep(50);
                            newJsEl.focus();
                            insertCursorAfterElement(newJsEl);
                            if (showEditorBoxWhenInsert) newJsEl.click();
                        });
                    }, true);
                }
            }
        }
    }, true);

    // 当从模板导入回车后或斜杠菜单选项被按下时更新光标位置
    document.addEventListener('keydown', async (event) => {
        if (event.key !== 'Enter' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        // 监控斜杠菜单插入修改光标位置
        if (event.target.closest('.protyle')?.querySelector('.protyle-hint:not(.fn__none) .b3-list-item--focus[data-id="inlineJS"]')) {
            window.requestAnimationFrame(async () => {
                insertToEditor(`$Loading\${: custom-js="${base64Encode(`return 'Hello Inline JS';`)}"}`);
                const newJsEl = event.target.closest('.protyle').querySelector('.protyle-content [custom-js][data-content="Loading"]');
                await sleep(50);
                newJsEl.focus();
                insertCursorAfterElement(newJsEl);
                if (showEditorBoxWhenInsert) newJsEl.click();
            });
        }
        // 监控模板导入，修改光标位置
        if(event.target.closest('.protyle-util')?.querySelector('[data-value*="templates'+(isWindows()?'\\\\':'/')+'"]')) {
            const newJsEl = await whenElementExistOrNullByObserver(()=>
                    event.target.closest('.protyle').querySelector('.protyle-content [custom-js][data-content="Loading"]') ||
                    [...event.target.closest('.protyle').querySelectorAll('.protyle-content [custom-js]')].find(item=>item.textContent==='Loading')
                );
            if(newJsEl) {
                await whenElementExistOrNullByObserver(()=>newJsEl.textContent&&newJsEl.textContent!=='Loading');
                window.requestAnimationFrame(()=>{
                    newJsEl.focus();
                    insertCursorAfterElement(newJsEl);
                });
            }
        }
    }, true);

    // 从模板导入被点击时更新光标位置
    document.addEventListener('click', async (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        // 监控模板导入，修改光标位置
        if(event.target.closest('.protyle-util')?.querySelector('[data-value*="templates'+(isWindows()?'\\\\':'/')+'"]')) {
            const newJsEl = await whenElementExistOrNullByObserver(()=>
                    event.target.closest('.protyle').querySelector('.protyle-content [custom-js][data-content="Loading"]') ||
                    [...event.target.closest('.protyle').querySelectorAll('.protyle-content [custom-js]')].find(item=>item.textContent==='Loading')
                );
            if(newJsEl) {
                await whenElementExistOrNullByObserver(()=>newJsEl.textContent&&newJsEl.textContent!=='Loading');
                window.requestAnimationFrame(()=>{
                    newJsEl.focus();
                    insertCursorAfterElement(newJsEl);
                });
            }
        }
    }, true);

    // 解决delete删除bug
    document.addEventListener('keydown',(e)=>{
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        if (e.key !== 'Delete' || !e.target.closest('.protyle-wysiwyg')) return;
        const currNode = getCursorElement();
        if(currNode && currNode.firstChild === currNode.lastChild && currNode.firstChild?.nodeType === Node.ELEMENT_NODE && currNode.firstChild?.matches('[custom-js]')){
            e.preventDefault();
            e.stopPropagation();
            currNode.firstChild.remove();
        }
    },true);

    function base64Encode(str) {
        if(isBase64(str)) return str; // 防止重复编码
        if(typeof str !== 'string') str += '';
        return 'Base64Text:'+btoa(unescape(encodeURIComponent(str)));
    }
    function base64Decode(str) {
        if(typeof str !== 'string') str += '';
        str = str.replace(/^Base64Text:/, '');
        return decodeURIComponent(escape(atob(str)));
    }
    function isBase64(str) {
        if(typeof str !== 'string') str += '';
        return (str+'').startsWith('Base64Text:');
    }
})();