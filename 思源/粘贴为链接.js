// 粘贴为链接（自动把一个链接或思源超级链接变为链接）
// see https://ld246.com/article/1752462022192
// author: wilsons
// version 0.0.2
// 0.0.2 修复手机粘贴失败的问题；参考@frostime的Titled Url插件代码解决了浏览器跨域无法获取问题 see https://github.com/frostime/sy-titled-link/blob/1b70c09631da0058f3229ac45681feaadd477604/src/index.ts#L17
(()=>{
    // main by wilsons
    const main = async (e, wysiwyg) => {
        const hljs = e.target.closest('.hljs');
        if(hljs) return;
        wysiwyg = wysiwyg||e.target.closest('.protyle-wysiwyg');
        whenElementExist('#commonMenu [data-id="pasteEscaped"], #editor .protyle-util--mobile [data-action="pasteEscaped"]').then(element => {
            if(!element || element.parentElement.querySelector('[data-id="pasteLink"], [data-action="pasteLink"]')) return;
            let pasteHtml = `<button data-id="pasteLink" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">粘贴为链接</span></button>`;
            if(isMobile()) pasteHtml = `<div class="keyboard__split"></div><button class="keyboard__action" data-action="pasteLink"><span>粘贴为链接</span></button>`;
            element.insertAdjacentHTML('afterend', pasteHtml);
            const pasteBtn = element.parentElement.querySelector('[data-id="pasteLink"], [data-action="pasteLink"]');
            pasteBtn.addEventListener('click', async (e) => {
                if(isMobile()) {
                   element.closest('#editor .protyle-util--mobile').classList.add("fn__none"); 
                } else {
                    window.siyuan.menus.menu.remove();
                }
                let text  = await getClipText();
                if(!text) return;
                text = text.trim();
                if(text.toLowerCase().startsWith('siyuan://')) {
                    // 思源超级链接
                    const blockId = text.split('/')?.pop()?.trim();
                    const linkTitle = await getBlockContent(blockId) || text;
                    text = `[${linkTitle}](${text})`;
                } else if(text.toLowerCase().startsWith('http://')||text.toLowerCase().startsWith('https://')) {
                    // 网络连接
                    const href = text;
                    text = `[正在获取标题...](${href} "Loading")`;
                    setTimeout(() => {
                        const links = wysiwyg.querySelectorAll(`[data-type~="a"][data-title="Loading"]`);
                        links.forEach(async link => {
                            const title = await getWebTitle(link.dataset.href) || href;
                            link.textContent = title;
                            link.dataset.title = '';
                            updateBlock(link);
                        });
                    }, 100);
                } else {
                    // 其他链接
                    text = `[${text}](${text})`;
                }
                insertToEditor(text);
            });
        });
    };
    // 添加右键菜单 by wilsons
    if(isMobile()) {
        // 手机版添加右键菜单
        document.addEventListener('contextmenu', (e)=>{
            const wysiwyg = e.target.closest('.protyle-wysiwyg');
            const protyleUtil = document.querySelector('#editor .protyle-util--mobile');
            if(protyleUtil && !protyleUtil.clickHandle) {
                protyleUtil.clickHandle = true;
                protyleUtil.addEventListener('click', (evt) => {
                    if(evt.target.closest('[data-action="more"]')) main(e, wysiwyg);
                });
            }
        }, true);
    } else {
        // pc版添加右键菜单
        document.addEventListener('contextmenu', main, true);
    }
    async function getClipText() {
        try {
            if (isInAndroid()) {
                return window.JSAndroid.readClipboard();
            } else if (isInHarmony()) {
                return window.JSHarmony.readClipboard();
            }
            return navigator.clipboard.readText();
        } catch (error) {
            return '';
        }
    }
    function isInAndroid() {
        return window.siyuan.config.system.container === "android" && window.JSAndroid;
    };
    function isInHarmony() {
        return window.siyuan.config.system.container === "harmony" && window.JSHarmony;
    };
    async function getBlockContent(blockId) {
        const content = await querySql(`select content from blocks where id = '${blockId}'`);
        return content[0]?.content || '';
    }
    function isDesktop() {
        return typeof window !== 'undefined' && !!window.require;
    }
    async function forwardProxy(url, method = 'GET', payload = {}, headers = [], timeout = 7000, contentType = 'text/html') {
        const data = {
            url: url,
            method: method,
            timeout: timeout,
            contentType: contentType,
            headers: headers,
            payload: payload
        };
        return requestApi('/api/network/forwardProxy', data);
    }
    async function getWebTitle(href) {
        let title = '';
        // Normalize URL
        if (href.startsWith("www.")) {
            href = "https://" + href;
        } else if (!href.toLowerCase().startsWith('http://') && !href.toLowerCase().startsWith('https://')) {
            return '';
        }
        try {
            let html;
            const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76";
            if (!isDesktop()) {
                // 浏览器环境必须依赖内核 API
                const result = await forwardProxy(
                    href, 'GET', null,
                    [{ 'User-Agent': userAgent }],
                    5000, 'text/html'
                );
                const data = result?.data;
                if (!data || (data.status / 100) !== 2) {
                    return '';
                }
                html = data?.body;
            } else {
                const response = await fetch(href, {
                    method: 'GET',
                    headers: {
                        'User-Agent': userAgent
                    },
                    redirect: 'follow'
                });
                if (!response.ok) {
                    return '';
                }
                html = await response.text();
            }
            // Common HTML parsing logic
            const titleReg = /<title\b[^>]*>(.*?)<\/title>/i;
            const matchRes = html.match(titleReg);
            if (matchRes) {
                title = matchRes[1];
                //@ts-ignore - assuming Lute is available in global scope
                title = window.Lute?.UnEscapeHTMLStr(title) || title;
                // Charset detection
                const charsetReg = /<meta\b[^>]*charset=['"]?([^'"]*)['"]?[^>]*>/i;
                const charsetMatch = html.match(charsetReg);
                const charset = charsetMatch ? charsetMatch[1].toLowerCase() : "utf-8";
                if (charset !== "utf-8") {
                    title = '';
                }
            }
        } catch (error) {
            console.error('Error fetching URL:', error);
            return '';
        }
        return title;
    }
    function insertToEditor(processedText) {
        // 插入处理后的文本
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(processedText);
        range.insertNode(textNode);
        range.setStart(textNode, textNode.length);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        // 触发input事件
        const editableElement = range.startContainer.parentElement.closest('[contenteditable]');
        if (editableElement) editableElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
    async function updateBlock(node) {
        if(!node.matches('[data-node-id][data-type]')) {
            node = node.closest('[data-node-id][data-type]');
        }
        await (await fetch('/api/block/updateBlock', {
            method: 'POST',
            body: JSON.stringify({
                "dataType": "dom",
                "data": node.outerHTML,
                "id": node.dataset.nodeId
            })
        })).json();
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    async function querySql(sql) {
        const result = await requestApi('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    function whenElementExist(selector, node = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function'
                        ? selector()
                        : node.querySelector(selector);
                } catch (err) {
                    return resolve(null);
                }
                if (el) {
                    resolve(el);
                } else if (Date.now() - start >= timeout) {
                    resolve(null);
                } else {
                    requestAnimationFrame(check);
                }
            }
            check();
        });
    }
})();