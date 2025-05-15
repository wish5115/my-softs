// 思源编辑器自定义光标
// 顺滑光标+是否闪烁+自定义样式
// 目前仅支持在编辑器中使用
// version 0.0.2
// 0.0.2 修复打开块等菜单时，光标显示在菜单之上的问题
// see https://ld246.com/article/1747269101239
// see https://ld246.com/article/1747200651209
(() => {
    // 是否使用光标顺滑动画效果 true 使用顺滑光标 false 不使用顺滑光标
    const isCursorSmoothEnabled = true;

    // 是否使用光标闪烁动画效果 true 闪动 false 不闪动
    const isCursorBlinkEnabled = false;

    // 是否也应用于文档标题中 true 应用 false不应用
    const isApplyToTitle = true;

    // 设置光标是光标所在元素行高的多少倍，相当于按光标所在文本行高百分比设置光标高度
    const cursorHeightRelativeToLineHeight = 0.88;

    // 其他光标样式，可以在这里改，颜色，宽高什么的
    addStyle(`
        .protyle-wysiwyg{ caret-color: transparent; } /* 隐藏编辑器默认光标 */
        ${isApplyToTitle ? `.protyle-title__input{caret-color: transparent;}`: ''} /* 隐藏标题默认光标 */
        /* 新光标样式 */
        #custom-cursor {
          /* 光标宽度 */
          width: 1.5px;
          
          /* 预设光标高度，也可以这里写死，但写死不同的元素可能有差异（这里优先级高于动态计算） */
          /* 这里行高仍然受cursorHeightRelativeToLineHeight的影响，如果想不受影响，把倍数设为1 */
          /* height: 26px; */

          /* 光标颜色 */
          background: var(--b3-theme-on-background);

          /* 以下样式，非必要勿改动 */
          position: fixed;
          pointer-events: none;
          transition: ${isCursorSmoothEnabled?'transform 0.1s linear':'none'};
          z-index: 1; /* 这个会实时动态计算，这里设置并不起作用 */
          transform: translate(0, 0);
          will-change: transform; /* 启用 GPU 加速 */
          backface-visibility: hidden; /* 避免重绘闪烁 */
        }
        #custom-cursor.hidden {
          opacity: 0;
          animation: none;
          transition: none;
        }
        #custom-cursor.no-transition {
          transition: none !important;
          animation: none !important;
        }
        /* 添加闪烁动画 */
        ${isCursorBlinkEnabled ? `
            #custom-cursor {
              animation: cursor-blink 1s steps(2, jump-none) infinite;
            }
            @keyframes cursor-blink {
              from { opacity: 1; }
              to { opacity: 0; }
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
                    height: (presetHeight || parseFloat(style.lineHeight) || 26) * cursorHeightRelativeToLineHeight
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
                { x: rect.left, y: rect.top, height: (presetHeight || rect.height)*cursorHeightRelativeToLineHeight } : 
                null;
        };

        const updateCursor = () => {
            if (isUpdating) return;
            isUpdating = true;

            requestAnimationFrame(() => {
                const pos = getStablePosition();
                const output={cursorElement:null};
                
                if (!pos || !isInAllowElements(pos, output)) {
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
                cursor.style.zIndex = output.cursorElement ? getEffectiveZIndex(output.cursorElement) + 1 : ++window.siyuan.zIndex;

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

        // 暂未用到
        const isInViewport = (pos) => {
            return pos.y >= 0 && 
                   pos.y <= window.innerHeight && 
                   pos.x >= 0 && 
                   pos.x <= window.innerWidth;
        };

        const isInAllowElements = (pos, output={cursorElement:null}) => {
            const cursorElement = getCursorElement();
            if(typeof output === 'object') output.cursorElement = cursorElement;
            // 动态获取当前活动编辑区域
            const protyleContent = cursorElement?.closest('.protyle-content');
            if (!protyleContent) return false;
            // 如果不应用于标题返回
            if(cursorElement.closest('.protyle-title__input') && !isApplyToTitle) return;
        
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
            ['mouseup', updateCursor],
            ['resize', updateCursor]
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

    function addStyle(css) {
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    // 获取实际生效的z-index
    function getEffectiveZIndex(element) {
        let current = element;
        while (current) {
            const style = window.getComputedStyle(current);
            const zIndex = style.zIndex;
            const position = style.position;
    
            // 如果是根元素，直接返回 0
            if (current === document.documentElement) return 0;
    
            // 判断当前元素是否创建了层叠上下文
            let isStackingContext = false;
            // 条件1: position 是 fixed 或 sticky（自动创建层叠上下文，即使 z-index 是 auto）
            if (position === 'fixed' || position === 'sticky') {
                isStackingContext = true;
            }
            // 条件2: position 是 absolute/relative 且 z-index 非 auto
            else if ((position === 'absolute' || position === 'relative') && zIndex !== 'auto') {
                isStackingContext = true;
            }
            // 其他条件（如 opacity < 1、transform 等）需要额外判断，此处暂未实现
    
            // 如果当前元素是层叠上下文，返回其 z-index（auto 视为 0）
            if (isStackingContext) {
                return zIndex === 'auto' ? 0 : parseInt(zIndex, 10);
            }
    
            current = current.parentElement;
        }
        return 0; // 理论上不会执行到此处
    }
})();