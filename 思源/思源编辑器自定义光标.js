// 思源编辑器自定义光标
// see https://ld246.com/article/1747200651209
(()=>{
    addStyle(`
        .protyle-wysiwyg{
            caret-color: transparent;
        }
        /* 自定义光标 */
        #custom-cursor {
          position: absolute;
          width: 2px;
          height: 1.2em;
          background: var(--b3-theme-on-background);
          animation: none !important; /* 禁用闪烁 */
          pointer-events: none;
        }
        @keyframes blink { /* 保留备用动画 */
          50% { opacity: 0 }
        }
    `);
    document.body.insertAdjacentHTML('beforeend', `<div id="custom-cursor"></div>`);
    addCursorEvent();
    
    function addCursorEvent() {
        let cursorVisible = true;
        const cursor = document.getElementById('custom-cursor');
        
        // 光标同步逻辑
        function updateCursor() {
          const sel = window.getSelection();
          if (!sel.rangeCount) return;
          
          const range = sel.getRangeAt(0).cloneRange();
          range.collapse(true);
          
          const rect = range.getClientRects()[0];
          if (rect) {
            cursor.style.left = `${rect.left}px`;
            cursor.style.top = `${rect.top}px`;
            cursor.style.display = cursorVisible ? 'block' : 'none';
          }
        }
        
        // 光标闪烁控制（可选）
        // setInterval(() => {
        //   cursorVisible = !cursorVisible;
        //   cursor.style.opacity = cursorVisible ? 1 : 0;
        // }, 600);
        
        // 事件监听
        document.addEventListener('selectionchange', updateCursor);
        document.addEventListener('keydown', updateCursor);
        document.addEventListener('click', updateCursor);
        document.addEventListener('input', updateCursor);
    }
    function addStyle(css) {
        // 创建一个新的style元素
        const style = document.createElement('style');
        // 设置CSS规则
        style.innerHTML = css;
        // 将style元素添加到<head>中
        document.head.appendChild(style);
    }
})();