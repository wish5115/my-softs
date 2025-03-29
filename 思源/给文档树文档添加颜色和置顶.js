// 给文档树文档添加颜色和置顶
// see https://ld246.com/article/1741359650489
// version 0.0.5.1
// 0.0.3 兼容手机版
// 0.0.4 修复右键时可能出现的与上一个未关闭的菜单冲突问题
// 0.0.5 修改默认配色方案，增加tree_colors_user_config.json用户配色方案文件
// 0.0.5.1 增加默认颜色；当有了用户配置后，默认配置不再生效
// 存储文件及使用说明
// 1. 修改/data/storage/tree_colors_user_config.json文件即可修改默认配色方案（第一次运行后生成）
// 2. 取消全部置顶只需删除/data/storage/tree_topmost.json文件即可（第一次置顶时生成）
// 3. 取消全部颜色只需删除/data/storage/tree_colors.json文件即可（第一次设置颜色时生成）
(async ()=>{
    // 是否开启置顶功能，true开启，false不开启
    const isEnableTopmost = true;

    // 是否开启颜色功能，true开启，false不开启
    const isEnableColor = true;

    // 预设颜色列表，格式 {"主题":{"明暗风格":{"编码":{style:"颜色值", "description":"颜色描述"}}}}，编码值必须唯一，编码修改则原来设置的颜色将失效
    // "---1": {}, 代表分割线，后面的序号必须递增
    // 第一次运行后，会把该默认配置保存到 /data/storage/tree_colors_user_config.json 中，以后配置颜色只需要修改该文件即可，这样不受代码片段升级的影响
    // 也可以把 tree_colors_user_config.json 发出来与大家分享您的创意
    // 该配色灵感来自 @Floria233 大佬提供的配色方案
    // see https://ld246.com/article/1741359650489/comment/1741430150736?r=wilsons#comments
    // （切换主题或亮色暗色风格时自动会切换配色方案）
    // 为了让目录树的颜色更突出，默认加了加粗显示（font-weight:bold样式），如果你不需要去掉这个样式即可
    let colors = {
        // 默认配色方案
        "default": {
            "light": {
                "level-1": {"style": "color:#D32F2F;font-weight:bold;", "description": "最重要"},
                "level-2": {"style": "color:#FF5722;font-weight:bold;", "description": "较重要"},
                "level-3": {"style": "color:#FF9800;font-weight:bold;", "description": "重要"},
                "level-4": {"style": "color:#1976D2;font-weight:bold;", "description": "一般"},
                "level-5": {"style": "color:#4CAF50;font-weight:bold;", "description": "不重要"},
                "level-6": {"style": "color:#8BC34A;font-weight:bold;", "description": "较不重要"},
                "level-7": {"style": "color:#9E9E9E;font-weight:bold;", "description": "最不重要"},
                "---1": {}, // 代表分割线，后面的序号必须递增
                "now": {"style": "color:#1D4ED8;font-weight:bold;", "description": "NOW"},
                "important": {"style": "color:#B91C1C;font-weight:bold;", "description": "重要"},
                "completed": {"style": "color:#15803D;font-weight:bold;", "description": "完成"},
                "todo": {"style": "color:#D97706;font-weight:bold;", "description": "TODO"},
                "pass": {"style": "color:#8E8E8E;font-weight:bold;", "description": "PASS"},
                "like": {"style": "color:#9333EA;font-weight:bold;", "description": "喜欢"},
                "special": {"style": "color:#D946EF;font-weight:bold;", "description": "特别"},
                "---2": {}, // 代表分割线，后面的序号必须递增
                "draft": {"style": "color:#FF9800;font-weight:bold;", "description": "草稿"},
                "being_edited": {"style": "color:#9C27B0;font-weight:bold;", "description": "修改中"},
                "scheduled": {"style": "color:#2196F3;font-weight:bold;", "description": "待发布"},
                "published": {"style": "color:#4CAF50;font-weight:bold;", "description": "已发布"},
                "archived": {"style": "color:#9E9E9E;font-weight:bold;", "description": "存档"},
                "deleted": {"style": "color:#f6b6b2;font-weight:bold;text-decoration:line-through;", "description": "已删除"}
            },
            "dark": {
                "level-1": {"style": "color:#FF4444;font-weight:bold;", "description": "最重要"},
                "level-2": {"style": "color:#FF6F61;font-weight:bold;", "description": "较重要"},
                "level-3": {"style": "color:#FFB300;font-weight:bold;", "description": "重要"},
                "level-4": {"style": "color:#42A5F5;font-weight:bold;", "description": "一般"},
                "level-5": {"style": "color:#66BB6A;font-weight:bold;", "description": "不重要"},
                "level-6": {"style": "color:#689F38;font-weight:bold;", "description": "较不重要"},
                "level-7": {"style": "color:#757575;font-weight:bold;", "description": "最不重要"},
                "---1": {}, // 代表分割线，后面的序号必须递增
                "now": {"style": "color:#42A5F5;font-weight:bold;", "description": "NOW"},
                "important": {"style": "color:#FF5252;font-weight:bold;", "description": "重要"},
                "completed": {"style": "color:#66BB6A;font-weight:bold;", "description": "完成"},
                "todo": {"style": "color:#FFB300;font-weight:bold;", "description": "TODO"},
                "pass": {"style": "color:#8E8E8E;font-weight:bold;", "description": "PASS"},
                "like": {"style": "color:#E040FB;font-weight:bold;", "description": "喜欢"},
                "special": {"style": "color:#CE93D8;font-weight:bold;", "description": "特别"},
                "---2": {}, // 代表分割线，后面的序号必须递增
                "draft": {"style": "color:#FFB300;font-weight:bold;", "description": "草稿"},
                "being_edited": {"style": "color:#AB47BC;font-weight:bold;", "description": "修改中"},
                "scheduled": {"style": "color:#29B6F6;font-weight:bold;", "description": "待发布"},
                "published": {"style": "color:#66BB6A;font-weight:bold;", "description": "已发布"},
                "archived": {"style": "color:#B0BEC5;font-weight:bold;", "description": "存档"},
                "deleted": {"style": "color:#c07070;font-weight:bold;text-decoration:line-through;", "description": "已删除"}
            }
        },
        // 其他主题配色方案
    };

    /////// main //////////////////////

    // 保存原始颜色配置
    const originColors = JSON.parse(JSON.stringify(colors));
    
    // 获取置顶数据，格式 {"docId":"order"}
    let topmostData = await getFile('/data/storage/tree_topmost.json') || '{}';
    topmostData = JSON.parse(topmostData);
    if(topmostData.code && topmostData.code !== 0) topmostData = {};

    // 获取颜色数据，格式 {"docId":"code"}，code来自colors变量编码
    let colorData = await getFile('/data/storage/tree_colors.json') || '{}';
    colorData = JSON.parse(colorData);
    if(colorData.code && colorData.code !== 0) colorData = {};

    // 获取用户颜色配置
    let colorConfig = await getFile('/data/storage/tree_colors_user_config.json') || '{}';
    colorConfig = JSON.parse(colorConfig);
    if(colorConfig.code && colorConfig.code !== 0) colorConfig = {};
    if(isEmptyObject(colorConfig)) {
        // 第一次运行保存默认配色方案
        putFile('/data/storage/tree_colors_user_config.json', JSON.stringify(colors, null, 4));
    }
    
    // 生成颜色数据
    genColors();
    
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

    // 监听主题和明暗风格切换
    observeThemeChange((attributeName, newValue) => {
        // 生成颜色数据
        genColors();
        // 生成样式
        genStyle();
    });

    /////// functions //////////////////////

    function genColors() {
        // 获取主题和明暗风格
        const mode = siyuan.config.appearance.mode === 0 ? 'light' : 'dark';
        const theme = siyuan.config.appearance.mode === 0 ? siyuan.config.appearance.themeLight : siyuan.config.appearance.themeDark;
        // 获取默认颜色配置
        const defaultDefaultColors = originColors['default'][mode] || {};
        const defaultThemeColors = originColors[theme] ? (originColors[theme][mode] || {}) : {};
        const defaultColors = {...defaultDefaultColors, ...defaultThemeColors};
        // 获取用户颜色配置
        const userDefaultColors = colorConfig['default'] ? (colorConfig['default'][mode] || {}) : {};
        const userThemeColors = colorConfig[theme] ? (colorConfig[theme][mode] || {}) : {};
        const userColors = {...userDefaultColors, ...userThemeColors};
        // 合并用户配置和默认配置
        //colors = {...defaultColors, ...userColors};
        colors = !isEmptyObject(userColors) ? userColors : defaultColors;
    }

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
            if(code.startsWith('---')){
                subMenus += `<button data-id="separator_${code.replace('---', '').trim()}" id="sy_file_sp_color_top" class="b3-menu__separator"></button>`;
            } else {
                subMenus += `<button class="b3-menu__item"><span class="b3-menu__label" data-code="${code}" style="${item.style}">${item.description}</span></button>`;
            }
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
                            order: ${order||0};
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
                            ${colors[code]?.style||''};
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

    function isEmptyObject(obj) {
      return obj == null || Object.keys(obj).length === 0;
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

    /**
     * 监听 HTML 标签的主题相关属性变化
     * @param {Function} callback - 回调函数，接收变化的属性名和新值
     */
    function observeThemeChange(callback) {
        // 获取目标元素（通常是 <html> 标签）
        const targetElement = document.documentElement;

        // 创建 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    const attributeName = mutation.attributeName;
                    const newValue = targetElement.getAttribute(attributeName);

                    // 检查是否是目标属性
                    if (['data-theme-mode', 'data-light-theme', 'data-dark-theme'].includes(attributeName)) {
                        // 调用回调函数，传递属性名和新值
                        callback(attributeName, newValue);
                    }
                }
            });
        });

        // 配置观察选项
        const config = {
            attributes: true, // 监听属性变化
            attributeFilter: ['data-theme-mode', 'data-light-theme', 'data-dark-theme'] // 仅监听指定属性
        };

        // 开始观察目标元素
        observer.observe(targetElement, config);
    }
})();