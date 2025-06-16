// 添加块到指定数据库（支持绑定块和不绑定块，支持文档块和普通块）
// see https://ld246.com/article/1746153210116
// 注意：只能在块菜单中操作（你的右键可能不是块菜单）
// 本应用已全部用完Achuan-2大佬提供的所有api see https://ld246.com/article/1733365731025
// version 0.0.8
// 0.0.2 （已废弃）
// 0.0.3 修改参数配置方式
// 0.0.4 修复仅对当前文档中的选中块起作用
// 0.0.5 支持叶归等第三方非标准思源dom结构
// 0.0.6 增加附加字段功能
// 0.0.7 增加可同时对选中块增加自定义属性
// 0.0.8 修复批量调添加可能扩展字段无法被添加的意外情况
(()=>{
    // 是否开启，同时添加其他字段 true 开启 false 不开启
    // 开启时，需要配置menus中的otherCols字段信息（可参考下面的示例）
    const isEnableMoreCols = false;

    // 是否同时对选中块添加自定义属性（需要在menus中配置customAttrs，每个菜单可以添加不同的自定义属性）
    const isEnableCustomAttrsInSelectedBlock = false;

    // 块菜单配置
    const menus = [
        {
            // 菜单名，显示在块或文档右键菜单上
            name: "添加到数据库A",
            // 添加到的数据库块id列表（必填），注意是数据库所在块id，如果移动了数据库位置需要更改
            toAvBlockId: "20241127231309-wo80aza",
            // 指定数据库的列名，不填默认是添加到主键列，该参数仅对不绑定块菜单有效，如果多个列名一样的则取第一个
            // 注意，目前仅支持文本列
            toAvColName: "",
            // 是否绑定块菜单，true 绑定，false 不绑定
            isBindBlock: true,
            // 给选中块添加自定义属性，可以按key:value形式添加多组
            // 注意，自定义属性需要添加custom-前缀
            customAttrs: {"custom-st-event": "今天"},
            // 其他扩展字段（需要时把注释打开后配置即可）
            // getColValue回调函数可动态计算字段值返回
            otherCols: [
                {
                    colName: '状态',
                    // 对于绑定块，块/文档id === rowID
                    getColValue: (keyID, rowID, cellID, avID) => {
                        return {"mSelect": [{"content":"今天"}]};
                    },
                }
            ],
        },
        {
            name: "添加到数据库B",
            toAvBlockId: "20241127231309-wo80aza",
            toAvColName: "",
            isBindBlock: false,
            // 给选中块添加自定义属性，可以按key:value形式添加多组
            // 注意，自定义属性需要添加custom-前缀
            customAttrs: {"custom-st-event": "今天"},
            // 其他扩展字段（需要时把注释打开后配置即可）
            // getColValue回调函数可动态计算字段值返回
            otherCols: [
                {
                    colName: '状态',
                    // 对于绑定块，块/文档id === rowID
                    getColValue: (keyID, rowID, cellID, avID) => {
                        return {"mSelect": [{"content":"今天"}]};
                    },
                }
            ],
        },
        {
            name: "添加到数据库C",
            toAvBlockId: "20250502120433-a7o0666",
            toAvColName: "",
            isBindBlock: false,
        }
    ];
    
    // 监听块右键菜单
    whenElementExist('#commonMenu .b3-menu__items').then((menuItems) => {
        const menusReverse = menus.reverse();
        observeBlockMenu(menuItems, async (isTitleMenu)=>{
            if(menuItems.querySelector('.add-to-my-av')) return;
            const addAv = menuItems.querySelector('button[data-id="addToDatabase"]');
            if(!addAv) return;
            if(menus.length === 0) return;
            // 生成块菜单
            menusReverse.forEach((menu,index) => {
                const menuText = menu.name+ (menu.isBindBlock?'':'（不绑定块）');
                const menuIcon = '#iconDatabase';
                const menuClass = `add-to-my-av-${menu.toAvBlockId}-${menus.length-index-1}`;
                const menuButtonHtml = `<button class="b3-menu__item ${menuClass}"><svg class="b3-menu__icon " style=""><use xlink:href="${menuIcon}"></use></svg><span class="b3-menu__label">${menuText}</span></button>`;
                addAv.insertAdjacentHTML('afterend', menuButtonHtml);
                const menuBtn = menuItems.querySelector('.'+menuClass);
                // 块菜单点击事件
                menuBtn.onclick = async () => {
                    window.siyuan.menus.menu.remove();
                    menuItemClick(menu.toAvBlockId, menu.toAvColName, menu.isBindBlock, menu.otherCols, menu.customAttrs, isTitleMenu);
                };
            });
        });
    });
    // 菜单点击事件
    async function menuItemClick(toAvBlockId, toAvColName, isBindBlock, otherCols, customAttrs, isTitleMenu) {
        const avId = await getAvIdByAvBlockId(toAvBlockId);
        if(!avId) {
            showMessage('未找到块ID'+toAvBlockId+'所在的数据库，请检查数据库块ID配置是否正确', true);
            return;
        }
        let blocks = [];
        const protyle = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)');
        if(isTitleMenu) {
            // 添加文档块到数据库
            const docTitleEl = (protyle||document)?.querySelector('.protyle-title');
            const docId = docTitleEl?.dataset?.nodeId;
            const docTitle = docTitleEl?.querySelector('.protyle-title__input')?.textContent;
            blocks = [{
                dataset: {nodeId: docId},
                textContent: docTitle,
            }];
        } else {
            // 添加普通块到数据库
            blocks = (protyle||document)?.querySelectorAll('.protyle-wysiwyg--select');
        }
        // 绑定块
        if(isBindBlock){
            const blockIds = [...blocks].map(block => block.dataset.nodeId);
            // 绑定块（要用await等待插入完成，否则后面的读取操作可能读不到数据）
            await addBlocksToAv(blockIds, avId, toAvBlockId);
            // 添加数据库其他属性
            if(isEnableMoreCols && otherCols && otherCols.length > 0) {
                // 通过字段名获取keyID
                const keys = await requestApi("/api/av/getAttributeViewKeysByAvID", {avID:avId});
                otherCols.forEach(col => {
                    if(!col.colName) return;
                    const keyID = keys?.data?.find(item=>item.name === col.colName.trim())?.id;
                    if(!keyID) return;
                    col.keyID = keyID;
                });
                // 添加属性到数据库
                await addColsToAv(blockIds, otherCols, avId);
            }
            // 给选中块添加自定义属性
            if(isEnableCustomAttrsInSelectedBlock) await setBlocksAttrs(blockIds, customAttrs);
        }
        // 非绑定块
        else {
            // 通过字段名获取keyID
            const keys = await requestApi("/api/av/getAttributeViewKeysByAvID", {avID:avId});
            // 获取主键id
            let pkKeyID = keys?.data[0]?.id || '';
            if(!pkKeyID) {
                pkKeyID = keys?.data?.find(item=>item.type === 'block')?.id;
            }
            // 获取指定字段id
            let keyID = '';
            if(toAvColName) {
                keyID = keys?.data?.find(item=>item.name === toAvColName.trim())?.id;
            }
            // 其他扩展字段
            if(isEnableMoreCols && otherCols && otherCols.length > 0) {
                otherCols.forEach(col => {
                    if(!col.colName) return;
                    const keyID = keys?.data?.find(item=>item.name === col.colName.trim())?.id;
                    if(!keyID) return;
                    col.keyID = keyID;
                });
            }
            await addBlocksToAvNoBind(blocks, avId, pkKeyID, keyID, otherCols);

            // 给选中块添加自定义属性
            const blockIds = [...blocks].map(block => block.dataset.nodeId);
            if(isEnableCustomAttrsInSelectedBlock) await setBlocksAttrs(blockIds, customAttrs);
        }
    }
    // 通过块id获取数据库id
    async function getAvIdByAvBlockId(blockId) {
        const av = await getAvBySql(`SELECT * FROM blocks where type ='av' and id='${blockId}'`);
        if(av.length === 0) return '';
        const avId = av.map(av => getDataAvIdFromHtml(av.markdown))[0];
        return avId || '';
    }
    // 从数据库HTML代码中获取数据库id
    function getDataAvIdFromHtml(htmlString) {
        // 使用正则表达式匹配data-av-id的值
        const match = htmlString.match(/data-av-id="([^"]+)"/);
        if (match && match[1]) {
        return match[1];  // 返回匹配的值
        }
        return "";  // 如果没有找到匹配项，则返回空
    }
    // 通过sql获取数据库信息
    async function getAvBySql(sql) {
        const result = await requestApi('/api/query/sql', {"stmt": sql});
        if(result.code !== 0){
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
    // 插入块到数据库
    async function addBlocksToAv(blockIds, avId, avBlockID) {
        blockIds = typeof blockIds === 'string' ? [blockIds] : blockIds;
        const srcs = blockIds.map(blockId => ({
            "id": blockId,
            "isDetached": false,
        }));
        const input = {
          "avID": avId,
          "blockID": avBlockID,
          'srcs': srcs
        }
        const result = await requestApi('/api/av/addAttributeViewBlocks', input);
        if(!result || result.code !== 0) console.error(result);
    }
    // 添加数据库属性
    // 对于绑定块，块/文档id === rowID
    async function addColsToAv(blockIds, cols, avID) {
        blockIds = typeof blockIds === 'string' ? [blockIds] : blockIds;
        for(const blockId of blockIds) {
            for(const col of cols) {
                if(!col.keyID) continue;
                const cellID = await getCellIdByRowIdAndKeyId(blockId, col.keyID, avID);
                if(!cellID) continue;
                let colData = {avID: avID, keyID: col.keyID, rowID: blockId, cellID};
                if(typeof col.getColValue !== 'function') continue;
                const colValue = await col.getColValue(col.keyID, blockId, cellID, avID);
                if(typeof colValue !== 'object') continue;
                colData.value = colValue;
                const result = await requestApi("/api/av/setAttributeViewBlockAttr", colData);
                if(!result || result.code !== 0) console.error(result);
            }
        }
    }
    // 获取cellID
    // 对于绑定块，块/文档id === rowID
    async function getCellIdByRowIdAndKeyId(rowID, keyID, avID) {
        let res = await requestApi("/api/av/getAttributeViewKeys", {id: rowID });
        const foundItem = res.data.find(item => item.avID === avID); //avid
        if (foundItem && foundItem.keyValues) {
            // 步骤2：在 keyValues 中查找特定 key.id 的项
            const specificKey = foundItem.keyValues.find(kv => kv.key.id === keyID); // keyid
            // 步骤3：获取 values 数组的第一个元素的 id
            if (specificKey && specificKey.values && specificKey.values.length > 0) {
                //console.log(specificKey.values[0].id)
                return specificKey.values[0].id;
            }
        }
    }

    // 插入块到数据库(非绑定)
    async function addBlocksToAvNoBind(blocks, avId, pkKeyID, keyID, otherCols) {
        const values = await Promise.all([...blocks].map(async block => {
            // 必须添加主键列
            const rowValues = [{
                "keyID": pkKeyID,
                "block": {
                  "content": keyID ? "" : block.textContent
                }
            }];
            if(keyID) {
                rowValues.push({
                    "keyID": keyID,
                    "text": {
                      "content": block.textContent
                    }
                });
            }
            if(isEnableMoreCols && otherCols && otherCols.length > 0) {
                for(const col of otherCols){
                    if(!col.keyID) continue;
                    let colData = {"keyID": col.keyID};
                    if(typeof col.getColValue !== 'function') continue;
                    const colValue = await col.getColValue(col.keyID);
                    if(typeof colValue !== 'object') continue;
                    colData = {...colData, ...colValue};
                    rowValues.push(colData);
                }
            }
            return rowValues;
        }));
        const input = {
          "avID": avId,
          "blocksValues": values,
        }
        const result = await requestApi('/api/av/appendAttributeViewDetachedBlocksWithValues', input);
        if(!result || result.code !== 0) console.error(result);
    }

    // 给块添加自定义属性
    async function setBlocksAttrs(blockIds, attrs) {
        if(typeof attrs !== 'object') return;
        for(const blockId of blockIds) {
            if(!blockId) continue;
            const result = await requestApi('/api/attr/setBlockAttrs', {
                "id": blockId,
                "attrs": attrs
            });
            if(!result || result.code !== 0) console.error(result);
        }
    }

    // 请求api
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    /**
     * 监控 body 直接子元素中 #commonMenu 的添加
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observeBlockMenu(selector, callback) {
        let hasFlag1 = false;
        let hasFlag2 = false;
        let isTitleMenu = false;
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是目标菜单
                        if((hasFlag1 && hasFlag2) || isTitleMenu) return;
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.cut) {
                            hasFlag1 = true;
                        }
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.move) {
                            hasFlag2 = true;
                        }
                        if(node.nodeType === 1 && node.closest('[data-name="titleMenu"]')) {
                            isTitleMenu = true;
                        }
                        if((hasFlag1 && hasFlag2) || isTitleMenu) {
                           callback(isTitleMenu);
                           setTimeout(() => {
                               hasFlag1 = false;
                               hasFlag2 = false;
                               isTitleMenu = false;
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
    
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
})();