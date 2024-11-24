// 思源通过标签插入当前块到数据库（SuperTag）
// 功能：给块设置标签，将块添加到标签同名的数据库。
// 说明；
// 1、数据库名称需要与标签同名
// 2、如果有多个同名数据库，只会将块添加到其中一个，所以不要建立同名数据库
// 3、需要提前建立数据库才能添加成功 
// version：0.0.1
// 问题反馈：
// 根据qiancang大佬的帖子实现 https://ld246.com/article/1731945645865
(()=>{
    // 添加tag后多少毫秒添加当前块到数据库
    // 不宜设置过小，过小可能导致标签被插入一半
    const delay = 500;
    
    // 发布服务立即返回
    if(siyuan.config.readonly) return;
    // 监听tag输入
    observeTagSpans(async tagEl => {
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
        const block = tagEl.closest('div[data-node-id][data-type]');
        const blockId = block?.dataset?.nodeId;
        if(!blockId) return;
        // 添加块到数据库
        await sleep(delay || 500);
        addBlocksToAv(blockId, avId, avBlockID);
    });
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
                            // 调用回调函数，传递新添加的元素
                            callback(node);
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
})();