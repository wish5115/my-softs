// 悬浮窗默认钉住和双击标题关闭
// see https://ld246.com/article/1751379117488
(()=>{
    // 监听悬浮窗出现
    observePopoverOpen((popover) => {
        // 默认钉住
        if(popover?.dataset.pin === 'false') {
            popover.querySelector('[data-type="pin"]').click();
        }
        // 双击标题关闭
        if(!popover?.dblclickHandle){
            popover.dblclickHandle = true;
            popover.querySelector('.resize__move').addEventListener('dblclick', () => {
                popover.querySelector('[data-type="close"]').click();
            });
        }
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