// 思源编辑器自定义光标
// 顺滑光标+是否闪烁+自定义样式
// see https://ld246.com/article/1747200651209
(() => {
    // 是否使用光标顺滑动画效果
    const isCursorSmoothEnabled = true;

    // 是否使用光标闪烁动画效果
    const isCursorBlinkEnabled = true;

    // 其他光标样式，可以在这里改，颜色大小什么的
    addStyle(`
        .protyle-wysiwyg{ caret-color: transparent; }
        #custom-cursor {
          position: fixed;
          width: 2px;
          /* height: 26px; */ /* 默认会自动获取行高，也可以这里写死 */
          background: var(--b3-theme-on-background);
          pointer-events: none;
          transition: ${isCursorSmoothEnabled?'transform 0.1s linear':'none'};
          z-index: ${++window.siyuan.zIndex};
          transform: translate(0, 0);
        }
        #custom-cursor.hidden {
          opacity: 0;
        }
        #custom-cursor.no-transition {
          transition: none !important;
          animation: none !important;
        }
        /* 添加闪烁动画 */
        ${isCursorBlinkEnabled ? `
            #custom-cursor{animation: blink 1s infinite;}
            @keyframes blink {
              50% { opacity: 0 }
            }
        `:''}
    `);

    // 插入光标元素并开启光标监听事件
    document.body.insertAdjacentHTML('beforeend', '<div id="custom-cursor" class="hidden"></div>');
    addCursorEvent();

    //////////// 以下功能函数非必要勿动 /////////////
    function addCursorEvent() {
        const cursor = document.getElementById('custom-cursor');
        let scrollTimeout = null;
        let isUpdating = false;
        let lastValidPos = null;
        let lastScrollPos = { x: window.scrollX, y: window.scrollY };
        let isFirstMove = true; // 新增首次移动标记

        // 优先获取光标元素自身预设行高
        const cursorElement = document.getElementById('custom-cursor');
        const cursorStyle = cursorElement ? window.getComputedStyle(cursorElement) : null;
        const presetHeight = cursorStyle ? parseFloat(cursorStyle.height) : null;

        const handleScroll = () => {
            cursor.classList.add('hidden', 'no-transition');
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                requestAnimationFrame(() => {
                    if (!isScrolling()) {
                        updateCursor();
                    }
                });
            }, 200);
        };

        const isScrolling = () => {
            const currentScrollPos = { x: window.scrollX, y: window.scrollY };
            const isMoving = currentScrollPos.x !== lastScrollPos.x || 
                           currentScrollPos.y !== lastScrollPos.y;
            lastScrollPos = currentScrollPos;
            return isMoving;
        };

        const getStablePosition = () => {
            const sel = window.getSelection();
            if (!sel.rangeCount) return null;

            document.body.clientWidth; // 强制重绘
            const range = sel.getRangeAt(0).cloneRange();
            range.collapse(true);

            // 使用优先级：光标预设高度 > 段落行高 > 默认20px
            const paragraph = findParentParagraph(range.startContainer);
            if (paragraph && !paragraph.textContent.trim()) {
                const rect = paragraph.getBoundingClientRect();
                const style = window.getComputedStyle(paragraph);
                return {
                    x: rect.left + parseFloat(style.paddingLeft),
                    y: rect.top + parseFloat(style.paddingTop),
                    height: presetHeight || parseFloat(style.lineHeight) || 20
                };
            }

            const marker = document.createElement('span');
            marker.textContent = '\u200b';
            marker.style.cssText = 'position: absolute; visibility: hidden; pointer-events: none;';
            
            range.insertNode(marker);
            const rect = marker.getBoundingClientRect();
            marker.remove();

            // 最终高度逻辑：优先使用光标预设高度，否则用实际测量高度
            return rect.width + rect.height > 0 ? 
                { x: rect.left, y: rect.top, height: presetHeight || rect.height } : 
                null;
        };

        const updateCursor = () => {
            if (isUpdating) return;
            isUpdating = true;

            requestAnimationFrame(() => {
                const pos = getStablePosition();
                
                if (!pos || !isInProtyleContent(pos)) {
                    cursor.classList.add('hidden');
                    isUpdating = false;
                    return;
                }

                // 处理首次移动
                if (isFirstMove) {
                    cursor.classList.add('no-transition');
                    isFirstMove = false;
                }

                // 更新位置前强制清除过渡
                cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
                cursor.style.height = `${pos.height}px`;
                cursor.classList.remove('hidden');

                // 强制布局同步
                void cursor.offsetHeight;

                // 延迟恢复过渡效果
                requestAnimationFrame(() => {
                    cursor.classList.remove('no-transition');
                });

                lastValidPos = pos;
                isUpdating = false;
            });
        };

        const isInViewport = (pos) => {
            return pos.y >= 0 && 
                   pos.y <= window.innerHeight && 
                   pos.x >= 0 && 
                   pos.x <= window.innerWidth;
        };

        const isInProtyleContent = (pos) => {
            // 动态获取当前活动编辑区域
            const protyleContent = document.querySelector(
                '[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) .protyle-content'
            ) || document.querySelector(
                '[data-type="wnd"] .protyle:not(.fn__none) .protyle-content'
            );
            
            if (!protyleContent) return isInViewport(pos);
        
            // 获取编辑区域可视范围
            const editorRect = protyleContent.getBoundingClientRect();
            
            // 检查坐标是否在编辑区域可视范围内
            return pos.x >= editorRect.left && 
                   pos.x <= editorRect.right && 
                   pos.y >= editorRect.top && 
                   pos.y <= editorRect.bottom;
        };

        const events = [
            ['scroll', handleScroll],
            ['wheel', handleScroll, { passive: true }],
            ['touchmove', handleScroll, { passive: true }],
            ['selectionchange', updateCursor],
            ['keydown', () => requestAnimationFrame(updateCursor)],
            ['input', () => requestAnimationFrame(updateCursor)],
            ['click', updateCursor],
            ['compositionend', updateCursor],
            ['mouseup', updateCursor]
        ];

        events.forEach(([e, h, opts]) => {
            document.addEventListener(e, h, opts);
        });
    }

    function findParentParagraph(node) {
        let current = node;
        while (current && current !== document.body) {
            if (current.dataset?.type === 'NodeParagraph') return current;
            current = current.parentElement;
        }
        return null;
    }

    function addStyle(css) {
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }
})();