// 动态文件夹图标
// 注意，这个代码不会真正改变图标，当你不使用该代码时一切复原，请放心使用
// 注意，该代码3.1.11之后的版本才支持，之前的版本不会有任何效果
(()=>{
    // 图标类型 emoji 或 custom custom代表用户自定义emoji
    const iconType = 'emoji';
    
    // 折叠文件夹图标 📁 1f4c1 custom输入/emojis/下的路径即可 比如 demo/folder.png
    const folderIconCode = '1f4c1';
    
    // 展开文件夹图标 📂 1f4c2 custom输入/emojis/下的路径即可 比如 demo/unfolder.png
    const unFolderIconCode = '1f4c2';

    // 设置默认图标，用户自定义的图标不会修改，不修改保存为空即可
    // 注意，不会真正改变图标，当不使用时一切复原
    const defaultIcon = folderIconCode;

    // 不支持设置默认图标则返回，3.1.11之后的版本才支持
    if(!siyuan?.storage["local-images"]?.folder) return;

    // 修改默认图标
    if(defaultIcon) {
        if(siyuan?.storage["local-images"]?.folder) {
            siyuan.storage["local-images"].folder = defaultIcon;
        }
    }

    const folderIcon = iconType === 'emoji' ? unicode2Emoji(folderIconCode) : `<img class="" src="/emojis/${folderIconCode}">`;
    const unFolderIcon = iconType === 'emoji' ? unicode2Emoji(unFolderIconCode) : `<img class="" src="/emojis/${unFolderIconCode}">`;

    whenElementExist(':is(.file-tree.sy__file, [data-type="sidebar-file"]) > .fn__flex-1').then(tree => {
        tree.addEventListener('click', async (event) => {
            await sleep(40);
            const toggleBtn = event.target.closest('.b3-list-item__toggle:not(.fn__hidden)');
            if(!toggleBtn) return;
            const li = toggleBtn.closest('[data-type="navigation-file"]');
            if(!li) return;
            const icon = li.querySelector('.b3-list-item__icon');
            const iconEmoji = icon.innerHTML.trim();
            const arrow = toggleBtn.querySelector('.b3-list-item__arrow');
            const isOpen = arrow.classList.contains('b3-list-item__arrow--open');
            const newIcon = isOpen ? unFolderIcon : folderIcon;
            if([folderIcon, unFolderIcon].includes(iconEmoji) && iconEmoji !== newIcon) {
                icon.innerHTML = newIcon;
            }
        });
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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