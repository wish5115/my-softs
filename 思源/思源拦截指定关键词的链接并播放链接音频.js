// 拦截指定关键词的链接并播放链接音频
// see https://ld246.com/article/1734238897997
// 关联 https://ld246.com/article/1732632964559
// version 0.0.3.1
// 更新记录
// 0.0.3.1 可以通过glb:word插入全球发音
// 0.0.3 兼容3.3.4+；自动发音支持有道词典和剑桥词典
// 0.0.2 增加缓存，已获取过的音频链接直接使用缓存链接
// 使用说明
// 一、手动插入链接
// 编辑器输入 /链接 或 /lianjie 在链接中输入你的链接即可，比如https://res.iciba.com/xxxx.mp3，当你的链接中含有audioLinkKeywords参数指定的关键词时，则自动拦截链接的点击并播放音频
// 当锚文本链接输入*号时，则会使用图片作为播放音频的按钮，图片可以在defaultImage相关参数中配置或使用默认配置即可
// 当链接地址中输入auto:开头的链接时，将自动获取音频，默认从iciba.com网站获取音频，可在getAudioSrcByNet函数中修改获取逻辑
// 自动获取连接规则，比如，auto:hello:en，这里auto:是关键词，这里auto也可以是icb/iciba/yd/youdao/cb/glb/global分别代表爱词霸/爱词霸/有道/有道/剑桥/全球发音/全球发音，hello是要查询的关键词，en是代表英音，am代表美音，默认是am，比如auto:hello，全球发音可省略
// 二，批量插入链接
// 批量插入指在其他编辑中格式化好后，批量插入。
// 批量插入的格式举例如下：
// hello [*](auto:hello)
// good [*](auto:good:en)
// a /ə/ [▶️](https://res.iciba.com/resource/amp3/oxford/0/22/97/2297067c3e5d25a542d1c1268d474d95.mp3)
// 格式说明：
// [*]和[▶️] 是链接描述文字，* 代表图片作为播放音频的按钮，▶️是自定义的emoji表情，也可以用普通文本
// (auto:good:en) 代表自动获取音频，auto:是开启自动获取的关键词，good是带查询的英语单词，en代表英音，am代表美音，美音也可以省略不写
// (https://res.iciba.com/xxxx.mp3) 代表是你自定义的音频链接
// 链接中加start和end参数可以控制音频播放的开始和结束时间点，支持纯数字秒数和srt时间格式
// 比如，(https://res.iciba.com/xxxx.mp3?start=10&end=20) 和 (auto:hello?start=0&end=20)
(()=>{
    // 指定哪些链接关键词自动拦截并播放音频
    const audioLinkKeywords = [
        'res.iciba.com',
        'tts.iciba.com',
        'res-tts.iciba.com',
        'staticedu-wps.cache.iciba.com',
        'dict.youdao.com/dictvoice',
    ];

    // 默认播放按钮Emoji
    const defaultEmoji = '▶️';

    // 默认播放按钮图片
    const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjcxNDMgMTguMTc4Nkg4QzcuNDQ3NzIgMTguMTc4NiA3IDE3LjcxMDkgNyAxNy4xMzRWMTAuODY2QzcgMTAuMjg5MSA3LjQ0NzcyIDkuODIxMzYgOCA5LjgyMTM2SDEwLjcxNDNMMTQuMzE3NyA3LjI4MzAyQzE0Ljk1NjkgNi42NTk3OCAxNiA3LjEzMzMgMTYgOC4wNDY3M1YxOS45NTMzQzE2IDIwLjg2NjcgMTQuOTU2OSAyMS4zNDAyIDE0LjMxNzcgMjAuNzE3TDEwLjcxNDMgMTguMTc4NloiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHBhdGggZD0iTTE5IDE4QzE5LjYzNDEgMTcuNDc0NyAyMC4xMzcxIDE2Ljg1MTEgMjAuNDgwMiAxNi4xNjQ4QzIwLjgyMzQgMTUuNDc4NSAyMSAxNC43NDI5IDIxIDE0QzIxIDEzLjI1NzEgMjAuODIzNCAxMi41MjE1IDIwLjQ4MDIgMTEuODM1MkMyMC4xMzcxIDExLjE0ODkgMTkuNjM0MSAxMC41MjUzIDE5IDEwIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==';
    const defaultImageWidth = '20px';
    const defaultImageHeight = '20px';
    const defaultImageZoom = '150% 150%';
    const defaultImageTop = '3.3px';

    // 全球发音默认图片
    const globalImage = 'data:image/svg+xml;base64,PHN2ZyB0PScxNzYwNzEzNDQ2MTM0JyBjbGFzcz0nZ2xvYmFsLWljb24nIHZpZXdCb3g9JzAgMCAxMDI0IDEwMjQnIHZlcnNpb249JzEuMScgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyBwLWlkPScxNzAwOCcgd2lkdGg9JzI4JyBoZWlnaHQ9JzI4Jz48cGF0aCBzdHJva2Utd2lkdGg9JzEuNScgZD0nTTUxMiA4NS4zMzMzMzNjMjM0LjY2NjY2NyAwIDQyNi42NjY2NjcgMTkyIDQyNi42NjY2NjcgNDI2LjY2NjY2N3MtMTkyIDQyNi42NjY2NjctNDI2LjY2NjY2NyA0MjYuNjY2NjY3Uzg1LjMzMzMzMyA3NDYuNjY2NjY3IDg1LjMzMzMzMyA1MTIgMjc3LjMzMzMzMyA4NS4zMzMzMzMgNTEyIDg1LjMzMzMzM3ogbTEzNi41MzMzMzMgODkuNnY2NGMtMC4zNDEzMzMgMzAuMTIyNjY3LTEuMzY1MzMzIDU3LjM0NC00LjI2NjY2NiA3Ni44LTguMTkyIDUzLjE2MjY2Ny01NS41NTIgOTQuNTQ5MzMzLTEwOC4yODggOTQuMTY1MzM0TDUyMC41MzMzMzMgNDA5LjZsLTU5LjczMzMzMy04LjUzMzMzM2gtNC4yNjY2NjdjLTE1LjM2IDAtMjcuMjY0IDEwLjM2OC0zMi41OTczMzMgMjQuODc0NjY2TDQyMi40IDQzMC45MzMzMzN2MTA2LjY2NjY2N2MwIDQ0LjMzMDY2Ny0yNi42MjQgODQuODY0LTY1LjUzNiAxMDAuMDEwNjY3TDM0OS44NjY2NjcgNjQwbC04LjUzMzMzNCA0LjI2NjY2Ny0xNTMuNiAzOC40YzU5LjczMzMzMyAxMTUuMiAxODMuNDY2NjY3IDE5MiAzMjAgMTkyIDE3LjA2NjY2NyAwIDM0LjEzMzMzMyAwIDUxLjItMi4xNzZsMTIuOC0yLjA5MDY2Ny00LjI2NjY2Ni00LjI2NjY2Ny0yNS42LTIxLjMzMzMzM2MtMzguNC0yOS44NjY2NjctNDYuOTMzMzMzLTg5LjYtMTcuMDY2NjY3LTEyOGw4LjI3NzMzMy04LjA2NGM2LjA1ODY2Ny01LjY3NDY2NyAxMy4wOTg2NjctMTEuNTIgMjAuMzk0NjY3LTE1LjIzMmw1LjQ2MTMzMy0yLjMwNCA4LjUzMzMzNC00LjI2NjY2NyA0Mi42NjY2NjYtMTcuMDY2NjY2YzEyLjgtNC4yNjY2NjcgMjEuMzMzMzMzLTE3LjA2NjY2NyAyMS4zMzMzMzQtMzQuMTMzMzM0LTQuMjY2NjY3LTY0IDEyLjgtMTEwLjkzMzMzMyA1NS40NjY2NjYtMTI4IDU5LjczMzMzMy0yNS42IDExNS4yLTguNTMzMzMzIDE4My40NjY2NjcgNTUuNDY2NjY3IDQuMjY2NjY3LTE3LjA2NjY2NyA0LjI2NjY2Ny0zNC4xMzMzMzMgNC4yNjY2NjctNTEuMiAwLTE1My42LTkzLjg2NjY2Ny0yODEuNi0yMjYuMTMzMzM0LTMzNy4wNjY2Njd6IG02NCA0MDEuMDY2NjY3Yy04LjUzMzMzMyA0LjI2NjY2Ny0xMi44IDE3LjA2NjY2Ny04LjUzMzMzMyA1NS40NjY2NjcgNC4yNjY2NjcgNDYuOTMzMzMzLTIxLjMzMzMzMyA4NS4zMzMzMzMtNjQgMTA2LjY2NjY2NmwtOC41MzMzMzMgNC4yNjY2NjctMTQuNDY0IDQuOTA2NjY3LTE3LjIzNzMzNCA2LjM1NzMzMy04LjUzMzMzMyAzLjU0MTMzM2MtNi4xNDQgMi43MzA2NjctOS44MTMzMzMgNC45MDY2NjctMTAuOTY1MzMzIDYuNTI4LTQuMjY2NjY3IDguNTMzMzMzLTQuMjY2NjY3IDE3LjA2NjY2NyA0LjI2NjY2NiAyNS42bDUxLjIgNDIuNjY2NjY3IDE1LjY1ODY2NyAxNS40NDUzMzMgNS42NzQ2NjctMi42NDUzMzNjODMuMTU3MzMzLTM3LjQxODY2NyAxNTQuMTU0NjY3LTEwNy4yMjEzMzMgMTg5LjMxMi0xOTMuNzA2NjY3bDEuNTc4NjY2LTMuMTE0NjY2YTE1Ljc0NCAxNS43NDQgMCAwIDAgMC44MTA2NjctMS43OTIgMTguMjYxMzMzIDE4LjI2MTMzMyAwIDAgMC01LjI0OC03LjUwOTMzNGwtMi45ODY2NjctMi45NDRjLTU5LjczMzMzMy01OS43MzMzMzMtOTMuODY2NjY3LTcyLjUzMzMzMy0xMjgtNTkuNzMzMzMzek01MTIgMTQ1LjA2NjY2N2MtMjAwLjUzMzMzMyAwLTM2Mi42NjY2NjcgMTYyLjEzMzMzMy0zNjIuNjY2NjY3IDM2Mi42NjY2NjYgMCAyOC40NTg2NjcgMi45ODY2NjcgNTYuODc0NjY3IDguODc0NjY3IDg1LjMzMzMzNGwzLjkyNTMzMyAxNy4wNjY2NjYgMTU3Ljg2NjY2Ny0zOC40YzExLjM5Mi0zLjc5NzMzMyAyMi43NDEzMzMtMTQuMzM2IDI1LjE3MzMzMy0yNS42bDAuNDI2NjY3LTQuMjY2NjY2di0xMDYuNjY2NjY3YTEwNS41MTQ2NjcgMTA1LjUxNDY2NyAwIDAgMSA5OS41NDEzMzMtMTA2LjQ1MzMzM0w0NTIuMjY2NjY3IDMyOC41MzMzMzNoMTcuMDY2NjY2bDU5LjczMzMzNCA4LjUzMzMzNGE0MS4yNTg2NjcgNDEuMjU4NjY3IDAgMCAwIDM2Ljk0OTMzMy0yNS4zNDRMNTY3LjQ2NjY2NyAzMDIuOTMzMzMzbDQuMjY2NjY2LTk4LjEzMzMzM1YxNTMuNmMtMTcuMDY2NjY3LTQuMjY2NjY3LTQwLjUzMzMzMy04LjUzMzMzMy01OS43MzMzMzMtOC41MzMzMzN6JyBwLWlkPScxNzAwOSc+PC9wYXRoPjwvc3ZnPg==';

    // 代码生效标记，用于与其他代码协作
    window.enableLinkAudioJs = true;

    // 监听指定的链接被添加
    audioLinkKeywords.unshift('auto:');
    audioLinkKeywords.unshift('icb:');
    audioLinkKeywords.unshift('iciba:');
    audioLinkKeywords.unshift('yd:');
    audioLinkKeywords.unshift('youdao:');
    audioLinkKeywords.unshift('cb:');
    audioLinkKeywords.unshift('glb:');
    audioLinkKeywords.unshift('global:');
    const selectors = audioLinkKeywords.map(audioLinkKeyword=>audioLinkKeyword?'span[data-type~="a"][data-href*="'+audioLinkKeyword.trim()+'"]:not([data-replaced])':'').filter(i=>i).join(',');
    if(selectors) observeLinkBlock(selectors, async (link) => {
        // 初始化
        const linkText = link.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        if(linkText === '*' || linkText === '') {
            link.dataset.img = true;
            if(!linkText) link.textContent = '*';
        } else {
            link.dataset.img = false;
        }
        if(link.dataset.replaced === "true") return;
        link.dataset.replaced = true;
        // 点击事件
        link.addEventListener('click', async (event) => {
            event.stopPropagation();
            let linkHref = link.dataset?.href?.replace('&amp;', '&');
            if(/^(glb|global):/i.test(linkHref)){
                const keywords = linkHref.replace(/(glb|global):/i, '').trim().split('?')[0].split(':');
                const word = keywords[0];
                if(!word) return;
                if(globalVoicesPopup && globalVoicesPopup?.style?.display === 'block') {
                  globalVoicesPopup.style.display = 'none';
                  return;
                }
                showGlobalVoicesPopup(link, word);
                return;
            }
            const params = getQueryParams(linkHref);
            if(/^(auto|iciba|icb|yd|youdao|cb):/i.test(linkHref)) {
                const soundFrom = linkHref?.split(':')?.[0] || '';
                const keywords = linkHref.replace(/(auto|iciba|icb|yd|youdao|cb):/i, '').trim().split('?')[0].split(':');
                const word = keywords[0];
                if(!word) return;
                const soundType = keywords[1] || '';
                linkHref = await getAudioSrcByNet(word, soundType, soundFrom);
                if(!linkHref) return;
            }
            playAudio(linkHref, formatTimeToSeconds(params.start) || 0, formatTimeToSeconds(params.end) || 0);
        });
        // 去掉提示框
        link.addEventListener('mouseover', (event) => {
            link.classList.add('play-link-hover');
        });
        link.addEventListener('mouseout', (event) => {
            link.classList.remove('play-link-hover');
        });
        // 右键菜单
        // link.addEventListener('contextmenu', (event) => {
        //     const selector = '#commonMenu .b3-menu__item--custom .fn__flex-center:not([data-action="copy"])';
        //     whenElementExist(selector).then(() => {
        //         const customItems = document.querySelectorAll(selector);
        //         const title = customItems[customItems.length -1];
        //         title.textContent = '图片';
        //     });
        // });
    });

    // 添加样式
    const cssSelectors = audioLinkKeywords.map(audioLinkKeyword=>audioLinkKeyword?'[data-href*="'+audioLinkKeyword.trim()+'"]':'').filter(i=>i).join(',');
    addStyle(`
        .protyle-wysiwyg [data-node-id] span[data-type~=a]:is(${cssSelectors}):hover {opacity: 0.8;border-bottom:none;}
        .protyle-wysiwyg [data-node-id] span[data-type~=a][data-img="true"] {
            background-image: url('${defaultImage}');
            background-repeat: no-repeat;
            background-position: center;
            background-size: ${defaultImageZoom};
            width: ${defaultImageWidth};
            height: ${defaultImageHeight};
            display: inline-block;
            color: transparent;
            position: relative;
            top: ${defaultImageTop};
        }
        .protyle-wysiwyg [data-node-id] span[data-type~=a][data-img="true"][data-href^="glb"],
        .protyle-wysiwyg [data-node-id] span[data-type~=a][data-img="true"][data-href^="global"]{
            background-image: url('${globalImage}');
            background-size: 96%;
        }
        [data-theme-mode="dark"] .protyle-wysiwyg [data-node-id] span[data-type~=a][data-img="true"]{
            filter: invert(100%);
        }
        body:has(span.play-link-hover) #tooltip{
            display: none!important;
        }
    `);

    // 通过iciba.com查询音频URL
    let soundCaches = {};
    async function getAudioSrcByNet(word, soundType, soundFrom) {
        if(soundFrom==='yd'||soundFrom==='youdao') {
            // type=1表示英式发音，type=2表示美式发音
            soundType = soundType === 'en' ? '1' : '2';
            return `http://dict.youdao.com/dictvoice?type=${soundType}&audio=${word}`;
        }
        if(soundFrom==='cb') {
            soundType = soundType === 'en' ? 'uk' : 'us';
            return getAudioUrlFromCamBridge(word, soundType);
        }
        if(soundCaches[word+'-'+soundType]) return soundCaches[word+'-'+soundType];
        try {
            let html = await fetch("https://www.iciba.com/word?w=" + word, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                }
            });
            html = await html.text();
            // 使用正则表达式匹配 <script> 标签内的内容，包括换行符等所有字符
            const match = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">\s*([\s\S]*?)\s*<\/script>/);
            let json = {};
            if (match && match[1]) {
                // 去除可能存在的首尾空白字符（包括换行符）
                json = JSON.parse(match[1].trim() || '{}');
            }
            soundType = soundType === 'en' ? 'ph_en_mp3' : 'ph_tts_mp3';
            backupAudio = soundType === 'en' ? 'ph_en_mp3_bk' : 'ph_tts_mp3_bk';
            let audioSrc = json?.props?.pageProps?.initialReduxState?.word?.wordInfo?.baesInfo?.symbols[0][soundType];
            if(!audioSrc){
                audioSrc = json?.props?.pageProps?.initialReduxState?.word?.wordInfo?.baesInfo?.symbols[0][backupAudio];
            }
            soundCaches[word+'-'+soundType] = audioSrc;
            return audioSrc;
        } catch(e) {
            console.log(e);
            return '';
        }
    }

    // 将SRT时间格式（例如 "00:00:10,500"）转换为秒数
    function formatTimeToSeconds(timeStr) {
        if(!timeStr) return 0;
        if(/^[\d.]+$/.test(timeStr)) return parseFloat(timeStr || 0);
        const [time, millis] = timeStr.split(',');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds + millis / 1000;
    }

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

    /**
     * 从剑桥词典获取指定单词的发音 URL
     * @param {string} word - 要查询的英文单词（支持多词，如 "take off"）
     * @param {string} region - 发音区域：'us'（美式）或 'uk'（英式）
     * @returns {Promise<string|''>} 返回完整的 MP3 音频 URL，若未找到则返回 ''
     */
    async function getAudioUrlFromCamBridge(word, region = 'us') {
      if (!word || (region !== 'us' && region !== 'uk')) {
        return '';
      }
    
      const baseUrl = 'https://dictionary.cambridge.org';
      const formattedWord = word.split(' ').join('-');
      const encodedWord = encodeURIComponent(formattedWord);
      const url = `${baseUrl}/dictionary/english-chinese-simplified/${encodedWord}`;
    
      try {
        const response = await fetch(url);
        if (!response.ok) return '';
    
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
    
        const block = doc.querySelector(region === 'us' ? '.us' : '.uk');
        if (!block) return '';
    
        const audioEl = block.querySelector('source[type="audio/mpeg"]');
        const relativePath = audioEl?.getAttribute('src');
        if (!relativePath) return '';
    
        return baseUrl + relativePath;
      } catch (err) {
        console.error('获取剑桥发音失败:', err);
        return '';
      }
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

    // 等待元素出现
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const check = () => {
                let el = document.querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
    
    // 监听Link被添加
    function observeLinkBlock(selector, callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                // 链接修改后触发
                if (mutation.type === 'attributes') {
                    if(mutation.target.matches(`.protyle-wysiwyg [data-node-id] span[data-type~=a]:is(${cssSelectors})`)) {
                        if(callback) callback(mutation.target);
                    }
                }
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches(selector)) {
                                // 调用回调函数
                                if(callback) callback(node);
                            } else {
                                const links = node.querySelectorAll(selector);
                                if (links.length && callback) {
                                    // 调用回调函数
                                    links.forEach(link => callback(link));
                                }
                            }
                        } else if(node.nodeType === Node.TEXT_NODE) {
                            // 实时修改链接时触发
                            if(mutation.target.matches(`.protyle-wysiwyg [data-node-id] span[data-type~=a]:is(${cssSelectors})`)) {
                                if(callback) callback(mutation.target);
                            }
                        }
                    }
                }
            }
        });
        // 配置观察选项:
        const config = { 
            childList: true, // 观察子节点的变化(添加/删除)
            subtree: true, // 观察所有后代节点
            attributes: true,
            attributeFilter: ['data-href']
        };
        // 选择需要观察变动的节点
        const targetNode = document.body; // 或者选择更具体的父节点以减少性能消耗
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回一个取消观察的方法
        return () => observer.disconnect();
    }

    ////////////////////// 全球发音支持 //////////////////////////
    let globalVoicesPopup = null;
    let globalVoicesStyleInjected = false;
    
    function initGlobalVoicesPopup() {
      if (globalVoicesPopup) return globalVoicesPopup;
    
      // 注入样式（只注入一次）
      if (!globalVoicesStyleInjected) {
        addStyle(`
          #globalVoicesPopup {
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: 300px;
            z-index: 2147483647;
            display: none;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          #globalVoicesPopup.glbs-dark {
            background: #1e1e1e;
            border-color: #444;
            color: #e0e0e0;
          }
          #globalVoicesPopup .voice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f8f9fa;
            border-bottom: 1px solid #eee;
            font-weight: bold;
          }
          #globalVoicesPopup.glbs-dark .voice-header {
            background: #2d2d2d;
            border-bottom-color: #444;
            color: #f0f0f0;
          }
          #globalVoicesPopup .close-voices-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #666;
            opacity: 0.7;
            transform: scale(1.18);
            margin-top: -3px;
            margin-right: -5px;
          }
          #globalVoicesPopup.glbs-dark .close-voices-btn {
            color: #aaa;
          }
          #globalVoicesPopup .close-voices-btn:hover {
            opacity: 1;
            color: #000;
          }
          #globalVoicesPopup.glbs-dark .close-voices-btn:hover {
            color: #fff;
          }
          #globalVoicesPopup .voice-content {
            max-height: 180px;
            overflow-y: auto;
          }
          #globalVoicesPopup .voice-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;
            transition: background-color 0.2s;
            color: #333;
          }
          #globalVoicesPopup .voice-item:hover {
            background-color: #f5f5f5;
          }
          #globalVoicesPopup.glbs-dark .voice-item {
            color: #e0e0e0;
          }
          #globalVoicesPopup.glbs-dark .voice-item:hover {
            background-color: #2d2d2d;
          }
          #globalVoicesPopup .voice-icon {
            margin-right: 8px;
            width: 20px;
            height: 20px;
            fill: #555;
          }
          #globalVoicesPopup.glbs-dark .voice-icon {
            fill: #cccccc;
          }
          #globalVoicesPopup .voice-info {
            display: flex;
            gap: 8px;
            font-size: 14px;
          }
        `);
        globalVoicesStyleInjected = true;
      }
    
      const popup = document.createElement('div');
      popup.id = 'globalVoicesPopup';
      document.body.appendChild(popup);
    
      // 点击外部关闭
      document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && !e.target.closest?.('[data-global-voices-trigger]')) {
          popup.style.display = 'none';
        }
      });
    
      globalVoicesPopup = popup;
      return popup;
    }
    
    // 获取发音（复用原逻辑）
    async function getGlobalVoices(keyword) {
      const url = `https://dict.eudic.net/dicts/en/${encodeURIComponent(keyword)}`;
      try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const gvDetails = doc.querySelector('.gv_details');
        if (!gvDetails) return [];
        const items = gvDetails.querySelectorAll('.gv_item');
        const result = [];
        for (const item of items) {
          const voice = item.querySelector('.gv-voice');
          const gender = item.querySelector('.gv_person');
          const country = item.querySelector('.gv_contury');
          if (voice && gender && country) {
            result.push({
              audio: voice.getAttribute('data-rel')?.trim() || '',
              gender: gender.textContent.trim(),
              country: country.textContent.trim()
            });
          }
        }
        return result;
      } catch (err) {
        console.error('获取全球发音失败:', err);
        return [];
      }
    }
    
    // 播放音频
    function playAudio(url) {
      const audio = new Audio(url);
      audio.play();
    }
    
    // 主函数：全局调用
    async function showGlobalVoicesPopup(triggerElement, keyword) {
      const popup = initGlobalVoicesPopup();
    
      // 设置主题
      if (window.siyuan?.config?.appearance?.mode === 1) {
        popup.classList.add('glbs-dark');
      } else {
        popup.classList.remove('glbs-dark');
      }
    
      // Loading
      popup.innerHTML = '<div style="padding:12px; text-align:center;">Loading...</div>';
      popup.style.display = 'block';
    
      // 定位：在 triggerElement 下方
      const rect = triggerElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      let top, left;
    
      if (spaceBelow >= 200) {
        top = rect.bottom + window.scrollY + 4;
      } else {
        top = rect.top + window.scrollY - 200 - 4; // 弹窗高约 200
      }
    
      left = rect.left + window.scrollX;
      if (left + 300 > window.innerWidth) left = window.innerWidth - 300;
      if (left < 0) left = 0;
    
      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
    
      // 获取数据
      let voices = await getGlobalVoices(keyword.toLowerCase());
    
      // 构建内容
      popup.innerHTML = '';
    
      // Header
      const header = document.createElement('div');
      header.className = 'voice-header';
      header.innerHTML = `<span>有 ${voices.length} 个发音</span><button class="close-voices-btn">×</button>`;
      popup.appendChild(header);
    
      // Content
      const content = document.createElement('div');
      content.className = 'voice-content';
      popup.appendChild(content);
    
      if (voices.length === 0) {
        const noItem = document.createElement('div');
        noItem.className = 'voice-item';
        noItem.textContent = '暂无全球发音';
        content.appendChild(noItem);
      } else {
        voices.forEach(voice => {
          const item = document.createElement('div');
          item.className = 'voice-item';
          item.innerHTML = `
            <svg class="voice-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
              <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
            </svg>
            <div class="voice-info">
              <span>${voice.gender}</span>
              <span>${voice.country}</span>
            </div>
          `;
          item.addEventListener('click', () => playAudio(voice.audio));
          content.appendChild(item);
        });
    
        // 更多
        const more = document.createElement('div');
        more.className = 'voice-item';
        more.innerHTML = '<div class="voice-info" style="margin-left:7px;">更多 >></div>';
        more.addEventListener('click', () => {
          window.open(`https://zh.forvo.com/search/${encodeURIComponent(keyword)}/en_usa/`);
        });
        content.appendChild(more);
      }
    
      // 关闭按钮
      header.querySelector('.close-voices-btn').addEventListener('click', () => {
        popup.style.display = 'none';
      });
    }
})();