// 粘贴为链接（自动把一个链接或思源超级链接变为链接）
// see 
// author: wilsons
// version 0.0.1
(()=>{
    // main by wilsons
    const main = async (e) => {
        const hljs = e.target.closest('.hljs');
        if(hljs) return;
        const wysiwyg = e.target.closest('.protyle-wysiwyg');
        whenElementExist('#commonMenu [data-id="pasteEscaped"], #editor .protyle-util--mobile [data-action="pasteEscaped"]').then(element => {
            if(!element || element.parentElement.querySelector('[data-id="pasteLink"], [data-action="pasteLink"]')) return;
            let pasteHtml = `<button data-id="pasteLink" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">粘贴为链接</span></button>`;
            if(isMobile()) pasteHtml = `<div class="keyboard__split"></div><button class="keyboard__action" data-action="pasteLink"><span>粘贴为链接</span></button>`;
            element.insertAdjacentHTML('afterend', pasteHtml);
            const pasteBtn = element.parentElement.querySelector('[data-id="pasteLink"], [data-action="pasteLink"]');
            pasteBtn.addEventListener('click', async (e) => {
                window.siyuan.menus.menu.remove();
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
            const protyleUtil = document.querySelector('#editor .protyle-util--mobile');
            if(protyleUtil && !protyleUtil.clickHandle) {
                protyleUtil.clickHandle = true;
                protyleUtil.addEventListener('click', (evt) => {
                    if(evt.target.closest('[data-action="more"]')) main(e);
                });
            }
        }, true);
    } else {
        // pc版添加右键菜单
        document.addEventListener('contextmenu', main, true);
    }
    async function getClipText() {
        try {
          const text = await navigator.clipboard.readText();
          return text;
        } catch (error) {
          return '';
        }
    }
    async function getBlockContent(blockId) {
        const content = await querySql(`select content from blocks where id = '${blockId}'`);
        return content[0]?.content || '';
    }
    async function getWebTitle(url) {
        try {
            let text = '';
            if(isElectron()){
                text = await fetchByCurl(url);
            } else {
                const response = await fetch(url);
                text = await response.text();
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            return doc?.title || '';
        } catch (error) {
            return '';
        }
    }
    async function fetchByCurl(url) {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        const cmd = [
              'curl -sL', 
              `-H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'`,
              `-H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8'`,
              `-H 'cache-control: no-cache'`,
              `-H 'pragma: no-cache'`,
              `-H 'priority: u=0, i'`,
              `-H 'sec-ch-ua: "Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"'`,
              `-H 'sec-ch-ua-mobile: ?0'`,
              `-H 'sec-ch-ua-platform: "macOS"'`,
              `-H 'sec-fetch-dest: document'`,
              `-H 'sec-fetch-mode: navigate'`,
              `-H 'sec-fetch-site: none'`,
              `-H 'sec-fetch-user: ?1'`,
              `-H 'upgrade-insecure-requests: 1'`,
              `-H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'`,
              `"${url}"`
        ].join(' ');
        const { stdout: html } = await execAsync(cmd);
        return html;
    }
    function isElectron() {
        return navigator.userAgent.includes('Electron');
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