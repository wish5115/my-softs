// 代码块添加折叠/展开/全屏/悬浮横向滚动条
// see https://ld246.com/article/1744373698945
// 支持在块上添加auto-height自定义属性，使块不受最大高度限制
// version 0.0.4
// 0.0.1 支持代码块的折叠和展开，全屏和悬浮横向滚动条
// 0.0.2 美化滚动条样式
// 0.0.3 修复全屏后代码块显示不全问题
// 0.0.4 改进仅代码有滚动条且高度大于codeMaxHeight时才显示
(() => {
    // 当代码块内容最大高度，注意：这里的高度是指.hljs元素的高度，默认是500px
    // 支持在块上添加auto-height自定义属性，使块不受最大高度限制
    const codeMaxHeight = '500px';
    
    // 是否显示全屏按钮 true 显示 false 不显示
    const isEnableFullscreen = true;
    
    // 是否显示模拟滚动条 true 显示 false 不显示
    // 该功能在代码块底部超出可视区域时自动在底部显示滚动条
    const isEnableScrollbar = true;
    
    // 不支持手机版（因为手机版不需要）
    if (isMobile()) return;

    // 添加样式
    addStyle(`
        .b3-typography div.hljs, .protyle-wysiwyg .code-block:not([custom-auto-height]) div.hljs {
            max-height: ${codeMaxHeight || '500px'};
        }
        .b3-typography .code-block:not(pre), .protyle-wysiwyg .code-block:not(pre){
            margin: 2px 0; padding: 4px;
        }
        .b3-typography div.hljs, .protyle-wysiwyg div.hljs{
                padding: 0.65em 1em 1.6em;
        }
        .b3-typography div.protyle-action, .protyle-wysiwyg .code-block div.protyle-action {
            position: sticky;
        }
        /* 全屏背景色 */
        :not(:root):fullscreen::backdrop {
            background-color: var(--b3-theme-background);
        }
        /* 模拟滚动条容器 */
        .scrollbar-container {
          position: sticky;
          bottom: 0;
          width: 100%;
          height: 8px;
          /*background-color: #ddd;*/
          cursor: pointer;
          border-radius: 5px;
          /*transition: opacity 0.3s ease;*/
          z-index: ${++siyuan.zIndex || 9999};
        }
        /* 滚动条滑块 */
        .scrollbar-thumb {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 20%; /* 初始滑块宽度 */
          /*background-color: var(--b3-scroll-color);*/ /* light #C2C3C3 dark #4E4F58 */
          box-shadow: inset 0 0 5px 5px var(--b3-scroll-color);
          border-radius: 5px;
          cursor: grab;
        }
        .scrollbar-container.f__hidden {
          opacity: 0; /* 隐藏元素 */
          pointer-events: none; /* 禁用鼠标交互 */
          height: 0;
        }
    `);

    // 监听代码块被加载
    whenElementExist('.layout__center, #editor').then(async el => {
        // 加载时执行（静态加载）
        let protyle;
        await whenElementExist(() => {
            protyle = el.querySelector('.protyle');
            return protyle && protyle?.dataset?.loading === 'finished';
        });
        addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.protyle-icon--expand))'), protyle);

        // 滚动时执行
        protyle.querySelector(".protyle-content").addEventListener('scroll', () => {
            addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.protyle-icon--expand))'), protyle);
        });

        // 监听protyle加载事件（动态加载）
        observeProtyleLoaded(el, protyles => {
            protyles.forEach(async protyle => {
                if (!protyle.classList.contains('protyle')) {
                    protyle = protyle.closest('.protyle');
                }
                // 加载时执行
                addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.protyle-icon--expand))'), protyle);

                // 滚动时执行
                protyle.querySelector(".protyle-content").addEventListener('scroll', () => {
                    addCodeExtends(protyle.querySelectorAll('.code-block:not(:has(.protyle-icon--expand))'), protyle);
                });
            });
        });
    });

    // 添加扩展按钮
    let runing = false;
    function addCodeExtends(codeBlocks, protyle) {
        if (codeBlocks.length === 0) return;
        if (runing) return;
        runing = true;
        setTimeout(() => { runing = false; }, 500);
        codeBlocks.forEach(async code => {
            if (code.querySelector('.protyle-icon--expand')) return;

            // 添加折叠按钮
            const hljs = code.querySelector('.hljs');
            if (!hljs) return;
            let expandStatus = getExpandStatus(hljs);
            const ariaLabel = getAriaLabelText(expandStatus);
            const expandBtnHtml = `<span class="b3-tooltips__nw b3-tooltips protyle-icon protyle-icon--expand protyle-action__expand protyle-custom" aria-label="${ariaLabel}"><svg><use xlink:href="#${expandStatus}"></use></svg></span>`;
            const moreBtn = code.querySelector('.protyle-icon--last');
            if (!moreBtn) return;
            await whenElementExist(() => moreBtn.getAttribute('aria-label'));
            moreBtn.insertAdjacentHTML('beforebegin', expandBtnHtml);
            const expandBtn = code.querySelector('.protyle-icon--expand');
            expandBtn.addEventListener('click', () => {
                expandStatus = getExpandStatus(hljs);
                if (expandStatus === 'iconDown') {
                    hljs.style.maxHeight = 'none';
                    expandStatus = 'iconUp';
                } else {
                    hljs.style.maxHeight = codeMaxHeight;
                    expandStatus = 'iconDown';
                }
                const useEl = expandBtn.querySelector('svg > use');
                useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + expandStatus);
                const ariaLabel = getAriaLabelText(expandStatus);
                expandBtn.setAttribute('aria-label', ariaLabel);
            });

            // 添加全屏按钮
            if (!isEnableFullscreen) return;
            if (code.querySelector('.protyle-icon--fullscreen')) return;
            let fullscreenAriaLabel = '全屏';
            let fullscreenStatus = 'iconFullscreen';
            const fullscreenBtnHtml = `<span class="b3-tooltips__nw b3-tooltips protyle-icon protyle-icon--fullscreen protyle-action__fullscreen protyle-custom" aria-label="${fullscreenAriaLabel}"><svg><use xlink:href="#${fullscreenStatus}"></use></svg></span>`;
            expandBtn.insertAdjacentHTML('beforebegin', fullscreenBtnHtml);
            const fullscreenBtn = code.querySelector('.protyle-icon--fullscreen');
            let oldCodeMaxHeight;
            fullscreenBtn.addEventListener('click', () => {
                if (fullscreenStatus === 'iconFullscreen') {
                    oldCodeMaxHeight = hljs.style.maxHeight;
                    requestFullScreen(code);
                    fullscreenStatus = 'iconFullscreenExit';
                    fullscreenAriaLabel = '退出全屏';
                    hljs.style.maxHeight = 'calc(100vh - 58px)';
                    expandBtn.style.display = 'none';
                    if (scrollbarContainer) scrollbarContainer.classList.add('f__hidden');
                } else {
                    exitFullScreen(code);
                    fullscreenStatus = 'iconFullscreen';
                    fullscreenAriaLabel = '全屏';
                    if (oldCodeMaxHeight !== undefined) hljs.style.maxHeight = oldCodeMaxHeight;
                    expandBtn.style.display = '';
                    setTimeout(() => {
                        if (scrollbarContainer) scrollbarContainer.classList.add('f__hidden');
                    }, 300);
                }
                const useEl = fullscreenBtn.querySelector('svg > use');
                useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + fullscreenStatus);
                fullscreenBtn.setAttribute('aria-label', fullscreenAriaLabel);
            });

            // 添加模拟滚动条
            if (!isEnableScrollbar) return;
            if (code.querySelector('.scrollbar-container')) return;
            const scrollbarHtml = `<div class="scrollbar-container protyle-custom"><div class="scrollbar-thumb"></div></div>`;
            code.insertAdjacentHTML('beforeend', scrollbarHtml);
            const scrollbarContainer = code.querySelector('.scrollbar-container');
            const protyleContent = protyle.querySelector(".protyle-content");

            // 检查是否需要显示模拟滚动条
            function checkScrollbarVisibility() {
                const hasHorizontalScrollbar = hljs.scrollWidth > hljs.clientWidth; // 是否有横向滚动条
                const isHeightExceeded = hljs.scrollHeight > parseHeightToPixels(codeMaxHeight); // 高度是否超过codeMaxHeight
                const isSticky = !isElementBottomInViewport(code); // 是否处于 sticky 状态

                if (hasHorizontalScrollbar && isHeightExceeded && isSticky) {
                    scrollbarContainer.classList.remove('f__hidden'); // 显示模拟滚动条
                } else {
                    scrollbarContainer.classList.add('f__hidden'); // 隐藏模拟滚动条
                }
            }

            // 初始化滚动条状态
            checkScrollbarVisibility();

            // 监听 protyleContent 的滚动事件
            protyleContent.addEventListener('scroll', () => {
                checkScrollbarVisibility();
            });

            // 模拟滚动条滚动
            const scrollbarThumb = code.querySelector(".scrollbar-thumb");
            let isDragging = false; // 是否正在拖动
            let startX, thumbStartX; // 鼠标按下时的初始位置

            // 计算滑块宽度和滚动比例
            function updateScrollbar() {
                const contentWidth = hljs.scrollWidth;
                const viewportWidth = hljs.clientWidth;
                let thumbWidth = (viewportWidth / contentWidth) * scrollbarContainer.offsetWidth;
                // 边界值处理
                thumbWidth = Math.max(thumbWidth, 10); // 最小宽度为10px
                scrollbarThumb.style.width = `${thumbWidth}px`;
            }

            // 同步滚动条位置
            function syncScrollbarPosition() {
                const scrollPercentage = hljs.scrollLeft / (hljs.scrollWidth - hljs.clientWidth);
                const thumbMaxMove = scrollbarContainer.offsetWidth - scrollbarThumb.offsetWidth;
                scrollbarThumb.style.left = `${scrollPercentage * thumbMaxMove}px`;
            }

            // 初始化滚动条
            updateScrollbar();
            syncScrollbarPosition();

            // 监听 .code-block 的滚动事件
            hljs.addEventListener("scroll", () => {
                syncScrollbarPosition();
            });

            // 模拟滚动条拖动逻辑
            scrollbarThumb.addEventListener("mousedown", (e) => {
                isDragging = true;
                startX = e.clientX;
                thumbStartX = parseFloat(scrollbarThumb.style.left) || 0;
                // 禁用文本选择
                hljs.style.userSelect = "none";
                // 绑定全局事件
                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
                // 阻止默认行为
                e.preventDefault();
            });

            function handleMouseMove(e) {
                if (!isDragging) return;
                const deltaX = e.clientX - startX;
                const thumbMaxMove = scrollbarContainer.offsetWidth - scrollbarThumb.offsetWidth;
                let newThumbPosition = thumbStartX + deltaX;
                // 限制滑块范围
                newThumbPosition = Math.max(0, Math.min(newThumbPosition, thumbMaxMove));
                scrollbarThumb.style.left = `${newThumbPosition}px`;
                // 同步 .code-block 的滚动位置
                const scrollPercentage = newThumbPosition / thumbMaxMove;
                hljs.scrollLeft = scrollPercentage * (hljs.scrollWidth - hljs.clientWidth);
                // 阻止默认行为
                e.preventDefault();
            }

            function handleMouseUp() {
                isDragging = false;
                // 恢复文本选择
                hljs.style.userSelect = "";
                // 移除全局事件
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            }

            // 监听窗口大小变化
            window.addEventListener("resize", () => {
                checkScrollbarVisibility();
                updateScrollbar();
                syncScrollbarPosition();
            });
        });
    }

    function requestFullScreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { // Firefox
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { // IE/Edge
            element.msRequestFullscreen();
        }
    }

    function exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }

    function getAriaLabelText(expandStatus) {
        return expandStatus === 'iconDown' ? '展开' : '折叠';
    }

    function getExpandStatus(hljs) {
        return getComputedStyle(hljs, null)?.maxHeight === codeMaxHeight ? 'iconDown' : 'iconUp';
    }

    function addStyle(css) {
        // 创建一个新的style元素
        const style = document.createElement('style');
        // 设置CSS规则
        style.innerHTML = css;
        // 将style元素添加到<head>中
        document.head.appendChild(style);
    }

    function observeProtyleLoaded(el, callback) {
        const config = { attributes: false, childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // 查找新增加的 NodeCodeBlock 元素
                    const protyles = Array.from(mutation.addedNodes).filter(node =>
                        node.nodeType === Node.ELEMENT_NODE &&
                        (node.classList.contains('protyle') || node.classList.contains('protyle-content'))
                    );
                    // 如果找到了这样的元素，则调用回调函数
                    if (protyles.length > 0) {
                        callback(protyles);
                    }
                }
            });
        });
        // 开始观察 body 下的所有变化
        observer.observe(el, config);
        // 当不再需要观察时可调用断开来停止观察
        return () => {
            observer.disconnect();
        };
    }

    // 等待元素渲染完成后执行
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector === 'function' ? selector() : (node || document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }

    function isElementBottomInViewport(el) {
        if (!el) return false; // 如果元素不存在，直接返回 false
        const rect = el.getBoundingClientRect(); // 获取元素的边界信息
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        // 判断元素的底部是否在视口内
        return rect.bottom <= windowHeight;
    }

    // 通过字符串解析实际高度，缓存对象 (作为函数属性)
    function parseHeightToPixels(value) {
      // 静态缓存对象 (函数属性)
      if (!parseHeightToPixels.memo) {
        parseHeightToPixels.memo = {};
      }
    
      // 1. 数字类型直接返回
      if (typeof value === 'number') {
        return value;
      }
    
      // 2. 检查缓存
      if (parseHeightToPixels.memo.hasOwnProperty(value)) {
        return parseHeightToPixels.memo[value];
      }
    
      // 3. 处理 px 单位或纯数字字符串
      if (typeof value === 'string') {
        // 3.1 纯数字字符串 (如 '500')
        if (/^\d+\.?\d*$/.test(value)) {
          const num = parseFloat(value);
          parseHeightToPixels.memo[value] = num;
          return num;
        }
    
        // 3.2 px 单位字符串 (如 '500px' 或 '300.5px')
        if (value.toLowerCase().endsWith('px')) {
          const num = parseFloat(value);
          parseHeightToPixels.memo[value] = num;
          return num;
        }
      }
    
      // 4. 其他单位需要 DOM 计算
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.height = value;
      tempDiv.style.left = '-9999px';
    
      document.body.appendChild(tempDiv);
      const heightInPixels = parseFloat(getComputedStyle(tempDiv).height);
      document.body.removeChild(tempDiv);
    
      // 存入缓存
      parseHeightToPixels.memo[value] = heightInPixels;
      return heightInPixels;
    }

    let statusMsg;
    function showStatusMsg(params, append = false) {
        if (!statusMsg) statusMsg = document.querySelector('#status .status__msg');
        params = typeof params === 'string' ? params : JSON.stringify(params);
        let html = statusMsg.innerHTML;
        if (append) {
            html += params;
        } else {
            html = params;
        }
        html = html.trim();
        statusMsg.innerHTML = html;
    }
})();