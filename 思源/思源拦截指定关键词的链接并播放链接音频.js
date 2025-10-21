// 拦截指定关键词的链接并播放链接音频
// see https://ld246.com/article/1732632964559
// version 0.0.3
// 更新记录
// 0.0.3 兼容3.3.4+；自动发音支持有道词典
// 0.0.2 增加缓存，已获取过的音频链接直接使用缓存链接
// 使用说明
// 一、手动插入链接
// 编辑器输入 /链接 或 /lianjie 在链接中输入你的链接即可，比如https://res.iciba.com/xxxx.mp3，当你的链接中含有audioLinkKeywords参数指定的关键词时，则自动拦截链接的点击并播放音频
// 当锚文本链接输入*号时，则会使用图片作为播放音频的按钮，图片可以在defaultImage相关参数中配置或使用默认配置即可
// 当链接地址中输入auto:开头的链接时，将自动获取音频，默认从iciba.com网站获取音频，可在getAudioSrcByNet函数中修改获取逻辑
// 自动获取连接规则，比如，auto:hello:en，这里auto:是关键词，这里auto也可以是icb/iciba/yd/youdao分别代表爱词霸/爱词霸/有道/有道，hello是要查询的关键词，en是代表英音，am代表美音，默认是am，比如auto:hello
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

    // 监听指定的链接被添加
    audioLinkKeywords.unshift('auto:');
    audioLinkKeywords.unshift('icb:');
    audioLinkKeywords.unshift('iciba:');
    audioLinkKeywords.unshift('yd:');
    audioLinkKeywords.unshift('youdao:');
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
            const params = getQueryParams(linkHref);
            if(/^(auto|iciba|icb|yd|youdao):/i.test(linkHref)) {
                const soundFrom = linkHref?.split(':')?.[0] || '';
                const keywords = linkHref.replace(/(auto|iciba|icb|yd|youdao):/i, '').trim().split('?')[0].split(':');
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
})();