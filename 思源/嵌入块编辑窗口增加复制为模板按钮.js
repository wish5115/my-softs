// 嵌入块编辑窗口增加复制为模板按钮
(()=>{
    document.body.addEventListener('mouseup', async function (event) {
        // 判断是否是左键单击
        if (event.button !== 0) return;
        // 判断是否嵌入块的编辑按钮
        if(!event.target.closest('[data-type="NodeBlockQueryEmbed"] .protyle-action__edit')) return;
        //await new Promise(resolve => setTimeout(resolve, 50));
        //const protyleUtil = event.target.closest('.protyle')?.querySelector('.protyle-util:not(.fn__none)');
        const protyleUtil = await whenElementExist('.protyle .protyle-util:not(.fn__none)');
        if(!protyleUtil) return;
        const refresh = protyleUtil.querySelector('[data-type="refresh"]');
        if(!refresh) return;
        // 创建 <span class="fn__space"></span> 元素
        const spanElement = document.createElement('span');
        spanElement.className = 'fn__space';
        // 创建 <button> 元素
        const buttonElement = document.createElement('button');
        buttonElement.dataset.type = 'copy2tpl';
        buttonElement.className = 'block__icon block__icon--show b3-tooltips b3-tooltips__nw';
        buttonElement.setAttribute('aria-label', '复制为模板');
        const svg = `<svg><use xlink:href="#iconCopy"></use></svg>`;
        buttonElement.innerHTML = svg;
        buttonElement.onclick = () => {
            // 复制为模板
            const textarea = protyleUtil.querySelector('textarea');
            const output = textarea.value.replace(/\n/g, '_esc_newline_');
            navigator.clipboard.writeText('{{'+output+'}}');
            buttonElement.innerHTML = '已复制';
            setTimeout(() => {
                buttonElement.innerHTML = svg;
            }, 1500);
        };
        // 将 <span> 和 <button> 插入到 refresh 元素的后面
        refresh.after(spanElement, buttonElement);
    });
    
    // 等待元素出现
    function whenElementExist(selector, target) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(target||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();