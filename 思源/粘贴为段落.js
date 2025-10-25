// 粘贴为段落（自动把剪切板一个换行转换为两个）
// see https://ld246.com/article/1749074848419
// v0.0.2 兼容浏览器http协议，用输入框代替获取剪切板数据
(()=>{
    if(isMobile()) return;
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
                let text = '';
                if(isBrowser() && location.protocol === 'http:') {
                    saveSelection();
                    text = await promptDialog('', '粘贴为段落', '请把文本粘贴到这里') || '';
                    restoreSelection();
                } else {
                    text  = await getClipText();
                }
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
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    function isBrowser() {
        return !navigator.userAgent.startsWith("SiYuan") ||
            navigator.userAgent.indexOf("iPad") > -1 ||
            (/Android/.test(navigator.userAgent) && !/(?:Mobile)/.test(navigator.userAgent));
    }
    // 调用示例
    // const result = await promptDialog(defaultValue, title, placehoder, okBtnText, cancelBtnText);
    // result string 确定并返回输入内容 false 取消
    function promptDialog(defaultValue = '', title = '请输入内容', placehoder = '请输入内容', okBtnText = '确定', cancelBtnText = '取消') {
        return new Promise((resolve) => {
            const dialogHtml = `<div data-key="dialog-prompt" class="b3-dialog--prompt b3-dialog--open"><div class="b3-dialog" style="z-index: ${++window.siyuan.zIndex};">
        <div class="b3-dialog__scrim"></div>
        <div class="b3-dialog__container " style="width:520px;height:auto;
        left:auto;top:auto">
        <svg class="b3-dialog__close"><use xlink:href="#iconCloseRound"></use></svg>
        <div class="resize__move b3-dialog__header" onselectstart="return false;">${title}</div>
        <div class="b3-dialog__body"><div class="b3-dialog__content">
        <div class="ft__breakword">
        <textarea class="b3-text-field" id="promptDialogInput" style="width:100%;height:200px;" placeholder="${placehoder}">${defaultValue}</textarea>
        </div>
        </div>
        <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" id="promptDialogCancelBtn">${cancelBtnText}</button><div class="fn__space"></div>
        <button class="b3-button b3-button--outline" id="promptDialogConfirmBtn">${okBtnText}</button>
        </div></div>
        <div class="resize__rd"></div><div class="resize__ld"></div><div class="resize__lt"></div><div class="resize__rt"></div><div class="resize__r"></div><div class="resize__d"></div><div class="resize__t"></div><div class="resize__l"></div>
        </div></div></div>`;
            document.body.insertAdjacentHTML('beforeend', dialogHtml);
            const dialog = document.querySelector('.b3-dialog--prompt');
            const input = dialog.querySelector('#promptDialogInput');
            setTimeout(()=>input.focus(), 100);
            const resolveHandle = (result) => {
                dialog.remove();
                resolve(result);
                document.removeEventListener('keydown', keydownHandle, true);
            };
            const keydownHandle = (event) => {
                const notOtherKey = !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
                if (event.key === 'Enter' && notOtherKey && document.querySelector('.b3-dialog--prompt')) {
                    // 确定
                    resolveHandle(input.value);
                } else if (event.key === 'Escape' && notOtherKey && document.querySelector('.b3-dialog--prompt')) {
                    // 取消
                    resolveHandle(false);
                }
            };
            dialog.addEventListener('click', (e) => {
                if(
                    e.target.closest('.b3-dialog__scrim') ||
                    e.target.closest('.b3-dialog__close') ||
                    e.target.closest('.b3-button--cancel')
                ) {
                    // 取消
                    resolveHandle(false);
                } else if(e.target.closest('.b3-button--outline')) {
                    // 确定
                    resolveHandle(input.value);
                }
            });
            document.addEventListener('keydown', keydownHandle, true);
        });
    }
    let savedSelection = null;
    function saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            savedSelection = {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset
            };
        }
    }
    
    function restoreSelection() {
        if (!savedSelection) return;
    
        const selection = window.getSelection();
        selection.removeAllRanges();
    
        const range = document.createRange();
        range.setStart(savedSelection.startContainer, savedSelection.startOffset);
        range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
    
        selection.addRange(range);
    }
})();