// 双击dock空白区域切换dock面板项
// see https://gitee.com/wish163/mysoft/issues/ICAGTO
(()=>{
    whenElementExist('#dockRight .dock__item--space').then(async () => {
        await sleep(100);
        const docks = document.querySelectorAll('#dockLeft, #dockRight');
        docks.forEach(dock => {
            const dockSpace = dock.querySelector('.dock__item--space');
            if(!dockSpace) return;
            let lastActiveItems = [];
            let lastClickTime = 0;
            const doubleClickDelay = 300; // ms
            // 模拟双击
            dockSpace.addEventListener('click', (event) => {
                const now = new Date().getTime();
                if (now - lastClickTime < doubleClickDelay) {
                    event.stopPropagation();
                    const activeItems = dock.querySelectorAll('.dock__item--active');
                    console.log(activeItems.length,lastActiveItems.length);
                    if(lastActiveItems.length === 0) {
                        lastActiveItems = activeItems;
                        activeItems.forEach(item => {
                            item.click();
                        });
                    } else {
                        lastActiveItems.forEach(item => {
                            item.click();
                        });
                        lastActiveItems = [];
                    }
                }
                lastClickTime = now;
            });
        });
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function whenElementExist(selector, node, timeout = 5000) {
        return new Promise(resolve => {
            // 先立即检查一次元素是否存在
            const existingEl = typeof selector==='function'?selector():(node||document).querySelector(selector);
            if (existingEl) {
                resolve(existingEl);
                return;
            }

            // 设置超时
            const timeoutId = setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
    
            // 如果元素不存在，才开始监听 DOM 变化
            const observer = new MutationObserver(mutations => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) {
                    clearTimeout(timeoutId);
                    observer.disconnect();
                    resolve(el);
                }
            });
    
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();