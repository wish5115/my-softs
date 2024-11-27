// 拦截指定域名的链接并播放链接音频
// see https://ld246.com/article/1732632964559
(()=>{
    // 以指定域名匹配链接
    const audioDomains = [
        'res.iciba.com',
        'tts.iciba.com',
        'res-tts.iciba.com',
    ];

    // 监听指定的链接被添加
    const selectors = audioDomains.map(audioDomain=>audioDomain?'span[data-type="a"][data-href*="'+audioDomain.trim()+'"]:not([data-replaced])':'').filter(i=>i).join(',');
    if(selectors) observeLinkBlock(selectors, async (link) => {
        link.dataset.replaced = true;
        link.onclick = (event) => {
            playAudio(link.dataset.href);
            event.stopPropagation();
        };
    });

    // 播放音频
    var audio;
    async function playAudio(file) {
        if(!audio){
            audio = document.createElement('audio');
            document.body.appendChild(audio);
        }
        audio.pause();
        audio.currentTime = 0;
        audio.src = file;
        audio.load();
        // 监听音频准备完毕
        const canplayhandler = () => {
            audio.play();
            audio.removeEventListener('canplay', canplayhandler);
        };
        audio.removeEventListener('canplay', canplayhandler);
        audio.addEventListener('canplay', canplayhandler);
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