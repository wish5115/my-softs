// 功能：折叠大纲默认仅显示一级目录，自动在大纲处定位光标处的标题
// see https://ld246.com/article/1729605574188
// version 0.0.4
// 更新记录
// 0.0.4 增加滚动定位功能
// 0.0.3 改进文档打开时，自动根据上次光标的位置定位光标所在的标题
// 0.0.2 改进大纲在鼠标离开时始终定位光标所在的标题
(async ()=>{
    whenElementExist('.sy__outline > .fn__flex-1').then(async el => {
        //let clicking = false;
        // 监听大纲标题被添加
        observeChildAddition(el, node => {
            return node.tagName.toLowerCase() === 'ul' &&
                        node.classList.contains('b3-list') && 
                        node.querySelector('.b3-list-item')
        }, uls => {
            // 获取大纲列表
            const ul = uls[0];
            // 遍历大纲第一级子元素
            Array.from(ul.children).forEach(item => {
                // 初始时，仅打开第一级
                if(item.tagName === 'LI') {
                    const toggleBtn = item.querySelector('.b3-list-item__toggle');
                    const svg = toggleBtn?.querySelector('svg.b3-list-item__arrow');
                    if(!svg.classList.contains('b3-list-item__arrow--open')) {
                        svg.classList.add('b3-list-item__arrow--open');
                    }
                }
                if(item.tagName === 'UL') {
                    if(item.classList.contains('fn__none')) {
                        item.remove('fn__none');
                    }
                    // 初始时，隐藏第一级下面的后代元素
                    itemsShow(item, false);
                }
                // 初始时定位光标处的标题
                openCursorHeading();
                // 监听大纲鼠标移入事件
                const ul = item.tagName === 'LI' ? item.nextElementSibling : item;
                item.addEventListener('mouseenter', (event) => {
                    if(!ul || ul?.tagName !== 'UL') return;
                    // 鼠标移入显示第一级后面的后代元素
                    itemsShow(ul, true);
                })
                // 监听大纲鼠标移出事件
                item.addEventListener('mouseleave', (event) => {
                    //if(clicking) {
                        //clicking = false;
                        //return;
                    //}
                    if(!ul || ul?.tagName !== 'UL') return;
                    // 鼠标移出隐藏第一级后面的后代元素
                    itemsShow(ul, false);

                    // 始终定位光标处的标题
                    openCursorHeading();
                });
                // 监听大纲点击事件
                // item.addEventListener('click', (event) => {
                //     clicking = true;
                // });
            });

            // 滚动时执行
            let ticking = false;
            const protyleContent = getProtyle()?.querySelector('.protyle-content');
            const wysiwyg = protyleContent.querySelector('.protyle-wysiwyg');
            if(!protyleContent.scrollEventOutline) {
                protyleContent.scrollEventOutline = true;
                protyleContent?.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                      openCursorHeading('scroll', wysiwyg);
                      ticking = false;
                    });
                    ticking = true;
                  }
                });
            }
            
            // 加载或切换大纲时执行
            openCursorHeading('load', wysiwyg);
        });

        // 添加光标被移动位置事件
        document.addEventListener("selectionchange", () => {
            // 关闭其他大纲展开
            Array.from(el.firstElementChild.children).forEach(item => {
                itemsShow(item, false);
            });

            // 展开光标处的标题
            openCursorHeading();
        }, false);
    });
    function getTopestHead(by = 'scroll', parentNode) {
        return [...(parentNode || document).querySelectorAll('.h1,.h2,.h3,.h4,.h5,.h6')].find(h=>{
            const top=h.getBoundingClientRect().top;
            return by === 'scroll' ? top > 80 && top<160 : top > 80;
        });
    }
    function isInHeading() {
        const el = getCursorElement();
        let heading = el?.closest('[data-type="NodeHeading"]');
        if(heading) {
            return heading;
        }
        const Sibling = el?.closest('[data-node-index]');
        heading = findPreviousNodeHeading(Sibling);
        return heading;
    }
    function findPreviousNodeHeading(el) {
        // 从当前元素开始向前查找兄弟节点
        let sibling = el?.previousElementSibling;
  
        while (sibling) {
            // 检查是否具有 data-type="NodeHeading" 的属性
            if (sibling.getAttribute('data-type') === 'NodeHeading') {
                return sibling; // 找到了，返回这个节点
            }
            // 继续向前查找
            sibling = sibling.previousElementSibling;
        }
  
        // 如果没有找到符合条件的兄弟节点，返回null
        return null;
    }
    function openCursorHeading(by='cursor', parentNode) {
        //获取是否在heading中
        const heading = by === 'cursor' ? isInHeading() : getTopestHead(by, parentNode);
        if(!heading) return;
        // 展开光标处的标题
        headingNodeId = heading.dataset.nodeId;
        node = document.querySelector('.sy__outline [data-node-id="'+headingNodeId+'"]');
        if(node && ['scroll', 'load'].includes(by)) {
            // 滚动时，设置大纲选中状态
            document.querySelector('.sy__outline li.b3-list-item.b3-list-item--focus')?.classList?.remove('b3-list-item--focus');
            node?.classList?.add('b3-list-item--focus');
            node?.scrollIntoView({block: 'center'});
        }
        // 遍历节点的祖先节点
        while (node && !node.classList.contains('b3-list')) {
            if (node.tagName === 'UL' && node.classList.contains('fn__none')) {
                // 展开箭头
                const li = node.previousElementSibling;
                if(li){
                    const arrowSvg = li.querySelector('.b3-list-item__toggle svg.b3-list-item__arrow:not(.b3-list-item__arrow--open)');
                    if(arrowSvg) arrowSvg.classList.add('b3-list-item__arrow--open');
                }
                // 移除.fn__none类
                node.classList.remove('fn__none');
            }
            // 向上查找父节点
            node = node.parentElement;
        }
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
    // 动态显示隐藏子标题
    function itemsShow(ul, isOpen) {
        if(isOpen){
           const svgs = ul.querySelectorAll('span.b3-list-item__toggle svg:not(.b3-list-item__arrow--open)');
            svgs.forEach(item => {
                item.classList.add('b3-list-item__arrow--open');
            });
            const uls = ul.querySelectorAll('ul.fn__none');
            uls.forEach(item => {
                item.classList.remove('fn__none');
            });
        } else {
            const svgs = ul.querySelectorAll('span.b3-list-item__toggle svg.b3-list-item__arrow--open');
            svgs.forEach(item => {
                item.classList.remove('b3-list-item__arrow--open');
            });
            const uls = ul.querySelectorAll('ul:not(.fn__none)');
            uls.forEach(item => {
                item.classList.add('fn__none');
            });
        }
    }
    function observeChildAddition(el, filter, handler) {
        // 配置观察器选项
        const config = { attributes: false, childList: true, subtree: false };
        // 定义回调函数
        const callback = function(mutationsList, observer) {
            // 遍历 mutation 列表
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 查找新增加的具有类名 'b3-list' 的 ul 元素
                    const newULs = Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE && filter(node));
                    // 如果有新的 ul 元素被添加，则调用处理函数
                    if(newULs.length > 0) {
                        handler(newULs);
                    }
                }
            }
        };
        // 创建一个新的 MutationObserver 实例
        const observer = new MutationObserver(callback);
        // 开始观察目标节点
        observer.observe(el, config);
        // 返回一个函数来停止观察
        return () => {
            observer.disconnect();
        };
    }
    // 等待元素渲染完成后执行
    function whenElementExist(selector, bySetTimeout = false, delay = 40) {
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
                    if (bySetTimeout) {
                        setTimeout(checkForElement, delay);
                    } else {
                        requestAnimationFrame(checkForElement);
                    }
                }
            };
            checkForElement();
        });
    }

    function getProtyle() {
        return document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
            .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
    }
})();