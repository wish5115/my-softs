// 给文档添加复制Markdown源码功能
(()=>{
    // 监听鼠标点击事件
    document.addEventListener('mouseup', (event) => {
        // 检查点击的目标元素是否具有 data-type="doc"
        if (event.target.closest('button[data-type="doc"]')) {
            whenElementExist('button[data-id="copy"]').then((copyBtn) => {
                if(!copyBtn) return;
                // 生成按钮
                const copyMarkdownButtonHTML = `
                    <button data-id="copyMarkdown" class="b3-menu__item b3-menu__item--current">
                        <svg class="b3-menu__icon" style="">
                            <use xlink:href="#iconCopy"></use>
                        </svg>
                        <span class="b3-menu__label">复制Markdown源码</span>
                    </button>`;
                copyBtn.insertAdjacentHTML('afterend', copyMarkdownButtonHTML);
                copyMarkdownBtn = copyBtn.parentElement.querySelector('button[data-id="copyMarkdown"]');
                // 复制Markdown源码
                const protyle = event.target.closest('.protyle');
                const docId = protyle?.querySelector('.protyle-title')?.dataset?.nodeId;
                if(!docId) return;
                copyMarkdownBtn.onclick = async () => {
                    const response = await requestApi("/api/lute/copyStdMarkdown", {
                       id: docId,
                    });
                    writeText(response.data);
                    showMessage('已复制到剪切板');
                    document.body.click();
                };
            });
        }
    });

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
    }

    function isInAndroid() {
        return window.siyuan.config.system.container === "android" && window.JSAndroid;
    };
    
    function isInIOS() {
        return window.siyuan.config.system.container === "ios" && window.webkit?.messageHandlers;
    };
    
    function isInHarmony() {
        return window.siyuan.config.system.container === "harmony" && window.JSHarmony;
    };

    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
})();
