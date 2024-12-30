// 主窗口添加钉住按钮
// see https://ld246.com/article/1735520004727
(()=>{
    // 添加pin时机, fullscreen 全屏时，loading 加载时，默认fullscreen
    const addPinEvent = 'fullscreen';

    // 删除pin时机，exitFullscreen 退出全屏时，never 不删除，默认exitFullscreen
    const delPinEvent = 'exitFullscreen';
    
    // 不支持手机版
    if(isMobile()) return;
    // 主函数
    const main = (breadcrumb) => {
        addPinButton(breadcrumb);
    };
    // 加载时查找（兼容分屏模式）
    whenElementsExist('.protyle-breadcrumb').then((elements) => {
        elements.forEach((breadcrumb) => {
            main(breadcrumb);
        });
    });
    // 打开/切换文档时监听
    observeElementAddition('.protyle-breadcrumb', main);

    // 监听全屏状态
    window.siyuan._editorIsFullscreen = window.siyuan.editorIsFullscreen || false;
    Object.defineProperty(window.siyuan, 'editorIsFullscreen', {
        get: function() {
            return this._editorIsFullscreen;
        },
        set: async function(value) {
            const oldValue = this._editorIsFullscreen;
            this._editorIsFullscreen = value;
            // value true是全屏，false是退出全屏
            // console.log(`editorIsFullscreen changed from ${oldValue} to ${value}`);
            if(addPinEvent === 'fullscreen' && value === true) {
                showPin(await getCurrBreadcrumb());
            } else if(delPinEvent === 'exitFullscreen' && value === false){
                showPin(await getCurrBreadcrumb(), false);
            }
        },
        configurable: true,
        enumerable: true
    });

    // 显示隐藏pin
    async function showPin(breadcrumb, show = true) {
        let pinElement = breadcrumb.querySelector('button[data-type="pin"]');
        if(!pinElement) pinElement = await whenElementsExist(() => breadcrumb.querySelector('button[data-type="pin"]'));
        if(show && pinElement.classList.contains('fn__none')) {
            pinElement.classList.remove('fn__none');
        } else if(!show && !pinElement.classList.contains('fn__none')) {
            pinElement.classList.add('fn__none');
        }
    }

    // 添加pin
    // see https://github.com/siyuan-note/siyuan/blob/914c7659388e645395e70224f0d831950275eb05/app/src/boot/onGetConfig.ts#L359
    function addPinButton(breadcrumb) {
        if(breadcrumb.querySelector('button[data-type="pin"]')) return;
        const fnNone = addPinEvent === 'fullscreen' ? 'fn__none' : '';
        breadcrumb.insertAdjacentHTML("beforeend", `<button class="block__icon fn__flex-center ariaLabel ${fnNone}" data-type="pin" aria-label="${window.siyuan.languages.pin}"><svg><use xlink:href="#iconPin"></use></svg></button>`);
        const pinElement = breadcrumb.querySelector('button[data-type="pin"]');
        pinElement.addEventListener("click", () => {
            if (pinElement.getAttribute("aria-label") === window.siyuan.languages.pin) {
                pinElement.querySelector("use").setAttribute("xlink:href", "#iconUnpin");
                pinElement.setAttribute("aria-label", window.siyuan.languages.unpin);
                require('electron').ipcRenderer.send("siyuan-cmd", "setAlwaysOnTopTrue");
            } else {
                pinElement.querySelector("use").setAttribute("xlink:href", "#iconPin");
                pinElement.setAttribute("aria-label", window.siyuan.languages.pin);
                require('electron').ipcRenderer.send("siyuan-cmd", "setAlwaysOnTopFalse");
            }
        });
    }

    async function getCurrBreadcrumb() {
        let protyle = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)');
        if(!protyle) {
            protyle = await whenElementsExist(() => document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)'));
        }
        return protyle.querySelector('.protyle-breadcrumb');
    }
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    function isNewWindow() {
        return document.getElementById("toolbar") ? false : true;
    }
     // 监听元素被添加
    function observeElementAddition(selector, callback) {
        // 创建一个观察者实例
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if(node.matches && node.matches(selector)) {
                                callback(node);
                            }
                        }
                    }
                }
            }
        });
        // 配置观察选项:
        const config = { attributes: false, childList: true, subtree: true };
        // 目标节点是需要观察的父节点，这里选择body作为最广泛的观察范围
        const targetNode = document.body;
        // 开始观察
        observer.observe(targetNode, config);
        // 返回一个停止观察的方法
        return () => observer.disconnect();
    }
    // 等待元素渲染完成
    function whenElementsExist(selector) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let elements = null;
                if (typeof selector === 'function') {
                    elements = selector();
                } else {
                    elements = document.querySelectorAll(selector);
                }
                if (elements && elements.length > 0) {
                    resolve(elements);
                } else {
                    requestAnimationFrame(checkForElement);
                }
            };
            checkForElement();
        });
    }
})();