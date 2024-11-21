// 思源把新窗口还原到主窗口显示
// version: 0.0.1
// see https://ld246.com/article/1731683269218
(async () => {
	// 新窗口关闭后延迟多少毫秒后主窗口再打开文件
	// 如果打开有问题，这里可适当调大些，如果你的电脑性能好也可调小些
	const delayTimeAfterNewWindowClose = 200;
	
    await sleep(100);
    if (isMobile()) return;
    if(isNewWindow()){
        // 新窗口
        const toolbar = document.querySelector('.toolbar__window');
        if (!toolbar) return;
		const pinWindowBtn = toolbar.querySelector('#pinWindow');
		if (!pinWindowBtn) return;
        // 创建一个新的 <div> 元素
        const closeBtn = document.createElement('div');
        // 设置 <div> 元素的属性和类名
        closeBtn.className = 'toolbar__item ariaLabel';
        closeBtn.setAttribute('aria-label', '还原到主窗口');
        closeBtn.id = 'toMainWindow';
        closeBtn.innerHTML = `<svg style="transform:scaleX(-1)"><use xlink:href="#iconOpenWindow"></use></svg>`;
        closeBtn.onclick = () => {
            const wnd = document.querySelector('[data-type="wnd"].layout__wnd--active') || document.querySelector('[data-type="wnd"]');
            const currDocBlockId = wnd.querySelector('.protyle:not(.fn__none)')?.querySelector('.protyle-title')?.dataset?.nodeId;
            // 通知主窗口打开块id
            localStorage.setItem('NotifyMainWindowOpenBlock', currDocBlockId || '');
        };
		toolbar.insertBefore(closeBtn, pinWindowBtn.nextSibling);
		const toolbarWidth = toolbar.offsetWidth;
		whenElementExist('.layout-tab-bar.layout-tab-bar--readonly').then((tabBar) => {
			tabBar.style.paddingRight = toolbarWidth + 'px';
		});
		localStorage.setItem('NotifyNewWindowClose', '');
        window.addEventListener('storage', function(event) {
            // 收到父窗口关闭通知
            if (event.key === 'NotifyNewWindowClose') {
                if(event.newValue) {
                    localStorage.setItem('NotifyNewWindowClose', '');
                    setTimeout(() => {
                        window.close();
                    }, 40);
                }
            }
        });
    } else {
        // 主窗口
		localStorage.setItem('NotifyMainWindowOpenBlock', '');
        window.addEventListener('storage', function(event) {
            // 收到新窗口的消息
            if (event.key === 'NotifyMainWindowOpenBlock') {
                if(event.newValue) {
                    // 通知新窗口关闭窗口
                    localStorage.setItem('NotifyNewWindowClose', event.newValue);
                    setTimeout(() => {
                        // 打开文档
                        window.open('siyuan://blocks/' + event.newValue);
                        setTimeout(() => {
                            localStorage.setItem('NotifyMainWindowOpenBlock', '');
                        }, 100);
                    }, delayTimeAfterNewWindowClose);
                }
            }
        });
    }

    function isNewWindow() {
        return !document.querySelector("#toolbar");
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
