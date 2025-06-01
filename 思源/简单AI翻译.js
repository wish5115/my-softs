// 简单AI翻译（仿沉浸式翻译）
// see https://ld246.com/article/1748748014662
// see https://ld246.com/article/1748607454045 需求贴
// version 0.0.7
// 0.0.7 增加shif+点击取消翻译
// 0.0.6 修复译文按钮分屏刷新时不显示问题
// 0.0.5 修复译文过长不换行问题
// 0.0.4 增加专家模式
// 0.0.3 支持思源ai翻译
// 0.0.2 生成译文直接放到编辑器中，方便复制等
{
    // default 默认引擎，即本代码自带引擎，完全免费，无需配置
    // siyuan 思源ai引擎，即思源ai配置中设定的ai引擎
    const aiEngine = 'default';
    
    // 翻译成什么语言
    // zh-cn 简体中文 zh-hk 港式繁体 zh-tw 台湾繁体
    // us-en 英语 ja-jp 日语 ko-kr 韩语 ru-ru 俄语 de-de 德语
    const transTo = 'zh-cn';

    // 是否开启专家模式
    // 专家模式将会把所有块一起发送给ai翻译，结果更准确，性能更好，但心理等待时间更久
    const expertMode = false;

    // ai提示词
    let aiPrompt = `
You are a professional, authentic machine translation engine.
Treat next line as plain text input and translate it into ${transTo}, output translation ONLY. If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes. Input:
{{text}}
    `;

    // 专家模式
    // 专家模式将会把所有块一起发送给ai翻译，结果更准确，性能更好，但心理等待时间更久
    if(expertMode) {
        aiPrompt = `
您是一位专业、正统的机器翻译引擎。
我将提供一个 JSON 格式的文本，其格式如下：
{"xxxx": "文本内容", "xxx2": "文本内容2", ...} —— 其中 "xxxx"、"xxx2" 是文本 ID，请原样保留；"文本内容"、"文本内容2" 等是待翻译的文本内容。
下面我将具体的给出实际的JSON文本内容，请将JSON中的文本内容翻译为 ${transTo}，输出格式与上述示例保持一致，仅翻译值部分。
若某段文本无需翻译（例如专有名词、代码等），请保留原文。
请直接输出 JSON 结果，不添加任何解释或注释。直接给出JSON结果即可。
JSON结果纯文本输出即可，不要加Markdown语法进去。
注意，这是一篇上下文相关联的文章，翻译时可参考上下文以更准确的翻译。
输入：{{text}}
        `;
    }

    // 主函数
    const main = (protyle)=>{
        if(protyle?.querySelector('.protyle-breadcrumb [data-type="trans"]')) return;
        const exitFocusBtn = protyle.querySelector('.protyle-breadcrumb [data-type="exit-focus"]');
        if(!exitFocusBtn) return;
        const shortcut = isMac() ? '⇧点击' : 'shift+点击';
        const transHtml = `<button class="block__icon fn__flex-center ariaLabel" aria-label="点击 <span class='ft__on-surface'>翻译</span><br>${shortcut} <span class='ft__on-surface'>取消翻译</span>" data-type="trans"><strong>译</strong></button>`;
        exitFocusBtn.insertAdjacentHTML('afterend', transHtml);
        const transBtn = protyle.querySelector('.protyle-breadcrumb [data-type="trans"]');
        if(!transBtn) return;
        const data = {};
        transBtn.addEventListener('click', async (event) => {
            const editor = transBtn.closest('.protyle')?.querySelector('.protyle-wysiwyg');
            const hasSelect = editor?.querySelector('.protyle-wysiwyg--select');
            if(event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                // 取消翻译
                const transNodes = editor.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'.trans-node');
                transNodes.forEach(transEl => transEl.remove());
                return;
            }
            const contenteditables = editor?.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'[contenteditable="true"]');
            contenteditables.forEach(async contenteditable => {
                const block = contenteditable.closest('[data-node-id][data-type]');
                if(!block) return;
                const text = contenteditable.textContent.trim();
                if(!text) return;
                let transEl = contenteditable.nextElementSibling;
                const loadingIcon = `<svg class="b3-menu__icon "><use xlink:href="#iconRefresh"></use></svg>`;
                if(!transEl?.matches('.trans-node')) {
                    const transElHtml = `<div class="protyle-custom trans-node" style="white-space:pre-wrap;word-break:break-all;">${loadingIcon}</div>`;
                    contenteditable.insertAdjacentHTML('afterend', transElHtml);
                    transEl = contenteditable.nextElementSibling;
                } else {
                    transEl.innerHTML = loadingIcon;
                }
                // 去掉思源ai的进度条
                if(aiEngine === 'siyuan') {
                    whenElementExist('#progress:has(.b3-dialog__loading)', null, 600000).then(progress => {
                        if(progress) progress.remove();
                    });
                }
                // 调用ai翻译
                if(!expertMode) {
                    // 普通模式
                    const transText = aiEngine === 'default' ? 
                        await translateText(text, transTo) : 
                        await siyuanAI(text);
                    transEl.innerHTML = transText;
                } else {
                    // 专家模式
                    if(block?.dataset?.nodeId) data[block.dataset.nodeId] = text;
                }
            });
            if(expertMode) {
                // 专家模式
                const text = JSON.stringify(data);
                const transText = aiEngine === 'default' ? 
                    await translateText(text, transTo) : 
                    await siyuanAI(text);
                try{
                    const transResult = JSON.parse(transText);
                    for(const [id, transText] of Object.entries(transResult)) {
                        const contenteditable = editor.querySelector('[data-node-id="'+id+'"] [contenteditable="true"]');
                        const transEl = contenteditable?.nextElementSibling;
                        if(!transEl) continue;
                        transEl.innerHTML = transText;
                    }
                } catch(e) {
                    console.error(e);
                }
            }
        });
    };
    
    // 监听protyle加载
    whenElementExist('.protyle:not(.fn__none)').then(()=>{
        const protyles = document.querySelectorAll('.protyle:not(.fn__none)');
        protyles.forEach(protyle => main(protyle));
    });
    observeProtyleLoad(main);

    // ai翻译
    async function translateText(text, toLang='zh-cn') {
      try {
        var myHeaders = new Headers();
        myHeaders.append("Pragma", "no-cache");
        myHeaders.append("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36");
        myHeaders.append("Content-Type", "application/json");
        var raw = JSON.stringify({
          "text": aiPrompt.trim().replace('{{text}}', text),
          "lang": toLang
        });
        var requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow'
        };
        const response = await fetch("https://ai.bingal.com/api/v1/translate ", requestOptions);
        if (!response.ok) {
          console.log(`HTTP error! status: ${response.status}`);
        }
        const result = await response.text();
        return result;
      } catch (error) {
        console.log('error', error);
        return '';
      }
    }

    async function siyuanAI(text) {
        const result = await requestApi('/api/ai/chatGPT', {
            "msg": aiPrompt.trim().replace('{{text}}', text)
        });
        if(result && result.code === 0 && result.data) return result.data;
        return '';
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    function whenElementExist(selector, node, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let isResolved = false;
            let requestId, timeoutId; // 保存 requestAnimationFrame 的 ID
            const check = () => {
                try {
                    const el = typeof selector === 'function' ? selector() : (node || document).querySelector(selector);
                    if (el) {
                        isResolved = true;
                        cancelAnimationFrame(requestId); // 找到元素时取消未执行的动画帧
                        if(timeoutId) clearTimeout(timeoutId);
                        resolve(el);
                    } else if (!isResolved) {
                        requestId = requestAnimationFrame(check); // 保存新的动画帧 ID
                    }
                } catch(e) {
                    isResolved = true;
                    cancelAnimationFrame(requestId);
                    clearTimeout(timeoutId);
                    reject(e);
                    return;
                }
            };
            check();
            timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    cancelAnimationFrame(requestId); // 超时后取消动画帧
                    reject(new Error(`Timeout: Element not found for selector "${selector}" within ${timeout}ms`));
                }
            }, timeout);
        });
    }
    
    function observeProtyleLoad(callback, parentElement) {
        // 如果 parentElement 是字符串，则将其转换为 DOM 元素
        if (typeof parentElement === 'string') {
            parentElement = document.querySelector(parentElement);
        }
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                // 检查是否是属性变化并且变化的属性是 class
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const targetElement = mutation.target; // 发生变化的目标元素
  
                    // 判断目标元素是否匹配指定选择器 .protyle:not(.fn__none)
                    if (targetElement.matches('.protyle:not(.fn__none)')) {
                        // 触发回调
                        callback(targetElement);
                    }
                }
            });
        });
        // 配置观察选项
        const config = {
            attributes: true, // 监听属性变化
            attributeFilter: ['class'], // 仅监听 class 属性
            subtree: true, // 监听父容器及其所有后代元素
        };
        // 启动观察，默认监听 document.body 或指定的父容器
        observer.observe(parentElement || document.body, config);
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }
}