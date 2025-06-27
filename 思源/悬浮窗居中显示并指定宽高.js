// 悬浮窗居中显示并指定宽高
// see https://ld246.com/article/1750995959012
(()=>{
    // 设置悬浮窗的宽高
    const width = 1020;
    const height = 791;
    
    // 监听悬浮窗出现
    observePopoverOpen((popover) => {
        // 将悬浮窗居中显示
        centerPopover(popover, width, height);
        // 设置居中按钮
        addCenterButton(popover, width, height);
    });

    /* 添加居中按钮 */
    function addCenterButton(popover, width, height) {
        const moveSize = popover.querySelector('.resize__move');
        const btnHtml = `<span data-type="centerPopover" class="block__icon block__icon--show b3-tooltips b3-tooltips__sw" aria-label="居中显示 "><svg><use xlink:href="#iconDock"></use></svg></span>`;
        moveSize.insertAdjacentHTML('afterend', btnHtml);
        const centerBtn = moveSize.nextElementSibling;
        centerBtn.addEventListener('click', (e)=>{
            centerPopover(popover, width, height);
        });
    }

    /**
     * 将悬浮窗居中显示
     * @param {HTMLElement} popover - 弹窗元素
     */
    function centerPopover(popover, width, height) {
        // 确保弹窗的定位方式为 absolute 或 fixed
        // if (window.getComputedStyle(popover).position !== 'fixed') {
        //     popover.style.position = 'fixed';
        // }

        // toolbar高度
        const toolbarHeight = document.querySelector('#toolbar')?.offsetHeight || 0;

        // 获取可视区域宽高
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight - toolbarHeight;
    
        // 计算弹窗的宽度和高度
        let popoverWidth = width || popover.offsetWidth;
        popoverWidth = popoverWidth > innerWidth ? innerWidth : popoverWidth;
        let popoverHeight = height || popover.offsetHeight;
        popoverHeight = popoverHeight > innerHeight ? innerHeight : popoverHeight;
    
        // 计算居中的位置
        const left = (innerWidth - popoverWidth) / 2;
        const top = (innerHeight - popoverHeight) / 2 + toolbarHeight;
    
        // 设置弹窗的位置
        popover.style.left = `${left > 0 ? left : 0}px`;
        popover.style.top = `${top > 0 ? top : 0}px`;
        popover.style.width = `${popoverWidth}px`;
        popover.style.maxHeight = `${popoverHeight}px`;
        popover.style.height = `${popoverHeight}px`;
    }
    
    /**
     * 监控 body 直接子元素中 .block__popover.block__popover--open 的添加，并将其居中显示
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observePopoverOpen(callback) {
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是 .block__popover.block__popover--open
                        if (
                            node.nodeType === 1 && // 确保是元素节点
                            node.classList.contains('block__popover')
                        ) {
                            whenElementExist(()=>node.classList.contains('block__popover--open')).then((isExist) => {
                                if(isExist) callback(node);
                            });
                        }
                    });
                }
            }
        });
    
        // 开始观察 body 的直接子元素的变化
        observer.observe(document.body, {
            childList: true, // 监听子节点的添加和删除
            subtree: false, // 仅监听直接子元素，不监听子孙元素
        });
    
        // 返回 observer 实例，便于后续断开监听
        return observer;
    }

    // 等待元素出现
    function whenElementExist(selector, node = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function'
                        ? selector()
                        : node.querySelector(selector);
                } catch (err) {
                    return resolve(null);
                }
                if (el) {
                    resolve(el);
                } else if (Date.now() - start >= timeout) {
                    resolve(null);
                } else {
                    requestAnimationFrame(check);
                }
            }
            check();
        });
    }
})();