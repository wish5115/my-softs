// 多彩Tab
// 每次打开tab时随机生成
// see https://ld246.com/article/1745131935346
(()=>{
    // 添加tab样式，可根据自己需要添加或修改样式
    const tabStyles = [
        'background-color:var(--b3-font-background1)',
        'background-color:var(--b3-font-background2)',
        'background-color:var(--b3-font-background3)',
        'background-color:var(--b3-font-background4)',
        'background-color:var(--b3-font-background5)',
        'background-color:var(--b3-font-background6)',
        'background-color:var(--b3-font-background7)',
        'background-color:var(--b3-font-background8)',
        'background-color:var(--b3-font-background9)',
        'background-color:var(--b3-font-background10)',
        'background-color:var(--b3-font-background11)',
        'background-color:var(--b3-font-background12)',
    ];
    
    // 手机版返回
    if(isMobile()) return;
    
    // 监听dock加载完毕
    whenElementExist('.layout__center').then((center)=>{
        const tabs = center.querySelectorAll('li[data-type="tab-header"]');
        tabs.forEach((tab)=>{
            setTabBackground(tab);
        });
        observeElementAdded(center, 'li[data-type="tab-header"]', (tab) => {
            setTabBackground(tab);
        });
    });

    function setTabBackground(tab) {
        const style = getRandomStyle();
        if(!style) return;
        tab.style = style;
    }
    
    let lastSelected = null; // 记录上一次选择的样式
    function getRandomStyle(defaultStyle = '') {
        const validStyles = tabStyles.filter(style => style.trim() !== '');
        // 如果没有有效样式，返回默认样式
        if (validStyles.length === 0) {
            return defaultStyle;
        }
        // 如果只有一个有效样式，直接返回它
        if (validStyles.length === 1) {
            lastSelected = validStyles[0];
            return validStyles[0];
        }
        let randomIndex, selectedStyle;
        // 确保生成的样式与上一次不同
        do {
            randomIndex = Math.floor(Math.random() * validStyles.length);
            selectedStyle = validStyles[randomIndex];
        } while (selectedStyle === lastSelected);
        // 更新 lastSelected 并返回结果
        lastSelected = selectedStyle;
        return selectedStyle;
    }

    /**
     * 监控 center 的后代元素 li[data-type="tab-header"] 被添加
     * @param {string} container - 容器选择器（如 "center"）
     * @param {string} targetSelector - 目标元素选择器（如 "li[data-type='tab-header']")
     * @param {Function} callback - 当目标元素被添加时的回调函数
     */
    function observeElementAdded(container, targetSelector, callback) {
        // 创建 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 遍历新增的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查新增节点是否匹配目标选择器
                        if (node.matches && node.matches(targetSelector)) {
                            callback(node); // 触发回调
                        }
                    });
                }
            });
        });
    
        // 配置观察选项
        const config = {
            childList: true, // 监听子节点的变化
            subtree: true,   // 监听所有后代节点的变化
        };
    
        // 开始观察
        observer.observe(container, config);
    
        // 返回 observer 实例，方便后续停止观察
        return observer;
    }

// 如果需要停止观察，可以调用 stopObserving.disconnect();

    function isMobile() {
        return !!document.getElementById("sidebar");
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