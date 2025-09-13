// 滚动时自动定位大纲位置
// see 
(()=>{
    eventBusOn('loaded-protyle-static', (event) => {
        const protyle = event?.detail?.protyle;
        const protyleContent = protyle?.element?.querySelector('.protyle-content');
        const wysiwyg = protyle?.element?.querySelector('.protyle-wysiwyg');
        // 滚动时执行
        let ticking = false;
        if(!protyleContent.scrollEventOutline) {
            protyleContent.scrollEventOutline = true;
            protyleContent?.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                  openCursorHeading('scroll', wysiwyg);
                  ticking = false;
                });
                ticking = true;
              }
            });
        }
        // 文档切换事件
        eventBusOn('switch-protyle', () => {
            setTimeout(()=>openCursorHeading('load', wysiwyg), 200);
        });
        // 页面加载时执行
        setTimeout(()=>openCursorHeading('load', wysiwyg), 800);
    });
    // 大纲加载时执行
    setTimeout(()=>{
        whenOutlineExist((outline, isExist) => {
            if(isExist) return; // 已存在返回
            const wysiwyg = getProtyle()?.querySelector('.protyle-wysiwyg');
            setTimeout(()=>openCursorHeading('load', wysiwyg), 200);
        });
    }, 2000);
    function getTopestHead(by = 'scroll', parentNode) {
        return [...(parentNode || document).querySelectorAll('.h1,.h2,.h3,.h4,.h5,.h6')].find(h => {
            const top = h.getBoundingClientRect().top;
            return by === 'scroll' ? top > 80 && top < 160 : top > 80;
        });
    }
    function openCursorHeading(by, parentNode) {
        //获取是否在heading中
        const heading = getTopestHead(by, parentNode);
        if(!heading) return;
        // 展开光标处的标题
        headingNodeId = heading.dataset.nodeId;
        node = document.querySelector('.sy__outline [data-node-id="'+headingNodeId+'"]');
        if(node && ['scroll', 'load'].includes(by)) {
            // 滚动时，设置大纲选中状态
            document.querySelector('.sy__outline li.b3-list-item.b3-list-item--focus')?.classList?.remove('b3-list-item--focus');
            node?.classList?.add('b3-list-item--focus');
            node?.scrollIntoView({block: 'center'});
        }
        // 遍历节点的祖先节点
        while (node && !node.classList.contains('b3-list')) {
            if (node.tagName === 'UL' && node.classList.contains('fn__none')) {
                // 展开箭头
                const li = node.previousElementSibling;
                if(li){
                    const arrowSvg = li.querySelector('.b3-list-item__toggle svg.b3-list-item__arrow:not(.b3-list-item__arrow--open)');
                    if(arrowSvg) arrowSvg.classList.add('b3-list-item__arrow--open');
                }
                // 移除.fn__none类
                node.classList.remove('fn__none');
            }
            // 向上查找父节点
            node = node.parentElement;
        }
    }
    function eventBusOn(eventName, callback) {
        const pluginName = 'my-custom-plugin';
        if(window.siyuan.ws.app.plugins?.length === 0) {
            console.log('绑定事件'+eventName+'失败，请至少安装一个插件');
            return false;
        }
        let myPlugin = window.siyuan.ws.app.plugins.find(item=>item.name === pluginName);
        if(!myPlugin) {
            const Plguin = Object.getPrototypeOf(window.siyuan.ws.app.plugins[0].constructor);
            const MyPlugin = class extends Plguin{};
            myPlugin = new MyPlugin({app:window.siyuan.ws.app.appId, name:pluginName, displayName:pluginName});
            myPlugin.openSetting = null; // 防止顶部插件按钮添加设置菜单
            window.siyuan.ws.app.plugins.push(myPlugin);
        }
        myPlugin.eventBus.on(eventName, callback);
        return true;
    }
    function whenOutlineExist(callback) {
        // 确保回调函数有效
        if (typeof callback !== 'function') {
            console.error('onOutlineExist: 参数必须是函数');
            return;
        }
        // 获取已存在的容器（.layout__dockr 或 .layout__dockl）
        const containers = document.querySelectorAll('.layout__dockr, .layout__dockl');
        if(!containers || containers.length === 0){
            console.error('[onOutlineExist] 未找到 .layout__dockr 或 .layout__dockl');
            return;
        }
        // 已存在直接返回
        const outline = document.querySelector('.sy__outline');
        if(outline) {
            callback(outline, true);
            return;
        }
        // 创建 MutationObserver 监听后代中 .sy__outline 的添加
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType !== Node.ELEMENT_NODE) return;
                        // 检查节点自身是否是 .sy__outline
                        if (node.matches('.sy__outline')) {
                            callback(node);
                            observer.disconnect();
                        }
                    });
                }
            }
        });
        // 开始监听容器的子树变化
        observer.observe(containers[0], { childList: true, subtree: true});
        observer.observe(containers[1], { childList: true, subtree: true});
    }
    function getProtyle() {
        return document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
          .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
    }
})();