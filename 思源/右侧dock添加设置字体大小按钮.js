// 右侧dock添加设置字体大小按钮
// see https://ld246.com/article/1735489255593
(()=>{
    // 监听dock加载完毕
    whenElementExist('#dockRight .dock__items .dock__item--pin').then((pin)=>{
        // 这里可以添加多个字号
        addFontSizeButton(16, pin); //官方默认字体大小，方便复原
        addFontSizeButton(24, pin);
        addFontSizeButton(48, pin);
    });

    // 设置字体大小
    function addFontSizeButton(fontSize, pin) {
        const buttonString = `<span class="dock__item ariaLabel" aria-label="设置${fontSize}号字体">${fontSize}</span>`;
        // 创建一个 DocumentFragment
        const fragment = document.createRange().createContextualFragment(buttonString);
        // 提取 span 元素
        const button = fragment.firstChild;
        button.onclick = (event) => {
            event.preventDefault(); // 阻止表单提交的默认行为
            event.stopPropagation(); // 阻止事件冒泡
             setFontSize(fontSize);
        };
        pin.before(button);
    }

    // 设置字体大小
    // see https://github.com/siyuan-note/siyuan/blob/914c7659388e645395e70224f0d831950275eb05/app/src/protyle/ui/initUI.ts#L89
    function setFontSize(fontSize) {
        window.siyuan.config.editor.fontSize = fontSize;
        setInlineStyle();
        fetchSyncPost("/api/setting/setEditor", window.siyuan.config.editor);
        getProtyle().wysiwyg.element.querySelectorAll(".code-block .protyle-linenumber__rows").forEach((block) => {
            lineNumberRender(block.parentElement);
        });
    }

    // 获取protyle对象
    function getProtyle() {
        try {
            if(document.getElementById("sidebar")) return siyuan.mobile.editor.protyle;
            const currDoc = siyuan?.layout?.centerLayout?.children.map(item=>item.children.find(item=>item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active')||item.panelElement.closest('[data-type="wnd"]')))).find(item=>item);
            return currDoc?.model.editor.protyle;
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    // 设置行内样式
    async function setInlineStyle(set = true) {
        const height = Math.floor(window.siyuan.config.editor.fontSize * 1.625);
        let style;
    
        // Emojis Reset: 字体中包含了 emoji，需重置
        // Emojis Additional： 苹果/win11 字体中没有的 emoji
        if (isMac() || isIPad() || isIPhone()) {
            style = `@font-face {
      font-family: "Emojis Additional";
      src: url(../../../appearance/fonts/Noto-COLRv1-2.047/Noto-COLRv1.woff2) format("woff2");
      unicode-range: U+1fae9, U+1fac6, U+1fabe, U+1fadc, U+e50a, U+1fa89, U+1fadf, U+1f1e6-1f1ff, U+1fa8f;
    }
    @font-face {
      font-family: "Emojis Reset";
      src: local("Apple Color Emoji"),
      local("Segoe UI Emoji"),
      local("Segoe UI Symbol");
      unicode-range: U+26a1, U+21a9, U+21aa, U+2708, U+263a, U+1fae4, U+2194-2199, U+2934-2935, U+25b6, U+25c0, U+23cf,
      U+2640, U+2642, U+2611, U+303d,U+3030, U+1f170, U+1f171, U+24c2, U+1f17e, U+1f17f, U+1f250, U+1f21a, U+1f22f,
      U+1f232-1f23a, U+1f251, U+3297, U+3299, U+2639, U+2660, U+2666, U+2665, U+2663, U+26A0, U+a9, U+ae, U+2122;
    }
    @font-face {
      font-family: "Emojis";
      src: local("Apple Color Emoji"),
      local("Segoe UI Emoji"),
      local("Segoe UI Symbol");
    }`;
        } else {
            const isWin11Browser = await isWin11();
            if (isWin11Browser) {
                style = `@font-face {
      font-family: "Emojis Additional";
      src: url(../../../appearance/fonts/Noto-COLRv1-2.047/Noto-COLRv1.woff2) format("woff2");
      unicode-range: U+1fae9, U+1fac6, U+1fabe, U+1fadc, U+e50a, U+1fa89, U+1fadf, U+1f1e6-1f1ff, U+1f3f4, U+e0067, U+e0062,
      U+e0065, U+e006e, U+e0067, U+e007f, U+e0073, U+e0063, U+e0074, U+e0077, U+e006c;
    }
    @font-face {
      font-family: "Emojis Reset";
      src: local("Segoe UI Emoji"),
      local("Segoe UI Symbol");
      unicode-range: U+263a, U+21a9, U+2642, U+303d, U+2197, U+2198, U+2199, U+2196, U+2195, U+2194, U+2660, U+2665, U+2666, 
      U+2663, U+3030, U+21aa, U+25b6, U+25c0, U+2640, U+203c, U+a9, U+ae, U+2122;;
    }
    @font-face {
      font-family: "Emojis";
      src: local("Segoe UI Emoji"),
      local("Segoe UI Symbol");
    }`;
            } else {
                style = `@font-face {
      font-family: "Emojis Reset";
      src: url(../../../appearance/fonts/Noto-COLRv1-2.047/Noto-COLRv1.woff2) format("woff2");
      unicode-range: U+263a, U+2194-2199, U+2934-2935, U+2639, U+26a0, U+25b6, U+25c0, U+23cf, U+2640, U+2642, U+203c, U+2049,
      U+2611, U+303d, U+1f170-1f171, U+24c2, U+1f17e, U+1f17f, U+1f22f, U+1f250, U+1f21a, U+1f232-1f23a, U+1f251, U+3297,
      U+3299, U+25aa, U+25ab, U+2660, U+2666, U+2665, U+2663, U+1f636, U+1f62e, U+1f642, U+1f635, U+2620, U+2763, U+2764,
      U+1f441, U+fe0f, U+1f5e8, U+270c, U+261d, U+270d, U+200d, U+e50a, U+3030, U+21aa, U+21a9, U+1f525, U+1fa79, U+1f4ab, 
      U+1f4a8, U+1f32b, U+a9, U+ae, U+2122;;
    }
    @font-face {
      font-family: "Emojis";
      src: url(../../../appearance/fonts/Noto-COLRv1-2.047/Noto-COLRv1.woff2) format("woff2"),
      local("Segoe UI Emoji"),
      local("Segoe UI Symbol"),
      local("Apple Color Emoji"),
      local("Twemoji Mozilla"),
      local("Noto Color Emoji"),
      local("Android Emoji"),
      local("EmojiSymbols");
    }`;
            }
        }
        style += `.b3-typography, .protyle-wysiwyg, .protyle-title {font-size:${window.siyuan.config.editor.fontSize}px !important}
    .b3-typography code:not(.hljs), .protyle-wysiwyg span[data-type~=code] { font-variant-ligatures: ${window.siyuan.config.editor.codeLigatures ? "normal" : "none"} }
    .li > .protyle-action {height:${height + 8}px;line-height: ${height + 8}px}
    .protyle-wysiwyg [data-node-id].li > .protyle-action ~ .h1, .protyle-wysiwyg [data-node-id].li > .protyle-action ~ .h2, .protyle-wysiwyg [data-node-id].li > .protyle-action ~ .h3, .protyle-wysiwyg [data-node-id].li > .protyle-action ~ .h4, .protyle-wysiwyg [data-node-id].li > .protyle-action ~ .h5, .protyle-wysiwyg [data-node-id].li > .protyle-action ~ .h6 {line-height:${height + 8}px;}
    .protyle-wysiwyg [data-node-id].li > .protyle-action::after {height: ${window.siyuan.config.editor.fontSize}px;width: ${window.siyuan.config.editor.fontSize}px;margin:-${window.siyuan.config.editor.fontSize / 2}px 0 0 -${window.siyuan.config.editor.fontSize / 2}px}
    .protyle-wysiwyg [data-node-id].li > .protyle-action svg {height: ${Math.max(14, window.siyuan.config.editor.fontSize - 8)}px}
    .protyle-wysiwyg [data-node-id].li::before {height: calc(100% - ${height + 8}px);top:${(height + 8)}px}
    .protyle-wysiwyg [data-node-id] [spellcheck] {min-height:${height}px;}
    .protyle-wysiwyg .p,
    .protyle-wysiwyg .code-block .hljs,
    .protyle-wysiwyg .table,
    .protyle-wysiwyg .render-node protyle-html,
    .protyle-wysiwyg .render-node > div[spin="1"],
    .protyle-wysiwyg [data-type="NodeHeading"] {${window.siyuan.config.editor.rtl ? " direction: rtl;" : ""}}
    .protyle-wysiwyg [data-node-id] {${window.siyuan.config.editor.justify ? " text-align: justify;" : ""}}
    .protyle-wysiwyg .li {min-height:${height + 8}px}
    .protyle-gutters button svg {height:${height}px}`;
        if (window.siyuan.config.editor.fontFamily) {
            style += `\n.b3-typography:not(.b3-typography--default), .protyle-wysiwyg, .protyle-title {font-family: "Emojis Additional", "Emojis Reset", "${window.siyuan.config.editor.fontFamily}", var(--b3-font-family)}`;
        }
        // pad 端菜单移除显示，如工作空间
        if ("ontouchend" in document) {
            style += "\n.b3-menu .b3-menu__action {opacity: 0.68;}";
        }
        if (set) {
            const siyuanStyle = document.getElementById("siyuanStyle");
            if (siyuanStyle) {
                siyuanStyle.innerHTML = style;
            } else {
                document.querySelector("#pluginsStyle").insertAdjacentHTML("beforebegin", `<style id="siyuanStyle">${style}</style>`);
            }
        }
        return style;
    }

    // 设置代码块行号
    function lineNumberRender(block) {
        const lineNumber = block.parentElement.getAttribute("lineNumber");
        if (lineNumber === "false") {
            return;
        }
        if (!window.siyuan.config.editor.codeSyntaxHighlightLineNum && lineNumber !== "true") {
            return;
        }
        // clientHeight 总是取的整数
        block.parentElement.style.lineHeight = `${((parseInt(block.parentElement.style.fontSize) || window.siyuan.config.editor.fontSize) * 1.625 * 0.85).toFixed(0)}px`;
        const codeElement = block.lastElementChild;
    
        let lineNumberHTML = "";
        const lineList = codeElement.textContent.split(/\r\n|\r|\n|\u2028|\u2029/g);
        if (lineList[lineList.length - 1] === "" && lineList.length > 1) {
            lineList.pop();
        }
        block.firstElementChild.innerHTML = `<span>${lineList.length}</span>`;
        codeElement.style.paddingLeft = `${block.firstElementChild.clientWidth + 16}px`;
    
        const lineNumberTemp = document.createElement("div");
        lineNumberTemp.className = "hljs";
        lineNumberTemp.setAttribute("style", `padding-left:${codeElement.style.paddingLeft};
    width: ${codeElement.clientWidth}px;
    white-space:${codeElement.style.whiteSpace};
    word-break:${codeElement.style.wordBreak};
    font-variant-ligatures:${codeElement.style.fontVariantLigatures};
    max-height: none;box-sizing: border-box;position: absolute;padding-top:0 !important;padding-bottom:0 !important;min-height:auto !important;`);
        lineNumberTemp.setAttribute("contenteditable", "true");
        block.insertAdjacentElement("afterend", lineNumberTemp);
    
        const isWrap = codeElement.style.wordBreak === "break-word";
        lineList.map((line) => {
            let lineHeight = "";
            if (isWrap) {
                // windows 下空格高度为 0 https://github.com/siyuan-note/siyuan/issues/12346
                lineNumberTemp.textContent = line.trim() ? line : "<br>";
                // 不能使用 lineNumberTemp.getBoundingClientRect().height.toFixed(1) 否则
                // windows 需等待字体下载完成再计算，否则导致不换行，高度计算错误
                // https://github.com/siyuan-note/siyuan/issues/9029
                // https://github.com/siyuan-note/siyuan/issues/9140
                lineHeight = ` style="height:${lineNumberTemp.clientHeight}px;"`;
            }
            lineNumberHTML += `<span${lineHeight}></span>`;
        });
    
        lineNumberTemp.remove();
        block.firstElementChild.innerHTML = lineNumberHTML;
        // https://github.com/siyuan-note/siyuan/issues/12726
        if (block.scrollHeight > block.clientHeight) {
            if (getSelection().rangeCount > 0) {
                const range = getSelection().getRangeAt(0);
                if (block.contains(range.startContainer)) {
                    const brElement = document.createElement("br");
                    range.insertNode(brElement);
                    brElement.scrollIntoView({block: "nearest"});
                    brElement.remove();
                }
            }
        }
    }

    function isIPhone() {
        return navigator.userAgent.indexOf("iPhone") > -1;
    }
    
    function isIPad() {
        return navigator.userAgent.indexOf("iPad") > -1;
    }
    
    function isMac() {
        return navigator.platform.toUpperCase().indexOf("MAC") > -1;
    }
    
    async function isWin11() {
        if (!(navigator).userAgentData || !(navigator).userAgentData.getHighEntropyValues) {
            return false;
        }
        const ua = await (navigator).userAgentData.getHighEntropyValues(["platformVersion"]);
        if ((navigator).userAgentData.platform === "Windows") {
            if (parseInt(ua.platformVersion.split(".")[0]) >= 13) {
               return true;
            }
        }
        return false;
    }

    // 请求api
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = {
            method: "POST",
        };
        if (data) {
            if (data instanceof FormData) {
                init.body = data;
            } else {
                init.body = JSON.stringify(data);
            }
        }
        try {
            const res = await fetch(url, init);
            const res2 = returnType === 'json' ? await res.json() : await res.text();
            return res2;
        } catch(e) {
            console.log(e);
            return returnType === 'json' ? {code:e.code||1, msg: e.message||"", data: null} : "";
        }
    }

    // 等待元素出现
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();