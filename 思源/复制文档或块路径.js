// 复制文档或块路径
(()=>{
    if(window.siyuan.mobile) return;
    // 监听块右键菜单
    whenElementExistOrNull('#commonMenu .b3-menu__items').then((menuItems) => {
        if(!menuItems) return;
        const handler = async (type)=>{
            let id = '';
            if(type === 'block') {
                const protyle = document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
                            .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
                const block = (protyle||document)?.querySelector('.protyle-wysiwyg--select');
                id = block.dataset?.nodeId;
            } else {
                const li = document.querySelector('.sy__file li.b3-list-item--focus');
                id = li.dataset?.nodeId;
            }
            const copyHPath = menuItems.querySelector('[data-id="copyHPath"]');
            if(!copyHPath) return;
            const html = `<button data-id="copyPath" class="b3-menu__item"><span class="b3-menu__label">复制路径</span></button>`;
            copyHPath.insertAdjacentHTML('beforebegin', html);
            copyPath = menuItems.querySelector('[data-id="copyPath"]');
            copyPath.addEventListener('click', async ()=>{
                const path = (await requestApi('/api/filetree/getPathByID', {id}))?.data?.path;
                if(path) copyText(path);
                window.siyuan.menus.menu.remove();
            });
        };
        observeMenu('block', menuItems, handler);
        observeMenu('filetree', menuItems, handler);
    });
    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.warn('复制失败: ', err);
        }
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    function whenElementExistOrNull(selector, node = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function' ? selector() : node.querySelector(selector);
                } catch (err) { return resolve(null); }
                if (el) resolve(el);
                else if (Date.now() - start >= timeout) resolve(null);
                else requestAnimationFrame(check);
            }
            check();
        });
    }
    /**
     * 监控 body 直接子元素中 #commonMenu 的添加
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observeMenu(type, selector, callback) {
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
                        if(type === 'block') {
                            if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.cut) {
                                hasFlag1 = true;
                            }
                            if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.move) {
                                hasFlag2 = true;
                            }
                        }
                        if(type === 'filetree') {
                            if (node.nodeType === 1 && node.matches('[data-id="newDocAbove"]')) {
                                hasFlag1 = true;
                            }
                            if (node.nodeType === 1 && node.matches('[data-id="newDocBelow"]')) {
                                hasFlag2 = true;
                            }
                        }
                        if(hasFlag1 && hasFlag2) {
                           callback(type);
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