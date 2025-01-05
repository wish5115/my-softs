// 移动当前块到文档最后或指定的块后面
// see https://ld246.com/article/1735996547380
(()=>{
    // 移动菜单名称
    const moveMenuText = '移动到最后';
    
    // 移动到哪个块的后面，如果为空，则移动到文档末尾，通常可以设置一个分割线，然后移动到该分割线后面
    const moveAfterThisBlockId = '';

    // 监听图片右键菜单
    whenElementExist('#commonMenu .b3-menu__items').then((menuItems) => {
        observeTextMenu(menuItems, async ()=>{
            if(menuItems.querySelector('.move-to-last')) return;
            const subMenuTexts = menuItems.querySelectorAll('.b3-menu__item > .b3-menu__label');
            if(!subMenuTexts || subMenuTexts.length === 0) return;
            const selectAll = Array.from(subMenuTexts).find(label => label.textContent === window.siyuan.languages.selectAll);
            if(!selectAll) return;
            const selectAllButton = selectAll.closest('button');
            // 创建菜单按钮
            const menuButtonHtml = `<button class="b3-menu__item move-to-last"><svg class="b3-menu__icon " style=""><use xlink:href="#iconMove"></use></svg><span class="b3-menu__label">${moveMenuText}</span></button>`;
            selectAllButton.insertAdjacentHTML('afterend', menuButtonHtml);
            const moveButton = menuItems.querySelector('.move-to-last');
            moveButton.onclick = async () => {
                const cursorElement = getCursorElement();
                const cusorBlock = cursorElement.closest('.protyle-wysiwyg > [data-type][data-node-id]');
                const lastBlockId = cusorBlock.closest('.protyle-wysiwyg')?.lastElementChild?.dataset?.nodeId;
                if(!moveAfterThisBlockId && !lastBlockId) return;
                if(!moveAfterThisBlockId && lastBlockId === cusorBlock.dataset.nodeId) return;
                if(moveAfterThisBlockId && moveAfterThisBlockId === cusorBlock.dataset.nodeId) return;
                const result = await requestApi('/api/block/moveBlock', {
                  "id": cusorBlock.dataset.nodeId,
                  "previousID": moveAfterThisBlockId || lastBlockId || "",
                  "parentID": ""
                });
                if(!result || result.code !== 0) {
                    console.error(result);
                }
                document.body.click(); // 关闭菜单
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
    function observeTextMenu(selector, callback) {
        let hasSelectAll = false;
        let hasPaste = false;
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是图片菜单
                        if(hasSelectAll && hasPaste) return;
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.selectAll) {
                            hasSelectAll = true;
                        }
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.paste) {
                            hasPaste = true;
                        }
                        if(hasSelectAll && hasPaste) {
                           callback();
                           setTimeout(() => {
                               hasSelectAll = false;
                               hasPaste = false;
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