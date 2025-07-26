// 通过toolbar按钮开启和关闭悬浮窗锁定状态
// see https://ld246.com/article/1751379117488/comment/1753415643697?r=wilsons#comments
(async ()=>{
    // 是否记住开启状态 true 记住 false 不记住
    // 不记住时，刷新页面后默认是不开启悬浮窗锁定
    const isStoreOpenStatus = true;

    // 不支持手机版
    if(isMobile()) return;
    // 获取开关状态
    let openAttrStatus = {isOpenAttr:false};
    if(isStoreOpenStatus) {
        openAttrStatus = await getFile('/data/storage/block_popover_status.json') || '{"isOpenAttr":false}';
        openAttrStatus = JSON.parse(openAttrStatus);
        if(openAttrStatus.code && openAttrStatus.code !== 0) {
            openAttrStatus = {isOpenAttr:false};
        }
    }
    // 添加toolbar按钮
    whenElementExist('#toolbar .fn__ellipsis').then((el)=>{
        if(!el) return;
        const ariaLabel = openAttrStatus.isOpenAttr ? '点击关闭悬浮窗锁定' : '点击开启悬浮窗锁定';
        const icon = openAttrStatus.isOpenAttr ? '#iconUnpin' : '#iconPin';
        const html = `<div data-menu="true" id="openAttr" class="toolbar__item ariaLabel" aria-label="${ariaLabel}" data-location="right"><svg><use xlink:href="${icon}"></use></svg></div>`;
        el.insertAdjacentHTML('afterend', html);
        const openAttrBtn = el.nextElementSibling;
        openAttrBtn.addEventListener('click', () => {
            const svgUse = openAttrBtn.querySelector("svg use");
            const tooltip = document.querySelector('#tooltip:not(fn__none)');
            if(!openAttrStatus.isOpenAttr) {
                // 开启悬浮窗锁定
                openAttrStatus.isOpenAttr = true;
                svgUse.setAttribute('xlink:href', '#iconUnpin');
                openAttrBtn.setAttribute('aria-label', '点击关闭悬浮窗锁定');
                if(tooltip) tooltip.textContent = '点击关闭打开悬浮窗锁定';
            } else {
                // 关闭悬浮窗锁定
                openAttrStatus.isOpenAttr = false;
                svgUse.setAttribute('xlink:href', '#iconPin');
                openAttrBtn.setAttribute('aria-label', '点击开启悬浮窗锁定');
                if(tooltip) tooltip.textContent = '点击开启悬浮窗锁定';
            }
            // 存储状态
            if(isStoreOpenStatus) {
                putFile('/data/storage/block_popover_status.json', JSON.stringify(openAttrStatus));
            }
        });
    });
    
    // 监听悬浮窗出现
    observePopoverOpen((popover) => {
        if(!popover || !openAttrStatus.isOpenAttr) return;
        // 默认钉住
        if(popover?.dataset.pin === 'false') {
            popover.querySelector('[data-type="pin"]').click();
        }
        // 双击标题关闭
        if(!popover?.dblclickHandle){
            popover.dblclickHandle = true;
            popover.querySelector('.resize__move').addEventListener('dblclick', (e) => {
                e.stopPropagation();
                popover.querySelector('[data-type="close"]').click();
            });
        }
    });
    
    /**
     * 监控 body 直接子元素中 .block__popover.block__popover--open 的添加，并将其居中显示
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observePopoverOpen(callback) {
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是 .block__popover.block__popover--open
                        if (
                            node.nodeType === 1 && // 确保是元素节点
                            node.classList.contains('block__popover')
                        ) {
                            whenElementExist(()=>node.classList.contains('block__popover--open')).then((isExist) => {
                                if(isExist) callback(node);
                            });
                        }
                    });
                }
            }
        });
    
        // 开始观察 body 的直接子元素的变化
        observer.observe(document.body, {
            childList: true, // 监听子节点的添加和删除
            subtree: false, // 仅监听直接子元素，不监听子孙元素
        });
    
        // 返回 observer 实例，便于后续断开监听
        return observer;
    }

    // 等待元素出现
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
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    async function getFile(path) {
        return fetch("/api/file/getFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
        }).then((response) => {
            if (response.ok) {
                return response.text();
            } else {
                throw new Error("Failed to get file content");
            }
        }).catch((error) => {
            console.error(error);
        });
    }
    // 存储文件，支持创建文件夹，当isDir true时创建文件夹，忽略文件
    async function putFile(path, content = '', isDir = false) {
        const formData = new FormData();
        formData.append("path", path);
        formData.append("isDir", isDir)
        formData.append("file", new Blob([content]));
        const result = await fetch("/api/file/putFile", { // 写入js到本地
            method: "POST",
            body: formData,
        });
        const json = await result.json();
        return json;
    }
})();