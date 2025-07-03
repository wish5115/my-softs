// 粘贴为段落（自动把剪切板一个换行转换为两个）
// see https://ld246.com/article/1749074848419
(()=>{
    // 添加右键菜单
    document.addEventListener('contextmenu', async function (e) {
        const hljs = e.target.closest('.hljs');
        if(hljs) return;
        whenElementExistOrNull('#commonMenu [data-id="pasteEscaped"]').then(element => {
            if(!element || element.parentElement.querySelector('[data-id="pasteParagraph"]')) return;
            const pasteHtml = `<button data-id="pasteParagraph" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">粘贴为段落</span></button>`;
            element.insertAdjacentHTML('afterend', pasteHtml);
            const pasteBtn = element.parentElement.querySelector('[data-id="pasteParagraph"]');
            pasteBtn.addEventListener('click', async (e) => {
                window.siyuan.menus.menu.remove();
                let text  = await getClipText();
                if(!text) return;
                text = text.replace(/\n/g, '\n\n');
                //text = text.split('\n').join('\n\n');
                insertToEditor(text);
            });
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
    function whenElementExistOrNull(selector, node, timeout = 5000) {
        return new Promise((resolve) => {
            let isResolved = false;
            let requestId, timeoutId; // 保存 requestAnimationFrame 的 ID
            const check = () => {
                try {
                    const el = typeof selector === 'function' ? selector() : (node || document).querySelector(selector);
                    if (el) {
                        isResolved = true;
                        cancelAnimationFrame(requestId); // 找到元素时取消未执行的动画帧
                        if(timeoutId) clearTimeout(timeoutId);
                        resolve(el);
                    } else if (!isResolved) {
                        requestId = requestAnimationFrame(check); // 保存新的动画帧 ID
                    }
                } catch(e) {
                    isResolved = true;
                    cancelAnimationFrame(requestId);
                    clearTimeout(timeoutId);
                    resolve(null);
                    return;
                }
            };
            check();
            timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    cancelAnimationFrame(requestId); // 超时后取消动画帧
                    resolve(null);
                }
            }, timeout);
        });
    }
})();