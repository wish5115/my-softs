// 让思源支持锚点链接跳转
// see https://ld246.com/article/1736153236901
(async () => {
    observeEditorLoaded((editor)=>{
        let headMaps = {};
        editor.addEventListener('click', async (event) => {
            if(event.target.matches('span[data-type="a"][data-href^="#"]')) {
                if(Object.keys(headMaps).length === 0) {
                    const nodeId = editor.parentElement?.querySelector('.protyle-title')?.dataset?.nodeId;
                    if(!nodeId) return;
                    const heads = await querySql(`select id,content from blocks where type = 'h' and root_id = '${nodeId}' limit 9999;`);
                    heads.forEach(h => headMaps[h.content.trim().toLowerCase()] = h.id);
                }
                const oldHref = event.target?.dataset?.href || '';
                const headText = event.target.textContent.trim();
                const headHrefText = event.target?.dataset?.href?.replace(/^#/, '')?.trim().toLowerCase();
                if(headMaps[headText.toLowerCase()] || headMaps[headHrefText] || headMaps[headHrefText.replace(/\-/g, ' ')]) {
                    const headId = headMaps[headText.toLowerCase()] || headMaps[headHrefText] || headMaps[headHrefText.replace(/\-/g, ' ')];
                    event.target.dataset.href = `siyuan://blocks/${headId}`;
                    //event.target.dataset.title = headText;
                    event.target.click();
                    // 恢复原链接锚点
                    setTimeout(() => {
                        event.target.dataset.href = oldHref;
                    }, 150);
                }
                // 关闭报错信息
                whenElementExist('#message .b3-snackbar__content').then((el) => {
                    if(el.textContent.trim() === 'Error: Invalid URL') {
                        el.click();
                    }
                });
            }
        });
    });
    // 监听编辑器被添加
    function observeEditorLoaded(callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (mutation.target.classList?.contains("protyle-wysiwyg")) {
                        if(!mutation.target?.dataset?.loaded) {
                            mutation.target.dataset.loaded = true;
                            callback(mutation.target);
                        }
                    }
                }
            }
        });
        // 配置观察选项:
        const config = { 
            childList: true, // 观察子节点的变化(添加/删除)
            subtree: true, // 观察所有后代节点
            attributes: false,
        };
        // 选择需要观察变动的节点
        const targetNode = document.body; // 或者选择更具体的父节点以减少性能消耗
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回一个取消观察的方法
        return () => observer.disconnect();
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    async function querySql(sql) {
        try {
            const result = await requestApi('/api/query/sql', { "stmt": sql });
            if (result.code !== 0) {
                console.error("查询数据库出错", result.msg);
                return [];
            }
            return result.data;
        } catch(e) {
            console.error("查询数据库出错", e.message);
            return [];
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
})();