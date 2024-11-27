// 思源通过标签插入当前块到数据库（SuperTag）
// 功能：给块设置标签，将块添加到标签同名的数据库。
// 说明；
// 1、数据库名称需要与标签同名，名称需含前后#，如 #笔记软件#
// 2、如果有多个同名数据库，只会将块添加到其中一个，所以不要建立同名数据库
// 3、需要提前建立数据库才能添加成功 
// version：0.0.4
// 更新记录
// 0.0.2 增加数据库同名文档标签即可把文档添加到标签同名数据库中（文档标签这里指文档头部的添加标签）。
// 0.0.3 增加可删除数据库引用文本中的标签名选项isShowTagNameInAvCell
// 0.0.4 改进当标签在列表中时数据库插入列表项
// 根据qiancang大佬的帖子实现 https://ld246.com/article/1731945645865
(()=>{
    // 添加tag后多少毫秒添加当前块到数据库
    // 不宜设置过小，过小可能导致标签被插入一半
    const delay = 500;

    // 是否开启文档标签插入同名数据库（文档标签这里指文档头部的添加标签），true开启，false不开启
    const enableDocTagToAv = true;

    // 是否在数据库列表中显示标签名(数据库名)，true显示，false不显示（注意，文档块引用不会添加标签名，实现较麻烦暂不支持）
    const isShowTagNameInAvCell = true;
    
    // 发布服务立即返回
    if(siyuan.config.readonly) return;
    
    // 监听tag输入
    observeTagSpans(async (tagEl, tagType) => {
        // 如果未开启文档标签插入同名数据库，当为文档标签时返回
        if(!enableDocTagToAv && tagType === 'doc-tag') return;
        // 去掉零宽度字符&ZeroWithSpace;
        const tag = tagEl?.textContent?.replace(/[\u200B-\u200D\uFEFF]/g, '')?.trim();
        if(!tag) return;
        // 获取数据库信息
        const av = await getAvByName(tag);
        if(!av) return;
        const avId = av.avID;
        if(!avId) return;
        const avBlockID = av.blockID;
        if(!avBlockID) return;
        // 获取文档块信息
        let block;
        if(tagType === 'doc-tag') {
            // 如果头部标签，返回文档id
            const blockParent = tagEl.closest('div.protyle-top');
            if(!blockParent) return;
            block = blockParent.querySelector('.protyle-title');
        } else {
            // 如果块标签，返回块id（监听元素的临时块）
            block = tagEl.closest('div[data-node-id][data-type]');
            if(!block) return;
            // 获取文档中的block结点
            block = document.querySelector('div[data-node-id="'+(block?.dataset?.nodeId||'')+'"]');
            if(!block) return;
            // 判断是否在列表元素内，数据库插入列表项
            const listLeafNode = block.closest('div[data-node-id][data-type="NodeList"]');
            if(listLeafNode) block = listLeafNode;
        }
        const blockId = block?.dataset?.nodeId;
        if(!blockId) return;
        // 添加块到数据库
        await sleep(delay || 500);
        addBlocksToAv(blockId, avId, avBlockID);
    });

    // 如果不在数据库中显示标签名则删除标签名（注意，文档块引用不会添加标签名，实现较麻烦暂不支持）
    if(!isShowTagNameInAvCell) {
        observeElementCreation(
            document.body,
            '.av__row:not(.av__row--header) [data-dtype="block"] [data-type="block-ref"]',
            async ref => {
                if(!/\s?#.*?#/i.test(ref.textContent)) return;
                ref.textContent = ref.textContent.replace(/\s?#.*?#/ig, '');
            }
        );
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
        const result = await fetchSyncPost('/api/av/addAttributeViewBlocks', input);
        if(!result || result.code !== 0) console.error(result);
    }
    // 通过该tag查询数据库
    async function getAvByName(name) {
        const result = await fetchSyncPost('/api/av/searchAttributeView', {
            "keyword": name
        });
        if(!result || result.code !== 0 || !result?.data?.results || result?.data?.results?.length === 0) return null;
        for (const av of result.data.results) {
            if (av.avName === name || av.avName === `#${name}#`) {
                return av;
            }
        }
        return null;
    }
    // 请求api
    // returnType json返回json格式，text返回文本格式
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
    // 延迟执行
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // 监听tag被添加
    function observeTagSpans(callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'span' && node.getAttribute('data-type') === 'tag') {
                            // 块标签调用回调函数
                            callback(node, 'block-tag');
                        } else if(node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'div' && node.classList?.contains('b3-chip') && node.getAttribute('data-type') === 'open-search') {
                            // 文档头部标签调用回调函数
                            callback(node, 'doc-tag');
                        }
                    }
                }
            }
        });
        // 配置观察选项:
        const config = { 
            childList: true, // 观察子节点的变化(添加/删除)
            subtree: true // 观察所有后代节点
        };
        // 选择需要观察变动的节点
        const targetNode = document.body; // 或者选择更具体的父节点以减少性能消耗
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回一个取消观察的方法
        return () => observer.disconnect();
    }
    // 监听元素被创建
    function observeElementCreation(parentNode, selector, onElementCreated) {
        // 配置观察器选项
        const config = { 
            childList: true, // 观察直接子节点的添加和移除
            subtree: true    // 观察所有后代节点
        };
        // 当检测到变动时执行的回调函数
        const callback = function(mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 使用 querySelectorAll 查找所有符合条件的新元素
                            const elements = node.querySelectorAll(selector);
                            elements.forEach(element => {
                                onElementCreated(element); // 调用外部提供的回调函数
                            });
                        }
                    });
                }
            }
        };
        // 创建一个观察器实例并传入回调函数
        const observer = new MutationObserver(callback);
        // 开始观察目标节点
        observer.observe(parentNode, config);
        // 返回一个函数来停止观察
        return () => observer.disconnect();
    }
})();