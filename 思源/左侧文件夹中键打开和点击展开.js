// 左侧文件夹中键打开和点击展开
// pc版 中键打开，单击展开
// 触屏版 长按打开 点击展开
// see https://ld246.com/article/1736401552973
(()=>{
    whenElementsExist(':is(.file-tree, [data-type="sidebar-file"]) .b3-list.b3-list--background').then((trees) => {
        trees.forEach(tree => {
            //////// pc版 中键打开，单击展开 ///////////
            if(!isTouchDevice()) {
                // 绑定鼠标单击
                tree.addEventListener('click', (event) => {
                    const {toggleBtn} = isTreeFolder(event.target);
                    if(!toggleBtn) return;
                    if (event.target.classList.contains("b3-list-item__text")){
                        event.stopPropagation();
                        event.preventDefault();
                        toggleBtn.click();
                    }
                });
        
                // 绑定中键单击
                tree.addEventListener('mousedown', (event) => {
                    if (event.button === 1) {
                        const {li} = isTreeFolder(event.target);
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
                    const {toggleBtn} = isTreeFolder(event.target);
                    if(!toggleBtn) return;
                    if (event.target.classList.contains("b3-list-item__text")||event.target.classList.contains("b3-list-item__icon")){
                        event.stopPropagation();
                        event.preventDefault();
                        toggleBtn.click();
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