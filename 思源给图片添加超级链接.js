// 给图片添加超链接
// version 0.0.2
// see https://ld246.com/article/1728779161490
(()=>{
    // 是否显示网络标志
    const isShowNetFlag = true;
    
    whenElementExist(isMobile()?'body':'.layout__center').then((el)=>{
        if(isShowNetFlag) {
            addStyle(`
               /* 显示链接标记 */
               [data-type="img"] > span:has(> img[src*="url="])::before {
                    content: "🔗";
                    position: absolute;
                    left: 5px;
                    top: 5px;
                    font-size: 12px;
                    z-index: 1;
                    width: 22px;
                    height: 21px;
                    padding: 0px;
                    border-radius: 6px;
                    background-color: #ffffffaa;
                }
                /* 错开与网络图片标志的冲突 */
                [data-type="img"] > span:has(> span.img__net):has(> img[src*="url="])::before {
                    top: 30px;
                }
            `);
        }
        let clickNum = 0, clickTimer = null, clicking = false;
        el.addEventListener('click', (event) => {
            // 正在执行点击中返回
            if(clicking) return;
            clickNum++;
            // 双击返回
            if(clickNum > 1){
                if(clickTimer) clearTimeout(clickTimer);
                clickNum = 0;
                return;
            }
            clickTimer = setTimeout(() => {
                if(event.target.tagName === 'IMG' && event.target.src && event.target.src.indexOf('url=') !== -1) {
                    const url = getParam(event.target.src, 'url');
                    if(!url) return
                    if(isMobile()){
                        openByMobile(url);
                    } else {
                        event.target.dataset.type = 'a';
                        event.target.dataset.href = url;
                        clicking = true;
                        event.target.click();
                        setTimeout(()=>{
                            event.target.dataset.type = '';
                            event.target.dataset.href = '';
                            clicking = false
                        }, 300);
                    }
                    // 更多打开功能可以参考 https://github.com/siyuan-note/siyuan/blob/4ef5d90af38666278473734be75c2f77da164661/app/src/editor/openLink.ts#L11
                    //window.open(decodeURIComponent(url));
                }
                clickNum = 0;
            }, 300);
        });
    });

    // 监听图片右键菜单
    whenElementExist('#commonMenu .b3-menu__items').then((menuItems) => {
        observeImagesMenu(menuItems, async ()=>{
            // 生成URL元素
            const inputWrap = menuItems.querySelector('.b3-menu__item--custom > span.b3-menu__label');
            const imgField = inputWrap.querySelectorAll('textarea')[0];
            if(!imgField) return;
            const urlValue = getParam(imgField.value, 'url') || '';
            const hr = `<div class="fn__hr"></div>`;
            const title = `
                <div class="fn__flex">
                    <span class="fn__flex-center">跳转地址</span>
                    <span class="fn__space"></span>
                    <span data-action="copy" class="block__icon block__icon--show b3-tooltips b3-tooltips__e fn__flex-center" aria-label="复制">
                        <svg><use xlink:href="#iconCopy"></use></svg>
                    </span>   
                </div>
            `;
            const textarea = `<textarea style="margin:4px 0;width: 360px" rows="1" class="b3-text-field">${urlValue}</textarea>`;
            inputWrap.insertAdjacentHTML('beforeend', hr);
            inputWrap.insertAdjacentHTML('beforeend', title);
            inputWrap.insertAdjacentHTML('beforeend', textarea);

            // 获取URL对象
            const urlField = inputWrap.querySelectorAll('textarea')[3];
            if(!urlField) return;

            // 监听 urlField 的内容变化
            urlField.addEventListener('input', () => {
                // 获取用户输入的新 URL
                const newUrl = urlField.value.trim();
                // 如果新 URL 为空，则不进行任何操作
                if (!newUrl) return;
                // 获取 imgField 的当前内容
                let imgFieldValue = imgField.value;
                // 检查是否已有 url 参数
                const urlParamRegex = /(url=)[^&\s]*/;
                if (urlParamRegex.test(imgFieldValue)) {
                    // 如果有 url 参数，则替换其值
                    imgFieldValue = imgFieldValue.replace(urlParamRegex, `$1${encodeURIComponent(newUrl)}`);
                } else {
                    // 如果没有 url 参数，则添加新的 url 参数
                    const separator = imgFieldValue.includes('?') ? '&' : '?';
                    imgFieldValue += `${separator}url=${encodeURIComponent(newUrl)}`;
                }
                // 将更新后的内容写回 imgField
                imgField.value = imgFieldValue;
                // 触发imgField输入事件
                imgField.dispatchEvent(new Event('input'));
            });
        });
    });
    
    // 手机端打开
    function openByMobile(uri) {
        if (!uri) {
            return;
        }
        if (isInIOS()) {
            if (uri.startsWith("assets/")) {
                window.webkit.messageHandlers.openLink.postMessage(location.origin + "/" + uri);
            } else {
                try {
                    new URL(uri);
                    window.webkit.messageHandlers.openLink.postMessage(uri);
                } catch (e) {
                    window.webkit.messageHandlers.openLink.postMessage("https://" + uri);
                }
            }
        } else if (isInAndroid()) {
            window.JSAndroid.openExternal(uri);
        } else {
            window.open(uri);
        }
    }
    // 获取URL参数
    function getParam(str, paramName) {
        const paramRegex = new RegExp(`(?:^|[^a-zA-Z0-9])${paramName}=([^&\\s]*)`);
        const match = str.match(paramRegex);
        return match ? decodeURIComponent(match[1]) : null;
    }
    // 是否iOS
    function isInIOS() {
        return window.siyuan.config.system.container === "ios" && window.webkit?.messageHandlers;
    }
    // 是否安卓端
    function isInAndroid() {
        return window.siyuan.config.system.container === "android" && window.JSAndroid;
    }
    // 是否手机端
    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    // 动态添加样式标签
    function addStyle(style) {
        // 创建一个新的 <style> 标签
        const styleTag = document.createElement('style');
        // 添加样式内容
        styleTag.textContent = style;
        // 将 <style> 标签添加到 <head> 中
        document.head.appendChild(styleTag);
    }
    // 等待元素渲染完成后执行
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

    /**
     * 监控 body 直接子元素中 #commonMenu 的添加
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observeImagesMenu(selector, callback) {
        let hasKeywordPng = false;
        let hasKeywordOcr = false;
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是图片菜单
                        if(hasKeywordPng && hasKeywordOcr) return;
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim() === window.siyuan.languages.copyAsPNG) {
                            hasKeywordPng = true;
                        }
                        if (node.nodeType === 1 && node.querySelector('.b3-menu__label')?.textContent?.trim()?.toUpperCase() === 'OCR') {
                            hasKeywordOcr = true;
                        }
                        if(hasKeywordPng && hasKeywordOcr) {
                           callback();
                           setTimeout(() => {
                               hasKeywordPng = false;
                               hasKeywordOcr = false;
                           }, 200);
                        }
                    });
                }
            }
        });
    
        // 开始观察 body 的直接子元素的变化
        observer.observe(selector || document.body, {
            childList: true, // 监听子节点的添加
            subtree: false, // 仅监听直接子元素，不监听子孙元素
        });
    
        // 返回 observer 实例，便于后续断开监听
        return observer;
    }
})();
