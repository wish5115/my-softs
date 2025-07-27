// 粘贴为网络图片和粘贴为本地图片
// version 0.0.6
// 0.0.6 修复图文混合粘贴时，思源默认粘贴可能无法粘贴的问题；在粘贴图片时增加Loading...提示
// 0.0.5.1 改进扩展名的获取方式和菜单尽早隐藏
// 0.0.5 增加下载图片失败时从剪切板获取；改进扩展名的获取方式；默认粘贴图片时，仅监控gif图片的粘贴
// 0.0.4 增加仅监控gif图片参数；修复图片名获取错误问题
// 0.0.3 兼容浏览器复制图片和复制图片地址；增加对思源默认粘贴的监控；修复有时粘贴的图片无法及时显示问题
// 0.0.2 增加粘贴为本地图片
// see https://ld246.com/article/1751467959584
(() => {
    // 是否监听思源默认的粘贴 true监听 false 不监听
    const isListenSiyuanPaste = true;

    // 是否仅监控gif粘贴，仅isListenSiyuanPaste=true时有效
    // true 仅监控gif图片 false 监控所有网络图片
    const isOnlyListenGifPaste = true;
    
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
                            const img = await readClipboardImageUrl();
                            if(img?.type === 'url') text = img.data;
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
                        const imgInfo = {ext: ''};
                        if (!text.trim() || !text.trim().toLowerCase().startsWith('http')) {
                            const img = await readClipboardImageUrl(imgInfo);
                            if(img?.type === 'url') text = img.data;
                            if (!text.trim().toLowerCase().startsWith('http')) {
                                window.siyuan.menus.menu.remove();
                                showMessage('不是有效的图片地址', true);
                                return;
                            }
                        }
                        insertLoadingIcon();
                        window.siyuan.menus.menu.remove();
                        const url = text.trim();
                        const imageBuffer = await fetchImageAsBinary(url, e, imgInfo);
                        if(!imageBuffer) {
                            window.siyuan.menus.menu.remove();
                            removeLoadingIcon();
                            showMessage('读取图片失败', true);
                            return;
                        }
                        const imgPathInfo = parseImageNameAndExt(url);
                        const ext = imgPathInfo?.ext || imgInfo.ext || 'png';
                        const name = imgPathInfo?.name || url.split(/\#|\?/)[0].split('/').pop().split('.')[0] || 'image';
                        const path = `/data/assets/${decodeURIComponent(name)}-${Lute.NewNodeID()}.${ext}`;
                        await putFile(path, imageBuffer);
                        text = `![image](${'assets/' + path.split('/assets/').pop()})`;
                        removeLoadingIcon();
                        insertToEditor(text);
                    } catch (e) {
                        window.siyuan.menus.menu.remove();
                        removeLoadingIcon();
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
            const contenteditable = el.closest('[contenteditable="true"]');
            if(el.closest('.hljs') || !el.closest('.protyle-wysiwyg')) return;
            try {
                let url = '';
                const imgInfo = {ext: ''};
                // 菜单粘贴
                if(e?.detail?.textHTML && /^<img [^>]*?\/?>$/i.test(e?.detail?.textHTML)) {
                    // 用 DOMParser 把 HTML 片段当文档解析
                    const doc = new DOMParser().parseFromString(e.detail.textHTML, 'text/html');
                    const img = doc.querySelector('img');
                    if (img) url = img.src;
                    // const match = e.detail.textHTML.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
                    // if (match && match[1]) {
                    //     url = match[1]; 
                    // }
                    imgInfo.ext = (e.detail?.files||[])[0]?.type?.split('/')[1] || '';
                }
                // 快捷键粘贴
                if(!url) {
                    const html = e?.clipboardData?.getData('text/html');
                    if (!html || !/^<meta [^>]*?><img [^>]*?\/?>$/i.test(html)) return;
                    // 用 DOMParser 把 HTML 片段当文档解析
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const img = doc.querySelector('img');
                    if (img) url = img.src;
                    imgInfo.ext = (e.clipboardData?.files||[])[0]?.type?.split('/')[1] || '';
                }
                url  = url?.trim();
                if(!url || !url.toLowerCase().startsWith('http')) return;
                const imgPathInfo = parseImageNameAndExt(url);
                let ext = imgPathInfo?.ext || imgInfo.ext;
                if(isOnlyListenGifPaste) {
                    if(ext.trim() && ext.trim().toLowerCase() !== 'gif') return;
                }
                e.preventDefault();
                e.stopPropagation();
                insertLoadingIcon();
                window.siyuan.menus.menu.remove();
                const imageBuffer = await fetchImageAsBinary(url, e, imgInfo);
                if(!imageBuffer) {
                    window.siyuan.menus.menu.remove();
                    removeLoadingIcon(contenteditable);
                    showMessage('读取图片失败', true);
                    return;
                }
                ext = imgInfo.ext || ext || 'png';
                const name = imgPathInfo?.name || url.split(/\#|\?/)[0].split('/').pop().split('.')[0] || 'image';
                const path = `/data/assets/${decodeURIComponent(name)}-${Lute.NewNodeID()}.${ext}`;
                await putFile(path, imageBuffer);
                text = `![image](${'assets/' + path.split('/assets/').pop()})`;
                removeLoadingIcon(contenteditable);
                insertToEditor(text);
            } catch (e) {
                removeLoadingIcon(contenteditable);
            }
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
    async function readClipboardImageUrl(imgInfo = {ext:''}) {
        // 必须在用户动作（点击、按键、粘贴事件回调）中调用
        const items = await navigator.clipboard.read();
        for (const item of items) {
            // 获取扩展名
            const ext = item.types?.find(type => type?.startsWith('image/'))?.split('/')[1] || '';
            if(ext) imgInfo.ext = ext;
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
            // if (item.types.some(t => t.startsWith('image/'))) {
            //     const imgBlob = await item.getType(item.types.find(t => t.startsWith('image/')));
            //     return { type: 'blob', data: imgBlob };
            // }
        }
    }
    function insertToEditor(processedText, triggerInput = true) {
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
        if(triggerInput) {
            const editableElement = range.startContainer.parentElement.closest('[contenteditable]');
            if (editableElement) editableElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    function insertLoadingIcon() {
        const html = `<span data-type="text imgLoadingText">Loading...</span>`;
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(html);
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    function removeLoadingIcon(node) {
        const imgLoading = node?.querySelector('[data-type~="imgLoadingText"]');
        if(imgLoading) imgLoading?.remove();
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
            } else {
                throw new Error("Failed to save file");
            }
        }).catch((error) => {
            console.error(error);
        });
    }
    async function fetchImageAsBinary(url, e, imgInfo = {ext:''}) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            const ext = response?.headers?.get('Content-Type')?.split('/')[1] || '';
            if(ext) imgInfo.ext = ext;
            // 获取 ArrayBuffer（原始二进制数据）
            const arrayBuffer = await response.arrayBuffer();
            // 如果你需要 Blob 对象用于预览或下载，也可以这样获取：
            // const blob = await response.blob();
            return arrayBuffer;
        } catch (error) {
            // 下载报错时从剪切板读取二进制
            try {
                return readClipboardImageAsBinary(e);
            } catch (err) {
                console.error('获取图片失败:', err);
                throw err;
            }
        }
    }
    async function readClipboardImageAsBinary(e) {
        // 粘贴菜单事件
        if((e?.detail?.files||[])[0]) {
             const arrayBuffer = await e.detail.files[0].arrayBuffer();
            return arrayBuffer;
        }
        // ctrl+v 事件
        if(e?.clipboardData?.items) {
            const items = e.clipboardData?.items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                // 只处理 image 类型
                if (item.type.startsWith('image/')) {
                    // 获取 File/Blob 对象
                    const blob = item.getAsFile();
                    if (!blob) continue;
                    // 读取 ArrayBuffer（二进制）
                    const arrayBuffer = await blob.arrayBuffer();
                    return arrayBuffer;
                }
            }
        }
        // 直接读取剪切板
        const clipboardItems = await navigator.clipboard.read();
        for (const clipItem of clipboardItems) {
            // 每个 item 可能有多种类型，找 image/*
            for (const type of clipItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipItem.getType(type);
                    // 读取二进制
                    const arrayBuffer = await blob.arrayBuffer();
                    return arrayBuffer;
                }
            }
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
    function parseImageNameAndExt(url) {
        const IMG_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        let fallbackName = '', fallbackExt = '';
        try {
            const u = new URL(url);
            // —— 1. Pathname 优先 ——
            const base = u.pathname.split('/').pop() || '';
            const idxDot = base.lastIndexOf('.');
            if (idxDot !== -1) {
                const pathExt = base.slice(idxDot + 1).toLowerCase();
                const pathName = base.slice(0, idxDot);
                if (IMG_EXTS.includes(pathExt)) {
                    // 确认是图片格式，直接返回
                    return { name: pathName, ext: pathExt };
                } else {
                    // 记住一个“备用”的名字和扩展
                    fallbackName = pathName;
                    fallbackExt = pathExt;
                }
            }
            // —— 2. 全局正则匹配 URL 中最后一个图片文件名 ——
            const re = /([^\/?#=]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg))(?=[?#]|$)/gi;
            let match, lastMatch = null;
            while ((match = re.exec(url)) !== null) {
                lastMatch = match[1];
            }
            if (lastMatch) {
                const dot = lastMatch.lastIndexOf('.');
                return {
                    name: lastMatch.slice(0, dot),
                    ext: lastMatch.slice(dot + 1).toLowerCase()
                };
            }
        } catch (e) {
            // 如果 URL 构造失败，就跳到兜底
        }
        // —— 3. 兜底：若 path 上有其它扩展，返回它 —— 
        if (fallbackName) {
            return { name: fallbackName, ext: fallbackExt };
        }
        // 全无匹配
        return { name: '', ext: '' };
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