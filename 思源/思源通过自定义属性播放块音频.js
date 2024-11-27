// 通过自定义属性播放块音频
// version 0.0.2
// 更新记录
// 0.0.2 增加了按钮鼠标悬停效果，增加了对自定义emoji的支持
(async ()=>{
    // 这里定义自定义属性名，这里不需要带custom-，但Markdown代码里必须加custom-前缀，注意属性使用小写，否则思源也会转换为小写
    const attrName = 'attrname';
    const audioFileAttrName = 'audiofilename';
    const startTimeAttrName = 'start';
    const endTimeAttrName = 'end';
    // 不使用该参数，填空即可
    const playEmoji = '▶️';
    // 自定义Emoji，格式，path/xxx，无需加图片扩展名，不使用该参数，填空即可
    // 假设自定义表情路径是，data/emojis/demo/demo.png，则只需要填写：demo/demo 即可。
    const playEmojiCustom = '';

    observeAudioBlock('custom-' + attrName.replace(/^custom\-/i,''), block => {
        const content = block.firstElementChild;
        if(!content) return;
        if(content.querySelector('.audio-play-btn')) return;
        let customEmoji;
        if(playEmojiCustom) customEmoji = content.querySelector('img[alt="'+playEmojiCustom.replace(/^:|:$/g,'')+'"]');
        let audioPlayBtn;
        if(customEmoji) {
            customEmoji.classList.add('audio-play-btn');
            audioPlayBtn = customEmoji;
        } else {
            if(!playEmoji) return;
            content.innerHTML = content.innerHTML.replace(playEmoji, '<span class="audio-play-btn">'+playEmoji+'</span>');
            audioPlayBtn = content.querySelector('.audio-play-btn');
        }
        audioPlayBtn?.addEventListener('click', (event) => {
            const file = block.getAttribute('custom-' + audioFileAttrName.replace(/^custom\-/i,''));
            let startTime = block.getAttribute('custom-' + startTimeAttrName.replace(/^custom\-/i,''));
            let endTime = block.getAttribute('custom-' + endTimeAttrName.replace(/^custom\-/i,''));
            if(!file || !startTime || !endTime) return;
            startTime = parseFloat(startTime) || 0;
            endTime = parseFloat(endTime) || 0;
            if(startTime > endTime) {
                showErrorMessage('播放失败，开始时间不能大于结束时间');
            } 
            playAudio(file, startTime, endTime);
            event.stopPropagation();
            event.preventDefault();
        });
    });

    // 添加样式
    addStyle(`
        .audio-play-btn {cursor: pointer;}
        .audio-play-btn:hover {opacity: 0.8;}
    `);

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
        audio.load();
        audio.addEventListener('canplay', () => {
            audio.play();
        });
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
    // 添加style标签
    function addStyle(css) {
        // 创建一个新的style元素
        const style = document.createElement('style');
        // 设置CSS规则
        style.innerHTML = css;
        // 将style元素添加到<head>中
        document.head.appendChild(style);
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