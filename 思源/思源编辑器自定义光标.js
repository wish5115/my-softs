// 思源编辑器自定义光标
// 顺滑光标+是否闪烁+自定义样式
// 目前仅支持在编辑器中使用
// version 0.0.8
// 0.0.8 优化拖动时计算光标算法
// 0.0.7 修复侧边栏拖动时，光标只能临时被隐藏的问题；增加手机版支持开关
// 0.0.6 修复侧边栏拖动后光标定位不准和悬浮窗拖动时不能实时定位光标问题
// 0.0.5 改进在光标闪烁时，当移动/输入/点击时的不自然，有光标突然消失感的问题；改进滚动时光标有闪烁的问题；取消选择文本是的顺滑效果
// 0.0.4 优化滑动鼠标动画，更加丝滑
// 0.0.3 修复手动拖动滚动条的bug和改变尺寸编辑器和拖动悬浮窗口光标刷新延后问题和光标位置及可见区域细节调整
// 0.0.2 修复打开块等菜单时，光标显示在菜单之上的问题
// see https://ld246.com/article/1747269101239 发布帖
// see https://ld246.com/article/1747200651209 需求贴
(() => {
    // 是否使用光标顺滑动画效果 true 使用顺滑光标 false 不使用顺滑光标
    const isCursorSmoothEnabled = true;

    // 是否使用光标闪烁动画效果 true 闪动 false 不闪动
    const isCursorBlinkEnabled = false;

    // 是否也应用于文档标题中 true 应用 false 不应用
    const isApplyToTitle = true;

    // 设置光标是光标所在元素行高的多少倍，相当于按光标所在文本行高百分比设置光标高度
    const cursorHeightRelativeToLineHeight = 0.88;

    // 是否在手机端使用，如果手机端出现不兼容问时可以禁用手机端
    // true 使用 false 不使用
    const isUseInMobile = true;

    if(!isUseInMobile && isMobile()) return;

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
          transition: ${isCursorSmoothEnabled?'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)':'none'};
          z-index: 1; /* 这个会实时动态计算，这里设置并不起作用 */
          transform: translate(0, 0);
          will-change: transform; /* 启用 GPU 加速 */
          backface-visibility: hidden; /* 避免重绘闪烁 */
          opacity: 1; /* 默认不透明 */
        }
        /* 隐藏光标 */
        #custom-cursor.hidden {
          opacity: 0 !important;
          animation: none !important;
          transition: none !important;
        }
        /* 停止光标闪动 */
        #custom-cursor.no-animation {
            animation: none !important;
        }
        /* 停止顺滑光标效果 */
        #custom-cursor.no-transition {
          transition: none !important;
        }
        /* 添加闪烁动画 */
        ${isCursorBlinkEnabled ? `
            #custom-cursor {
              animation: cursor-blink 1s steps(2, jump-none) infinite;
            }
            @keyframes cursor-blink {
              from { opacity: 0; }
              to { opacity: 1; }
            }
        `:''}
        /* 侧边栏拖动手柄禁止选择，防止拖动时，被误插入marker标记（用于计算光标位置） */
        .layout__resize{user-select: none;}
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
        let blinkTimeout;
        const BLINK_DELAY = 500; // 静止后开始闪烁的延迟时间
        //let editorLastLeft = 0;

        // 优先获取光标元素自身预设行高
        const cursorElement = document.getElementById('custom-cursor');
        const cursorStyle = cursorElement ? window.getComputedStyle(cursorElement) : null;
        const presetHeight = cursorStyle ? parseFloat(cursorStyle.height) : null;

        const handleScroll = () => {
            // 清除闪烁并停止后续闪烁(滚动时必须停止动画，不然动画效果会让光标悬浮固定不动)
            if(blinkTimeout) clearTimeout(blinkTimeout);
            cursor.classList.add('no-animation');
            // 清除顺滑效果，防止滚动时上下跳动
            cursor.classList.add('no-transition');
            updateCursor();
            // clearTimeout(scrollTimeout);
            // scrollTimeout = setTimeout(() => {
            //     requestAnimationFrame(() => {
            //         if (!isScrolling()) {
            //             updateCursor();
            //         }
            //     });
            // }, 200);
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

            // （暂没用这个方案）使用优先级：光标预设高度 > 段落行高 > 默认20px
            // const paragraph = findParentParagraph(range.startContainer);
            // if (paragraph && !paragraph.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()) {
            //     const rect = paragraph.getBoundingClientRect();
            //     const style = window.getComputedStyle(paragraph);
            //     const height = (presetHeight || parseFloat(style.lineHeight) || 26) * cursorHeightRelativeToLineHeight;
            //     const topGap = (parseFloat(style.lineHeight) - height) / 2;
            //     return {
            //         x: rect.left + parseFloat(style.paddingLeft),
            //         y: rect.top + parseFloat(style.paddingTop) + topGap,
            //         height: height
            //     };
            // }

            const marker = document.createElement('span');
            marker.textContent = '\u200b';
            marker.style.cssText = 'position: absolute; visibility: hidden; pointer-events: none;';
            
            range.insertNode(marker);
            const rect = marker.getBoundingClientRect();
            marker.remove();

            // 最终高度逻辑：优先使用光标预设高度，否则用实际测量高度
            const height = (presetHeight || rect.height)*cursorHeightRelativeToLineHeight;
            const topGap = (rect.height - height) / 2;
            return rect.width + rect.height > 0 ? 
                { x: rect.left, y: rect.top + topGap, height: height } : 
                null;
        };

        const updateCursor = (eventType) => {
            if (isUpdating) return;
            isUpdating = true;

            // 强制同步布局（解决元素尺寸变化后的布局延迟问题）
            //document.body.clientWidth; 

            //requestAnimationFrame(() => {
                const pos = getStablePosition();
                const output={cursorElement:null, isOuterElement: false};
                
                if (!pos || !isInAllowElements(pos, output)) {
                    // 编辑器内的元素，但超出编辑器范围了隐藏
                    cursor.classList.add('hidden');
                    isUpdating = false;
                    return;
                }

                // 清除之前的闪烁定时器
                if(blinkTimeout) clearTimeout(blinkTimeout);
                // 移除闪烁效果（当光标移动/输入/点击时不需要闪烁，不然会有突然消失感）
                cursor.classList.add('no-animation');

                // 处理首次移动
                if (isFirstMove) {
                    cursor.classList.add('no-transition');
                    isFirstMove = false;
                }

                // 当选择文本时，不需要顺滑动画
                if(eventType === 'selectionchange') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0 && selection.toString()) {
                        cursor.classList.add('no-transition');
                    }
                }

                // 悬浮窗拖动窗口时，取消顺滑动画
                if(['blockPopoverMove', 'protyleResize'].includes(eventType)) {
                    cursor.classList.add('no-transition');
                }

                // 更新位置前强制清除过渡
                //const protyleContent = output.cursorElement?.closest('.protyle-content');
                //const editorRect = protyleContent.getBoundingClientRect();
                // 兼容拖动侧边栏，鼠标位置+编辑器被移动距离（移动距离=当前编辑器left-上次编辑器left）
                // 这里还有其他的算法，比如在或者光标位置时用 编辑器left-marker left得出相对距离，然后用pos.x+相对距离
                //const realX = pos.x + (editorRect.left - (editorLastLeft||editorRect.left));
                //editorLastLeft = editorRect.left;
                cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
                cursor.style.height = `${pos.height}px`;
                cursor.classList.remove('hidden');
                cursor.style.zIndex = output.cursorElement ? getEffectiveZIndex(output.cursorElement) + 1 : ++window.siyuan.zIndex;

                // 强制布局同步
                void cursor.offsetHeight;

                // 延迟恢复顺滑效果
                requestAnimationFrame(() => {
                    cursor.classList.remove('no-transition');
                });

                // 延迟添加闪烁效果（待光标静止后恢复闪烁）
                blinkTimeout = setTimeout(() => {
                    cursor.classList.remove('no-animation');
                }, BLINK_DELAY);

                lastValidPos = pos;
                isUpdating = false;
            //});
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
            let protyleContent = cursorElement?.closest('.protyle-content');
            // 非编辑器内的元素返回
            if (!protyleContent) {
                output.isOuterElement = true;
                return false;
            }
            // 如果不应用于标题返回
            if(cursorElement.closest('.protyle-title__input') && !isApplyToTitle) return;
        
            // 获取编辑区域可视范围
            const editorRect = protyleContent.getBoundingClientRect();
            
            // 检查坐标是否在编辑区域可视范围内
            const isInEditor = pos.x >= editorRect.left && 
                   pos.x <= editorRect.right && 
                   pos.y >= editorRect.top && 
                   pos.y <= editorRect.bottom;

            //获取滚动元素
            const scrollEl = findClosestScrollableElement(cursorElement);
            // 不是滚动元素直接返回编辑器区域
            if(protyleContent === scrollEl || !isSelfOrDescendant(protyleContent, scrollEl)) {
                return isInEditor;
            }
            // 获取滚动元素区域
            const scrollElRect = scrollEl.getBoundingClientRect();
            const isInScrollEl = pos.x >= scrollElRect.left && 
                   pos.x <= scrollElRect.right && 
                   pos.y >= scrollElRect.top && 
                   pos.y <= scrollElRect.bottom;
            
            // 必须在滚动元素内且编辑器内
            return isInScrollEl && isInEditor;
        };

        // 给元素添加绑定事件
        const checkElementEvents = () => {
            const cursorElement = getCursorElement();
            if(!cursorElement) return;
            // 给内部带有滚动条的元素添加滚动事件
            const scrollEl = findClosestScrollableElement(cursorElement);
            if(scrollEl && !scrollEl.handleClick) {
                scrollEl.handleClick = handleScroll;
                scrollEl.addEventListener('scroll', scrollEl.handleClick);
                scrollEl.addEventListener('wheel', scrollEl.handleClick, { passive: true });
            }
            // 给protyle-content绑定改变尺寸事件
            const protyleContent = cursorElement?.closest('.protyle-content');
            if (protyleContent && !protyleContent.handleResize) {
                new ResizeObserver(entries => {
                    updateCursor('protyleResize');
                }).observe(protyleContent);
            }
            // 给block__popover绑定拖动事件
            const blockPopover = cursorElement?.closest('.block__popover');
            if (blockPopover && !blockPopover.handleDrag) {
                const dragEl = blockPopover.querySelector('.resize__move');
                if(!dragEl) return;
                blockPopover.handleDrag = true;
                let isDragging = false;
                dragEl.addEventListener('mousedown', function(e) {
                    isDragging = true;
                });
                dragEl.addEventListener('mousemove', function(e) {
                    if(isDragging) updateCursor('blockPopoverMove');
                });
                dragEl.addEventListener('mouseup', function(e) {
                    isDragging = false;
                });
            }
        };

        const events = [
            ['scroll', handleScroll],
            ['wheel', handleScroll, { passive: true }],
            ['touchmove', handleScroll, { passive: true }],
            ['selectionchange', ()=>updateCursor('selectionchange')],
            ['keydown', () => requestAnimationFrame(updateCursor)],
            ['input', () => requestAnimationFrame(updateCursor)],
            ['click', () => {updateCursor();checkElementEvents();}],
            ['compositionend', updateCursor],
            ['mouseup', updateCursor],
            ['resize', updateCursor],
            ['keyup', () => {checkElementEvents();}],
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

    function hasScroll(el) {
      const style = getComputedStyle(el);
      const canScrollY = (style.overflowY === 'scroll' || style.overflowY === 'auto') 
        && el.scrollHeight > el.clientHeight;
      const canScrollX = (style.overflowX === 'scroll' || style.overflowX === 'auto') 
        && el.scrollWidth > el.clientWidth;
      return canScrollY || canScrollX;
    }
    
    function findClosestScrollableElement(element) {
      while (element && element !== document.documentElement) {
        if (hasScroll(element)) return element;
        element = element.parentNode;
      }
      
      // 显式检查根元素
      const roots = [document.body, document.documentElement];
      for (const root of roots) {
        if (hasScroll(root)) return root;
      }
      
      return null;
    }

    // 检查是否自身或后代
    function isSelfOrDescendant(protyleContent, scrollEl) {
      return protyleContent === scrollEl || protyleContent.contains(scrollEl);
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }
})();