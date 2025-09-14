// 左侧文件夹中键打开和点击展开
// pc版 中键打开，单击展开
// 触屏版 长按打开 点击展开
// version 0.0.3
// 0.0.3 修复排序等导致按键失效问题
// 0.0.2 改进在没有功能键的时候才生效，防止影响功能键的操作
// see https://ld246.com/article/1736401552973
(()=>{

    // 打开文件夹的方式 midclick 中键 dblclick 双击
    const openFolderBy = 'midclick';

    // 是否更改空文件夹图标 true更改 false不更改
    const isUpdateFolderIconWhenItEmpty = false;
    
    // 空文件夹图标代码，可选项 📂 1f4c2  📁 1f4c1
    const emptyFolderIconCode = '1f4c2';

    // 思源默认图标，首先读取用户自定义的默认图标，没有用官方默认图标，也可在这里写死
    const defaultIconCode = siyuan?.storage["local-images"]?.folder || '1f4d1';
    
    waitForElement(':is(.sy__file, [data-type="sidebar-file"]) > .fn__flex-1').then((tree) => {
        //.b3-list.b3-list--background
        
        //////// pc版 中键/双击打开，单击展开 ///////////
        if(!isTouchDevice()) {
            // 绑定鼠标单击
            tree.addEventListener('click', async (event) => {
                if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                const {toggleBtn, li} = isTreeFolder(event.target);
                if(!toggleBtn) return;
                if (event.target.classList.contains("b3-list-item__text")){
                    event.stopPropagation();
                    event.preventDefault();
                    toggleBtn.click();

                    // 添加图标，文件夹的文件内容为空，修改为指定的图标
                    if(isUpdateFolderIconWhenItEmpty) addIcon(li);
                }
            }, true);
    
            // 绑定中键单击，无论文件夹或文件都打开
            if(openFolderBy === 'midclick') {
                tree.addEventListener('mousedown', (event) => {
                    if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                    if (event.button === 1) {
                        event.preventDefault();
                        //const {li} = isTreeFolder(event.target);
                        const li = event.target.closest('li[data-type="navigation-file"]:not([data-type="navigation-root"])');
                        if(!li) return;
                        li.click();
                    }
                });
            }
            // 绑定双击事件，无论文件夹或文件都打开
            if(openFolderBy === 'dblclick') {
                tree.addEventListener('dblclick', (event) => {
                    if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    //const {li} = isTreeFolder(event.target);
                    const li = event.target.closest('li[data-type="navigation-file"]:not([data-type="navigation-root"])');
                    if(!li) return;
                    li.click();
                });
            }
        }

        //////// 触屏版 长按打开 点击展开 ///////////
        if(isTouchDevice()) {
            let pressTimer;

            // 点击事件
            function handleTap(event) {
                const {toggleBtn, li} = isTreeFolder(event.target);
                if(!toggleBtn) return;
                if (event.target.classList.contains("b3-list-item__text")||event.target.classList.contains("b3-list-item__icon")){
                    event.stopPropagation();
                    event.preventDefault();
                    toggleBtn.click();

                    // 添加图标，文件夹的文件内容为空，修改为指定的图标
                    if(isUpdateFolderIconWhenItEmpty) addIcon(li);
                }
            }

            // 长按事件
            function handleLongPress(event) {
                const {li} = isTreeFolder(event.target);
                if(!li) return;
                li.click();
            }
            
            tree.addEventListener('touchstart', (event) => {
                pressTimer = setTimeout(() => {
                    handleLongPress(event);
                }, 500);
            });
            
            tree.addEventListener('touchend', (event) => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    handleTap(event);
                }
            });
            
            tree.addEventListener('touchmove', (event) => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            });
        }
    });

    async function addIcon(li) {
        const isFolderFileEmpty = await isFileEmpty(li.dataset.nodeId);
        if(isFolderFileEmpty) {
            const icon = li.querySelector('.b3-list-item__icon');
            const defaultIcon = unicode2Emoji(defaultIconCode);
            // 用户已自定义图标了返回
            if(icon?.innerHTML?.trim() !== defaultIcon) return;
            const newIcon = unicode2Emoji(emptyFolderIconCode);
            // 空文件图标不等于现有图标则修改
            if(newIcon !==  icon?.innerHTML?.trim()) {
                const result = await requestApi('/api/attr/setBlockAttrs', {
                    "id": li.dataset.nodeId,
                    "attrs": { "icon": emptyFolderIconCode }
                });
                if(result.code === 0) {
                    icon.innerHTML = newIcon;
                }
            }
        }
    }

    async function isFileEmpty(id) {
        const ret = await requestApi('api/block/getTreeStat', {id});
        return ret && ret.code === 0 && ret.data && (ret.data?.runeCount === 0 || ret.data?.stat?.runeCount === 0) || false;
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    function isTreeFolder(element) {
        // 判断目标元素是否是 .sy__file li[data-type="navigation-file"]
        const li = element.closest('li[data-type="navigation-file"]:not([data-type="navigation-root"])');
        if(!li) return false;
        // 非文件夹返回
        const toggleBtn = li.querySelector(':is(.b3-list-item__toggle--hl,.b3-list-item__toggle):not(.fn__hidden)');
        if(!toggleBtn) return false;
        return {li, toggleBtn};
    }

    function isTouchDevice() {
        return ("ontouchstart" in window) && navigator.maxTouchPoints > 1;
    }

    // unicode转emoji
    // 使用示例：unicode2Emoji('1f4c4');
    // see https://ld246.com/article/1726920727424
    function unicode2Emoji(unicode, className = "", needSpan = false, lazy = false) {
        if (!unicode) {
            return "";
        }
        let emoji = "";
        if (unicode.indexOf(".") > -1) {
            emoji = `<img class="${className}" ${lazy ? "data-" : ""}src="/emojis/${unicode}"/>`;
        } else {
            try {
                unicode.split("-").forEach(item => {
                    if (item.length < 5) {
                        emoji += String.fromCodePoint(parseInt("0" + item, 16));
                    } else {
                        emoji += String.fromCodePoint(parseInt(item, 16));
                    }
                });
                if (needSpan) {
                    emoji = `<span class="${className}">${emoji}</span>`;
                }
            } catch (e) {
                // 自定义表情搜索报错 https://github.com/siyuan-note/siyuan/issues/5883
                // 这里忽略错误不做处理
            }
        }
        return emoji;
    }
    function waitForElement(selector, timeout = 0, parentNode) {
        return new Promise((resolve) => {
            if(typeof parentNode === 'string') parentNode = document.querySelector(parentNode);
            let timeoutId, resolved = false, container = parentNode||document, node = container?.querySelector(selector);
            if(node) {resolved = true; resolve(node); return;}
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type !== 'childList') continue;
                    for (const node of mutation.addedNodes) {
                        if(resolved) break;
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;
                        if (node.matches(selector)) {
                            resolved = true;
                            if(timeoutId) clearTimeout(timeoutId);
                            observer.disconnect();
                            resolve(node);
                            return;
                        }
                    }
                }
            });
            observer.observe(container, { childList: true, subtree: true});
            if(timeout) timeoutId = setTimeout(() => {
                resolved = true;
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }
})();