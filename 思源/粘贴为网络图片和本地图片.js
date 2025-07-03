// 粘贴为网络图片和粘贴为本地图片
// version 0.0.4
// 0.0.4 增加仅监控gif图片参数；修复图片名获取错误问题
// 0.0.3 兼容浏览器复制图片和复制图片地址；增加对思源默认粘贴的监控；修复有时粘贴的图片无法及时显示问题
// 0.0.2 增加粘贴为本地图片
// see https://ld246.com/article/1751467959584
(() => {
    // 是否监听思源默认的粘贴 true监听 false 不监听
    const isListenSiyuanPaste = true;

    // （试验）是否仅监控gif粘贴，仅isListenSiyuanPaste=true时有效
    // 通过扩展名判断，可能不准，请根据自己需求谨慎使用
    // true 仅监控gif图片 false 监控所有网络图片
    const isOnlyListenGifPaste = false;
    
    // 添加右键菜单
    document.addEventListener('contextmenu', async function (e) {
        const hljs = e.target.closest('.hljs');
        if (hljs) return;
        whenElementExist('#commonMenu [data-id="pasteEscaped"]').then(element => {
            if (!element) return;
            // 粘贴为网络图片
            if (!element.parentElement?.querySelector('[data-id="pasteNetImage"]')) {
                const pasteHtml = `<button data-id="pasteNetImage" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href=""></use></svg><span class="b3-menu__label">粘贴为网络图片</span></button>`;
                element.insertAdjacentHTML('afterend', pasteHtml);
                const pasteBtn = element.parentElement.querySelector('[data-id="pasteNetImage"]');
                pasteBtn.addEventListener('click', async (e) => {
                    try {
                        let text = await getClipText();
                        if (!text.trim() || !text.trim().toLowerCase().startsWith('http')) {
                            const img = await readClipboardItems();
                            if(img.type === 'url') text = img.data;
                            if (!text.trim().toLowerCase().startsWith('http')) {
                                window.siyuan.menus.menu.remove();
                                showMessage('不是有效的图片地址', true);
                                return;
                            }
                        }
                        text = `![](${text.trim()})`;
                        insertToEditor(text);
                        window.siyuan.menus.menu.remove();
                    } catch (e) {
                        window.siyuan.menus.menu.remove();
                        showMessage(e.message || '粘贴失败', true);
                    }
                });
            }
            // 粘贴为本地图片
            if (!element.parentElement?.querySelector('[data-id="pasteLocalImage"]')) {
                const pasteHtml = `<button data-id="pasteLocalImage" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href=""></use></svg><span class="b3-menu__label">粘贴为本地图片</span></button>`;
                element.insertAdjacentHTML('afterend', pasteHtml);
                const pasteBtn = element.parentElement.querySelector('[data-id="pasteLocalImage"]');
                pasteBtn.addEventListener('click', async (e) => {
                    try {
                        let text = await getClipText();
                        if (!text.trim() || !text.trim().toLowerCase().startsWith('http')) {
                            const img = await readClipboardItems();
                            if(img.type === 'url') text = img.data;
                            if (!text.trim().toLowerCase().startsWith('http')) {
                                window.siyuan.menus.menu.remove();
                                showMessage('不是有效的图片地址', true);
                                return;
                            }
                        }
                        const url = text.trim();
                        const imageBuffer = await fetchImageAsBinary(url);
                        const ext = url.split('.').pop().split(/\#|\?/)[0];
                        const name = url.split(/\#|\?/)[0].split('/').pop().split('.')[0] || 'image';
                        const path = `/data/assets/${name}-${Lute.NewNodeID()}.${ext}`;
                        await putFile(path, imageBuffer);
                        text = `![image](${'assets/' + path.split('/assets/').pop()})`;
                        insertToEditor(text);
                        window.siyuan.menus.menu.remove();
                    } catch (e) {
                        window.siyuan.menus.menu.remove();
                        showMessage(e.message || '粘贴失败', true);
                    }
                });
            }
        });
    }, true);

    // 监控粘贴
    if (isListenSiyuanPaste) {
        let pasting = false;
        const pastehandle = async e => {
            if(pasting) return;
            pasting = true;
            setTimeout(()=>pasting = false, 100);
            const el = getCursorElement();
            if(el.closest('.hljs') || !el.closest('.protyle-wysiwyg')) return;
            try {
                let url = '';
                // 菜单粘贴
                if(e?.detail?.textHTML) {
                    // 用 DOMParser 把 HTML 片段当文档解析
                    const doc = new DOMParser().parseFromString(e.detail.textHTML, 'text/html');
                    const img = doc.querySelector('img');
                    if (img) url = img.src;
                    // const match = e.detail.textHTML.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
                    // if (match && match[1]) {
                    //     url = match[1]; 
                    // }
                }
                // 快捷键粘贴
                if(!url) {
                    const html = e.clipboardData.getData('text/html');
                    if (!html) return;
                    // 用 DOMParser 把 HTML 片段当文档解析
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const img = doc.querySelector('img');
                    if (img) url = img.src;
                }
                url  = url?.trim();
                if(!url || !url.toLowerCase().startsWith('http')) return;
                if(isOnlyListenGifPaste) {
                    const ext = url.split('.').pop().split(/\#|\?/)[0];
                    if(ext.trim().toLowerCase() !== 'gif') return;
                }
                e.preventDefault();
                e.stopPropagation();
                const imageBuffer = await fetchImageAsBinary(url);
                const ext = url.split('.').pop().split(/\#|\?/)[0];
                const name = url.split(/\#|\?/)[0].split('/').pop().split('.')[0] || 'image';
                const path = `/data/assets/${name}-${Lute.NewNodeID()}.${ext}`;
                await putFile(path, imageBuffer);
                text = `![image](${'assets/' + path.split('/assets/').pop()})`;
                insertToEditor(text);
                window.siyuan.menus.menu.remove();
            } catch (e) {}
        };
        document.addEventListener('paste', pastehandle, true);
    }

    async function getClipText() {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            return '';
        }
    }
    async function readClipboardItems() {
        // 必须在用户动作（点击、按键、粘贴事件回调）中调用
        const items = await navigator.clipboard.read();
        for (const item of items) {
            // item.types 里可能有 'text/html'、'text/plain'、'image/png' 等
            if (item.types.includes('text/html')) {
                const blob = await item.getType('text/html');
                const html = await blob.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const img = doc.querySelector('img');
                if (img) {
                    return { type: 'url', data: img.src };
                }
            }
            // 检查 image/* 类型，获取 Blob
            if (item.types.some(t => t.startsWith('image/'))) {
                const imgBlob = await item.getType(item.types.find(t => t.startsWith('image/')));
                return { type: 'blob', data: imgBlob };
            }
        }
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
    function putFile(storagePath, data) {
        const formData = new FormData();
        formData.append("path", storagePath);
        formData.append("file", new Blob([data]));
        return fetch("/api/file/putFile", {
            method: "POST",
            body: formData,
        }).then((response) => {
            if (response.ok) {
                //console.log("File saved successfully");
            }
            else {
                throw new Error("Failed to save file");
            }
        }).catch((error) => {
            console.error(error);
        });
    }
    async function fetchImageAsBinary(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            // 获取 ArrayBuffer（原始二进制数据）
            const arrayBuffer = await response.arrayBuffer();
            // 如果你需要 Blob 对象用于预览或下载，也可以这样获取：
            // const blob = await response.blob();
            return arrayBuffer;
        } catch (err) {
            console.error('获取图片失败:', err);
            throw err;
        }
    }
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({ "msg": message, "timeout": delay })
        });
    }
    function getCursorElement() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // 获取选择范围的起始位置所在的节点
            const startContainer = range.startContainer;
            // 如果起始位置是文本节点，返回其父元素节点
            const cursorElement = startContainer.nodeType === Node.TEXT_NODE
                ? startContainer.parentElement
                : startContainer;
            return cursorElement;
        }
        return null;
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