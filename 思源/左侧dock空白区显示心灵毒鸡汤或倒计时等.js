// 左侧dock空白区显示心灵毒鸡汤/倒计时/顶部显示天气等
// version 0.0.5
// 功能介绍：
// 1. 左侧dock空白区域显示心灵毒鸡汤，可自定义自己的毒鸡汤及设定出现概率
// 2. 双击显示下一个
// 3. 右键复制到剪切板
// 4. 可显示为跑马灯效果
// 5. 可显示倒计时，可选择显示在左侧或右侧，倒计时的优先级高于心灵毒鸡汤和哲理名言
// 6. 可在右侧dock空白区域显示哲理名言
// 7. 增加顶部显示今日天气
(()=>{
    // 设置多久显示一次，单位秒，默认5分钟
    const delay = 300;

    // 是否显示为跑马灯效果，true显示为跑马灯效果
    const marquee = false;

    // 鼠标悬停时是否显示提示
    const showTitle = true;

    // 显示倒计时，显示倒计时时将不再显示心灵毒鸡汤
    const showCountdown = false;

    // 倒计时到期日期
    const countdownExpireDate = '2025-01-01';

    // 倒计时模板
    const countdownTemplate = '距离2025新年还剩 {day} 天';

    // 倒计时显示位置，left显示在左侧，right显示在右侧
    const countdownPosition = 'right';

    // 右侧dock空白区域显示信息，不显示保持为空间即可
    const dockRightWords = [
        '人生最大的敌人是自己',
        '人生是一场修行，修的是心',
        '人生没有如果，只有结果和后果',
        '人生没有彩排，每一天都是现场直播',
        '种一棵树最好的时间是十年前，其次是现在',
    ];

    // 自定义心灵毒鸡汤
    const customWords = [
        "喜欢就去表白，不然你不会知道自己长得多丑。",
        "所有抱怨社会不公和制度的人翻译过来只有一句话：请给我金钱，女人和社会地位。",
        "虽然我学得慢，但是我放弃的快啊！",
        "死并不可怕，怕的是再也不能活了。",
        "谁说我不会乐器？我退堂鼓打的可好了。",
        "世界这么大，我想去看看，什么地方要饭比较方便！",
        "世界上本没有鸡汤，鸡死了，便做成了鸡汤。",
        "诗和远方越远越脏 以梦为马越骑越傻！",
        "生活不止眼前的苟且，还有读不懂的诗和到不了的远方。",
        "上帝为你关上一道防盗门，还会顺手给你上了一把钛合金锁。",
        "如果所有人都理解你，那你得普通成什么样！",
        "如果十年之后你未娶，我未嫁，那真是太惨了！",
        "人生不如意，十之有十！",
        "人人都想拯救世界，却没人帮妈妈洗碗。",
        "其实只要不要脸，很多人生难题都能迎刃而解。",
    ];

    // 自定义心灵毒鸡汤出现概率, 0.01是%1, 0.001是1‰，……，依次类推
    const customWordsRate = 0.01;

    // 是否显示今日天气
    // 天气参数可在showTodayWeather()函数中修改，参数详情可参考 https://github.com/chubin/wttr.in
    const showWeather = true;
  
    // 左侧dock空白区文本样式
    addStyle(`
        #dockLeft .fn__flex-1.dock__item--space, #dockRight .fn__flex-1.dock__item--space {
        	display: flex;
        	justify-content: center; /* 水平居中 */
        	align-items: center; /* 垂直居中 */
        	font-size: clamp(12px, 3vh, 18px); /* 字体大小 */
        	writing-mode: vertical-rl; /* 竖向排列 */
        	text-align: center; /* 文字居中对齐 */
            line-height: 120%;
            overflow: hidden;
        }
        #dockLeft .fn__flex-1.dock__item--space marquee {
            display: flex;
            align-items: center;
            white-space: nowrap;
            font-size: 18px;
            height: 100vh;
        }
    `);

    // 手机版退出
    if(isMobile()) return;

    // 监听事件
    let dockSpace = getDockSpace();
    if(dockSpace){
        // 添加双击事件，双击显示下一个
        listenDockSpaceDblclick();
        // 右键事件，右键复制到剪切板
        listenDockSpaceContextmenu();
    } else {
        setTimeout(() => {
            dockSpace = getDockSpace();
            listenDockSpaceDblclick();
            listenDockSpaceContextmenu();
        }, 1500);
    }

    // 定时显示心灵毒鸡汤
    setInterval(async () => {
        yiyan((text) => {
            setDockSpace(text);
        });
    }, delay * 1000 || 300000);

    // 加载时显示一次
    yiyan((text) => {
        setDockSpace(text);
    });

    // 右侧dock空白区域显示文字
    showDockRightWords(dockRightWords);

    // 显示今日天气
    showTodayWeather();

    // 显示今日天气
    function showTodayWeather() {
        if(!showWeather) return;
        whenElementExist('#toolbar .fn__ellipsis').then(async (ellipsis) => {
            // 获取天气api
            const weatherApi = await fetch('https://wttr.in/?format=1');
            const text = await weatherApi.text();
            if(!text) return;
            // 插入顶部导航
            const weather = document.createElement('div');
            weather.className = 'today-weather';
            weather.style.position = 'relative';
            const style = `position:absolute;left:20px;width:max-content;color:var(--b3-toolbar-color);`;
            weather.innerHTML=`<div style="${style}">${text.trim().replace(/\s+/g, ' ')}</div>`;
            ellipsis.before(weather);
            //获取json数据
            const w = await fetch('https://wttr.in/?format=j1');
            const json = await w.json();
            const title = `${json.current_condition[0]?.lang_zh[0]?.value||''} ${json.current_condition[0]?.temp_C}°C`;
            weather.firstElementChild.setAttribute('aria-label', title);
            // 插入文字描述
            let weatherText = weather.firstElementChild.textContent;
            const weatherTextArr = weatherText.split(' ');
            weatherTextArr[0] = weatherTextArr[0] + json.current_condition[0]?.lang_zh[0]?.value||'';
            weatherText = weatherTextArr.join(' ');
            weather.firstElementChild.textContent = weatherText;
        }); 
    }

    // 获取倒计时文字
    function getCountdownWords() {
        // 定义目标日期，比如（2025年1月1日）
        const targetDate = new Date(countdownExpireDate + 'T00:00:00');
        // 获取当前日期
        const currentDate = new Date();
        // 计算时间差（以毫秒为单位）
        const timeDifference = targetDate - currentDate;
        // 将毫秒转换为天数
        const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        // 输出结果
        const countdownWords = countdownTemplate.replace(/\{day\}/ig, daysRemaining);
        return countdownWords;
    }

    //心灵毒鸡汤
    async function yiyan(callback) {
        let response = '';
        if(showCountdown && countdownPosition === 'left') {
            response = getCountdownWords();
            callback(response);
        } else {
            const randomValue = Math.random();
            // 判断是否满足 customWordsRate 的概率
            if (customWords && customWords.length > 0 && customWordsRate > 0 && randomValue <= customWordsRate) {
                // 从自定义中获取
                const randomIndex = Math.floor(Math.random() * customWords.length);
                response = customWords[randomIndex];
            } else {
                // 从网络获取
                response = await fetch("https://api.zxki.cn/api/djt");
                response = await response.text();
                response = extractTextFromHtml(response);
                response = cleanText(response);
            }
            callback(response);
        }
    }

    // 右侧dock空白区域显示文字
    function showDockRightWords(dockRightWords) {
        const selector = '#dockRight .fn__flex-1.dock__item--space';
        let dockRightSpace = document.querySelector(selector), dockRightSpaceWords = '';
        if(showCountdown && countdownPosition === 'right') {
            dockRightSpaceWords = getCountdownWords();
        } else {
            if(!dockRightWords || dockRightWords.length === 0) return;
            const randomIndex = Math.floor(Math.random() * dockRightWords.length);
            dockRightSpaceWords = dockRightWords[randomIndex];
        }
        if(dockRightSpace){
            dockRightSpace.innerHTML = dockRightSpaceWords;
        } else {
            setTimeout(() => {
                dockRightSpace = document.querySelector(selector);
                if(dockRightSpace) dockRightSpace.innerHTML = dockRightSpaceWords;
            }, 1500);
        }
    }

    // 清除空白符换行等
    function cleanText(str) {
        // 去除所有换行符
        let noNewlines = str.replace(/[\r\n]+/g, '');
        // 替换多个连续的空白字符为单个空格，并去除开头和结尾的空白
        return noNewlines.replace(/\s+/g, ' ').trim();
    }

    // 解析出文本字符
    function extractTextFromHtml(htmlString) {
        // 创建一个新的DOMParser实例
        const parser = new DOMParser();
        // 使用DOMParser将HTML字符串解析为一个文档对象
        const doc = parser.parseFromString(htmlString, 'text/html');
        // 获取所有 <script> 标签并移除它们
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        // 返回文档中的纯文本内容，去除多余的空白字符
        return doc.body.textContent || doc.body.innerText || '';
    }

    // 获取左侧dock空白区域对象
    function getDockSpace() {
        return document.querySelector('#dockLeft .fn__flex-1.dock__item--space');
    }
  
    // 设置左侧dock空白文字
    function setDockSpace(html) {
        dockSpace = dockSpace || getDockSpace();
        if(dockSpace) {
            const text = html;
            if(marquee) {
                html = '<marquee direction="up">'+html+'</marquee>';
            }
            dockSpace.innerHTML = html;
            dockSpace.title = text;
        }
    }

    // 监听左侧dock空白区域双击事件
    function listenDockSpaceDblclick() {
        dockSpace = dockSpace || getDockSpace();
        dockSpace.addEventListener('dblclick', () => {
            yiyan((text) => {
                setDockSpace(text);
            });
        });
    }

    // 监听左侧dock空白区域右键事件
    function listenDockSpaceContextmenu() {
        dockSpace = dockSpace || getDockSpace();
        dockSpace.addEventListener('contextmenu', () => {
            const successful = copyTextToClipboard(dockSpace.textContent);
            if(successful) {
                showMessage('已复制到剪切板', false, 3000);
            } else {
                showMessage('复制失败', true, 3000);
            }
        });
    }

    // 复制文本到剪切板
    function copyTextToClipboard(text) {
        // 创建一个隐藏的textarea元素
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        // 隐藏此输入框
        textarea.style.position = 'fixed'; // 移出正常文档流
        textarea.style.left = '-9999px';  // 移动到屏幕外
        textarea.style.top = 0; // 确保不占用可见区域
        // 选中并复制文本
        textarea.select();
        textarea.setSelectionRange(0, 99999); // 对于移动设备
        let successful = false;
        try {
            successful = document.execCommand('copy');
        } catch (err) {
            console.error('无法复制文本: ', err);
        }
        // 移除输入框
        document.body.removeChild(textarea);
        return successful;
    }
  
    // 添加样式
    function addStyle(css) {
        // 创建一个 <style> 元素
        const styleElement = document.createElement('style');
        // 设置样式内容
        styleElement.type = 'text/css';
        styleElement.appendChild(document.createTextNode(css));
        // 将 <style> 元素添加到 <head> 中
        document.head.appendChild(styleElement);
    }

    // 判断是否手机版
    function isMobile() {
        return !!document.getElementById("sidebar");
    }

    // 发送消息
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    // 等待元素出现
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():document.querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();