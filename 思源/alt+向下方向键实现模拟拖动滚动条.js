// alt+向下方向键实现模拟拖动滚动条
// 提取自 https://gitee.com/wish163/mysoft/blob/main/%E6%80%9D%E6%BA%90/toolbar%E5%A2%9E%E5%8A%A0%E4%B8%8A%E4%B8%8B%E7%BF%BB%E9%A1%B5%E6%8C%89%E9%92%AE.js
// 原需求 https://ld246.com/article/1759977992135
(async () => {
    if (isMobile()) return;

    let isDragging = false;
    let isDragPaused = false;

    // === 全局快捷键监听 ===
    document.addEventListener('keydown', (e) => {
        // Alt + ↓ 触发模拟拖动
        if (
            e.altKey &&
            (e.key === 'ArrowDown' || e.key === 'Down') &&
            !e.shiftKey &&
            !e.ctrlKey &&
            !e.metaKey
        ) {
            e.preventDefault(); // 阻止浏览器默认行为（如切换标签）
            e.stopPropagation();
            beginDragging();
        }
    }, true);

    // === 模拟拖动核心 ===
    function beginDragging() {
        if (isDragging) return;
        isDragging = true;
        isDragPaused = false;
        document.addEventListener('mousemove', mousemoveHandle, true);
        document.addEventListener('keydown', keydownHandle, true);
    }

    function endDragging() {
        if (!isDragging) return;
        isDragging = false;
        isDragPaused = false;
        document.removeEventListener('mousemove', mousemoveHandle, true);
        document.removeEventListener('keydown', keydownHandle, true);
    }

    function keydownHandle(e) {
        if (!isDragging) return;

        // Esc：退出
        if ((e.key === 'Escape' || e.key === 'Esc') && !e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            endDragging();
            return;
        }

        // Alt（单独）：暂停/继续
        if (e.key === 'Alt' && e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            isDragPaused = !isDragPaused;
            return;
        }
    }

    function mousemoveHandle(e) {
        if (!isDragging || isDragPaused) return;

        const protyleEl = getProtyleEl();
        const scrollEl = protyleEl?.querySelector('.protyle-content');
        if (!scrollEl) return;

        const { scrollHeight, clientHeight } = scrollEl;
        const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
        if (maxScrollTop <= 0) return;

        const rect = scrollEl.getBoundingClientRect();
        const relativeY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        const ratio = relativeY / rect.height;

        scrollEl.scrollTop = ratio * maxScrollTop;
    }

    // === 工具函数（复用原逻辑）===
    function getProtyleEl() {
        return document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
            .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }
})();