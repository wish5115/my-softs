// 带块id的剪切
// see https://ld246.com/article/1744246860602
// 支持手机版
// 注意：只能在块菜单中操作（你的右键可能不是块菜单）
// 缺点：不支持撤销（官方移动也不支持撤销）
(()=>{
    // 选择的块id列表
    let selectedIds = [];
    // 监听图片右键菜单
    whenElementExist('#commonMenu .b3-menu__items').then((menuItems) => {
        observeBlockMenu(menuItems, async ()=>{
            if(menuItems.querySelector('.cut-with-id')) return;
            const cut = menuItems.querySelector('button[data-id="cut"]');
            if(!cut) return;
            const isPaste = selectedIds.length > 0;
            // 创建菜单按钮
            const menuText = isPaste ? '剪切到这里（Esc取消）' : '剪切（带块ID）';
            const menuIcon = '#iconCut'; //isPaste ? '#iconPaste' : '#iconCut';
            const menuButtonHtml = `<button class="b3-menu__item cut-with-id"><svg class="b3-menu__icon " style=""><use xlink:href="${menuIcon}"></use></svg><span class="b3-menu__label">${menuText}</span></button>`;
            cut.insertAdjacentHTML('afterend', menuButtonHtml);
            const cutWithIdBtn = menuItems.querySelector('.cut-with-id');
            // Esc取消
            if(isPaste) {
                const handleEscKey = (event) => {
                    // 检查是否按下了 Esc 键
                    if (event.key === 'Escape' || event.keyCode === 27) {
                        selectedIds = [];
                        // 移除事件监听器，确保只监听一次
                        document.removeEventListener('keydown', handleEscKey);
                    }
                }
                // 添加事件监听器
                document.addEventListener('keydown', handleEscKey);
            }
            cutWithIdBtn.onclick = async () => {
                window.siyuan.menus.menu.remove();
                // 粘贴
                if(isPaste){
                    const currEditor = getProtyle()?.wysiwyg?.element;
                    const currBlock = currEditor?.querySelector('.protyle-wysiwyg--select');
                    const prevBlock = currBlock?.previousElementSibling;
                    let lastBlockId = prevBlock?.dataset?.nodeId;
                    const rootId = currBlock.closest('.protyle')?.querySelector('.protyle-title')?.dataset?.nodeId;
                    for(const id of selectedIds){
                        const result = await requestApi('/api/block/moveBlock', {
                          "id": id,
                          "previousID": lastBlockId || undefined,
                          "parentID": lastBlockId ? "" : rootId,
                        });
                        if(!result || result.code !== 0) {
                            console.error(result);
                            showMessage('粘贴失败', true);
                            break;
                        }
                        lastBlockId = id;
                    }
                    selectedIds = [];
                    reloadProtyle()
                }
                // 剪切
                else {
                    const blocks = document.querySelectorAll('.protyle-wysiwyg--select');
                    blocks.forEach(block => {
                        selectedIds.push(block.dataset.nodeId);
                    });
                }
            };
        });
    });

    // 请求api
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
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

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    function reloadProtyle() {
        (siyuan?.mobile||getProtyle()?.model)?.editor?.reload();
    }

    function getProtyle() {
        try {
            if(document.getElementById("sidebar")) return siyuan.mobile.editor.protyle;
            const currDoc = siyuan?.layout?.centerLayout?.children.map(item=>item.children.find(item=>item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active')||item.panelElement.closest('[data-type="wnd"]')))).find(item=>item);
            return currDoc?.model.editor.protyle;
        } catch(e) {
            console.error(e);
            return null;
        }
    }
})();