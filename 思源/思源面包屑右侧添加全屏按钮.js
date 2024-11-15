// see https://ld246.com/article/1731683038390
(() => {
    const fullscreenSvg = `<svg><use xlink:href="#iconFullscreen"></use></svg>`;
    const exitFullscreenSvg = `<svg><use xlink:href="#iconFullscreenExit"></use></svg>`;
    const main = (breadcrumb) => {
        const exitFocus = breadcrumb.querySelector('button[data-type="exit-focus"]');
        if(!exitFocus) return;
        const protyle = exitFocus.closest('.protyle');
        if(!protyle) return;
        // 创建全屏按钮元素
        const fullScreenBtn = document.createElement('button');
        fullScreenBtn.className = 'block__icon fn__flex-center ariaLabel';
        fullScreenBtn.setAttribute('aria-label', '全屏');
        fullScreenBtn.dataset.type = 'full-screen';
        fullScreenBtn.innerHTML = fullscreenSvg;
        fullScreenBtn.onclick = () => {
            if(!window.siyuan.editorIsFullscreen) {
                // 全屏
                protyle.classList.add("fullscreen");
                window.siyuan.editorIsFullscreen = true;
            } else {
                // 退出全屏
                protyle.classList.remove("fullscreen");
                window.siyuan.editorIsFullscreen = false;
            }
        };
        // 获取 exitFocus 的父节点
        const parent = exitFocus.parentNode;
        // 将新按钮插入到 exitFocus 的后面
        parent.insertBefore(fullScreenBtn, exitFocus.nextSibling);

        // 监听其他元素全屏事件
        observeClassAddition(protyle, 'fullscreen', (eventType) => {
            if(eventType === 'fullscreen'){
                fullScreenBtn.innerHTML = exitFullscreenSvg;
                fullScreenBtn.setAttribute('aria-label', '退出全屏');
            } else {
                fullScreenBtn.innerHTML = fullscreenSvg;
                fullScreenBtn.setAttribute('aria-label', '全屏');
            }
        });
    };
    whenElementExist('.protyle-breadcrumb').then(main);
    observeElementAddition('.protyle-breadcrumb', main);
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
    function observeClassAddition(element, className, callback) {
        if (!element) {
            console.error(`Element not found.`);
            return;
        }
        // 创建一个观察者实例
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // 检查类名是否包含指定的类名
                    if (element.classList.contains(className)) {
                        // 发生全屏事件
                        callback('fullscreen', element);
                    } else {
                        // 退出全屏事件
                        callback('exit-fullscreen', element);
                    }
                }
            }
        });
        // 配置观察选项:
        const config = { attributes: true, attributeFilter: ['class'] };
        // 开始观察
        observer.observe(element, config);
        // 返回一个停止观察的方法
        return () => observer.disconnect();
    }
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let element = null;
                if (typeof selector === 'function') {
                    element = selector();
                } else {
                    element = document.querySelector(selector);
                }
                if (element) {
                    resolve(element);
                } else {
                    requestAnimationFrame(checkForElement);
                }
            };
            checkForElement();
        });
    }
})();