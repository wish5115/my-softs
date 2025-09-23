// 滚动时自动定位大纲位置
// 暂不支持手机和预览
// version 0.0.6
// 0.0.6 优化大纲滚动方式，只能判断滚动方向，更符合使用习惯
// 0.0.5 改进计算标题位置算法，解决大纲点击标题时，大纲标题定位偏差问题
// 0.0.4 改进计算标题位置算法：根据上下滚动分别计算标题位置，更符合实际情况
// 0.0.3 改进当大纲标题的祖先被折叠时，自动临时展开祖先元素（临时的含义指如果思源支持持久化大纲后不会影响持久化状态）
// 0.0.2 当大纲从未打开时及早返回，增强性能；当大纲被隐藏后再次打开自动定位标题位置
// see https://ld246.com/article/1757773937694
(()=>{
    if(isMobile()) return;
    let protyleContentTop = 0, outlineItemClicking = false;
    eventBusOn('loaded-protyle-static', (event) => {
        const protyle = event?.detail?.protyle;
        const protyleContent = protyle?.element?.querySelector('.protyle-content');
        const wysiwyg = protyle?.element?.querySelector('.protyle-wysiwyg');
        let lastScrollTop = protyleContent?.scrollTop;
        protyleContentTop = protyleContent?.getBoundingClientRect()?.top;
        // 滚动时执行
        let ticking = false;
        if(!protyleContent.scrollEventOutline) {
            protyleContent.scrollEventOutline = true;
            protyleContent?.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    protyleContentTop = protyleContent?.getBoundingClientRect()?.top;
                    const currentScrollTop = protyleContent.scrollTop;
                    const to = currentScrollTop >= lastScrollTop ? 'down' : 'up';
                    lastScrollTop = currentScrollTop;
                    openCursorHeading('scroll', wysiwyg, to);
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
            const protyleContent = protyle?.querySelector('.protyle-content');
            protyleContentTop = protyleContent?.getBoundingClientRect()?.top;
            setTimeout(()=>openCursorHeading('load', wysiwyg), 200);
        });
    }, 2000);
    function getTopestHead(by = 'scroll', parentNode, to) {
        const heads = [...(parentNode || document).querySelectorAll('.h1,.h2,.h3,.h4,.h5,.h6')];
        let head;
        if(by === 'scroll' && to === 'up') {
            heads.reverse();
            head = heads.find(h => {
                const top = h.getBoundingClientRect().top;
                return top < protyleContentTop && Math.abs(top - protyleContentTop) > 1;
            });
        } else {
            // load down
            let index = heads.findIndex(h => {
                const top = h.getBoundingClientRect().top;
                return top > protyleContentTop && Math.abs(top - protyleContentTop) > 1;
            });
            index = index - 1 >= 0 ? index - 1 : index;
            head = heads[index];
        }
        return head;
    }
    function openCursorHeading(by, parentNode, to) {
        if(outlineItemClicking) return;
        // 从未打开过大纲直接返回
        const outline = document.querySelector('.sy__outline');
        if(!outline) return;
        // 监控大纲可视时滚动到当前标题
        if(!outline.obResizeEvent) {
            outline.obResizeEvent = true;
            observeOutlineResize(outline, parentNode);
        }
        // 大纲绑定点击事件
        if(!outline.clickEvent) {
            outline.clickEvent = true;
            outline.addEventListener('click', (e) => {
                outlineItemClicking = true;
                setTimeout(()=>outlineItemClicking = false, 200);
            }, true);
        }
        //获取是否在heading中
        const heading = getTopestHead(by, parentNode, to);
        if(!heading) return;
        // 展开光标处的标题
        const headingNodeId = heading.dataset.nodeId;
        const node = outline.querySelector('[data-node-id="'+headingNodeId+'"]');
        if(node && ['scroll', 'load'].includes(by)) {
            // 展开父标题
            const ul = node.closest('ul.fn__none');
            if(ul) {
                const parentsArrow = ul?.previousElementSibling?.querySelector('svg.b3-list-item__arrow');
                if(parentsArrow && !parentsArrow.classList.contains('b3-list-item__arrow--open')) parentsArrow.classList.add('b3-list-item__arrow--open');
                node.closest('ul.fn__none').classList.remove('fn__none');
            }
            // 滚动时，设置大纲选中状态
            document.querySelector('.sy__outline li.b3-list-item.b3-list-item--focus')?.classList?.remove('b3-list-item--focus');
            node?.classList?.add('b3-list-item--focus');
            if(!isNodeInContainer(node, '.sy__outline > .fn__flex-1')) node?.scrollIntoView({ block: 'nearest' });
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
    function observeOutlineResize(outline, parentNode) {
        let timerId;
        const resizeObserver = new ResizeObserver(entries => {
            if(timerId) clearTimeout(timerId);
            timerId = setTimeout(() => {
                if(outline?.getBoundingClientRect()?.width > 0) {
                    //获取是否在heading中
                    const heading = getTopestHead('load', parentNode);
                    if(!heading) return;
                    // 展开光标处的标题
                    const headingNodeId = heading.dataset.nodeId;
                    const node = outline.querySelector('[data-node-id="'+headingNodeId+'"]');
                    if(node && !isNodeInContainer(node, '.sy__outline > .fn__flex-1')) node?.scrollIntoView({ block: 'nearest' });
                }
            }, 50);
        });
        resizeObserver.observe(outline);
    }
    function isNodeInContainer(node, container) {
      node = typeof node === 'string' ? document.querySelector(node) : node;
      container = typeof container === 'string' ? document.querySelector(container) : container;
      const nodeRect = node.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return (
        nodeRect.top >= containerRect.top && // 顶部在容器内
        nodeRect.bottom <= containerRect.bottom // 底部在容器内
      );
    }
    function getProtyle() {
        return document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
          .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
    }
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
})();