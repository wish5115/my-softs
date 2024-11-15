(()=>{
    whenElementExist(isMobile()?'body':'.layout__center').then((el)=>{
          addStyle(`
              [data-type="img"] > span:has(> img[src*="url="])::before {
                  content: "🔗";
                  position: absolute;
                  left: 5px;
                  top: 5px;
                  font-size: 20px;
                  z-index: 1;
                  width: 30px;
                  height: 30px;
                  padding: 2px;
                  border-radius: 5px;
                  background-color: #ffffffaa;
              }
        `);
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
    function getParam(url, paramName) {
        try {
            const urlObj = new URL(url);
            const searchParams = new URLSearchParams(urlObj.search);
            return searchParams.get(paramName) || null;
        } catch (error) {
            console.error('Invalid URL:', error);
            return null;
        }
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
})();
