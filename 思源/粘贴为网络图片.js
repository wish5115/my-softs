// 粘贴为网络图片
// see https://ld246.com/article/1751467959584
(()=>{
    // 添加右键菜单
    document.addEventListener('contextmenu', async function (e) {
        const hljs = e.target.closest('.hljs');
        if(hljs) return;
        whenElementExist('#commonMenu [data-id="pasteEscaped"]').then(element => {
            if(!element || element.parentElement.querySelector('[data-id="pasteNetImage"]')) return;
            const pasteHtml = `<button data-id="pasteNetImage" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href=""></use></svg><span class="b3-menu__label">粘贴为网络图片</span></button>`;
            element.insertAdjacentHTML('afterend', pasteHtml);
            const pasteBtn = element.parentElement.querySelector('[data-id="pasteNetImage"]');
            pasteBtn.addEventListener('click', async (e) => {
                let text  = await getClipText();
                if(!text.trim()) return;
                text = `![](${text.trim()})`;
                insertToEditor(text);
                window.siyuan.menus.menu.remove();
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