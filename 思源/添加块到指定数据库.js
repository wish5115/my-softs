// 添加块到指定数据库（支持绑定块和不绑定块，支持文档块和普通块）
// see https://ld246.com/article/1746087652265
// 注意：只能在块菜单中操作（你的右键可能不是块菜单）
// version 0.0.2
// 0.0.2 支持同时发送到多个数据库中
(()=>{

    // 是否开启绑定块菜单，true 开启，false 不开启
    const isEnableBindBlock = true;

    // 是否开启不绑定块菜单，true 开启，false 不开启
    const isEnableNotBindBlock = true;
    
    // 添加到的数据库块id列表（必填），注意是数据库所在块id，如果移动了数据库位置需要更改
    const toAvBlockIds = [
        '20250501223635-2hu6d9z',
        '20250502120433-a7o0ahx',
    ];

    // 指定数据库的列名，不填默认是添加到主键列，该参数仅对不绑定块菜单有效，如果多个列名一样的则取第一个
    // 注意，目前仅支持文本列
    const toAvColName = '';
    
    // 监听块右键菜单
    whenElementExist('#commonMenu .b3-menu__items').then((menuItems) => {
        observeBlockMenu(menuItems, async (isTitleMenu)=>{
            if(menuItems.querySelector('.add-to-my-av')||menuItems.querySelector('.add-to-my-av-no-bind')) return;
            const addAv = menuItems.querySelector('button[data-id="addToDatabase"]');
            if(!addAv) return;
            
            // 创建非绑定菜单按钮
            if(isEnableNotBindBlock) {
                const menuText = '添加到指定数据库（不绑定块）';
                const menuIcon = '#iconDatabase';
                const menuButtonHtml = `<button class="b3-menu__item add-to-my-av-no-bind"><svg class="b3-menu__icon " style=""><use xlink:href="${menuIcon}"></use></svg><span class="b3-menu__label">${menuText}</span></button>`;
                addAv.insertAdjacentHTML('afterend', menuButtonHtml);
                const menuBtn = menuItems.querySelector('.add-to-my-av-no-bind');
                menuBtn.onclick = async () => {
                    window.siyuan.menus.menu.remove();
                    toAvBlockIds.forEach(toAvBlockId => {
                        menuItemClick(toAvBlockId, isTitleMenu, false);
                    });
                };
            }

            // 创建绑定菜单按钮
            if(isEnableBindBlock) {
                const menuText = '添加到指定数据库';
                const menuIcon = '#iconDatabase';
                const menuButtonHtml = `<button class="b3-menu__item add-to-my-av"><svg class="b3-menu__icon " style=""><use xlink:href="${menuIcon}"></use></svg><span class="b3-menu__label">${menuText}</span></button>`;
                addAv.insertAdjacentHTML('afterend', menuButtonHtml);
                const menuBtn = menuItems.querySelector('.add-to-my-av');
                menuBtn.onclick = async () => {
                    window.siyuan.menus.menu.remove();
                    toAvBlockIds.forEach(toAvBlockId => {
                        menuItemClick(toAvBlockId, isTitleMenu, true);
                    });
                };
            }
        });
    });
    // 菜单点击事件
    async function menuItemClick(toAvBlockId, isTitleMenu, isBindBlock) {
        const avId = await getAvIdByAvBlockId(toAvBlockId);
        if(!avId) {
            showMessage('未找到块ID'+toAvBlockId+'所在的数据库，请检查数据库块ID配置是否正确', true);
            return;
        }
        let blocks = [];
        if(isTitleMenu) {
            // 添加文档块到数据库
            const docTitleEl = (document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)'))?.querySelector('.protyle-title');
            const docId = docTitleEl?.dataset?.nodeId;
            const docTitle = docTitleEl?.querySelector('.protyle-title__input')?.textContent;
            blocks = [{
                dataset: {nodeId: docId},
                textContent: docTitle,
            }];
        } else {
            // 添加普通块到数据库
            blocks = document.querySelectorAll('.protyle-wysiwyg--select');
        }
        // 绑定块
        if(isBindBlock){
            const blockIds = [...blocks].map(block => block.dataset.nodeId);
            addBlocksToAv(blockIds, avId, toAvBlockId);
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
            addBlocksToAvNoBind(blocks, avId, pkKeyID, keyID);
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

    // 插入块到数据库(非绑定)
    async function addBlocksToAvNoBind(blocks, avId, pkKeyID, keyID) {
        const values = [...blocks].map(block => {
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
            return rowValues;
        });
        const input = {
          "avID": avId,
          "blocksValues": values,
        }
        const result = await requestApi('/api/av/appendAttributeViewDetachedBlocksWithValues', input);
        if(!result || result.code !== 0) console.error(result);
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