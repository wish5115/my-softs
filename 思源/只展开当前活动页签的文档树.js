// 只展开当前活动页签的文档树
// see https://ld246.com/article/1717306355600
(()=>{
    // 加载时是否自动定位当前文档
    const autoFocusTreeOnload = true;

    // 最终焦点落在文档树还是文档上？ tree文档树，doc文档
    const lastFoucsIn = 'doc';
    
    // 等待标签页容器渲染完成后开始监听
    whenElementExist('.layout__center').then(async element => {
        // 等待笔记列表加载完毕
        await sleep(40);
        // 监听页签切换事件
        observeTabChanged(element, (tab) => {
            // 折叠所有笔记，然后定位当前笔记
            collapseAllBooksThenFocusCurrentBook(element, tab);
        });
        // 加载时定位当前文档
        if(autoFocusTreeOnload) {
            await sleep(1000);
            focusCurrentDocInTrees();
        }
    });
    // 折叠所有笔记，然后定位当前笔记
    async function collapseAllBooksThenFocusCurrentBook(element, tab) {
        let currNodeId = "";
        // 等待激活文档加载完毕
        await whenElementExist(()=>{
            const content = element.querySelector('.layout-tab-container [data-id="'+tab.getAttribute("data-id")+'"]');
            // 获取当前文档的node-id
            currNodeId = document.querySelector('.layout-tab-container [data-id="'+tab.getAttribute("data-id")+'"] .protyle-title')?.getAttribute("data-node-id") || "";
            return content && content.getAttribute("data-loading") === "finished" && currNodeId;
        });
        // 获取当前文档所在的路径和当前笔记，并折叠当前文档以外的目录
        let currBoxDataUrl = "";
        if(currNodeId){
            // 定位当前文档
            focusCurrentDocInTrees();
            // 等待定位完成
            let currTreeItem = null;
            await whenElementExist(()=>{
                currTreeItem = document.querySelector("ul.b3-list[data-url] li[data-node-id='" + currNodeId + "']");
                return currTreeItem;
            });
            // 获取当前文档在目录树中的node-id
            if(currTreeItem) {
                // 获取当前笔记的data-url
                currBoxDataUrl = currTreeItem.closest('ul.b3-list[data-url]')?.getAttribute("data-url") || "";
                if(currBoxDataUrl){
                    // 获取当前文档所在的路径
                    currTreeItemPath = currTreeItem.getAttribute("data-path");
                    // 获取所有展开的目录
                    const trees = document.querySelectorAll("ul.b3-list[data-url='" + currBoxDataUrl + "'] span.b3-list-item__toggle svg.b3-list-item__arrow--open");
                    trees.forEach(arrowBtn => {
                        // 如果是当前文档的上级目录则跳过
                        const itemPath = arrowBtn.closest('li.b3-list-item')?.getAttribute("data-path")?.replace(/\.sy$/i, '');
                        if(currTreeItemPath.startsWith(itemPath)){
                            return;
                        }
                        // 其他目录则折叠
                        if (arrowBtn.parentElement) {
                            arrowBtn.parentElement.click();
                        }
                    });
                }
            }
        }
        // 折叠除当前笔记外的所有笔记
        document.querySelectorAll("ul.b3-list[data-url]").forEach(async book => {
            // 如果是当前笔记则跳过
            if(book.getAttribute("data-url") === currBoxDataUrl) {
                return;
            }
            // 折叠笔记
            const bookArrowBtn = book.querySelector('li[data-type="navigation-root"] span.b3-list-item__toggle');
            if (bookArrowBtn && bookArrowBtn.firstElementChild.classList.contains("b3-list-item__arrow--open")) {
                bookArrowBtn.click();
            }
        });
    }
    // 在目录树中定位当前文档
    async function focusCurrentDocInTrees() {
        // 等待大纲切换完毕，最终焦点在文档树
        if(lastFoucsIn === 'tree') await sleep(120);
        // 定位当前文档
        document.querySelector(".layout-tab-container .block__icons span[data-type=focus]")?.click();
        // 等待定位完成
        await whenElementExist(()=>{
            return document.querySelector('ul.b3-list[data-url] li[data-type="navigation-file"].b3-list-item--focus');
        });
        // 处理官方定位，在未打开目录树时，左侧dock区目录树显示隐藏按钮样式会获取焦点的bug
        await sleep(40);
        const dockFileTreeBtn = document.querySelector('#dockLeft span[data-type="file"]');
        if(document.querySelector('#layouts .layout__dockl')?.style?.width === "0px"){
            if(dockFileTreeBtn.classList.contains("dock__item--active")) {
                dockFileTreeBtn.classList.remove("dock__item--active");
            }
            if(dockFileTreeBtn.classList.contains("dock__item--activefocus")) {
                dockFileTreeBtn.classList.remove("dock__item--activefocus");
            }
        }

        // 文档树模拟点击后恢复文档窗口（编辑器）的焦点(最终焦点在文档)
        if(lastFoucsIn === 'doc') {
            whenElementExist('.layout__tab--active .b3-list--background .b3-list-item--focus').then(() => {
                const activepPotyle = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)');
                if(activepPotyle) activepPotyle.click();
            });
        }
    }
    // 监听页签切换事件
    function observeTabChanged(parentNode, callback) {
        // 创建一个回调函数来处理观察到的变化
        const observerCallback = function(mutationsList, observer) {
            // 用常规方式遍历 mutationsList 中的每一个 mutation
            for (let mutation of mutationsList) {
                // 属性被修改
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target;
                    if (element.tagName.toLowerCase() === 'li' && element.getAttribute('data-type') === 'tab-header' && element.classList.contains('item--focus')) {
                        if(typeof callback === 'function') callback(element);
                    }
                }
                // 如果有新的子节点被添加
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'li') {
                            if (node.getAttribute('data-type') === 'tab-header' && node.classList.contains('item--focus')) {
                                if(typeof callback === 'function') callback(node);
                            }
                        }
                    });
                }
            }
        };
        // 创建一个观察器实例并传入回调函数
        const observer = new MutationObserver(observerCallback);
        // 配置观察器：传递一个对象来指定观察器的行为
        const config = { attributes: true, attributeFilter: ['class'], childList: true, subtree: true };
        // 开始观察目标节点
        observer.observe(parentNode, config);
        // 返回一个函数，用于停止观察
        return function stopObserving() {
            observer.disconnect();
        };
    }
    // 延迟执行
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // 等待元素渲染完成后执行
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
