// 把无序列表转为段落
// see https://ld246.com/article/1753082550538
(async ()=>{
    // 右键菜单名
    const menuText = '把无序列表转为段落';

    // 该键为转换为段落的系统快捷键，思源默认 command/ctrl+alt+0，如果你未修改过保持空即可
    // 仅支持功能键+一个字母
    const hotKey = '';

    if(isMobile()) return;
    whenElementExist('#commonMenu .b3-menu__items').then((menuItems) => {
        observeBlockMenu(menuItems, async ()=>{
            if(menuItems.querySelector('.ulist-to-paragraph')) return;
            const turnInto = menuItems.querySelector('button[data-id="turnInto"]');
            if(!turnInto) return;
            const menuButtonHtml = `<button class="b3-menu__item ulist-to-paragraph"><svg class="b3-menu__icon " style=""><use xlink:href="#iconParagraph"></use></svg><span class="b3-menu__label">${menuText}</span></button>`;
            turnInto.insertAdjacentHTML('afterend', menuButtonHtml);
            const turnBtn = menuItems.querySelector('.ulist-to-paragraph');
            turnBtn.onclick = async () => {
                cancelUnOrderList();
            };
        });
    });
    async function cancelUnOrderList() {
        const protyle = getProtyle();
        const protyleEl = protyle.element;
        const wysiwyg = protyle.wysiwyg.element;
        const docId = protyle.block.id;
        const selectEls = protyleEl.querySelectorAll('.protyle-wysiwyg--select.list[data-subtype="u"], .protyle-wysiwyg--select .list[data-subtype="u"]');
        const ids = [...selectEls].map(el => el?.dataset?.nodeId);
        const selectEles = protyleEl.querySelectorAll(".protyle-wysiwyg--select");
        selectEles.forEach(el => el.classList.remove('protyle-wysiwyg--select'))
        for(const id of ids) {
            // 更新元素
            const list = protyleEl.querySelector(`.list[data-node-id="${id}"]`);
            list.classList.add('protyle-wysiwyg--select');
            press(hotKey||`${isMac()?'meta':'ctrl'}+alt+0`, wysiwyg);
            await sleep(50);
        }
    }
    function press(keys = [], element) {
        if(typeof keys === 'string') keys = keys.split('+');
        keys = keys.map(item=>item.trim().toLowerCase());
        const key = keys.find(item=>!['ctrl','alt','meta','shift'].includes(item));
        const code = `Key${key.toUpperCase()}`;
        let keyInit = {
            ctrlKey: keys.includes('ctrl'),
            altKey: keys.includes('alt'),
            metaKey: keys.includes('meta'),
            shiftKey: keys.includes('shift'),
            key: key.toUpperCase(),
            keyCode: key.toUpperCase().charCodeAt(0),
            code: code,
        }
        keyInit["bubbles"] = true;
        let keydownEvent = new KeyboardEvent('keydown', keyInit);
        if(typeof element === 'string') element = document.querySelector(element);
        (element || document.getElementsByTagName("body")[0]).dispatchEvent(keydownEvent);
        let keyUpEvent = new KeyboardEvent('keyup', keyInit);
        (element || document.getElementsByTagName("body")[0]).dispatchEvent(keyUpEvent);
    }
    function getProtyle() {
        try {
            if(document.getElementById("sidebar")) return window.siyuan.mobile.editor.protyle;
            const currDoc = window.siyuan?.layout?.centerLayout?.children.map(item=>item.children.find(item=>item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active')||item.panelElement.closest('[data-type="wnd"]')))).find(item=>item);
            return currDoc?.model.editor.protyle;
        } catch(e) {
            console.error(e);
            return null;
        }
    }
    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
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