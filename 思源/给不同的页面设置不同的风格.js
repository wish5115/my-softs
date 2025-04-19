// 给不同的页面设置不同的风格（暂不支持持久，即文档关闭或页面刷新后复原）
// see https://ld246.com/article/1744597829665
(()=>{
    // 添加风格
    const styles = {
        "📋": {tips:'正常', style:``},
        "🛢️": {tips:'数据库', style:`width: 100%;padding: 16px 20px 64px !important;`},
        "🖍️": {tips:'编辑', style:`font-size: 24px!important;`},
        "👁️": {tips:'阅读', style:`font-size: 12px!important;`},
    };

    // 鼠标悬停是否显示提示信息，true显示，false不显示
    const showTips = true;
    
    // 手机版返回
    if(isMobile()) return;
    
    // 监听dock加载完毕
    whenElementExist('#dockRight .dock__items .dock__item--pin').then((pin)=>{
        // 这里可以添加多个风格
        Object.entries(styles).forEach(([key, val]) => {
            addStyleButton(key, val, pin);
        });
    });

    // 设置风格按钮
    function addStyleButton(key, val, pin) {
        const buttonString = `<span class="dock__item ariaLabel" aria-label="${showTips ? '设置'+val.tips+'风格' : ''}">${key}</span>`;
        // 创建一个 DocumentFragment
        const fragment = document.createRange().createContextualFragment(buttonString);
        // 提取 span 元素
        const button = fragment.firstChild;
        button.onclick = (event) => {
            event.preventDefault(); // 阻止表单提交的默认行为
            event.stopPropagation(); // 阻止事件冒泡
            setPageStyle(val.style);
        };
        pin.before(button);
    }

    function setPageStyle(style) {
        const protyle = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)');
        const protyleId = protyle?.dataset?.id;
        if(!protyleId) {
            showMessage('请先选择要设置的编辑器！', true);
        }
        style = `.protyle[data-id="${protyleId}"] .protyle-wysiwyg{${style}}`;
        setStyle(style, protyleId);
    }

    function setStyle(css, protyleId) {
        // 1. 移除旧的样式（通过唯一ID）
        const existingStyle = document.getElementById(`protyle-${protyleId}-style`);
        if (existingStyle) {
            existingStyle.remove();
        }
        // 2. 创建新的 <style> 元素
        const style = document.createElement('style');
        style.id = `protyle-${protyleId}-style`; // 唯一标识符
        style.textContent = css; // 设置 CSS 内容
        // 3. 将样式添加到页面头部
        document.head.appendChild(style);
    }

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    
    // 等待元素出现
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();