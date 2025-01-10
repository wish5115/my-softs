// 嵌入块编辑窗口增加复制为模板按钮
(()=>{
    observerProtyleUtil(async protyleUtil => {
        if(protyleUtil.querySelector('button[data-type="copy-tpl"]')) return;
        const refresh = protyleUtil.querySelector('[data-type="refresh"]');
        if(!refresh) return;
        // 创建 <span class="fn__space"></span> 元素
        const spanElement = document.createElement('span');
        spanElement.className = 'fn__space';
        // 创建 <button> 元素
        const buttonElement = document.createElement('button');
        buttonElement.dataset.type = 'copy-tpl';
        buttonElement.className = 'block__icon block__icon--show b3-tooltips b3-tooltips__nw';
        buttonElement.setAttribute('aria-label', '复制为模板');
        const svg = `<svg><use xlink:href="#iconCopy"></use></svg>`;
        buttonElement.innerHTML = svg;
        buttonElement.onclick = () => {
            // 复制为模板
            const textarea = protyleUtil.querySelector('textarea');
            let output = textarea.value.replace(/\n/g, '_esc_newline_');
            output = encodeHTMLEntities(output);
            navigator.clipboard.writeText('{{'+output+'}}');
            buttonElement.innerHTML = '已复制';
            setTimeout(() => {
                buttonElement.innerHTML = svg;
            }, 1500);
        };
        // 将 <span> 和 <button> 插入到 refresh 元素的后面
        await sleep(0);
        refresh.after(spanElement, buttonElement);
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function encodeHTMLEntities(html) {
        return html.replace(/[<>&"']/g, (match) => {
            switch (match) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                //case "'": return '&#39;';
                default: return match;
            }
        });
    }
    
    // 等待元素出现
    function observerProtyleUtil(callback) {
        let hasEmit = false;
        // 1. 创建 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
          mutationsList.forEach((mutation) => {
            // 2. 获取目标元素
            const targetElement = mutation.target;
            // 3. 检查目标元素是否是 .protyle .protyle-util
            if (targetElement.matches('.protyle .protyle-util')) {
              // 4. 检查 .fn__none 类是否被删除
              if (!targetElement.classList.contains('fn__none')) {
                  if(hasEmit) return;
                  hasEmit = true;
                  callback(targetElement);
                  setTimeout(() => {
                      hasEmit = false;
                  }, 100);
              }
            }
          });
        });
        // 5. 配置并启动监听
        observer.observe(document.body, {
          attributes: true, // 监听属性变化
          attributeFilter: ['class'], // 只监听 class 属性
          subtree: true,    // 监听所有后代元素
        });
    }
})();