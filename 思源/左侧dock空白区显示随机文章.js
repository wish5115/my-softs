// 左侧dock空白区显示随机文章
// see https://ld246.com/article/1734652659115
// 功能介绍：
// 1. 左侧dock空白区域显示随机文章
// 2. 单击打开文章
// 3. 双击显示下一个
// 4. 右键复制为引用到剪切板
// 5. 可显示为跑马灯效果
(()=>{
    // 设置多久切换一篇文章，单位秒，默认5分钟
    const delay = 300;

    // 是否显示为跑马灯效果，true显示为跑马灯效果
    const marquee = false;

    // 鼠标悬停时是否显示提示
    const showTitle = true;

    // sql查询语句
    const sql = `
        SELECT * FROM blocks
        WHERE type = 'd'
        -- 这里可以指定目录或子目录下的文章
        -- AND hpath like '%%'
        ORDER BY RANDOM()
        LIMIT 1;
    `;
    
    // 左侧dock空白区文本样式
    addStyle(`
        #dockLeft .fn__flex-1.dock__item--space {
        	display: flex;
        	justify-content: center; /* 水平居中 */
        	align-items: center; /* 垂直居中 */
        	font-size: clamp(12px, 3vh, 18px); /* 字体大小 */
        	writing-mode: vertical-rl; /* 竖向排列 */
        	text-align: center; /* 文字居中对齐 */
            line-height: 120%;
            overflow: hidden;
            cursor: pointer;
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

    // 定时显示心灵毒鸡汤
    setInterval(async () => {
        yiwen((text) => {
            setDockSpace(text);
        });
    }, delay * 1000 || 300000);

    // 加载时显示一次
    yiwen((text) => {
        setDockSpace(text);
    });

    // 监听事件
    let dockSpace = getDockSpace();
    if(dockSpace){
        // 添加双击事件，双击显示下一个
        listenDockSpaceDblclick();
        // 右键事件，右键复制到剪切板
        listenDockSpaceContextmenu();
        // 点击事件，单击打开文章
        listenDockSpaceClick();
    } else {
        setTimeout(() => {
            dockSpace = getDockSpace();
            listenDockSpaceDblclick();
            listenDockSpaceContextmenu();
            listenDockSpaceClick();
        }, 1500);
    }

    //每日一文
    let doc = {};
    async function yiwen(callback) {
        let response = await query(sql);
        doc = response[0];
        callback(doc.content);
    }

    // 查询SQL函数
    async function query(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }

    // 请求api
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
            yiwen((text) => {
                setDockSpace(text);
            });
        });
    }

    // // 监听左侧dock空白区域点击事件,点击打开文章
    function listenDockSpaceClick() {
        dockSpace = dockSpace || getDockSpace();
        dockSpace.addEventListener('click', () => {
            window.open(`siyuan://blocks/${doc.id}`);
        });
    }

    // 监听左侧dock空白区域右键事件,右键复制为引用到剪切板
    function listenDockSpaceContextmenu() {
        dockSpace = dockSpace || getDockSpace();
        dockSpace.addEventListener('contextmenu', () => {
            const successful = copyTextToClipboard(`((${doc.id} '${doc.content}'))`);
            if(successful) {
                showMessage('已复制为引用', false, 3000);
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
})();