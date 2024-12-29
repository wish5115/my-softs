// 复制或移动子菜单到主菜单
// see https://ld246.com/article/1735472731026
(()=>{
    // true 拷贝子菜单到主菜单，false 移动子菜单到主菜单
    const byCloneMenu = false;

    // 监听图片右键菜单
    whenElementExist('#commonMenu .b3-menu__items').then((menuItems) => {
        observeImagesMenu(menuItems, async ()=>{
            await sleep(40);
            const subMenuTexts = menuItems.querySelectorAll('.b3-menu__submenu .b3-menu__label');
            if(!subMenuTexts || subMenuTexts.length === 0) return;
            const percent25 = Array.from(subMenuTexts).find(label => label.textContent === '25%');
            if(!percent25) return;
            if(byCloneMenu){
                // 拷贝菜单
                const percent25Button = percent25.closest('button');
                if(!percent25Button) return;
                const clonePercent25Button = percent25Button.cloneNode(true);
                const clonePercent25 = clonePercent25Button.querySelector('.b3-menu__label');
                clonePercent25.textContent = '宽度 25%';
                const svgString = `<svg class="b3-menu__icon" style=""><use xlink:href="#"></use></svg>`;
                clonePercent25.insertAdjacentHTML('beforebegin', svgString);
                clonePercent25Button.onclick = () => {
                    percent25Button.click();
                };
                const percent25ParentButton = percent25Button.parentElement?.closest('button');
                if(!percent25ParentButton) return;
                percent25ParentButton.before(clonePercent25Button);
            } else {
                // 移动菜单
                percent25.textContent = '宽度 25%';
                const svgString = `<svg class="b3-menu__icon" style=""><use xlink:href="#"></use></svg>`;
                percent25.insertAdjacentHTML('beforebegin', svgString);
                const percent25Button = percent25.closest('button');
                if(!percent25Button) return;
                const percent25ParentButton = percent25Button.parentElement?.closest('button');
                if(!percent25ParentButton) return;
                percent25ParentButton.before(percent25Button);
            }
        });
    });

    /**
     * 监控 body 直接子元素中 #commonMenu 的添加
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observeImagesMenu(selector, callback) {
        let hasKeywordPng = false;
        let hasKeywordOcr = false;
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是图片菜单
                        if(hasKeywordPng && hasKeywordOcr) return;
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.copyAsPNG) {
                            hasKeywordPng = true;
                        }
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim()?.toUpperCase() === 'OCR') {
                            hasKeywordOcr = true;
                        }
                        if(hasKeywordPng && hasKeywordOcr) {
                           callback();
                           setTimeout(() => {
                               hasKeywordPng = false;
                               hasKeywordOcr = false;
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

    // 延迟执行
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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