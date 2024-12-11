// 自动设置白板文档图标
// see https://ld246.com/article/1733791593751
(async ()=>{
    // 将要设置的Emoji代码
    // 查询Emoji代码，可在控制台输入__getIconCodeByKeyword('关键词')查询，比如 __getIconCodeByKeyword('写字')
    // 批量修改Emoji代码，可在控制台输入__setWhiteboardIcon('emoji code')，比如 __setWhiteboardIcon('270d-fe0f')
    const iconUnicode = '270d-fe0f'; //270d-fe0f 写字Emoji的代码

    // 初始化
    const hasInit = await getLocalStorage('whiteboard-icon-init');
    if(!hasInit) {
        await sleep(300);
        setWhiteboardIcon(iconUnicode);
        setLocalStorageVal('whiteboard-icon-init', 1);
    }

    let firstAfterLoad = true;
    observeWhiteboardCreated(async (whiteboard)=>{
        const editor =  whiteboard.closest('.protyle-wysiwyg[alias="whiteboard"]');
        const docId = editor.previousElementSibling?.querySelector('.protyle-title')?.dataset?.nodeId;
        if(!docId) return;
        if(firstAfterLoad) {
            // 防止未加载完成
            firstAfterLoad = false;
            await sleep(300);
        } else {
           await sleep(100); 
        }
        fetchSyncPost('/api/attr/setBlockAttrs', {
            "id": docId,
            "attrs": { "icon": iconUnicode }
        });
        document.querySelector('.b3-list-item__icon[data-id="'+docId+'"]').innerHTML = unicode2Emoji(iconUnicode);
    });

    // 暴露内部接口
    window.__setWhiteboardIcon = setWhiteboardIcon;
    window.__getIconCodeByKeyword = getIconUnicodeByKeyword;
    window.__setLocalStorageVal = setLocalStorageVal;

    // 批量设置白板图标
    async function setWhiteboardIcon(iconUnicode) {
        const result = await query(`select * from blocks where alias = 'whiteboard'`);
        result.forEach((doc) => {
            fetchSyncPost('/api/attr/setBlockAttrs', {
                "id": doc.id,
                "attrs": { "icon": iconUnicode }
            });
            document.querySelector('.b3-list-item__icon[data-id="'+doc.id+'"]').innerHTML = unicode2Emoji(iconUnicode);
        });
    }
    
    // 获取表情unicode
    function getIconUnicodeByKeyword(keyword) {
        return window.siyuan.emojis.map(item=>item.items.find(i=>i.description_zh_cn.includes(keyword))).find(i=>i)?.unicode || defaultIconUnicode || '1f4c4';
    };
    async function getLocalStorage(key) {
        if(!key) return '';
        const result = await fetchSyncPost('/api/storage/getLocalStorage');
        if(!result || result.code !== 0 || !result.data) return '';
        return result.data[key] || '';
    }
    function setLocalStorageVal(key, val) {
        fetchSyncPost('/api/storage/setLocalStorageVal', { "key": key, "val": val, "app": siyuan.ws.app.appId });
    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // unicode转emoji
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
    // 查询SQL函数
    async function query(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
    // 请求api函数
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
        } catch (e) {
            console.log(e);
            return returnType === 'json' ? { code: e.code || 1, msg: e.message || "", data: null } : "";
        }
    }
    function observeWhiteboardCreated(callback) {
        // 观察器的配置（需要观察什么变动）
        const config = { attributes: false, childList: true, subtree: true };
        // 当检测到变动时需要运行的回调函数
        const callbackWrapper = function (mutationsList, observer) {
            // 遍历所有发生的变动
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 查找新增加的元素
                    const addedNodes = Array.from(mutation.addedNodes);
                    addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.matches('.iframe[data-type="NodeWidget"]')) {
                            if(node.closest('.protyle-wysiwyg[alias="whiteboard"]')) {
                                callback(node);
                            } else {
                                whenElementExist('.protyle-wysiwyg[alias="whiteboard"] [data-node-id="'+node.dataset?.nodeId+'"]').then((node) => {
                                    callback(node);
                                });
                            }
                        }
                    });
                }
            }
        };
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver(callbackWrapper);
        // 开始观察目标节点
        observer.observe(document.body, config);
        // 返回观察者对象，以便可以在外部断开观察
        return observer;
    }
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():document.querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();