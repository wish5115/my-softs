// 给文档树文档添加颜色和置顶
// see https://ld246.com/article/1741359650489
// version 0.0.4
// 0.0.3 兼容手机版
// 0.0.4 修复右键时可能出现的与上一个未关闭的菜单冲突问题
(async ()=>{
    // 是否开启置顶功能，true开启，false不开启
    const isEnableTopmost = true;

    // 是否开启颜色功能，true开启，false不开启
    const isEnableColor = true;

    // 预设颜色列表，格式 {"编码":{style:"颜色值", "description":"颜色描述"}}，编码值必须唯一
    // 也可以把该配置贴出来与大家分享您的创意
    //该颜色组采用20种人类最易识别的颜色 see https://zhuanlan.zhihu.com/p/508870810
    let colors = {
        "orangeRed": { style: "color:#e6194B", description: "橙红色" },
        "green": { style: "color:#3cb44b", description: "绿色" },
        "yellow": { style: "color:#ffe119", description: "黄色" },
        "blueDark": { style: "color:#4363d8", description: "深蓝色" },
        "orange": { style: "color:#f58231", description: "橙色" },
        "purple": { style: "color:#911eb4", description: "紫色" },
        "cyan": { style: "color:#42d4f4", description: "青色" },
        "magenta": { style: "color:#f032e6", description: "洋红色" },
        "limeGreen": { style: "color:#bfef45", description: "黄绿色" },
        "pink": { style: "color:#fabed4", description: "粉色" },
        "teal": { style: "color:#469990", description: "蓝绿色" },
        "lavender": { style: "color:#dcbeff", description: "薰衣草紫" },
        "brown": { style: "color:#9A6324", description: "棕色" },
        "beige": { style: "color:#fffac8", description: "米色" },
        "maroon": { style: "color:#800000", description: "栗色" },
        "mintGreen": { style: "color:#aaffc3", description: "薄荷绿色" },
        "olive": { style: "color:#808000", description: "橄榄色" },
        "apricot": { style: "color:#ffd8b1", description: "杏色" },
        "navyBlue": { style: "color:#000075", description: "海军蓝" },
        "gray": { style: "color:#a9a9a9", description: "灰色" },
        //"white": { style: "color:#ffffff", description: "白色" },
        //"black": { style: "color:#000000", description: "黑色" }
    };

    /////// main //////////////////////
    
    // 获取置顶数据，格式 {"docId":"order"}
    let topmostData = await getFile('/data/storage/tree_topmost.json') || '{}';
    topmostData = JSON.parse(topmostData);
    if(topmostData.code && topmostData.code !== 0) topmostData = {};

    // 获取颜色数据，格式 {"docId":"code"}，code来自colors变量编码
    let colorData = await getFile('/data/storage/tree_colors.json') || '{}';
    colorData = JSON.parse(colorData);
    if(colorData.code && colorData.code !== 0) colorData = {};
    
    // 生成样式
    genStyle();

    // 监听菜单事件
    const treeSelector = isMobile()? '#sidebar .b3-list--mobile' : '.sy__file';
    whenElementExist(treeSelector).then((fileTree) => {
        const onMenuShow = (event) => {
            const currLi = event.target.closest('li.b3-list-item:not([data-type="navigation-root"])');
            if(!currLi) return;
            // 关闭上次的菜单，防止与上一个未关闭的菜单冲突
            closeMenu();
            whenElementExist('button[data-id="rename"]').then(renameBtn => {
                if(document.querySelector('#sy_file_sp_color_top')) return;
                genTopmostMenu(renameBtn, currLi);
                genColorMenus(renameBtn, currLi);
                genSeparator(renameBtn);
            });
        };
        if(isMobile()) {
            // 监听手机版更多按钮被单击
            fileTree.addEventListener('touchend', (event) => {
                // 检查点击的目标是否是 span[data-type="more-file"]
                if (event.target.closest('span[data-type="more-file"]')) {
                    onMenuShow(event);
                }
            });
        } else {
            // 监听更多按钮被单击
            fileTree.addEventListener('mouseup', (event) => {
                // 检查点击的目标是否是 span[data-type="more-file"]
                if (event.target.closest('span[data-type="more-file"]')) {
                    onMenuShow(event);
                }
            });
            // 监听文档树右键事件
            fileTree.addEventListener('contextmenu', onMenuShow);
        }
    });

    // 添加新图标
    addSvgSymbol();

    /////// functions //////////////////////

    function genTopmostMenu(beforeBtn, currLi) {
        if(!isEnableTopmost) return;
        const menuText = topmostData[currLi.dataset.nodeId] ? '取消置顶' : '置顶';
        const html = `<button data-id="topmost" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTop"></use></svg><span class="b3-menu__label">${menuText}</span></button>`;
        beforeBtn.insertAdjacentHTML('beforebegin', html);
        beforeBtn.parentElement.querySelector('button[data-id="topmost"]').onclick = () => {
            // 保存置顶数据
            if(topmostData[currLi.dataset.nodeId]) {
                // 删除置顶
                delete topmostData[currLi.dataset.nodeId];
            } else {
                // 置顶
                topmostData[currLi.dataset.nodeId] = getOrder();
            }
            putFile('/data/storage/tree_topmost.json', JSON.stringify(topmostData));
            // 更新置顶样式
            genStyle();
            closeMenu();
        };
    }

    function genColorMenus(beforeBtn, currLi) {
        if(!isEnableColor) return;
        const html = `<button data-id="color" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTheme"></use></svg><span class="b3-menu__label">颜色</span><svg class="b3-menu__icon b3-menu__icon--small"><use xlink:href="#iconRight"></use></svg><div class="b3-menu__submenu"><div class="b3-menu__items"></div></div></button>`;
        beforeBtn.insertAdjacentHTML('beforebegin', html);
        const colorMenu = beforeBtn.parentElement.querySelector('button[data-id="color"]');
        
        // 生成子菜单
        let subMenus = '';
        // 是否显示取消颜色
        if(colorData[currLi.dataset.nodeId]){
            colors = {
                "none": { style: "color:var(--b3-theme-on-background);", description: "取消颜色" },
                ...colors
            };
        } else {
            delete colors['none'];
        }
        // 遍历生成子菜单
        for (const code in colors) {
            const item = colors[code];
            subMenus += `<button class="b3-menu__item"><span class="b3-menu__label" data-code="${code}" style="${item.style};font-weight:bold;">${item.description}</span></button>`;
        }
        
        // 显示子菜单
        colorMenu.querySelector(".b3-menu__submenu .b3-menu__items").innerHTML = subMenus;
        // 子菜单点击事件
        colorMenu.onclick = (event) => {
            if(!event.target.dataset.code) return;
            if(event.target.dataset.code === 'none') {
                // 删除颜色数据
                delete colorData[currLi.dataset.nodeId]
            } else {
                const color = colors[event.target.dataset.code];
                if(!color) return;
                // 保存颜色数据
                colorData[currLi.dataset.nodeId] = event.target.dataset.code; 
            }
            putFile('/data/storage/tree_colors.json', JSON.stringify(colorData));
            // 更新颜色样式
            genStyle();
            closeMenu();
        };
    }

    function genSeparator(beforeBtn) {
        if(!isEnableTopmost && !isEnableColor) return;
        const html = `<button data-id="separator_2" id="sy_file_sp_color_top" class="b3-menu__separator"></button>`;
        beforeBtn.insertAdjacentHTML('beforebegin', html);
    }
    
    function genStyle() {
        // 生成置顶样式
        let topmostStyle = '';
        if (isEnableTopmost) {
            for (const docId in topmostData) {
                if (topmostData.hasOwnProperty(docId)) {
                    const order = topmostData[docId];
                    topmostStyle += `
                        :is(.sy__file, #sidebar .b3-list--mobile) li[data-node-id="${docId}"] {
                            order: ${order};
                        }
                    `;
                }
            }
        }
        
        // 生成颜色样式
        let colorStyle = '';
        if (isEnableColor) {
            for (const docId in colorData) {
                if (colorData.hasOwnProperty(docId)) {
                    const code = colorData[docId];
                    colorStyle += `
                        :is(.sy__file, #sidebar .b3-list--mobile) li[data-node-id="${docId}"] span.b3-list-item__text{
                            ${colors[code]['style']};
                        }
                    `;
                }
            }
        }
        
        const css = `
            /* file tree support order */
            :is(.sy__file, #sidebar .b3-list--mobile) ul {
                display: flex;
                flex-direction: column;
            }
            /* color */
            ${colorStyle}
            /* topmost */
            ${topmostStyle}
        `;
        const id = 'sy_file_doc_top_color_style';
        // 检查是否已经存在具有相同 id 的 <style> 元素
        let styleElement = document.getElementById(id);
        if (styleElement) {
            // 如果存在，则更新其内容
            styleElement.innerHTML = css;
        } else {
            // 如果不存在，则创建一个新的 <style> 元素
            const newStyle = document.createElement('style');
            newStyle.id = id; // 设置 id
            newStyle.innerHTML = css; // 设置 CSS 规则
            document.head.appendChild(newStyle); // 将 <style> 元素添加到 <head> 中
        }
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

    // 获取文件
    async function getFile(path) {
        return fetch("/api/file/getFile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path,
            }),
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

    function closeMenu() {
       document.body.click();
    }
    
    function getOrder() {
        if(topmostData['maxIndex']) return --topmostData['maxIndex'];
        topmostData['maxIndex'] = -1;
       return topmostData['maxIndex']; 
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    
    function addSvgSymbol() {
        // 检查是否存在 id 为 "iconTop" 的 <symbol> 元素
        if (!document.querySelector('symbol#iconTop')) {
            // 创建 SVG 字符串
            const svgString = `
                <svg data-name="sy-file-top-color" style="position: absolute; width: 0; height: 0; overflow: hidden;" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <symbol id="iconTop" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" stroke-width="0.5">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <g>
                                    <path d="M2.5 2.5a.75.75 0 010-1.5H13a.75.75 0 010 1.5H2.5zM2.985 9.795a.75.75 0 001.06-.03L7 6.636v7.614a.75.75 0 001.5 0V6.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 00.03 1.06z"></path>
                                </g>
                            </g>
                        </symbol>
                    </defs>
                </svg>
            `;
            // 将 SVG 字符串转换为 DOM 并追加到 body
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            document.body.appendChild(svgDoc.documentElement);
        }
    }
})();