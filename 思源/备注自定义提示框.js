// 备注自定义提示框
// see https://ld246.com/article/1745742440889
// v0.0.2 兼容3.3.5；修改tooltip样式
(()=>{
    // 这里设置提示框样式
    const tooltipStyles = `
        max-width: 400px;
        max-height: 200px;
        font-size: 16px;
        line-height: 150%;
        color: var(--b3-theme-on-background); /* 文字颜色 */
        background-color:var(--b3-theme-background); /* 背景色 */
        border-radius: var(--b3-border-radius);
        box-shadow: var(--b3-dialog-shadow);
        border: 1px solid var(--b3-theme-surface-lighter);
    `;

    // 闪烁情况选择
    // little 当鼠标进入提示框再进入目标元素会闪烁下（感觉没啥影响），但优点是当鼠标移开目标元素关闭提示框时，无论上/下/左右都可以。
    // no 不闪烁，但缺点是当鼠标移开目标元素关闭提示框时，只能上/下才行，左右必须超越提示框的宽度范围才行，且不支持点击备注。
    // little 选择闪烁版本，no 选择不闪烁版本
    const flashingStatus = 'little';
    
    // 添加样式
    addStyle(`
        /* 去掉默认提示 */
        .protyle-attr--memo{
            &.b3-tooltips:hover::before, &.b3-tooltips:hover::after,
            &.b3-tooltips__nw::before, &.b3-tooltips__nw::after,
            &.b3-tooltips__nw:hover::before, &.b3-tooltips__nw:hover::after,
            &.b3-tooltips__s::before, &.b3-tooltips__se::before, &.b3-tooltips__sw::before{
                display: none!important;
            }
        }
        /* 自定义提示框样式 */
        .mytooltip {
            position: fixed;
            z-index: 1000000;
        }
        .mytooltip .message {
            padding: 4px 8px;
            font-size: 12px;
            font-weight: normal;
            -webkit-font-smoothing: subpixel-antialiased;
            color: var(--b3-tooltips-color);
            word-wrap: break-word;
            background-color: var(--b3-tooltips-background);
            border-radius: var(--b3-border-radius);
            line-height: 17px;
            /*max-width: 320px;*/
            animation-duration: 150ms;
            animation-fill-mode: both;
            animation-name: zoomIn;
            /*max-height: 90vh;*/
            overflow: auto;
            box-sizing: border-box;
            white-space: break-spaces;
            ${tooltipStyles}
        }
        .mytooltip .message::selection {
            /*color: white;*/
            background-color: lightyellow;
        }
        [data-theme-mode="light"] {
            /* 整个滚动条 */
            .mytooltip .message::-webkit-scrollbar {
                width: 6px; /* 滚动条宽度 */
                height: 6px; /* 横向滚动条高度 */
            }
            /* 滚动条滑块 */
            .mytooltip .message::-webkit-scrollbar-thumb {
                background: #6B6B6B; /* 滑块颜色 */
                border-radius: 6px; /* 滑块圆角 */
            }
       }
    `);
    whenElementExist(".layout__center").then((element)=>{
        let hasBoundMouseout = false;
        element.addEventListener('mouseover', async (e)=>{
            const memo = e.target.closest(".protyle-attr--memo");
            if(!memo) return;
            hideDefaultTooltip();
            if(!hasBoundMouseout) {
                memo.addEventListener('mouseleave', () => {
                    hideTooltip();
                });
            }
            showTooltip(memo.getAttribute('aria-label'), memo);
        });
    });
    // see https://github.com/siyuan-note/siyuan/blob/e47b8efc2f2611163beca9fad4ee5424001515ff/app/src/dialog/tooltip.ts#L3
    function showTooltip(message, target, tooltipClass) {
        // mobile返回
        if (!!document.getElementById("sidebar")) {
            return;
        }
        const targetRect = target.getBoundingClientRect();
        if (targetRect.height === 0 || !message) {
            hideTooltip();
            return;
        }
    
        let messageElement = document.getElementById("mytooltip");
        if(!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'mytooltip';
            messageElement.className = 'fn__none';
            const messageElementContent = document.createElement('div');
            messageElementContent.className = 'message';
            messageElement.appendChild(messageElementContent);
            document.body.appendChild(messageElement);
            messageElement.addEventListener("mouseleave", () => {
                hideTooltip();
            });
            messageElement.addEventListener("mouseenter", () => {
                hideTooltip(false);
            });
        }
        messageElement.className = tooltipClass ? `mytooltip mytooltip--${tooltipClass}` : "mytooltip";
        const messageElementContent = messageElement.querySelector('.message');
        messageElementContent.innerHTML = message;
        // 避免原本的 top 和 left 影响计算
        messageElement.removeAttribute("style");
    
    
        const position = target.getAttribute("data-position");
        //const parentRect = target.parentElement.getBoundingClientRect();
    
        let left;
        let top;
        // ${number}south & 默认值
        const positionDiff = parseInt(position) || 0.5;
        left = Math.max(0, targetRect.left - (messageElement.clientWidth - targetRect.width) / 2);
        top = targetRect.bottom + positionDiff;
    
        if (top + messageElement.clientHeight > window.innerHeight) {
            if (targetRect.top - positionDiff > window.innerHeight - top) {
                top = targetRect.top - positionDiff - messageElement.clientHeight;
                messageElement.style.maxHeight = (targetRect.top - positionDiff) + "px";
            } else {
                messageElement.style.maxHeight = (window.innerHeight - top) + "px";
            }
        }
        if (left + messageElement.clientWidth > window.innerWidth) {
            left = window.innerWidth - messageElement.clientWidth;
        }
        const targetHeight = flashingStatus === 'little' ? 0 : targetRect.height;
        if(top > targetRect.top) {
            // 显示到目标元素的下面
            messageElement.style.paddingTop = (targetHeight+5) + 'px';
            messageElement.style.marginTop = (-targetHeight-5) + 'px';
        } else {
            // 显示到目标元素的上面
            messageElement.style.paddingBottom = (targetHeight+5) + 'px';
            messageElement.style.marginBottom = (-targetHeight-5) + 'px';
        }
        messageElement.style.top = top + "px";
        messageElement.style.left = left + "px";
    }
    function hideTooltip(action = "hide") {
        if(action === "hide") {
            document.getElementById("mytooltip").classList.add("fn__none");
        } else {
            document.getElementById("mytooltip").classList.remove("fn__none");
        }
    }
    async function hideDefaultTooltip() {
        const tooltip = await whenElementExist("#tooltip:not(.fn__none)");
        if(tooltip) tooltip.classList.add('fn__none');
    }
    function addStyle(css) {
        // 创建一个新的style元素
        const style = document.createElement('style');
        // 设置CSS规则
        style.innerHTML = css;
        // 将style元素添加到<head>中
        document.head.appendChild(style);
    }
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let element = null;
                if (typeof selector === 'function') {
                    element = selector();
                } else {
                    element = document.querySelector(selector);
                }
                if (element) {
                    resolve(element);
                } else {
                    requestAnimationFrame(checkForElement);
                }
            };
            checkForElement();
        });
    }
})();