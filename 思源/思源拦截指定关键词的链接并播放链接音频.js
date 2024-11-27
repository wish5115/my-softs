// 拦截指定关键词的链接并播放链接音频
// see https://ld246.com/article/1732632964559
(()=>{
    // 以指定关键词匹配链接
    const audioLinkKeyword = '';

    // 监听指定的链接被添加
    if(audioLinkKeyword) observeLinkBlock('span[data-type="a"][data-href*="'+audioLinkKeyword+'"]:not([data-replaced])', async (link) => {
        link.dataset.replaced = true;
        link.onclick = (event) => {
            const linkHref = link.dataset?.href?.replace('&amp;', '&');
            const params = getQueryParams(linkHref);
            playAudio(linkHref, parseFloat(params.start) || 0, parseFloat(params.end) || 0);
            event.stopPropagation();
        };
    });

    // 播放音频
    var audio, endTime;
    async function playAudio(file, start, end) {
        endTime = end;
        if(!audio){
            audio = document.createElement('audio');
            document.body.appendChild(audio);
        }
        audio.pause();
        audio.currentTime = start || 0;
        audio.src = file;
        audio.load();
        
        // 监听音频准备完毕
        const canplayhandler = () => {
            audio.play();
            audio.removeEventListener('canplay', canplayhandler);
        };
        audio.removeEventListener('canplay', canplayhandler);
        audio.addEventListener('canplay', canplayhandler);

        // 监听时间更新事件，检查是否到达结束时间
        if(start > 0 && end > 0 && end > start) {
            const timeUpdateHandler = () => {
                if (audio.currentTime >= endTime) {
                    audio.pause(); // 停止播放
                    audio.removeEventListener('timeupdate', timeUpdateHandler);
                }
            };
            audio.removeEventListener('timeupdate', timeUpdateHandler);
            audio.addEventListener('timeupdate', timeUpdateHandler);
        }
    }

    // 获取URL参数
    function getQueryParams(url) {
        const urlObj = new URL(url);
        const urlParams = new URLSearchParams(urlObj.search);
        const params = {};
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        return params;
    }
    
    // 监听Link被添加
    function observeLinkBlock(selector, callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches(selector)) {
                                // 调用回调函数
                                if(callback) callback(node);
                            } else {
                                const link = node.querySelector(selector);
                                if (link) {
                                    // 调用回调函数
                                    if(callback) callback(link);
                                }
                            }
                        }
                    }
                }
            }
        });
        // 配置观察选项:
        const config = { 
            childList: true, // 观察子节点的变化(添加/删除)
            subtree: true // 观察所有后代节点
        };
        // 选择需要观察变动的节点
        const targetNode = document.body; // 或者选择更具体的父节点以减少性能消耗
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回一个取消观察的方法
        return () => observer.disconnect();
    }
})();