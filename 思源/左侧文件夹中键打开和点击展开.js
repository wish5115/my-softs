// 左侧文件夹中键打开和点击展开
// pc版 中键打开，单击展开
// 触屏版 长按打开 点击展开
// see https://ld246.com/article/1736401552973
(()=>{
    // 空文件夹图标代码 📂 1f4c2  📁 1f4c1
    const emptyFolderIconCode = '1f4c2';

    // 思源默认图标
    const defaultIconCode = siyuan?.storage["local-images"]?.folder || '1f4d1';
    
    whenElementsExist(':is(.file-tree, [data-type="sidebar-file"]) .b3-list.b3-list--background').then((trees) => {
        trees.forEach(tree => {
            //////// pc版 中键打开，单击展开 ///////////
            if(!isTouchDevice()) {
                // 绑定鼠标单击
                tree.addEventListener('click', async (event) => {
                    const {toggleBtn, li} = isTreeFolder(event.target);
                    if(!toggleBtn) return;
                    if (event.target.classList.contains("b3-list-item__text")){
                        event.stopPropagation();
                        event.preventDefault();
                        toggleBtn.click();

                        // 添加图标，文件夹的文件内容为空，修改为指定的图标
                        addIcon(li);
                    }
                });
        
                // 绑定中键单击，无论文件夹或文件都打开
                tree.addEventListener('mousedown', (event) => {
                    if (event.button === 1) {
                        event.preventDefault();
                        //const {li} = isTreeFolder(event.target);
                        const li = event.target.closest('li[data-type="navigation-file"]:not([data-type="navigation-root"])');
                        if(!li) return;
                        li.click();
                    }
                });
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
                        addIcon(li);
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

    // 等待多个元素渲染完成
    function whenElementsExist(selector) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let elements = null;
                if (typeof selector === 'function') {
                    elements = selector();
                } else {
                    elements = document.querySelectorAll(selector);
                }
                if (elements && elements.length > 0) {
                    resolve(elements);
                } else {
                    requestAnimationFrame(checkForElement);
                }
            };
            checkForElement();
        });
    }
})();