// 全屏菜单（Esc退出全屏）
// see https://ld246.com/article/1746079460404
(()=>{
    // 判断是否全屏状态
    if(localStorage.getItem('isFullscreen') === 'true') {
        const comfirmHtml = `<div data-key="dialog-confirm" class="b3-dialog--fullScreen b3-dialog--open"><div class="b3-dialog" style="z-index: ${++window.siyuan.zIndex};">
<div class="b3-dialog__scrim"></div>
<div class="b3-dialog__container " style="width:520px;height:auto;
left:auto;top:auto">
  <svg class="b3-dialog__close"><use xlink:href="#iconCloseRound"></use></svg>
  <div class="resize__move b3-dialog__header" onselectstart="return false;">⚠️ 全屏确认</div>
  <div class="b3-dialog__body"><div class="b3-dialog__content">
    <div class="ft__breakword">意外退出全屏，您想要 <b>继续全屏</b> 吗？
<div class="fn__hr"></div>
<div class="ft__smaller ft__on-surface">全屏后可按 <code class="fn__code">Esc</code> 键退出全屏</div></div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="cancelDialogConfirmBtn">取消</button><div class="fn__space"></div>
    <button class="b3-button b3-button--outline" id="confirmDialogConfirmBtn">继续全屏</button>
</div></div>
  <div class="resize__rd"></div><div class="resize__ld"></div><div class="resize__lt"></div><div class="resize__rt"></div><div class="resize__r"></div><div class="resize__d"></div><div class="resize__t"></div><div class="resize__l"></div>
</div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', comfirmHtml);
        const fullScreenDialog = document.querySelector('.b3-dialog--fullScreen');
        fullScreenDialog.addEventListener('click', (e) => {
            if(
                e.target.closest('.b3-dialog__scrim') ||
                e.target.closest('.b3-dialog__close') ||
                e.target.closest('.b3-button--cancel')
            ) {
                fullScreenDialog.remove();
                localStorage.setItem('isFullscreen', false);
            } else if(e.target.closest('.b3-button--outline')) {
                fullScreenDialog.remove();
                requestFullScreen(document.querySelector('html'));
                localStorage.setItem('isFullscreen', true);
            }
        });
        document.addEventListener('keydown', (event) => {
            const notOtherKey = !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
            if (event.key === 'Enter' && notOtherKey && document.querySelector('.b3-dialog--fullScreen')) {
                fullScreenDialog.remove();
                requestFullScreen(document.querySelector('html'));
                localStorage.setItem('isFullscreen', true);
            }
            else if (event.key === 'Escape' && notOtherKey && document.querySelector('.b3-dialog--fullScreen')) {
                fullScreenDialog.remove();
                localStorage.setItem('isFullscreen', false);
            }
        }, true);
    }
    // 监听主菜单
    whenElementExist('#commonMenu .b3-menu__items').then((mainMenu) => {
        let hasToggle = false;
        observeMainMenu(mainMenu, async ()=>{
            if(hasToggle) return;
            hasToggle = true;
            if(mainMenu.querySelector('button[data-id="fullScreen"]')) return;
            const sp2 = mainMenu.querySelector('button[data-id="separator_2"]');
            const fullScreenText = isFullScreen() ? '退出全屏' : '全屏';
            const fullScreenIcon = isFullScreen() ? '#iconFullscreenExit' : '#iconFullscreen';
            const btnString = `<button data-id="fullScreen" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="${fullScreenIcon}"></use></svg><span class="b3-menu__label">${fullScreenText}</span></button>`;
            setTimeout(() => {
                if(!sp2) return;
                sp2.insertAdjacentHTML('beforebegin', btnString);
                const button = mainMenu.querySelector('button[data-id="fullScreen"]');
                button.onclick = (event) => {
                    window.siyuan.menus.menu.remove(); // 关闭主菜单
                    if(isFullScreen()) {
                        // 退出全屏
                        exitFullscreen();
                        localStorage.setItem('isFullscreen', false);
                        setTimeout(()=>{
                            if(checkSoftFullScreen()) showMessage('检测到您可能处于软件级全屏状态，此操作可能无效！');
                        }, 300);
                    } else {
                        if(checkSoftFullScreen()) showMessage('检测到您可能处于软件级全屏状态，此操作可能无效！');
                        // 全屏
                        requestFullScreen(document.querySelector('html'));
                        localStorage.setItem('isFullscreen', true);
                    }
                };
                setTimeout(()=>hasToggle = false, 200);
            }, 0);
        });
    });
    // 监听全屏变化
    document.addEventListener('fullscreenchange', function () {
      if (isFullScreen()) {
        localStorage.setItem('isFullscreen', true);
      } else {
        localStorage.setItem('isFullscreen', false);
      }
    });
    /**
     * 监控 body 直接子元素中 #commonMenu 的添加
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observeMainMenu(selector, callback) {
        let hasToggle = false;
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        if(node.nodeType === 1 && node.closest('[data-name="barWorkspace"]')) {
                            hasToggle = true;
                            callback();
                            setTimeout(() => {
                                hasToggle = false;
                            }, 200);
                        }
                    });
                }
            }
        });
        // 开始观察 body 的直接子元素的变化
        selector = typeof selector === 'string' ? document.querySelector(selector) : selector;
        observer.observe(selector || document.body, {
            childList: true, // 监听子节点的添加
            subtree: false, // 仅监听直接子元素，不监听子孙元素
        });
        // 返回 observer 实例，便于后续断开监听
        return observer;
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
    function exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari, Opera */
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) { /* IE/Edge Legacy */
        document.msExitFullscreen();
      }
    }
    function isFullScreen() {
      return !!document.fullscreenElement;
        
    }
    function checkSoftFullScreen() {
      const threshold = 0.99; // 容忍误差
      const widthMatch = window.innerWidth / screen.width > threshold;
      const heightMatch = window.innerHeight / screen.height > threshold;
      if (widthMatch && heightMatch) {
        return true;
      } else {
        return false;
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
    // 发送通知消息
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
})();