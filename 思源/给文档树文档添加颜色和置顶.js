// 给文档树文档添加颜色和置顶
// see https://ld246.com/article/1741359650489
// version 0.0.6
// 0.0.3 兼容手机版
// 0.0.4 修复右键时可能出现的与上一个未关闭的菜单冲突问题
// 0.0.5 修改默认配色方案，增加tree_colors_user_config.json用户配色方案文件
// 0.0.6 增加用户配色方案；改进当存在用户配置文件时默认配置不再生效；增加置顶到顶层功能
// 存储文件及使用说明
// 1. 修改/data/storage/tree_colors_user_config.json文件即可修改默认配色方案（第一次运行后生成）
// 2. 取消全部置顶只需删除/data/storage/tree_topmost.json文件即可（第一次置顶时生成）
// 3. 取消全部颜色只需删除/data/storage/tree_colors.json文件即可（第一次设置颜色时生成）
(async ()=>{
    // 是否开启置顶功能，true开启，false不开启
    const isEnableTopmost = true;

    // 是否开启颜色功能，true开启，false不开启
    const isEnableColor = true;

    // 是否开启顶层置顶功能，true开启，false不开启
    const isEnableTopmostLevel1 = true;

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

    // keydown 和 keyup 是为了防止重复触发
    let keydown, keyup;

    // 保存原始颜色配置
    const originColors = JSON.parse(JSON.stringify(colors));
    
    // 获取置顶数据，格式 {"docId":"order"}
    let topmostData = await getFile('/data/storage/tree_topmost.json') || '{}';
    topmostData = JSON.parse(topmostData);
    if(topmostData.code && topmostData.code !== 0) topmostData = {};

    // 获取置顶顶层数据，格式 {"box"{"docId":{"order":"","path":""}}}
    let topmostLevel1Data = await getFile('/data/storage/tree_topmost_level1.json') || '{}';
    topmostLevel1Data = JSON.parse(topmostLevel1Data);
    if(topmostLevel1Data.code && topmostLevel1Data.code !== 0) topmostLevel1Data = {};

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
            const menuItems = document.querySelector('#commonMenu .b3-menu__items');
            if(menuItems) menuItems.innerHTML = '';
            // 等待菜单加载完毕
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

    // 监听笔记本被展开
    if(isEnableTopmostLevel1) {
        whenElementExist('[data-url] > ul').then(() => {
            const uls = document.querySelectorAll('[data-url] > ul');
            uls.forEach((ul) => {
                genTopmostLevel1List(ul, ul.closest('[data-url]')?.dataset?.url);
            });
        });
        observeElement('[data-url] > ul', (ul) => {
            genTopmostLevel1List(ul, ul.closest('[data-url]')?.dataset?.url);
        });
    }

    // 同步完成时加载
    setTimeout(() => {
        // 监听同步完成
        siyuan.ws.ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if(msg.cmd === 'syncing' && msg.msg !== siyuan.languages._kernel[81]) {
                const uls = document.querySelectorAll('[data-url] > ul');
                if(uls.length === 0) return;
                uls.forEach((ul) => {
                    reloadTopmostTreeList(ul, ul.closest('[data-url]')?.dataset?.url);
                });
            }
        });
    }, 5000);

    /////// functions //////////////////////

    // 重新生成置顶数据
    async function reloadTopmostTreeList(ul, box) {
        // 重新加载顶层置顶数据
        topmostLevel1Data = await getFile('/data/storage/tree_topmost_level1.json') || '{}';
        topmostLevel1Data = JSON.parse(topmostLevel1Data);
        if(topmostLevel1Data.code && topmostLevel1Data.code !== 0) topmostLevel1Data = {};
        // 重新生成顶层置顶数据
        genTopmostLevel1List(ul, box);

        // 重新获取置顶数据
        topmostData = await getFile('/data/storage/tree_topmost.json') || '{}';
        topmostData = JSON.parse(topmostData);
        if(topmostData.code && topmostData.code !== 0) topmostData = {};

        // 更新样式
        genStyle();
    }

    function genTopmostLevel1List(ul, box) {
        const docs = topmostLevel1Data[box];
        if(!docs) return;
        Object.entries(docs).forEach(async ([id, doc]) => {
            const oldLi = ul.querySelector(`[data-node-id="${id}"].topmost-level-1`);
            if(oldLi) return;
            const item = await getTreeDocById(id, box, doc.path);
            const li = isMobile() ? genMobileFileHTML(item) : genFileHTML(item);
            ul.insertAdjacentHTML('afterbegin', li);
            const liEl = ul.querySelector(`[data-node-id="${id}"]`);
            liEl.classList.add('topmost-level-1');
            //liEl.style.order = doc.order;
            //liEl.style.display = 'flex';
        });
    }

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
        const box = currLi.closest('[data-url]')?.dataset?.url;
        const menuText = topmostData[currLi.dataset.nodeId] || (topmostLevel1Data[box] && topmostLevel1Data[box][currLi.dataset.nodeId]) ? '取消置顶' : '置顶';
        const html = `<button data-id="topmost" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTop"></use></svg><span class="b3-menu__label">${menuText}</span></button>`;
        beforeBtn.insertAdjacentHTML('beforebegin', html);
        const topmostBtn = beforeBtn.parentElement.querySelector('button[data-id="topmost"]');

        // 置顶处理函数
        const topmostHandle = () => {
            // 保存置顶数据
            if(topmostData[currLi.dataset.nodeId]) {
                // 取消置顶
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

        // 手机端置顶事件
        if(isEnableTopmostLevel1 && isMobile()) {
            let pressTimer; // 定时器
            let isLongPress = false; // 标记是否触发了长按
            const longPressDuration = 500; // 长按的触发时间（毫秒）

            // 触摸开始事件
            topmostBtn.addEventListener('touchstart', (event) => {
                event.preventDefault(); // 防止默认行为（如滚动）

                // 初始化标记变量
                isLongPress = false;

                // 设置定时器，用于检测长按
                pressTimer = setTimeout(() => {
                    isLongPress = true; // 标记为长按

                    /////// 长按事件 start ///////
                    // 当前文档不是顶级文档时，置顶到顶层
                    if(!currLi.matches('[data-url] > ul > li')) {
                        topToLevel1(currLi);
                    } else {
                        // 当前文档是顶级文档时，直接置顶
                        topmostHandle();
                    }
                    /////// 长按事件 end ///////

                }, longPressDuration);
            });

            // 触摸结束事件
            topmostBtn.addEventListener('touchend', () => {
                clearTimeout(pressTimer); // 清除定时器

                if (!isLongPress) {

                    /////// 点击事件 start ///////
                    // 如果文档是顶层文档，取消顶层置顶
                    if(topmostLevel1Data[box] && topmostLevel1Data[box][currLi.dataset.nodeId]){
                        topToLevel1(currLi);
                    } else {
                        // 如果文档不是顶层文档，取消置顶
                        topmostHandle();
                    }
                    /////// 点击事件 end ///////

                }

                // 重置标记变量
                isLongPress = false;
            });

            // 触摸移动事件
            topmostBtn.addEventListener('touchmove', () => {
                clearTimeout(pressTimer); // 用户移动手指，取消长按
            });
        } else {
            // pc端置顶事件
            topmostBtn.onclick = (event) => {
                // 检查是否按下了 Shift 键
                if(isEnableTopmostLevel1) {
                    const shiftKey = event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;
                    // 按shift顶层置顶
                    if(shiftKey) {
                        // 当前文档不是顶级文档时，置顶到顶层
                        if(!currLi.matches('[data-url] > ul > li')) {
                            topToLevel1(currLi);
                            return;
                        }
                    }
                    // 顶层文档取消置顶
                    else if(topmostLevel1Data[box] && topmostLevel1Data[box][currLi.dataset.nodeId]) {
                        // 当文档本身就是顶级文档时，直接置顶
                        topToLevel1(currLi);
                        return;
                    }
                }
                // 置顶处理函数
                topmostHandle();
            };
            if(isEnableTopmostLevel1) {
                keydown = (event) => {
                    const shiftKey = event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;
                    if(shiftKey) {
                        const label = topmostBtn.querySelector('.b3-menu__label');
                        if(label.textContent === '置顶') label.textContent = '置顶到顶层';
                    }
                };
                keyup = (event) => {
                    const label = topmostBtn.querySelector('.b3-menu__label');
                    if(label.textContent === '置顶到顶层') label.textContent = '置顶';
                };
                document.addEventListener('keydown', keydown);
                document.addEventListener('keyup', keyup);
            }
        }
    }

    // 置顶到顶层处理函数
    function topToLevel1(currLi) {
        const box = currLi.closest('[data-url]');
        const nodeId = currLi.dataset.nodeId;
        const boxId = box?.dataset?.url;
        if(topmostLevel1Data[boxId] && topmostLevel1Data[boxId][nodeId]) {
            // 取消置顶
            currLi.remove();
            // 删除数据
            delete topmostLevel1Data[boxId][nodeId];
            putFile('/data/storage/tree_topmost_level1.json', JSON.stringify(topmostLevel1Data));
        } else {
            // 置顶
            // 复制文档到顶级目录
            const order = getOrder();
            const topLi = currLi.cloneNode(true);
            topLi.classList.add('topmost-level-1');
            //topLi.style.order = order;
            //topLi.style.display = 'flex';
            topLi.querySelector('.b3-list-item__toggle').style.paddingLeft = isVersionGreaterThan(siyuan.config.system.kernelVersion,'3.1.10')?'18px':'22px';
            box.children[1].insertBefore(topLi, box.children[1].firstChild);
            // 保存置顶顶级文档数据
            if(!topmostLevel1Data[boxId]) topmostLevel1Data[boxId] = {};
            if(!topmostLevel1Data[boxId][nodeId]) topmostLevel1Data[boxId][nodeId] = {};
            topmostLevel1Data[boxId][nodeId]['order'] = order;
            topmostLevel1Data[boxId][nodeId]['path'] = currLi.dataset.path;
            putFile('/data/storage/tree_topmost_level1.json', JSON.stringify(topmostLevel1Data));
            // 保存maxOrder
            putFile('/data/storage/tree_topmost.json', JSON.stringify(topmostData));
            currLi.classList.remove('b3-list-item--focus');
        }
        // 更新置顶样式
        genStyle();
        // 关闭菜单
        closeMenu();
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
                        :is(.sy__file, #sidebar .b3-list--mobile) li[data-node-id="${docId}"] + ul {
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
        
        // 生成顶层置顶样式
        let topmostLevel1Style = '';
        if (isEnableTopmostLevel1) {
            for(const box in topmostLevel1Data){
                const docs = topmostLevel1Data[box];
                if(!docs) continue;
                const ids = Object.keys(docs);
                if(ids.length === 0) continue;
                ids.forEach(id => {
                    const order = docs[id]['order']||0;
                    topmostLevel1Style += `
                        :is(.sy__file, #sidebar .b3-list--mobile) li[data-node-id="${id}"].topmost-level-1 {
                            order: ${order||0};
                            display: flex;
                        }
                        :is(.sy__file, #sidebar .b3-list--mobile) li[data-node-id="${id}"].topmost-level-1 + ul {
                            order: ${order||0};
                            display: flex;
                        }
                        :is(.sy__file, #sidebar .b3-list--mobile) li[data-node-id="${id}"] {
                            display: none;
                        }
                        :is(.sy__file, #sidebar .b3-list--mobile) li[data-node-id="${id}"] + ul {
                            display: none;
                        }
                    `;
                });
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
            /* topmost level1 */
            ${topmostLevel1Style}
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

    function whenElementExist(selector, node, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let isResolved = false;
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) {isResolved = true; resolve(el);} else if(!isResolved) requestAnimationFrame(check);
            };
            check();
            setTimeout(() => {
                if (!isResolved) {
                    reject(new Error(`Timeout: Element not found for selector "${selector}" within ${timeout}ms`));
                }
            }, timeout);
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
        if(keydown) { document.removeEventListener('keydown', keydown); keydown = null;}
        if(keyup) { document.removeEventListener('keyup', keyup); keyup = null;}
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

    /**
     * 监控指定选择器的元素是否被添加到 DOM 中
     * @param {string} selector - CSS 选择器
     * @param {Function} callback - 当匹配元素被添加时触发的回调函数
     */
    function observeElement(selector, callback) {
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 检查新增的节点是否匹配选择器
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.matches(selector)) {
                            callback(node);
                        }
                    });
                }
            });
        });

        // 配置观察选项
        const config = {
            childList: true, // 观察子节点的添加或删除
            subtree: true,   // 观察整个子树
        };

        // 开始观察 body 元素
        observer.observe(document.body, config);

        // 返回取消观察的方法
        return () => observer.disconnect();
    }

    // 请求api
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = {
            method: "POST",
        };
        if (data) {
            if (data instanceof FormData) {
                init.body = data;
            } else {
                init.body = JSON.stringify(data);
            }
        }
        try {
            const res = await fetch(url, init);
            const res2 = returnType === 'json' ? await res.json() : await res.text();
            return res2;
        } catch(e) {
            console.log(e);
            return returnType === 'json' ? {code:e.code||1, msg: e.message||"", data: null} : "";
        }
    }

    // 发送消息
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    /////////// 生成文档树 li ////////////////////////
    async function getTreeDocById(id, box, path) {
        if(!box || path) {
            const doc = await fetchSyncPost('/api/filetree/getDoc', {id:id});
            box = doc?.data?.box;
            path = doc?.data?.path;
            if(!box || !path) return;
        }
        if(path.toLocaleLowerCase().endsWith('.sy')) {
            const pathArr = path.split('/');
            pathArr.pop();
            path = pathArr.join('/');
            path = path === '' ? '/' : path;
        }
        let list = await fetchSyncPost('/api/filetree/listDocsByPath', {notebook:box, path:path});
        list = list.data?.files?.filter(item=>item.id === id) || [];
        return list[0];
    }
    // see https://github.com/siyuan-note/siyuan/blob/1317020c1791edf440da7f836d366567e03dd843/app/src/layout/dock/Files.ts#L1224
    function genFileHTML(item) {
        let countHTML = "";
        if (item.count && item.count > 0) {
            countHTML = `<span class="popover__block counter b3-tooltips b3-tooltips__nw" aria-label="${window.siyuan.languages.ref}">${item.count}</span>`;
        }
        const ariaLabel = genDocAriaLabel(item, escapeAriaLabel);
        const paddingLeft = isVersionGreaterThan(siyuan.config.system.kernelVersion,'3.1.10')?18:22; //(item.path.split("/").length - 1) * 18;
        return `<li data-node-id="${item.id}" data-name="${Lute.EscapeHTMLStr(item.name)}" draggable="true" data-count="${item.subFileCount}" 
    data-type="navigation-file" 
    style="--file-toggle-width:${paddingLeft + (isVersionGreaterThan(siyuan.config.system.kernelVersion,'3.1.10')?18:22)}px" 
    class="b3-list-item b3-list-item--hide-action" data-path="${item.path}">
    <span style="padding-left: ${paddingLeft}px" class="b3-list-item__toggle b3-list-item__toggle--hl${item.subFileCount === 0 ? " fn__hidden" : ""}">
        <svg class="b3-list-item__arrow"><use xlink:href="#iconRight"></use></svg>
    </span>
    <span class="b3-list-item__icon b3-tooltips b3-tooltips__n popover__block" data-id="${item.id}" aria-label="${window.siyuan.languages.changeIcon}">${unicode2Emoji(item.icon || (item.subFileCount === 0 ? (window.siyuan.storage['local-images']?.file||'1f4c4') : (window.siyuan.storage['local-images']?.folder||'1f4d1')))}</span>
    <span class="b3-list-item__text ariaLabel" data-position="parentE"
    aria-label="${ariaLabel}">${getDisplayName(item.name, true, true)}</span>
    <span data-type="more-file" class="b3-list-item__action b3-tooltips b3-tooltips__nw" aria-label="${window.siyuan.languages.more}">
        <svg><use xlink:href="#iconMore"></use></svg>
    </span>
    <span data-type="new" class="b3-list-item__action b3-tooltips b3-tooltips__nw${window.siyuan.config.readonly ? " fn__none" : ""}" aria-label="${window.siyuan.languages.newSubDoc}">
        <svg><use xlink:href="#iconAdd"></use></svg>
    </span>
    ${countHTML}
    </li>`;
    }

    // see https://github.com/siyuan-note/siyuan/blob/1317020c1791edf440da7f836d366567e03dd843/app/src/mobile/dock/MobileFiles.ts#L725
    function genMobileFileHTML(item) {
        let countHTML = "";
        if (item.count && item.count > 0) {
            countHTML = `<span class="counter">${item.count}</span>`;
        }
        return `<li data-node-id="${item.id}" data-name="${Lute.EscapeHTMLStr(item.name)}" data-type="navigation-file" 
class="b3-list-item" data-path="${item.path}">
    <span style="padding-left: ${isVersionGreaterThan(siyuan.config.system.kernelVersion,'3.1.10')?24:20/*(item.path.split("/").length - 1) * 20*/}px" class="b3-list-item__toggle${item.subFileCount === 0 ? " fn__hidden" : ""}">
        <svg class="b3-list-item__arrow"><use xlink:href="#iconRight"></use></svg>
    </span>
    <span class="b3-list-item__icon">${unicode2Emoji(item.icon || (item.subFileCount === 0 ? (window.siyuan.storage['local-images']?.file||'1f4c4') : (window.siyuan.storage['local-images']?.folder||'1f4d1')))}</span>
    <span class="b3-list-item__text">${getDisplayName(item.name, true, true)}</span>
    <span data-type="more-file" class="b3-list-item__action b3-tooltips b3-tooltips__nw" aria-label="${window.siyuan.languages.more}">
        <svg><use xlink:href="#iconMore"></use></svg>
    </span>
    <span data-type="new" class="b3-list-item__action b3-tooltips b3-tooltips__nw${window.siyuan.config.readonly ? " fn__none" : ""}" aria-label="${window.siyuan.languages.newSubDoc}">
        <svg><use xlink:href="#iconAdd"></use></svg>
    </span>
    ${countHTML}
</li>`;
    };

    function genDocAriaLabel(item, escapeMethod) {
        return `${escapeMethod(getDisplayName(item.name, true, true))} <small class='ft__on-surface'>${item.hSize}</small>${item.bookmark ? "<br>" + window.siyuan.languages.bookmark + " " + escapeMethod(item.bookmark) : ""}${item.name1 ? "<br>" + window.siyuan.languages.name + " " + escapeMethod(item.name1) : ""}${item.alias ? "<br>" + window.siyuan.languages.alias + " " + escapeMethod(item.alias) : ""}${item.memo ? "<br>" + window.siyuan.languages.memo + " " + escapeMethod(item.memo) : ""}${item.subFileCount !== 0 ? window.siyuan.languages.includeSubFile.replace("x", item.subFileCount) : ""}<br>${window.siyuan.languages.modifiedAt} ${item.hMtime}<br>${window.siyuan.languages.createdAt} ${item.hCtime}`;
    }

    function escapeAriaLabel(html) {
        if (!html) {
            return html;
        }
        return html.replace(/"/g, "&quot;").replace(/'/g, "&apos;")
            .replace(/</g, "&amp;lt;").replace(/&lt;/g, "&amp;lt;");
    }

    function getDisplayName(filePath, basename = true, removeSY = false) {
        let name = filePath;
        if (basename) {
            name = getBasename(filePath); //pathPosix().basename(filePath);
        }
        if (removeSY && name.endsWith(".sy")) {
            name = name.substr(0, name.length - 3);
        }
        return name;
    }

    function pathPosix() {
        if(typeof require === 'undefined') return null;
        if (typeof require !== 'undefined' && require('path').posix) {
            return require('path').posix;
        }
        return require('path');
    }

    function getBasename(filePath, ext = '') {
        // 1. 提取路径的最后一部分（文件名）
        let base = filePath.replace(/\\/g, '/').split('/').pop(); // 处理 POSIX 和 Windows 路径
    
        // 2. 如果提供了扩展名参数，则去掉对应的扩展名
        if (ext && base.endsWith(ext)) {
            base = base.slice(0, base.length - ext.length);
        }
    
        return base;
    }

    // unicode转emoji
    // 使用示例：unicode2Emoji('1f4c4');
    // see https://ld246.com/article/1726920727424
    function unicode2Emoji(unicode, className = "", needSpan = false, lazy = false) {
        if (!unicode) {
            return "";
        }
        let emoji = "";
        if (unicode.indexOf(".") > -1) {
            emoji = `<img class="${className}" ${lazy ? "data-" : ""}src="/emojis/${unicode}"/>`;
        } else {
            try {
                unicode.split("-").forEach(item => {
                    if (item.length < 5) {
                        emoji += String.fromCodePoint(parseInt("0" + item, 16));
                    } else {
                        emoji += String.fromCodePoint(parseInt(item, 16));
                    }
                });
                if (needSpan) {
                    emoji = `<span class="${className}">${emoji}</span>`;
                }
            } catch (e) {
                // 自定义表情搜索报错 https://github.com/siyuan-note/siyuan/issues/5883
                // 这里忽略错误不做处理
            }
        }
        return emoji;
    }

    /**
     * 比较两个版本号，判断 versionA 是否大于 versionB
     * @param {string} versionA - 第一个版本号
     * @param {string} versionB - 第二个版本号
     * @returns {boolean} - 如果 versionA > versionB，则返回 true；否则返回 false
     */
    function isVersionGreaterThan(versionA, versionB) {
        // 将版本号按 '.' 分割成数组
        const partsA = versionA.split('.').map(Number);
        const partsB = versionB.split('.').map(Number);

        // 获取两个版本号的最大长度
        const maxLength = Math.max(partsA.length, partsB.length);

        // 逐段比较版本号
        for (let i = 0; i < maxLength; i++) {
            const numA = partsA[i] || 0; // 如果某一段不存在，默认为 0
            const numB = partsB[i] || 0;

            if (numA > numB) {
                return true; // versionA 大于 versionB
            } else if (numA < numB) {
                return false; // versionA 小于 versionB
            }
        }

        // 如果所有段都相等，则返回 false
        return false;
    }
})();