// toolbar增加上下翻页按钮第二版
// see https://ld246.com/article/1760023377457
// 改自 https://ld246.com/article/1759977992135
// version 0.0.1
// 0.0.1 重构为 ↑/↓ 切换模式；移除模拟拖动滚动条；Alt+点击 = 自动滚动；Shift+点击 = 切换方向
(async () => {
    // 手动滚动高度（Ctrl + 点击），单位：px
    const manualScrollHeight = 34 * 3;

    // 重叠高度（翻页时保留上下文）
    const overlap = 40;

    // 自动滚动速度（Alt + 点击），单位：px/frame（支持小数）
    const autoScrollSpeed = 1;

    // 是否显示详细提示
    const isShowDetailTips = true;

    // 不支持手机版
    if (isMobile()) return;

    // ===== 状态管理 =====
    let isUpMode = false; // false = ↓, true = ↑
    let isAutoScrolling = false;
    let isPaused = false;
    let autoScrollRafId = null;
    let scrollConfig = { direction: 1, speed: autoScrollSpeed, scrollEl: null };

    // ===== 工具函数 =====
    function updateButtonUI() {
        const btn = document.querySelector('#toolbar #pageUpDownBtn');
        if (!btn) return;

        const svg = btn.querySelector('svg');
        const label = isUpMode
            ? (isShowDetailTips
                ? `</span>点击 <span class='ft__on-surface'>向上翻页</span><br>Ctrl + 点击 <span class='ft__on-surface'>向上滚动</span><br>Alt + 点击 <span class='ft__on-surface'>自动向上滚动</span><br>Alt <span class='ft__on-surface'>暂停/继续滚动</span><br>Esc <span class='ft__on-surface'>退出滚动</span><br>Shift + 点击 <span class='ft__on-surface'>切换为向下</span><span class="pageUpDownBtn-tips" style="display:none;">`
                : '点击向上翻页')
            : (isShowDetailTips
                ? `点击 <span class='ft__on-surface'>向下翻页</span><br>Ctrl + 点击 <span class='ft__on-surface'>向下滚动</span><br>Alt + 点击 <span class='ft__on-surface'>自动向下滚动</span><br>Alt <span class='ft__on-surface'>暂停/继续滚动</span><br>Esc <span class='ft__on-surface'>退出滚动</span><br>Shift + 点击 <span class='ft__on-surface'>切换为向上</span><span class="pageUpDownBtn-tips" style="display:none;">`
                : '点击向下翻页');

        svg.style.transform = isUpMode ? 'scaleY(-1)' : '';
        btn.setAttribute('aria-label', label);

        const tooltip = document.querySelector("#tooltip");
        if(tooltip && tooltip.querySelector('span.pageUpDownBtn-tips')) {
            tooltip.innerHTML = label;
        }
    }

    // ===== 自动滚动逻辑 =====
    function autoScroll(direction) {
        if (isAutoScrolling) return;

        const protyleEl = getProtyleEl();
        const scrollEl = protyleEl?.querySelector('.protyle-content');
        if (!scrollEl) return;

        isAutoScrolling = true;
        isPaused = false;
        scrollConfig = {
            direction,
            speed: autoScrollSpeed,
            scrollEl
        };

        autoScrollRafId = requestAnimationFrame(autoScrollStep);
    }

    function autoScrollStep() {
        if (!isAutoScrolling || isPaused) {
            autoScrollRafId = requestAnimationFrame(autoScrollStep);
            return;
        }

        const { scrollEl, direction, speed } = scrollConfig;
        if (!scrollEl) {
            stopAutoScroll();
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = scrollEl;
        const maxScroll = scrollHeight - clientHeight;
        if (maxScroll <= 0) {
            stopAutoScroll();
            return;
        }

        let newScrollTop = scrollTop + direction * speed;
        if (newScrollTop <= 0) {
            newScrollTop = 0;
            stopAutoScroll();
        } else if (newScrollTop >= maxScroll) {
            newScrollTop = maxScroll;
            stopAutoScroll();
        }

        scrollEl.scrollTop = newScrollTop;

        if (isAutoScrolling && !isPaused) {
            autoScrollRafId = requestAnimationFrame(autoScrollStep);
        }
    }

    function stopAutoScroll() {
        if (autoScrollRafId) {
            cancelAnimationFrame(autoScrollRafId);
            autoScrollRafId = null;
        }
        isAutoScrolling = false;
        isPaused = false;
    }

    // 全局按键：控制自动滚动
    document.addEventListener('keydown', (e) => {
        if (!isAutoScrolling) return;
        if (e.key === 'Alt' && e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            isPaused = !isPaused;
        } else if (e.key === 'Escape' && !e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            stopAutoScroll();
        }
    }, true);

    // ===== 翻页/滚动逻辑 =====
    function scrollPage(element, isPageUp = true, amount = 0) {
        const scroller = element || window;
        const pageHeight = scroller === window ? window.innerHeight : scroller.clientHeight;
        const top = isPageUp
            ? (amount ? -amount : (-pageHeight + overlap))
            : (amount ? amount : (pageHeight - overlap));
        scroller.scrollBy({ top });
    }

    // ===== 初始化按钮 =====
    whenElementExist('#toolbar .fn__ellipsis').then((el) => {
        if (!el) return;

        const defaultTips = isShowDetailTips
            ? `点击 <span class='ft__on-surface'>向下翻页</span><br>Ctrl + 点击 <span class='ft__on-surface'>向下滚动</span><br>Alt + 点击 <span class='ft__on-surface'>自动向下滚动</span><br>Shift + 点击 <span class='ft__on-surface'>切换方向</span>`
            : '点击向下翻页';

        const btnHtml = `<div data-menu="true" id="pageUpDownBtn" class="toolbar__item ariaLabel" aria-label="${defaultTips}" data-location="right">
            <svg><use xlink:href="#iconArrowDown"></use></svg>
        </div>`;
        el.insertAdjacentHTML('afterend', btnHtml);

        const btn = el.nextElementSibling;
        btn.addEventListener('click', (event) => {
            const protyleEl = getProtyleEl();
            const scrollEl = protyleEl?.querySelector('.protyle-content');

            const isShift = event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
            const isCtrl = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey;
            const isAlt = event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey;

            if (isShift) {
                // 切换模式
                isUpMode = !isUpMode;
                updateButtonUI();
                return;
            }

            if (isAlt) {
                // Alt + 点击 = 自动滚动
                autoScroll(isUpMode ? -1 : 1);
                return;
            }

            if (isCtrl) {
                // Ctrl + 点击 = 手动滚动
                scrollPage(scrollEl, isUpMode, manualScrollHeight);
                return;
            }

            // 普通点击 = 翻页
            scrollPage(scrollEl, isUpMode);
        });

        // 初始化 UI
        updateButtonUI();
    });

    // ===== 工具函数（保持不变）=====
    function getProtyleEl() {
        return document.querySelector('#editor') || document.querySelector(`.protyle[data-id="${[...document.querySelectorAll('.layout-tab-bar [data-type="tab-header"]')]
            .reduce((max, tab) => Number(tab?.dataset?.activetime) > Number(max?.dataset?.activetime || -1) ? tab : max, null)?.dataset?.id}"]`);
    }

    function whenElementExist(selector, node = document, timeout = 5000) {
        return new Promise((resolve) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function' ? selector() : node.querySelector(selector);
                } catch {
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