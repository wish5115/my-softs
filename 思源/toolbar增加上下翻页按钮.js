// toolbar增加上下翻页按钮
// see https://ld246.com/article/1759977992135
// vesion 0.0.4
// 0.0.4 调整快捷键；增加alt+点击下方向键 模拟鼠标按住滚动条拖动，再次按alt关闭模拟滚动；增加按shift箭头翻转效果；增加详细提示文本；删除向上按钮
// 0.0.3 新增alt+点击下方向键 向下滚动指定行，alt+shift+点击下方向键，向上滚动指定行；向下按钮和alt+点击向下按钮滚动时，会保留一定的重叠区域，方便浏览时衔接
// 0.0.2 修复滚动算法错误（之前的视窗计算有误差）；增加ctrl+点击向下方向键，实现向上翻页功能
(async ()=>{
    // alt+点击 滚动高度，这里用行高 * 3 表示，由于每个人的行高不一样，这里可自行修改
    const altClickScrollHeight = 34 * 3;
    
    // 重叠高度，当上下滚动时，有一部分重叠区域不滚动（并非完全滚动整个视窗），方便上下文衔接，可根据自己需要修改
    const overlap = 40;

    // 是否开启alt+↓ 模拟鼠标按住滚动条拖动 true 开启 false 不开启
    const isAltDragging = true;

    // 当按shift或shift+ctrl时箭头是否翻转 true 翻转 false 不翻转
    const isArrowFlippedWhenShiftPress = true;

    // 是否显示详细提示 true 显示 false 不显示
    const isShowDetailTips = true;

    // 是否显示向上翻页按钮 true 显示 false 不显示
    //const isShowPageUpBtn = false;

    // 不支持手机版
    if(isMobile()) return;

    let isDragging = false;
  
    // 添加toolbar按钮
    whenElementExist('#toolbar .fn__ellipsis').then((el)=>{
        if(!el) return;
        // 向下按钮
        const tips = !isShowDetailTips ? '点击向下翻页' : `点击 <span class='ft__on-surface'>向下翻页</span><br>Shift + 点击 <span class='ft__on-surface'>向上翻页</span><br>Ctrl + 点击 <span class='ft__on-surface'>向下滚动</span><br>Shift + Ctrl + 点击 <span class='ft__on-surface'>向上滚动</span><br>Alt + 点击 <span class='ft__on-surface'>模拟拖动滚动条</span><br>再次按Alt <span class='ft__on-surface'>取消模拟拖动滚动条</span>`;
        const pageDownBtnHtml = `<div data-menu="true" id="pageDownBtn" class="toolbar__item ariaLabel" aria-label="${tips}" data-location="right"><svg style=""><use xlink:href="#iconArrowDown"></use></svg></div>`;
        el.insertAdjacentHTML('afterend', pageDownBtnHtml);
        const pageDownBtn = el.nextElementSibling;
        pageDownBtn.addEventListener('click', (event) => {
            const protyleEl = getProtyleEl();
            const scrollEl = protyleEl?.querySelector('.protyle-content');
            const isCtrlPressed = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey;
            const isShiftPressed =  event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
            const isShiftCtrlPressed = (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey;
            const isAltPressed =  event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey;
            // Shift + ↓ 上翻页
            if(isShiftPressed) scrollPage(scrollEl, true);
            // Ctrl + ↓ 向下滚动
            else if(isCtrlPressed) scrollPage(scrollEl, false, altClickScrollHeight);
            // Shift + Ctrl + ↓ 上滚动
            else if(isShiftCtrlPressed) scrollPage(scrollEl, true, altClickScrollHeight);
            // alt + ↓ 开始模拟拖动滚动条
            else if(isAltPressed) beginDragging();
            // ↓ 下翻页
            else scrollPage(scrollEl, false);
            
        });

        // 向上按钮
        // if(isShowPageUpBtn) {
        //     const pageUpBtnHtml = `<div data-menu="true" id="pageUpBtn" class="toolbar__item ariaLabel" aria-label="点击向上翻页" data-location="right"><svg style="transform: scaleY(-1);"><use xlink:href="#iconArrowDown"></use></svg></div>`;
        //     el.insertAdjacentHTML('afterend', pageUpBtnHtml);
        //     const pageUpBtn = el.nextElementSibling;
        //     pageUpBtn.addEventListener('click', (event) => {
        //         const protyleEl = getProtyleEl();
        //         const scrollEl = protyleEl?.querySelector('.protyle-content');
        //         scrollPage(scrollEl, true);
        //     });
        // }
    });

    if(isArrowFlippedWhenShiftPress) {
        let isArrowFlipped = false; // 状态标记
        document.addEventListener('keydown', (event) => {
            if (isArrowFlipped) return; // 防止重复触发
        
            const isShiftPressed = event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
            const isShiftCtrlPressed = (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey;
        
            if (isShiftPressed || isShiftCtrlPressed) {
                const arrowBtn = document.querySelector('#toolbar #pageDownBtn');
                const arrow = arrowBtn?.querySelector('svg');
                if (arrow) {
                    arrow.style.transform = 'scaleY(-1)';
                    //arrowBtn.setAttribute('aria-label', isShiftPressed ? '点击向上翻页' : '点击向上滚动');
                    isArrowFlipped = true; // 标记已翻转
                }
            }
        });
        
        document.addEventListener('keyup', () => {
            if (isArrowFlipped) {
                const arrowBtn = document.querySelector('#toolbar #pageDownBtn');
                const arrow = arrowBtn?.querySelector('svg');
                if (arrow) {
                    arrow.style.transform = ''; // 复原
                    //arrowBtn.setAttribute('aria-label', '点击向下翻页');
                    isArrowFlipped = false;     // 清除标记
                }
            }
        });
    }

    function beginDragging() {
        if(!isAltDragging) return;
        if (isDragging) return;
        isDragging = true;
        document.addEventListener('mousemove', mousemoveHandle);
        document.addEventListener('keydown', keydownHandle);
    }

    function endDragging() {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', mousemoveHandle);
        document.removeEventListener('keydown', keydownHandle);
    }

    function keydownHandle(e) {
        if(e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) endDragging();
    }

    function mousemoveHandle(e) {
        if (!isDragging) return;
    
        const protyleEl = getProtyleEl();
        const scrollEl = protyleEl?.querySelector('.protyle-content');
        if (!scrollEl) return;
    
        const { scrollHeight, clientHeight } = scrollEl;
        const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
        if (maxScrollTop <= 0) return;
    
        // 获取 scrollEl 在视口中的位置
        const rect = scrollEl.getBoundingClientRect();
        const scrollElTop = rect.top;
        const scrollElHeight = rect.height;
    
        // 鼠标在 scrollEl 内部的相对 Y（可能为负或超出，需 clamp）
        let relativeY = e.clientY - scrollElTop;
        // 限制在 [0, scrollElHeight] 范围内
        relativeY = Math.max(0, Math.min(relativeY, scrollElHeight));
    
        // 计算比例：0（顶部）→ 1（底部）
        const ratio = relativeY / scrollElHeight;
    
        // 应用滚动
        scrollEl.scrollTop = ratio * maxScrollTop;
    }

    function scrollPage(element, isPageUp = true, amount = 0) {
      const scroller = element || window;
      const pageHeight = scroller === window 
        ? window.innerHeight 
        : scroller.clientHeight;
    
      const scrollOptions = { 
        top: isPageUp ? (amount?-amount:(-pageHeight+overlap)) : (amount?amount:(pageHeight-overlap)),
        // behavior: 'smooth' // 按需开启
      };
    
      if (scroller === window) {
        window.scrollBy(scrollOptions);
      } else {
        scroller.scrollBy(scrollOptions);
      }
    }
    function getProtyleEl() {
        return document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
          .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
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
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
})();