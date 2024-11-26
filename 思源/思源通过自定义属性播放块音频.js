// 通过自定义属性播放块音频
// see https://ld246.com/article/1732606877452
(async ()=>{
    // 这里定义自定义属性名，这里不需要带custom-，但Markdown代码里必须加custom-前缀，注意属性使用小写，否则思源也会转换为小写
    const attrName = 'attrname';
    const audioFileAttrName = 'audiofilename';
    const startTimeAttrName = 'start';
    const endTimeAttrName = 'end';
    const playEmoji = '▶️';

    observeAudioBlock('custom-' + attrName, block => {
        const content = block.firstElementChild;
        if(!content) return;
        content.innerHTML = content.innerHTML.replace(playEmoji, '<span class="audio-play-btn" style="cursor:pointer">'+playEmoji+'</span>');
        content.querySelector('.audio-play-btn')?.addEventListener('click', () => {
            const file = block.getAttribute('custom-' + audioFileAttrName);
            let startTime = block.getAttribute('custom-' + startTimeAttrName);
            let endTime = block.getAttribute('custom-' + endTimeAttrName);
            if(!file || !startTime || !endTime) return;
            startTime = parseFloat(startTime) || 0;
            endTime = parseFloat(endTime) || 0;
            if(startTime > endTime) {
                showErrorMessage('播放失败，开始时间不能大于结束时间');
            } 
            playAudio(file, startTime, endTime);
        });
    });

    var audio, timeUpdateHandler, currentEndTime = 0;
    function playAudio(file, startTime, endTime) {
        startTime = parseFloat(startTime) || 0;
        endTime = parseFloat(endTime) || 0;
        currentEndTime = endTime;
        if(!audio){
            audio = document.createElement('audio');
            document.body.appendChild(audio);
        }
        timeUpdateHandler = () => {
            if (audio.currentTime >= currentEndTime) {
                audio.pause(); // 停止播放
                audio.removeEventListener('timeupdate', timeUpdateHandler);
            }
        };
        audio.pause();
        audio.removeEventListener('timeupdate', timeUpdateHandler);
        audio.src = file;
        audio.currentTime = startTime;
        audio.play();
        // 监听时间更新事件，检查是否到达结束时间
        audio.addEventListener('timeupdate', timeUpdateHandler);
    }
    // 发送错误通知
    function showErrorMessage(message) {
        fetch('/api/notification/pushErrMsg', {
            "method": "POST",
            "body": JSON.stringify({"msg": message})
        })
    }
    // 监听tag被添加
    function observeAudioBlock(attrName, callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute(attrName) !== null) {
                            // 块标签调用回调函数
                            callback(node);
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