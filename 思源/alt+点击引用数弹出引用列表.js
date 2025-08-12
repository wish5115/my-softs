// alt+点击引用数弹出引用列表
// version 0.0.2
// 0.0.2 禁用思源默认的悬浮窗；不再需要按 alt；菜单项前添加了序号；可通过该序号搜索；当直仅有一个引用时，直接跳转，不再弹窗菜单
// see https://ld246.com/article/1754877297383
setTimeout(()=>{
    const container = document.querySelector('.layout__center, #editor');
    if(!container) return;
    // 禁用mouseover
    container.addEventListener('mouseover', (e) => {
        if(e.altKey || e.shiftKey || e.ctrlKey || e.metaKey || !e.target.closest('.protyle-attr--refcount')) return;
        e.stopImmediatePropagation();
        e.preventDefault();
    }, true);
    // 增加点击事件
    container.addEventListener('click', async (e)=>{
        if(e.altKey || e.shiftKey || e.ctrlKey || e.metaKey || !e.target.closest('.protyle-attr--refcount')) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        const target = e.target;
        const node = e.target.closest('.protyle-title[data-node-id], [data-node-id][data-type]');
        const nodeId = node?.dataset?.nodeId;
        if(!nodeId) return;
        // 获取引用列表
        const refs = await requestApi('/api/block/getRefIDs', {"id": nodeId});
        const refIds = refs?.data?.refDefs?.map(ref=>ref.refID);
        if(refIds.length === 0) return;
        const results = await querySql(`select id, hpath, content from blocks where id in(${refIds.map(id=>`'${id}'`).join(',')})`);
        const data = refIds.map((id, index) => {const item = results.find(item=>item.id === id); item.content = `${index+1}. ${item.content}`; return item;});
        if(data?.length === 1) {
            // 仅一条引用时直接打开
            openBlock(data[0].id);
        } else {
            // 2条及以上引用时展示菜单
            const item = await optionsDialog(target, data, {focusInput: isMobile()?false:true});
            openBlock(item.dataset.id);
        }
        // 闪烁引用块
        setTimeout(()=>{
            const editor = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr');
            const refNode = editor.querySelector(`[data-node-id="${item.dataset.id}"]`);
            refNode.classList.add('protyle-wysiwyg--hl');
            setTimeout(()=>refNode.classList.remove('protyle-wysiwyg--hl'), 100);
        }, 500);
    }, true);
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
    function openBlock(id) {
        const wysiwyg = document.querySelector('#editor .protyle-wysiwyg');
        if(wysiwyg) {
            const html = `<span class="protyle-custom open-block-link" data-type="a" data-href="siyuan://blocks/${id}" style="display:none;"></span>`;
            wysiwyg.insertAdjacentHTML('beforeend', html);
            const link = wysiwyg.querySelector('.open-block-link');
            link.click();
            link.remove();
        } else {
            window.open('siyuan://blocks/' + id);
        }
    }
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    // ui
    // const item = await optionsDialog(target, data); // data格式 [{title:'', value: '', hpath:'', id: 'blockId', extends:'{}'},...]
    // const item = await optionsDialog(target, (keyword) => {}) // 回调函数需返回 [{title:'', value: '', hpath:'', id: 'blockId', extends:'{}'}, ...]
    // target 对话框显示在哪个元素附近，也可以是对象，指定显示位置，如果{left:0, top:0}
    // data 是对象数组或数据返回函数；afterRender 是渲染完成后的回调，一般不需要
    // options 选项 {showInput: true/false, focusInput: true/false} focusInput仅移动端false有效
    // 返回值 item是列表选项的dom元素，可通过item.dataset.xxx获取对应的值，比如item.dataset.value
    // see https://github.com/siyuan-note/siyuan/blob/a2a678c5fbb560e3b265dc2c690f568bcf15a663/app/src/protyle/render/av/relation.ts#L55
    function optionsDialog(target, data, options, afterRender) {
        options = { showInput: true, focusInput: true, ...options };
        return new Promise((resolve) => {
            const menu = window.siyuan.menus.menu;
            menu.remove();
            menu.addItem({
                iconHTML: "",
                type: "empty",
                label: `
                    <div class="fn__flex-column b3-menu__filter">
                        <input class="b3-text-field fn__flex-shrink ${options.showInput?'':'fn__none'}"/>
                        <div class="fn__hr ${options.showInput?'':'fn__none'}"></div>
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
                    if(options.showInput && options.focusInput) setTimeout(()=>element.querySelector("input").focus(), 100);
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
        <svg aria-label="${item?.current || '当前块'}" style="margin: 0 0 0 4px" class="b3-list-item__hinticon ariaLabel${item?.current || (item?.id && target?.dataset?.nodeId && item?.id === target?.dataset?.nodeId) ? "" : " fn__none"}"><use xlink:href="#iconInfo"></use></svg>
    </div>`;
            });
            element.innerHTML = html;
        }
        function escapeHtml(html) {
            if (!html) return html;
            if(typeof html !== 'string') html = html.toString();
            return html.replace(/&/g, "&amp;").replace(/</g, "&lt;");
        }
        function escapeGreat(html) {
            if(typeof html !== 'string') html = html.toString();
            return html.replace(/</g, "&lt;");
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
}, 2000);