// 顶栏标签融合（支持自定义tab高度和右侧工具栏自滚动显示）
// version 1.1
// modify by wilsons
// see https://gitee.com/wish163/mysoft/blob/main/%E6%80%9D%E6%BA%90/%E9%A1%B6%E6%A0%8F%E6%A0%87%E7%AD%BE%E8%9E%8D%E5%90%88.js
// 改自: https://ld246.com/article/1754884947760 感谢 @HugZephyr 大佬的代码
(() => {
    // tab高度，默认38，如果你没自定义过高度一般不用改
    const tabHeight = 38;

    // 顶部右侧工具栏宽度，请根据自己需要调整，0则思源默认，不调整宽度
    const rightToolBarWidth = 200;

    // 当顶部右侧工具栏限制宽度时，哪些工具不显示在限定宽度内，这里填的是工具元素的id，请使用devtools查看
    const rightToolBarExcludes = ['barPlugins', 'barCommand', 'barSearch', 'barMode'];

    // 样式微调，当你的页面出现上下位置小幅度错位等情况时可以在这里微调样式
    const styles = `
        /* 你的自定义样式 */
        
    `;

    // 钳位函数，将一个数值限制在指定的最小值和最大值之间
    Math.clamp || (Math.clamp = function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    });
    
    // 功能: 监听直到元素存在
    // 找到 selector 时，执行 func_cb，监听超时时间默认为 4s
    // selector: string | #id | function
    function whenExist(selector, func_cb, time_out = 4000) {
        console.log("whenExist begin", selector);

        return new Promise((resolve) => {
            const startTime = Date.now(); // 记录开始时间

            const checkForElement = () => {
                let element = null;

                // 根据selector类型进行查找
                if (typeof selector === 'string') {
                    if (selector.startsWith('#')) {
                        element = document.getElementById(selector.slice(1));
                    } else {
                        element = document.querySelector(selector);
                    }
                } else if (typeof selector === 'function') {
                    element = selector();
                } else {
                    // 若 selector 不合法，直接退出
                    console.error("Invalid selector type");
                    resolve(false);
                    return;
                }

                if (element) {
                    // 元素存在时，执行回调并解析Promise
                    if (func_cb) func_cb(element);
                    resolve(true);
                } else if (Date.now() - startTime >= time_out) {
                    // 超时处理
                    console.log(selector, "whenExist timeout");
                    resolve(false);
                } else {
                    // 元素不存在且未超时，继续检查
                    requestAnimationFrame(checkForElement);
                }
            };

            // 开始检查元素是否存在
            checkForElement();
        });
    }

    let styleElement = null;

    function set_css_style() {
        if (styleElement) {
            styleElement.remove();
            styleElement = null;
        }
        //const tabHeight = document.querySelector('.layout-tab-bar [data-type="tab-header"]')?.offsetHeight || 38;
        styleElement = document.createElement('style');
        styleElement.id = 'HZ-FusionOn';
        styleElement.textContent = `
            #toolbar.toolbar.fn__flex {
                // 工具栏背景色
                // background-color: transparent;
                // 工具栏底部分割线颜色
                // border-bottom-color: transparent;
                margin-bottom: -${tabHeight}px;
                pointer-events: none;
                z-index: 5;
                -webkit-app-region: drag;
                app-region: drag;
                height: ${tabHeight+4}px;
            }
            #toolbar .toolbar__item {
                pointer-events: auto;
                -webkit-app-region: no-drag;
                app-region: no-drag;
            }
            #drag {
                opacity: 0;
            }
            :root {
                --HZ-FusionOn-Top-Transform: translateY(-8px);
                --HZ-FusionOn-Not-Top-Transform: translateY(-2.5px);
            }
            .layout__center :is(.fn__flex-1, .fn__flex, .fn__flex-column) [data-type="wnd"].HZFusionTop > .fn__flex:first-child {
                transform: var(--HZ-FusionOn-Top-Transform);
                z-index: 6;
            }
            .layout__center {
                padding-top: 3.75px;
                box-sizing: border-box;
                &#layouts {
                    padding-top: 3.75px;
                }
            }
            .layout__center [data-type="wnd"] > .fn__flex:first-child > .layout-tab-bar {
                background-color: transparent;
                border-bottom: unset;
            }
            .layout__center [data-type="wnd"] > .fn__flex:first-child > .layout-tab-bar [data-type="tab-header"] {
                -webkit-app-region: no-drag;
                app-region: no-drag;
            }
            .layout__center [data-type="wnd"] > .fn__flex:first-child > .layout-tab-bar.layout-tab-bar--readonly {
                max-width: 80px;
                -webkit-app-region: drag;
                app-region: drag;
            }
            .layout__center [data-type="wnd"] > .fn__flex:first-child > .layout-tab-bar.layout-tab-bar--readonly :is([data-type="new"], [data-type="more"]) {
                -webkit-app-region: no-drag;
                app-region: no-drag;
            }
            .layout__center [data-type="wnd"] > .fn__flex:first-child + .layout-tab-container {
                border-radius: var(--b3-border-radius);
            }
            #layouts.layout__center [data-type="wnd"] > :is(.fn__flex-column, .fn__flex-1, .fn__flex):first-child {
                -webkit-app-region: drag;
                app-region: drag;
                & > .layout-tab-bar.layout-tab-bar--readonly {
                    max-width: 80px;
                }
            }
            .toolbar__window {
                -webkit-app-region: no-drag;
                app-region: no-drag;
            }
            .layout__center [data-type="wnd"] > .fn__flex:first-child.fn__none + .layout-tab-container {
                height: calc(100% - ${tabHeight-4}px);
                margin-top: ${tabHeight-4}x;
            }
            #dockLeft {
                padding-top: ${tabHeight}px;
            }
            #dockRight {
                padding-top: ${tabHeight}px;
            }
            :is(.layout__dockl, .layout__dockr):not(.layout--float)  {
                padding-top: ${tabHeight}px;
                min-height: 50%;
            }
            #layouts .layout__resize.layout__resize--lr {
                clip-path: inset(${tabHeight}px 0 0 0 round var(--b3-border-radius));
            }
            #layouts .layout--float.layout__dockb .layout__resize.layout__resize--lr {
                clip-path: none;
            }
            .HZFusionTop > .fn__flex:first-child {
                // 动画
                // transition: 0.45s cubic-bezier(0.33, 1.42, 0.69, 0.99);
            }
            .toolbar-scroll-wrap{
                display: flex;
                width: ${rightToolBarWidth?rightToolBarWidth+'px':'auto'};
                overflow: hidden;
                white-space: nowrap;
                height: ${tabHeight}px;
                margin: 0 2px;
                margin-top: 1px;
                pading: 0 5px;
            }
            .toolbar-scroll-wrap.fn__none {
                display: flex !important;
            }
            ${styles}
        `;
        document.head.appendChild(styleElement);
    }
    // 设置页签位置
    function set_margin_tab_bar(wnd) {
        if (!wnd) return;
        // console.log(wnd);
        if (wnd.getBoundingClientRect().top > 20) {
            wnd.classList.remove("HZFusionTop");
            return;
        }
        wnd.classList.add('HZFusionTop');
        const tab_bar = wnd.querySelector('.layout-tab-bar').parentElement;
        const drag = document.querySelector('#drag');
        if (!tab_bar || !drag) return;
        let tab_bound = wnd.getBoundingClientRect();
        const drag_bound = drag.getBoundingClientRect();
        let margin_left = 0;
        if (tab_bound.left < drag_bound.left) {
            margin_left = drag_bound.left - tab_bound.left;
        }
        tab_bar.style.marginLeft = `${margin_left}px`;
        tab_bound = wnd.getBoundingClientRect();
        let margin_right = 0;
        if (tab_bound.right > drag_bound.right) {
            margin_right = tab_bound.right - drag_bound.right;
        }
        // console.log('tab_bound.left', tab_bound.left)
        // console.log('drag_bound.left', drag_bound.left)
        // console.log('tab_bound.right', tab_bound.right)
        // console.log('drag_bound.right', drag_bound.right)
        // console.log('margin_left', margin_left)
        // console.log('margin_right', margin_right)
        tab_bar.style.marginRight = `${margin_right}px`;
    }

    // 监听页签变化
    function wnd_size_change_listen(wnd) {
        if (!wnd) return;
        let last_bound = wnd.getBoundingClientRect();
        const observer = new ResizeObserver(entries => {
            const this_bound = wnd.getBoundingClientRect();
            if (this_bound.left != last_bound.left || this_bound.right != last_bound.right) {
                // console.log('wnd last_bound', last_bound);
                // console.log('wnd this_bound', this_bound);
                set_margin_tab_bar(wnd);
                last_bound = this_bound;
            }
        });
        observer.observe(wnd);
        set_margin_tab_bar(wnd);
    }
    // 监听顶栏变化
    function drag_size_change_listen(drag) {
        if (!drag) return;
        let last_bound = drag.getBoundingClientRect();
        const observer = new ResizeObserver(entries => {
            const this_bound = drag.getBoundingClientRect();
            if (this_bound.left != last_bound.left || this_bound.right != last_bound.right) {
                // console.log('drag last_bound', last_bound);
                // console.log('drag this_bound', this_bound);
                document.querySelectorAll('.layout__center [data-type="wnd"]').forEach(wnd => set_margin_tab_bar(wnd));
                last_bound = this_bound;
            }
        });
        observer.observe(drag);
    }

    set_css_style();
    whenExist('.layout__center', (center) => {
        // 初始化监听wnd
        center.querySelectorAll('[data-type="wnd"]').forEach(wnd => wnd_size_change_listen(wnd));

        // 新增wnd之后, 也要监听
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type != 'childList')
                    return
                // 查找新增加的 NodeCodeBlock 元素
                // console.log('add wnd', mutation.addedNodes);
                mutation.addedNodes.forEach(add_node => {
                    if (add_node.nodeType != Node.ELEMENT_NODE) return
                    wnd_size_change_listen(add_node.querySelector('[data-type="wnd"]'))
                });
            });
        });
        // 4. 开始观察 ele 元素
        observer.observe(center, {
            childList: true, // 观察子节点的变化
            subtree: true, // 观察所有子孙节点
        });
    });

    function formatRightToolbar() {
        if(!rightToolBarWidth) return;
        if(document.querySelector('#toolbarScrollWrap')) return
        scrollWrapCreated = true;
        const drag = document.querySelector('#drag');
        // 创建 scrollWrap
        const scrollWrap = document.createElement('div');
        scrollWrap.id = 'toolbarScrollWrap';
        scrollWrap.className = 'toolbar-scroll-wrap';
    
        // 获取 drag 之后的所有**元素**兄弟节点（不包括文本节点）
        const siblings = Array.from(drag.parentNode.children)
            .filter(el => ![...rightToolBarExcludes, 'barExit', 'windowControls'].includes(el?.id))
            .slice(Array.from(drag.parentNode.children).indexOf(drag) + 1);
    
        // 将这些元素逐个移动到 scrollWrap 中
        siblings.forEach(sibling => {
            scrollWrap.appendChild(sibling);
        });

        // 获取父节点
        const parent = drag.parentNode;
    
        // 在 drag 之后插入 scrollWrap
        parent.insertBefore(scrollWrap, drag.nextSibling);

         // 监听后续新插入到parent中的元素，当是drag后面的兄弟结点时，也插入到scrollWrap中
        if(!parent.observer) {
            parent.observer = new MutationObserver(function (mutations) {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        // 只处理元素节点
                        if (node.nodeType !== 1) return;
    
                        // 跳过 scrollWrap 本身（防止被重复插入）
                        if (node.id === 'toolbarScrollWrap') return;
    
                        // 获取 drag 在父节点中的索引
                        const dragIndex = Array.from(parent.children).indexOf(drag);
                        const nodeIndex = Array.from(parent.children).indexOf(node);
    
                        // 如果新节点插入在 drag 之后，且不是被排除的元素
                        if (nodeIndex > dragIndex &&
                            ![
                                ...rightToolBarExcludes,
                                'barExit',
                                'windowControls',
                                'toolbarScrollWrap' // 额外排除 scrollWrap 自身
                            ].includes(node.id)) {
    
                            // 确保它不在 scrollWrap 中（避免重复移动）
                            if (!scrollWrap.contains(node)) {
                                scrollWrap.appendChild(node);
                            }
                        }
                    });
                });
            });
    
            // 开始观察父节点的子节点变化（包括新增、删除、属性变化等）
            parent.observer.observe(parent, {
                childList: true,      // 监听子节点增删
                subtree: false,       // 不递归子树
                attributes: false,    // 不监听属性变化
                characterData: false  // 不监听文本变化
            });
        }

        // 绑定toolbar自滚动事件
        scrollElementByMousePosition(scrollWrap);
    }

    // 根据鼠标位置水平滚动元素
    function scrollElementByMousePosition(element) {
        var maxChildWidth = 23.5;
        [...element.children].forEach(el=>{
            const rect = el.getBoundingClientRect();
            if(rect.width > maxChildWidth) maxChildWidth = rect.width;
        });
        element.addEventListener("mousemove", function(mouseEvent) {
            var visibleWidth = element.clientWidth;
            var totalScrollWidth = element.scrollWidth;

            if (totalScrollWidth > visibleWidth) {
                // 计算鼠标在元素内的相对 X 坐标（减去元素左边缘）
                var elementRect = element.getBoundingClientRect();
                var adjustedMouseX = mouseEvent.clientX - elementRect.left - maxChildWidth;
                var scrollPercentage = adjustedMouseX / (visibleWidth - maxChildWidth);

                // 钳位到 [0, 1] 范围
                scrollPercentage = Math.clamp(scrollPercentage, 0, 1);

                // 设置水平滚动位置
                element.scrollLeft = (totalScrollWidth - visibleWidth) * scrollPercentage;
            }
        });
    }

    whenExist('#drag', drag => {
        drag_size_change_listen(drag)
        formatRightToolbar()
    });
})()