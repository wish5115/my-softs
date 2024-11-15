// 功能：建文档的时候自动设置为自定义的某个图标
// see https://ld246.com/article/1726920727424
(()=>{
    // 默认图标
    // 根据iconType参数不同而不同
    // 当iconType参数是keyword时，该值是关键词，如：嘿嘿，获取方式参考iconType参数
    // 当iconType参数是unicode时，该词是表情unicode，如：1f4c4，获取方式请参考iconType参数
    // 当iconType参数是custom时，用户自定义表情是表情路径，，/emojis/下的表情图片路径，不要包含/emojis/，如下
    // const defaultIcon = 'demo/demo.png'; // 实际表情路径是 /emojis/demo/demo.png
    const defaultIcon = '备忘录';

    // 表情类型
    // 参数类型有：keyword 关键词，默认；unicode；custom，用户自定义表情
    // keyword的获取方式，打开表情对话框，鼠标移上去就能看到表情的提示内容了，比如：嘿嘿，这种方式的缺点是性能略差，需要遍历表情获取unicode
    // unicode获取方式，思源主菜单》开发者工具》控制台中输入 比如：getIconUnicodeByKeyword('嘿嘿')，该方式缺点获取unicode麻烦
    // unicode，也可以在 工作空间/conf/appearance/emojis/conf.json中搜索
    // custom，用户自定义表情，需要用户在defaultIcon参数中输入自定义表情的路径，详情参考 defaultIcon参数说明
    // 如果你不清楚，请使用默认参数
    const iconType = 'keyword';

    // 多少秒内创建的文档被认为是新建文档，默认为3秒
    const delayTime = 3;

    // 思源默认新建文档图标，不需要修改
    const defaultIconUnicode = '1f4c4';

    // 监听笔记列表渲染完成
    whenElementExist(".layout__dockl .file-tree ul.b3-list[data-url]").then(async ul => {
        window.getIconUnicodeByKeyword = getIconUnicodeByKeyword;
        let icon = defaultIcon;
        if(iconType === 'keyword'){
            icon = getIconUnicodeByKeyword(defaultIcon);
        }
        observeNoteCreated(ul.parentElement, async (newNote) => {
            await sleep(200);
            const result = await fetchSyncPost('/api/attr/setBlockAttrs', {
                "id": newNote.dataset.nodeId,
                "attrs": { "icon": icon }
            });
            if(result.code === 0) {
                if(iconType === 'custom') {
                    newNote.querySelector('.b3-list-item__icon').innerHTML = `<img class="" src="/emojis/${icon}">`;
                } else {
                    newNote.querySelector('.b3-list-item__icon').innerHTML = unicode2Emoji(icon);
                }
            }
        });
    });

    // 监听新建文档
    function observeNoteCreated(targetNode, callback) {
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
                        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'UL') {
                            Array.from(node.children).forEach(li => {
                                const nodeId = li.dataset.nodeId;
                                if(!nodeId) return;
                                const nodeTime = nodeId.split('-')[0];
                                const nowTime = formatDateTime();
                                if(nowTime - nodeTime < delayTime) {
                                    callback(li);
                                }
                            });
                        }
                    });
                }
            }
        };
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver(callbackWrapper);
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回观察者对象，以便可以在外部断开观察
        return observer;
    }
    // 生成块时间 类似dayjs().format("YYYYMMDDHHmmss")
    function formatDateTime(date) {
        date = date || new Date();
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var day = ('0' + date.getDate()).slice(-2);
        var hours = ('0' + date.getHours()).slice(-2);
        var minutes = ('0' + date.getMinutes()).slice(-2);
        var seconds = ('0' + date.getSeconds()).slice(-2);

        return year + month + day + hours + minutes + seconds;
    }
    // 获取表情unicode
    function getIconUnicodeByKeyword(keyword) {
        return window.siyuan.emojis.map(item=>item.items.find(i=>i.description_zh_cn.includes(keyword))).find(i=>i)?.unicode || defaultIconUnicode || '1f4c4';
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
    };
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
    // sleep函数
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // 等待元素渲染完成后执行
    function whenElementExist(selector, bySetTimeout = false, delay = 40) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let element = null;
                if (typeof selector === 'function') {
                    element = selector();
                } else {
                    element = document.querySelector(selector);
                }
                if (element) {
                    resolve(element);
                } else {
                    if (bySetTimeout) {
                        setTimeout(checkForElement, delay);
                    } else {
                        requestAnimationFrame(checkForElement);
                    }
                }
            };
            checkForElement();
        });
    }
})();