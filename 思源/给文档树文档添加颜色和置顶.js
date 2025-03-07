// 给文档树文档添加颜色和置顶
// see https://ld246.com/article/1741359650489
// version 0.0.2
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

    // 监听右键菜单
    whenElementExist('.sy__file').then((fileTree) => {
        fileTree.addEventListener('contextmenu', (event) => {
            const currLi = event.target.closest('li.b3-list-item:not([data-type="navigation-root"])');
            if(!currLi) return;
            whenElementExist('button[data-id="rename"]').then(renameBtn => {
                genTopmostMenu(renameBtn, currLi);
                genColorMenus(renameBtn, currLi);
                genSeparator(renameBtn);
            });
        });
    });

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
        const html = `<button data-id="color" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTheme"></use></svg><span class="b3-menu__label">颜色</span><svg class="b3-menu__icon b3-menu__icon--small"><use xlink:href="#iconRight"></use></svg><div class="b3-menu__submenu" style="top: 267px; left: 352.453px; bottom: auto;"><div class="b3-menu__items"></div></div></button>`;
        beforeBtn.insertAdjacentHTML('beforebegin', html);
        const colorMenu = beforeBtn.parentElement.querySelector('button[data-id="color"]');
        // 生成子菜单
        let subMenus = '';
        colors = {
            "none": { style: "color:var(--b3-theme-on-background);", description: "取消颜色" },
            ...colors
        };
        for (const code in colors) {
            const item = colors[code];
            subMenus += `<button class="b3-menu__item"><span class="b3-menu__label" data-code="${code}" style="${item.style};font-weight:bold;">${item.description}</span></button>`;
        }
        colorMenu.onmouseenter = () => {
            colorMenu.querySelector(".b3-menu__submenu .b3-menu__items").innerHTML = subMenus;
        };
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
                        .sy__file li[data-node-id="${docId}"] {
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
                        .sy__file li[data-node-id="${docId}"] span.b3-list-item__text{
                            ${colors[code]['style']};
                        }
                    `;
                }
            }
        }
        
        const css = `
            .sy__file ul {
                display: flex;
                flex-direction: column;
            }
            /* color */
            ${colorStyle}
            /*.sy__file li[data-node-id="20250127115827-zx3a4fe"] span.b3-list-item__text{
                color: red;
            }*/
            /* topmost */
            ${topmostStyle}
            /*.sy__file li[data-node-id="20250304123309-ahknlqo"] {
                order: -1;
            }*/
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
})();