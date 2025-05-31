// 简单AI翻译（仿沉浸式翻译）
// see https://ld246.com/article/1748607454045
// version 0.0.2
// 生成译文直接放到编辑器中，方便复制等
{
    // 翻译成什么语言
    // zh-cn 简体中文 zh-hk 港式繁体 zh-tw 台湾繁体
    // us-en 英语 ja-jp 日语 ko-kr 韩语 ru-ru 俄语 de-de 德语
    const transTo = 'zh-cn';

    // 主函数
    const main = (protyle)=>{
        if(protyle?.querySelector('.protyle-breadcrumb [data-type="trans"]')) return;
        const exitFocusBtn = protyle.querySelector('.protyle-breadcrumb [data-type="exit-focus"]');
        if(!exitFocusBtn) return;
        const transHtml = `<button class="block__icon fn__flex-center ariaLabel" aria-label="AI翻译" data-type="trans"><strong>译</strong></button>`;
        exitFocusBtn.insertAdjacentHTML('afterend', transHtml);
        const transBtn = protyle.querySelector('.protyle-breadcrumb [data-type="trans"]');
        if(!transBtn) return;
        transBtn.addEventListener('click', () => {
            const editor = transBtn.closest('.protyle')?.querySelector('.protyle-wysiwyg');
            const hasSelect = editor?.querySelector('.protyle-wysiwyg--select');
            const contenteditables = editor?.querySelectorAll((hasSelect?'.protyle-wysiwyg--select ':'')+'[contenteditable="true"]');
            contenteditables.forEach(async contenteditable => {
                const block = contenteditable.closest('[data-node-id][data-type]');
                if(!block) return;
                const text = contenteditable.textContent.trim();
                if(!text) return;
                let transEl = contenteditable.nextElementSibling;
                const loadingIcon = `<svg class="b3-menu__icon "><use xlink:href="#iconRefresh"></use></svg>`;
                if(!transEl?.matches('.trans-node')) {
                    const transElHtml = `<div class="protyle-custom trans-node" style="white-space:pre;">${loadingIcon}</div>`;
                    contenteditable.insertAdjacentHTML('afterend', transElHtml);
                    transEl = contenteditable.nextElementSibling;
                } else {
                    transEl.innerHTML = loadingIcon;
                }
                const transText = await translateText(text, transTo);
                transEl.innerHTML = transText;
            });
        });
    };
    
    // 监听protyle加载
    whenElementExist('.protyle:not(.fn__none)').then(main);
    observeProtyleLoad(main);

    // ai翻译
    async function translateText(text, toLang='zh-cn') {
      try {
        var myHeaders = new Headers();
        myHeaders.append("Pragma", "no-cache");
        myHeaders.append("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36");
        myHeaders.append("Content-Type", "application/json");
        var raw = JSON.stringify({
          "text": text,
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.text();
        return result;
      } catch (error) {
        console.log('error', error);
        return '';
      }
    }
    
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            // 先立即检查一次元素是否存在
            const existingEl = typeof selector==='function'?selector():(node||document).querySelector(selector);
            if (existingEl) {
                resolve(existingEl);
                return;
            }
    
            // 如果元素不存在，才开始监听 DOM 变化
            const observer = new MutationObserver(mutations => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
    
            observer.observe(document.body, { childList: true, subtree: true });
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
}