// 属性引用，有效避免引动丢失
// 有效解决，对与未删除的块，但由于剪切等原因导致块id改变后，引用失效问题
// 原理如下：
// 1. 当插入引用链接时，自动给引用链接和被引用的块添加custom-id属性，这个属性以后都不会变
// 2. 当被引用的块id被改变后，通过引用链接的custom-id属性获取被引用的块，并修正引用链接的id为新块的id
// 3. 当有多个块具有相同的custom-id属性时，自动弹出选项对话框，让用户选择引用哪个块，用户选择后更新引用链接的id为用户选择块的id
// 4. 在情况3时，如果你不小心选错了要引用的块，也不要紧，只需要在引用链接上ctrl+点击，会再次弹出选项对话框，可以再次选择
// 5. 已删除的块无法引用，恢复块删除即可
// version 0.0.1
// see 
(()=>{
    setTimeout(()=>{
        // 获取容器元素
        const targetNode = document.querySelector('.layout__center, #editor') || document.body;
        
        // 监听引用插入
        observeBlockRef(async (blockRef)=>{
            console.log(blockRef);
            const blockId = blockRef?.dataset?.id;
            if(!blockId) return;
            // 如果已存在custom-id返回
            if(blockRef.getAttribute('custom-id')) return;
            const attrs = await requestApi('/api/attr/getBlockAttrs', {id: blockId});
            let customId = blockId;
            const blockHasCustomId = attrs && attrs.data && attrs.data['custom-id'];
            if(blockHasCustomId) customId = attrs.data['custom-id'];
            // 添加custom-id
            blockRef.setAttribute('custom-id', customId);
            // 触发 input 事件
            dispatchInputEvent(blockRef);
            // 给块添加属性
            if(blockHasCustomId) return;
            const result = await requestApi('/api/attr/setBlockAttrs', {
                "id": blockId,
                "attrs": {"custom-id": blockId}
            });
            if(!result || result.code !== 0) console.warn(result);
        }, targetNode);

        // 监听鼠标移入事件
        targetNode.addEventListener('mouseover', async (e) => {
            // 获取引用元素
            const blockRef = e.target.closest('[data-type="block-ref"][custom-id]');
            if(!blockRef) return;
            // 检查块是否存在
            let blocks = await querySql(`select id from blocks where id='${blockRef.dataset.id}'`);
            if(blocks.length > 0) return;
            // 通过属性获取块
            const customId = blockRef.getAttribute('custom-id');
            blocks = await querySql(`select id, content, hpath from blocks where ial like '%custom-id="${customId}"%'`);
            if(blocks.length === 0) return;
            let id = blocks[0]?.id;
            if(blocks.length > 1) {
                e.preventDefault();
                e.stopPropagation();
                // 去除找不到id报错
                whenElementExist('#message .b3-snackbar--error [data-type="textMenu"]').then((message)=>{
                    if(message && message?.textContent?.includes(`[${blockRef.dataset.id}]`)) message.click();
                });
                const item = await optionsDialog(blockRef, blocks);
                id = item?.dataset?.id;
            }
            if(!id) return;
            blockRef.dataset.id = id;
            // 更新块
            updateBlock(blockRef);
        }, true);

        // ctrl+点击，选择引用块
        targetNode.addEventListener('click', async (e) => {
            const ctrlKey = isMac() ? e.metaKey : e.ctrlKey;
            const controlKey = isMac() ? e.ctrlKey : e.metaKey;
            if(e.shiftKey || e.altKey || controlKey || !ctrlKey) return;
            // 获取引用元素
            const blockRef = e.target.closest('[data-type="block-ref"][custom-id]');
            if(!blockRef) return;
            e.preventDefault();
            e.stopPropagation();
            // 通过属性获取块
            const customId = blockRef.getAttribute('custom-id');
            blocks = await querySql(`select id, content, hpath from blocks where ial like '%custom-id="${customId}"%'`);
            if(blocks.length === 0) return;
            const item = await optionsDialog(blockRef, blocks);
            const id = item?.dataset?.id;
            if(!id) return;
            blockRef.dataset.id = id;
            // 更新块
            updateBlock(blockRef);
        }, true);
    }, 1500);

    function dispatchInputEvent(blockRef) {
        const wysiwyg = blockRef.closest('.protyle-wysiwyg');
        const inputEvent = new Event('input', { bubbles: true });
        wysiwyg.dispatchEvent(inputEvent);
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    async function updateBlock(node) {
        if(!node.matches('[data-node-id][data-type]')) {
            node = node.closest('[data-node-id][data-type]');
        }
        await requestApi('/api/block/updateBlock', {
            "dataType": "dom",
            "data": node.outerHTML,
            "id": node.dataset.nodeId
        })
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    async function querySql(sql) {
        const result = await requestApi('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
    
    function observeBlockRef(callback, targetNode, selector = 'span[data-type="block-ref"]:not(.av__celltext--ref)') {
        targetNode = targetNode || document.querySelector('.layout__center, #editor') || document.body;
        const observer = new MutationObserver(mutationsList => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 遍历新增的节点
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查当前节点是否匹配 selector
                            if (node.matches?.(selector)) {
                                callback(node);
                            }
                            // 检查子节点是否匹配 selector（递归查找）
                            //node.querySelectorAll(selector).forEach(callback);
                        }
                    });
                }
            }
        });
        // 开始观察
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
        return observer; // 返回 observer 实例以便后续可调用 .disconnect()
    }

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

    /////////////// 选择引用块，ui对话框 ///////////////
    // const item = await optionsDialog(target, data); // data格式 [{title:'', value: '', hpath:'', id: 'blockId', extends:'{}'},...]
    // const item = await optionsDialog(target, (keyword) => {}) // 回调函数需返回 [{title:'', value: '', hpath:'', id: 'blockId', extends:'{}'}, ...]
    // target 对话框显示在哪个元素附近，也可以是对象，指定显示位置，如果{left:0, top:0}
    // data 是对象数组或数据返回函数；afterRender 是渲染完成后的回调，一般不需要
    // 返回值 item是列表选项的dom元素，可通过item.dataset.xxx获取对应的值，比如item.dataset.value
    // see https://ld246.com/article/1752074911214#optionsDialog-%E9%80%89%E9%A1%B9%E5%AF%B9%E8%AF%9D%E6%A1%86
    // see https://github.com/siyuan-note/siyuan/blob/a2a678c5fbb560e3b265dc2c690f568bcf15a663/app/src/protyle/render/av/relation.ts#L55
    function optionsDialog(target, data, afterRender) {
        return new Promise((resolve) => {
            const menu = window.siyuan.menus.menu;
            menu.remove();
            menu.addItem({
                iconHTML: "",
                type: "empty",
                label: `
                    <div class="fn__flex-column b3-menu__filter">
                        <input class="b3-text-field fn__flex-shrink"/>
                        <div class="fn__hr"></div>
                        <div class="b3-list fn__flex-1 b3-list--background">
                            <img style="margin: 0 auto;display: block;width: 64px;height: 64px" src="/stage/loading-pure.svg">
                        </div>
                    </div>
                `,
                async bind(element) {
                    const listElement = element.querySelector(".b3-list");
                    const inputElement = element.querySelector("input");
                    inputElement.addEventListener("keydown", (event) => {
                        if (event.isComposing) return;
                        const currentElement = upDownHint(listElement, event);
                        if (currentElement) event.stopPropagation();
                        if (event.key === "Enter") {
                            event.preventDefault();
                            event.stopPropagation();
                            const listItemElement = listElement.querySelector(".b3-list-item--focus");
                            resolve(listItemElement);
                            menu.remove();
                        }
                    });
                    let timeoutId;
                    inputElement.addEventListener("input", (event) => {
                        event.stopPropagation();
                        if (event.isComposing) return;
                        if(timeoutId) clearTimeout(timeoutId);
                        timeoutId = setTimeout(async ()=>{
                            await genSearchList(listElement, inputElement.value, data);
                            if(timeoutId) clearTimeout(timeoutId);
                        }, 100);
                    });
                    inputElement.addEventListener("compositionend", () => {
                        if(timeoutId) clearTimeout(timeoutId);
                        timeoutId = setTimeout(async ()=>{
                            await genSearchList(listElement, inputElement.value, data);
                            if(timeoutId) clearTimeout(timeoutId);
                        }, 100);
                    });
                    element.lastElementChild.addEventListener("click", (event) => {
                        const listItemElement = event.target.closest(".b3-list-item");
                        if (listItemElement) {
                            event.stopPropagation();
                            resolve(listItemElement);
                            menu.remove();
                        }
                    });
                    await genSearchList(listElement, '', data);
                    const rect = target?.nodeType === 1 ? target.getBoundingClientRect() : target;
                    menu.popup({
                        x: rect.left,
                        y: rect.bottom || rect.top,
                        //w: rect.width,
                        h: rect.height,
                        //isLeft: rect.isLeft
                    });
                    setTimeout(()=>element.querySelector("input").focus(), 100);
                    if(typeof afterRender === 'function') await afterRender(element);
                }
            });
            menu.element.querySelector(".b3-menu__items").setAttribute("style", "overflow: initial");
            const popoverElement = target?.closest ? target.closest('.block__popover') : null;
            menu.element.setAttribute("data-from", popoverElement ? popoverElement.dataset.level + "popover" : "app");
        });
        async function genSearchList(element, keyword = '', data){
            if(typeof data === 'function') {
                data = await data(keyword);
            } else {
                if(!Array.isArray(data)) return;
                data = data.filter(item => item?.value?.toString()?.includes(keyword) || item?.title?.toString()?.includes(keyword) || item?.content?.toString()?.includes(keyword));
            }
            let html = "";
            data.forEach((item, index) => {
                html += `<div class="b3-list-item b3-list-item--narrow${index === 0 ? " b3-list-item--focus" : ""}" data-block-id="${item?.id||''}" data-id="${item?.id||''}" data-value="${item?.value||''}" data-extends="${item?.extends||''}">
        <div class="b3-list-item--two fn__flex-1">
            <div class="b3-list-item__first">
                <span class="b3-list-item__text">${escapeHtml(item?.title || item?.content || window.siyuan.languages.title)}</span>
            </div>
            <div class="b3-list-item__meta b3-list-item__showall">${escapeGreat(item?.hpath||'')}</div>
        </div>
        <svg aria-label="${item?.current || '当前块'}" style="margin: 0 0 0 4px" class="b3-list-item__hinticon ariaLabel${item?.current || item?.id === target?.dataset?.nodeId ? "" : " fn__none"}"><use xlink:href="#iconInfo"></use></svg>
    </div>`;
            });
            element.innerHTML = html;
        }
        function escapeHtml(html) {
            if (!html) return html;
            if(typeof html !== 'string') html = html.toString();
            return html.replace(/&/g, "&").replace(/</g, "<");
        }
        function escapeGreat(html) {
            if(typeof html !== 'string') html = html.toString();
            return html.replace(/</g, "<");
        }
        function isNormalItem(currentHintElement, className) {
            return !currentHintElement.classList.contains(className) || currentHintElement.getBoundingClientRect().height === 0;
        };
        // see https://github.com/siyuan-note/siyuan/blob/a2a678c5fbb560e3b265dc2c690f568bcf15a663/app/src/util/upDownHint.ts#L5
        function upDownHint(listElement, event, classActiveName = "b3-list-item--focus", defaultElement) {
            let currentHintElement = listElement.querySelector("." + classActiveName);
            if (!currentHintElement && defaultElement) {
                defaultElement.classList.add(classActiveName);
                defaultElement.scrollIntoView(true);
                return;
            }
            if (!currentHintElement) return;
            const className = classActiveName.split("--")[0];
            if (event.key === "ArrowDown") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = currentHintElement.nextElementSibling;
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.nextElementSibling;
                }
                if (!currentHintElement) {
                    currentHintElement = listElement.children[0];
                    while (currentHintElement && isNormalItem(currentHintElement, className)) {
                        currentHintElement = currentHintElement.nextElementSibling;
                    }
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                if (listElement.scrollTop < currentHintElement.offsetTop - listElement.clientHeight + currentHintElement.clientHeight ||
                    listElement.scrollTop > currentHintElement.offsetTop) {
                    currentHintElement.scrollIntoView(listElement.scrollTop > currentHintElement.offsetTop);
                }
                return currentHintElement;
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = currentHintElement.previousElementSibling;
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.previousElementSibling;
                }
                if (!currentHintElement) {
                    currentHintElement = listElement.children[listElement.children.length - 1];
                    while (currentHintElement &&
                    (currentHintElement.classList.contains("fn__none") || !currentHintElement.classList.contains(className))) {
                        currentHintElement = currentHintElement.previousElementSibling;
                    }
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                const overTop = listElement.scrollTop > currentHintElement.offsetTop - (currentHintElement.previousElementSibling?.clientHeight || 0);
                if (listElement.scrollTop < currentHintElement.offsetTop - listElement.clientHeight + currentHintElement.clientHeight || overTop) {
                    currentHintElement.scrollIntoView(overTop);
                }
                return currentHintElement;
            } else if (event.key === "Home") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = listElement.children[0];
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.nextElementSibling;
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                currentHintElement.scrollIntoView();
                return currentHintElement;
            } else if (event.key === "End") {
                event.preventDefault();
                event.stopPropagation();
                currentHintElement.classList.remove(classActiveName);
                currentHintElement = listElement.children[listElement.children.length - 1];
                while (currentHintElement && isNormalItem(currentHintElement, className)) {
                    currentHintElement = currentHintElement.previousElementSibling;
                }
                if (!currentHintElement) return;
                currentHintElement.classList.add(classActiveName);
                currentHintElement.scrollIntoView(false);
                return currentHintElement;
            }
        }
    }
})();