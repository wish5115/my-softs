// 粘贴为网络图片和粘贴为本地图片
// see https://ld246.com/article/1751467959584
(() => {
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
                    let text = await getClipText();
                    if (!text.trim() || !text.trim().toLowerCase().startsWith('http')) {
                        window.siyuan.menus.menu.remove();
                        showMessage('不是有效的图片地址', true);
                        return;
                    }
                    text = `![](${text.trim()})`;
                    insertToEditor(text);
                    window.siyuan.menus.menu.remove();
                });
            }
            // 粘贴为本地图片
            if (!element.parentElement?.querySelector('[data-id="pasteLocalImage"]')) {
                const pasteHtml = `<button data-id="pasteLocalImage" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href=""></use></svg><span class="b3-menu__label">粘贴为本地图片</span></button>`;
                element.insertAdjacentHTML('afterend', pasteHtml);
                const pasteBtn = element.parentElement.querySelector('[data-id="pasteLocalImage"]');
                pasteBtn.addEventListener('click', async (e) => {
                    let text = await getClipText();
                    if (!text.trim() || !text.trim().toLowerCase().startsWith('http')) {
                        window.siyuan.menus.menu.remove();
                        showMessage('不是有效的图片地址', true);
                        return;
                    }
                    const url = text.trim();
                    const imageBuffer = await fetchImageAsBinary(url);
                    const ext = url.split('.').pop().split(/\#|\?/)[0];
                    const name = url.split('/').pop().split('.')[0] || 'image';
                    const path = `/data/assets/${name}-${Lute.NewNodeID()}.${ext}`;
                    putFile(path, imageBuffer);
                    text = `![image](${'assets/' + path.split('/assets/').pop()})`;
                    insertToEditor(text);
                    window.siyuan.menus.menu.remove();
                });
            }
        });
    }, true);

    async function getClipText() {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            return '';
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