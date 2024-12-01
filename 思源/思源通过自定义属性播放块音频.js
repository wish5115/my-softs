// 通过自定义属性播放块音频
// version 0.0.5
// 更新记录
// 0.0.2 增加了按钮鼠标悬停效果，增加了对自定义emoji的支持
// 0.0.3 标题可增加Emoji实现一键播放该标题下的所有音频（注意，该功能通过所有音频的最小开始和最大结束时间实现的，不是通用方案，如果你的音频不是连续的，勿用此功能！）
// 0.0.4 兼容时间格式，标题Emoji兼容自定义Emoji
// 0.0.5 由于思源块内无法添加自定义元素和属性，放弃emoji方案，仅支持自定义emoji方案 see https://github.com/siyuan-note/siyuan/issues/13325
(async ()=>{
    // 这里定义自定义属性名，这里不需要带custom-，但Markdown代码里必须加custom-前缀，注意属性使用小写，否则思源也会转换为小写
    const audioFileAttrName = 'audiofilename';
    const startTimeAttrName = 'start';
    const endTimeAttrName = 'end';
    // 块播放按钮自定义Emoji，格式，path/xxx，无需加图片扩展名，不使用该参数，填空即可
    // 假设自定义表情路径是，data/emojis/demo/demo.png，则只需要填写：demo/demo 即可。
    // 如果同一个块中多个相同播放按钮，仅第一个生效
    let playEmojiCustom = 'your_path/block-play';
    // 标题播放按钮自定义Emoji，不使用该参数，填空即可
    //（该功能是通过获取标题下的所有音频的最小开始时间和最大结束时间实现的，因此不通用，如果你的音频不是连续播放的，勿用此功能）
    // 如果同一个标题中多个相同播放按钮，仅第一个生效
    let playEmojiCustomHead = 'your_path/head-play';

    // 去除两边:号
    playEmojiCustom = playEmojiCustom.replace(/^:|:$/g,'');
    playEmojiCustomHead = playEmojiCustomHead.replace(/^:|:$/g,'');

    // 监听块播放按钮被加载或添加
    observeAudioElements('custom-' + audioFileAttrName.replace(/^custom\-/i,''), (block, type) => {
        if(!playEmojiCustom) return;
        const content = block.firstElementChild;
        if(!content) return;
        const customEmoji = content.querySelector('img[alt="'+playEmojiCustom+'"]');
        const clickEvent = (event) => {
            event.stopPropagation();
            event.preventDefault();
            const file = block.getAttribute('custom-' + audioFileAttrName.replace(/^custom\-/i,''));
            let startTime = block.getAttribute('custom-' + startTimeAttrName.replace(/^custom\-/i,''));
            let endTime = block.getAttribute('custom-' + endTimeAttrName.replace(/^custom\-/i,''));
            if(!file || !startTime || !endTime) return;
            startTime = convertSrtTimeToSeconds(startTime);
            endTime = convertSrtTimeToSeconds(endTime);
            if(startTime > endTime) {
                showErrorMessage('播放失败，开始时间不能大于结束时间');
            }
            playAudio(file, startTime, endTime);
        };
        customEmoji?.removeEventListener('click', clickEvent);
        customEmoji?.addEventListener('click', clickEvent);
    });

    // 添加样式
    addStyle(`
        [custom-${audioFileAttrName.replace(/^custom\-/i,'')}] img.emoji[alt="${playEmojiCustom}"]:first-child {cursor: pointer;}
        [custom-${audioFileAttrName.replace(/^custom\-/i,'')}] img.emoji[alt="${playEmojiCustom}"]:first-child:hover {opacity: 0.8;}
        [data-type="NodeHeading"] img.emoji[alt="${playEmojiCustomHead}"]:first-child {cursor: pointer;}
        [data-type="NodeHeading"] img.emoji[alt="${playEmojiCustomHead}"]:first-child:hover {opacity: 0.8;}
    `);

    // 标题播放按钮被加载或添加时被回调
    function onHeadPlayEmojiAddition(head, type) {
        if(!playEmojiCustomHead) return;
        const playBtnHead = head.querySelector(`img.emoji[alt="${playEmojiCustomHead}"]`);
        const clickEvent = async (event) => {
            event.stopPropagation();
            event.preventDefault();
            const headBlockId = head?.dataset?.nodeId;
            if(!headBlockId) return;
            const result = await fetchSyncPost('/api/block/getChildBlocks', {id: headBlockId});
            if(!result || result.code !== 0 || !result.data || result.data.length === 0) return;
            let file = '';
            const starts = [];
            const ends = [];
            result.data.forEach(item => {
                const el = document.querySelector('[data-node-id="'+item.id+'"]');
                if(!el) return;
                if(el.matches && el.matches('[custom-'+audioFileAttrName.replace(/^custom\-/i,'')+']')) {
                    if(!file) file = el.getAttribute('custom-'+audioFileAttrName.replace(/^custom\-/i,''));
                    const start = el.getAttribute('custom-'+startTimeAttrName.replace(/^custom\-/i,''));
                    const end = el.getAttribute('custom-'+endTimeAttrName.replace(/^custom\-/i,''));
                    starts.push(convertSrtTimeToSeconds(start));
                    ends.push(convertSrtTimeToSeconds(end));
                } else {
                    const els = el.querySelectorAll('[custom-'+audioFileAttrName.replace(/^custom\-/i,'')+']');
                    if(els.length > 0) {
                        els.forEach(el => {
                            if(!file) file = el.getAttribute('custom-'+audioFileAttrName.replace(/^custom\-/i,''));
                            const start = el.getAttribute('custom-'+startTimeAttrName.replace(/^custom\-/i,''));
                            const end = el.getAttribute('custom-'+endTimeAttrName.replace(/^custom\-/i,''));
                            starts.push(convertSrtTimeToSeconds(start));
                            ends.push(convertSrtTimeToSeconds(end));
                        });
                    }
                }
            });
            const minStart = Math.min(...starts);
            const maxEnd = Math.max(...ends);
            if(minStart > maxEnd) return;
            playAudio(file, minStart, maxEnd);
        };
        playBtnHead?.removeEventListener('click', clickEvent);
        playBtnHead?.addEventListener('click', clickEvent);
    }

    var audio, timeUpdateHandler, currentEndTime = 0;
    function playAudio(file, startTime, endTime) {
        startTime = parseFloat(startTime || 0);
        endTime = parseFloat(endTime || 0);
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
        // 监听音频准备完毕
        const canplayhandler = () => {
            audio.play();
            audio.removeEventListener('canplay', canplayhandler);
        };
        audio.removeEventListener('canplay', canplayhandler);
        audio.addEventListener('canplay', canplayhandler);
        // 监听时间更新事件，检查是否到达结束时间
        audio.addEventListener('timeupdate', timeUpdateHandler);
    }
    // 将SRT时间格式（例如 "00:00:10,500"）转换为秒数
    function convertSrtTimeToSeconds(timeStr) {
        if(/^[\d.]+$/.test(timeStr)) return parseFloat(timeStr || 0);
        const [time, millis] = timeStr.split(',');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds + millis / 1000;
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
    // 请求api
    // returnType json返回json格式，text返回文本格式
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = {
            method: "POST",
        };
        if (data) {
            if (data instanceof FormData) {
                init.body = data;
            } else {
                init.body = JSON.stringify(data);
            }
        }
        try {
            const res = await fetch(url, init);
            const res2 = returnType === 'json' ? await res.json() : await res.text();
            return res2;
        } catch(e) {
            console.log(e);
            return returnType === 'json' ? {code:e.code||1, msg: e.message||"", data: null} : "";
        }
    }
    // 监听音频元素被添加
    function observeAudioElements(attrName, callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        // 标题，加载时查找自定义播放Emoji
                        if(playEmojiCustomHead && node.nodeType === Node.ELEMENT_NODE && node.matches && node.matches('div[data-type="NodeHeading"]') && node.querySelector('img.emoji[alt="'+playEmojiCustomHead+'"]')) {
                            onHeadPlayEmojiAddition(node, 'load');
                        }
                        // 标题，添加自定义Emoji时触发
                        if(playEmojiCustomHead && node.nodeType === Node.ELEMENT_NODE && node.matches && node.matches('img.emoji[alt="'+playEmojiCustomHead+'"]')){
                            const head = node.closest('div[data-type="NodeHeading"]');
                            if(!head) return;
                            onHeadPlayEmojiAddition(head, 'add');
                        }
                        // 块，添加自定义Emoji时触发
                        if(node.nodeType === Node.ELEMENT_NODE && node.matches && node.matches('img.emoji[alt="'+playEmojiCustom+'"]')){
                            const block = node.closest('div[custom-'+audioFileAttrName.replace(/^custom\-/i,'')+']');
                            if(!block) return;
                            callback(block, 'add');
                        }
                        // 块，加载时触发
                        if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute(attrName) !== null) {
                            // 块标签调用回调函数
                            callback(node, 'load');
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