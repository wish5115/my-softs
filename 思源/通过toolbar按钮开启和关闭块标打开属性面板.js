// 通过toolbar按钮开启和关闭块标打开属性面板
// see https://ld246.com/article/1750855839822
(async ()=>{
    // 是否记住开启状态 true 记住 false 不记住
    // 不记住时，刷新页面后默认是不开启打开属性面板
    const isStoreOpenAttrStatus = true;

    // 不支持手机版
    if(isMobile()) return;
    
    // 获取开关状态
    let openAttrStatus = {isOpenAttr:false};
    if(isStoreOpenAttrStatus) {
        openAttrStatus = await getFile('/data/storage/open_attr_status.json') || '{"isOpenAttr":false}';
        openAttrStatus = JSON.parse(openAttrStatus);
        if(openAttrStatus.code && openAttrStatus.code !== 0) {
            openAttrStatus = {isOpenAttr:false};
        }
    }
    
    // 添加toolbar按钮
    whenElementExist('#toolbar .fn__ellipsis').then((el)=>{
        if(!el) return;
        const ariaLabel = openAttrStatus.isOpenAttr ? '关闭打开属性面板' : '开启打开属性面板';
        const style = openAttrStatus.isOpenAttr ? 'transform: scaleX(-1);' : '';
        const html = `<div data-menu="true" id="openAttr" class="toolbar__item ariaLabel" aria-label="${ariaLabel}" data-location="right"><svg style="${style}"><use xlink:href="#iconParagraph"></use></svg></div>`;
        el.insertAdjacentHTML('afterend', html);
        const openAttrBtn = el.nextElementSibling;
        openAttrBtn.addEventListener('click', () => {
            const svg = openAttrBtn.querySelector("svg");
            const tooltip = document.querySelector('#tooltip:not(fn__none)');
            if(!openAttrStatus.isOpenAttr) {
                // 开启打开属性面板
                openAttrStatus.isOpenAttr = true;
                svg.style.transform = "scaleX(-1)";
                openAttrBtn.setAttribute('aria-label', '关闭打开属性面板');
                if(tooltip) tooltip.textContent = '关闭打开属性面板';
            } else {
                // 关闭打开属性面板
                openAttrStatus.isOpenAttr = false;
                svg.style.transform = "";
                openAttrBtn.setAttribute('aria-label', '开启打开属性面板');
                if(tooltip) tooltip.textContent = '开启打开属性面板';
            }
            // 存储状态
            if(isStoreOpenAttrStatus) {
                putFile('/data/storage/open_attr_status.json', JSON.stringify(openAttrStatus));
            }
        });
    });
    // 监听块标被点击
    document.addEventListener('click', (e)=> {
        const gutters = e.target?.closest('.protyle-gutters');
        if(gutters){
            // 打开属性面板
            if(openAttrStatus.isOpenAttr) {
                // 监听块菜单
                whenElementExist(()=>{
                    const menuItems = document.querySelector('#commonMenu .b3-menu__items');
                    const isBlockMenu = menuItems.querySelector('[data-id="cut"]') && menuItems.querySelector('[data-id="move"]');
                    if(isBlockMenu) return menuItems;  
                }).then((menuItems) => {
                    if(!menuItems) return;
                    // 打开属性面板
                    const attr = menuItems.querySelector('[data-id="attr"]');
                    if(attr) attr.click();
                    // 打开自定义属性
                    whenElementExist('div.b3-dialog--open[data-key="dialog-attr"]').then((dialog) => {
                        if(dialog) dialog.querySelector('.layout-tab-bar .item--full[data-type="custom"]').click();
                    });
                });
            }
        }
    }, true);
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