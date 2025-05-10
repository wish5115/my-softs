// 复制数据库ID
(()=>{
    // 监听块右键菜单
    whenElementExistOrNull('#commonMenu .b3-menu__items').then((menuItems) => {
        if(!menuItems) return;
        observeBlockMenu(menuItems, async ()=>{
            if(menuItems.querySelector('[data-id="copyAvID"]')) return;
            const protyle = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)');
            const blocks = (protyle||document)?.querySelectorAll('.protyle-wysiwyg--select');
            const firstAvBlock = [...blocks].find(item=>item?.dataset?.avId);
            if(!firstAvBlock) return;
            const copyId = menuItems.querySelector('[data-id="copyID"]');
            if(!copyId) return;
            const copyAvIdHtml = `<button data-id="copyAvID" class="b3-menu__item"><span class="b3-menu__label">复制数据库 ID</span></button>`;
            copyId.insertAdjacentHTML('afterend', copyAvIdHtml);
            copyAvID = menuItems.querySelector('[data-id="copyAvID"]');
            copyAvID.addEventListener('click', ()=>{
                copyText(firstAvBlock?.dataset?.avId||'');
                window.siyuan.menus.menu.remove();
            });
        });
    });
    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.warn('复制失败: ', err);
        }
    }
    function whenElementExistOrNull(selector, node, timeout = 5000, sleep = 0) {
        timeout = /^\d+$/.test(timeout) ? parseInt(timeout) : 5000;
        sleep = /^\d+$/.test(sleep) ? parseInt(sleep) : 0;
        return new Promise(resolve => {
            const startTime = Date.now();
            const check = async () => {
                const el = typeof selector === 'function'
                    ? await selector()
                    : (node || document).querySelector(selector);
                if (el || Date.now() - startTime >= timeout) {
                    resolve(el || null);
                    return;
                }
                sleep ? setTimeout(check, sleep) : requestAnimationFrame(check);
            };
            check();
        });
    }
    /**
     * 监控 body 直接子元素中 #commonMenu 的添加
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observeBlockMenu(selector, callback) {
        let hasFlag1 = false;
        let hasFlag2 = false;
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是目标菜单
                        if(hasFlag1 && hasFlag2) return;
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.cut) {
                            hasFlag1 = true;
                        }
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.move) {
                            hasFlag2 = true;
                        }
                        if(hasFlag1 && hasFlag2) {
                           callback();
                           setTimeout(() => {
                               hasFlag1 = false;
                               hasFlag2 = false;
                           }, 200);
                        }
                    });
                }
            }
        });
        // 开始观察 body 的直接子元素的变化
        observer.observe(selector || document.body, {
            childList: true, // 监听子节点的添加
            subtree: false, // 仅监听直接子元素，不监听子孙元素
        });
        // 返回 observer 实例，便于后续断开监听
        return observer;
    }
})();