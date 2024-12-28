// 弹窗居中显示
// see https://ld246.com/article/1735377399074
(()=>{
    // 监听弹窗出现
    observePopoverOpen((node) => {
        // 将弹窗居中显示
        centerPopover(node);
    });
    
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
                            whenElementExist(()=>node.classList.contains('block__popover--open')).then(() => {
                                callback(node);
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
    
    /**
     * 将弹窗居中显示
     * @param {HTMLElement} popover - 弹窗元素
     */
    function centerPopover(popover) {
        // 确保弹窗的定位方式为 absolute 或 fixed
        // if (window.getComputedStyle(popover).position !== 'fixed') {
        //     popover.style.position = 'fixed';
        // }
    
        // 计算弹窗的宽度和高度
        const popoverWidth = popover.offsetWidth;
        const popoverHeight = popover.offsetHeight;
    
        // 计算居中的位置
        const left = (window.innerWidth - popoverWidth) / 2;
        const top = (window.innerHeight - popoverHeight) / 2;
    
        // 设置弹窗的位置
        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
    }

    // 等待元素出现
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();