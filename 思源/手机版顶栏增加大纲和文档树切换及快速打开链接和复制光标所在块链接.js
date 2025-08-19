// 手机版顶栏增加大纲和文档树切换及快速打开链接和复制光标所在块链接
// see https://ld246.com/article/1755585975916
// see https://ld246.com/article/1751087267927
setTimeout(() => {
    if(!window.siyuan?.mobile) return;
    const targetButton = document.querySelector('#editor .protyle-breadcrumb [data-type="exit-focus"]');
    if (!targetButton) return;
    targetButton.insertAdjacentHTML('afterend', `<a class="block__icon fn__flex-center ariaLabel" aria-label="链接2" data-type="link2" href="siyuan://blocks/20250627184916-xhmqiqj"><svg><use xlink:href="#iconCopy"></use></svg></a>`);
    const link2 = targetButton.nextElementSibling;
    targetButton.insertAdjacentHTML('afterend', `<a class="block__icon fn__flex-center ariaLabel" aria-label="链接" data-type="link" href="siyuan://blocks/20250627184916-xhmqiqj"><svg><use xlink:href="#iconOpenWindow"></use></svg></a>`);
    const link = targetButton.nextElementSibling;
    targetButton.insertAdjacentHTML('afterend', `<button class="block__icon fn__flex-center ariaLabel" aria-label="大纲" data-type="outline"><svg><use xlink:href="#iconAlignCenter"></use></svg></button>`);
    const outline = targetButton.nextElementSibling;
    targetButton.insertAdjacentHTML('afterend', `<button class="block__icon fn__flex-center ariaLabel" aria-label="文档树" data-type="docTree"><svg><use xlink:href="#iconFiles"></use></svg></button>`);
    const tree = targetButton.nextElementSibling;
    link.addEventListener('click', ()=>{
        // 在这里修改你的块id 👇👇👇
        openBlock('20250519181309-2n6qhdj');
    });
    link2.addEventListener('click', (e)=>{
        // 在这里修改你的代码 👇👇👇
        e.preventDefault();
        const block = getCursorElement()?.closest('.protyle-wysiwyg div[data-node-id][data-type]');
        if(!block) {showMessage('未找到光标所在块', true); return;}
    
        // 仅复制超级链接
        // if(block?.dataset?.nodeId) copyPlainText(`siyuan://blocks/${block?.dataset?.nodeId}`);

        // 复制Markdown链接（可直接粘贴）
        if(block?.dataset?.nodeId) copyPlainText(`[${block?.textContent||block?.dataset?.nodeId}](siyuan://blocks/${block?.dataset?.nodeId})`);
    
        // 复制为引用
        //if(block?.dataset?.nodeId) copyPlainText(`((${block?.dataset?.nodeId} '${block?.textContent||block?.dataset?.nodeId}'))`);
    
        showMessage('已复制到剪切板');
    });
    tree.addEventListener('click', ()=>{
        click('#toolbarFile');
        click('[data-type="sidebar-file-tab"]');
    });
    outline.addEventListener('click', ()=>{
        click('#toolbarFile');
        click('[data-type="sidebar-outline-tab"]');
    });
    function click(el) {
        if(typeof el === 'string') el = document.querySelector(el);
        el.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
    }
    function openBlock(id) {
        const wysiwyg = document.querySelector('#editor .protyle-wysiwyg');
        if(!wysiwyg) return;
        const html = `<span class="protyle-custom open-block-link" data-type="a" data-href="siyuan://blocks/${id}" style="display:none;"></span>`;
        wysiwyg.insertAdjacentHTML('beforeend', html);
        const link = wysiwyg.querySelector('.open-block-link');
        link.click();
        link.remove();
    }
    async function copyPlainText (text) {
        text = text.replace(new RegExp("\u200b", "g"), ""); // `复制纯文本` 时移除所有零宽空格 https://github.com/siyuan-note/siyuan/issues/6674
        await writeText(text);
    }
    // see https://github.com/siyuan-note/siyuan/blob/5f0f4e3ba6aabd5af26f9879695e5b9b796b5fb9/app/src/protyle/util/compatibility.ts#L129C14-L129C24
    function writeText(text) {
        let range;
        if (getSelection().rangeCount > 0) {
            range = getSelection().getRangeAt(0).cloneRange();
        }
        try {
            // navigator.clipboard.writeText 抛出异常不进入 catch，这里需要先处理移动端复制
            if (isInAndroid()) {
                window.JSAndroid.writeClipboard(text);
                return;
            }
            if (isInHarmony()) {
                window.JSHarmony.writeClipboard(text);
                return;
            }
            if (isInIOS()) {
                window.webkit.messageHandlers.setClipboard.postMessage(text);
                return;
            }
            navigator.clipboard.writeText(text);
        } catch (e) {
            if (isInIOS()) {
                window.webkit.messageHandlers.setClipboard.postMessage(text);
            } else if (isInAndroid()) {
                window.JSAndroid.writeClipboard(text);
            } else if (isInHarmony()) {
                window.JSHarmony.writeClipboard(text);
            } else {
                const textElement = document.createElement("textarea");
                textElement.value = text;
                textElement.style.position = "fixed";  //avoid scrolling to bottom
                document.body.appendChild(textElement);
                textElement.focus();
                textElement.select();
                document.execCommand("copy");
                document.body.removeChild(textElement);
                if (range) {
                    focusByRange(range);
                }
            }
        }
        function isInAndroid() {
            return window.siyuan.config.system.container === "android" && window.JSAndroid;
        }
        function isInIOS() {
            return window.siyuan.config.system.container === "ios" && window.webkit?.messageHandlers;
        }
        function isInHarmony() {
            return window.siyuan.config.system.container === "harmony" && window.JSHarmony;
        }
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
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
}, 2000);