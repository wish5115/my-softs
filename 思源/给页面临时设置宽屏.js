// 给页面临时设置宽屏（暂不支持持久，即文档关闭或页面刷新后复原）
// 兼容编辑器宽度插件和思源自适应宽度，兼容标题宽度
// see https://ld246.com/article/1746079460404
// 修改改自 https://ld246.com/article/1744597829665
(()=>{
    // 是否隐藏侧边栏，true 隐藏 false不隐藏
    const isHideDock = true;
    
    // 添加风格
    const styles = {
        "↔️": {tips:'宽屏', style:`width: 100%!important;margin:0 auto;padding-left:20px!important;padding-right:20px!important;.av{font-size: 16px;}`},
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
    const styleStatus = {};
    function addStyleButton(key, val, pin) {
        const buttonString = `<span class="dock__item ariaLabel" aria-label="${showTips ? '设置'+val.tips+'风格' : ''}">${key}</span>`;
        // 创建一个 DocumentFragment
        const fragment = document.createRange().createContextualFragment(buttonString);
        // 提取 span 元素
        const button = fragment.firstChild;
        button.onclick = (event) => {
            event.preventDefault(); // 阻止表单提交的默认行为
            event.stopPropagation(); // 阻止事件冒泡
            if(!styleStatus[key]) {
                // 添加样式
                setPageStyle(val.style);
                styleStatus[key] = true;
                button.setAttribute('aria-label', '取消'+val.tips+'风格');
                // 隐藏侧边栏
                toggleDockItems(false);
            } else {
                // 恢复样式
                setPageStyle('');
                styleStatus[key] = false;
                button.setAttribute('aria-label', '设置'+val.tips+'风格');
                // 显示侧边栏
                toggleDockItems(true);
            }
        };
        pin.before(button);
    }

    let lastProtyle = null;
    function setPageStyle(style) {
        const protyle = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)');
        const protyleId = protyle?.dataset?.id;
        if(!protyleId) {
            showMessage('请先选择要设置的编辑器！', true);
        }
        lastProtyle = protyle;
        const width = extractWidth(style);
        // #layouts div.layout__center div.protyle-content:not([data-fullwidth="true"]) div.protyle-wysiwyg
        style = `#layouts div.layout__center .protyle[data-id="${protyleId}"] div.protyle-content div.protyle-wysiwyg{${style}}`;
        if(width) style += `#layouts div.layout__center .protyle[data-id="${protyleId}"] div.protyle-content div.protyle-title{margin-left: max(calc(max(calc((100% - ${width}) / 2), 16px) + 0px), 16px) !important;margin-right: max(calc(max(calc((100% - ${width}) / 2), 16px) - 0px), 16px)!important;}`;
        setStyle(style, protyleId);
    }

    function extractWidth(styleCode) {
        // 1. 过滤所有类选择器规则（包括嵌套）
        const cleanedCode = styleCode.replace(/\.\w+\s*{[^}]*}/g, '');
        // 2. 精确匹配width属性值（兼容空格和特殊符号）
        const regex = /width\s*:\s*([^;}]+)/i;
        const match = cleanedCode.match(regex);
        // 3. 仅移除尾部可能残留的 `}` 符号
        return match ? match[1].trim().replace(/}$/, '').replace(/!important/ig, '').trim() : null;
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
    // 隐藏/显示侧边栏
    let lastDockTypes = [];
    function toggleDockItems(show) {
        const activeDocks = document.querySelectorAll('.dock__item--active');
        if(show === true) {
            // 显示侧边栏
            if (lastDockTypes.length > 0) {
                const dockTypes = Array.from(activeDocks).map(dock => `[data-type="${dock.dataset.type}"]`);
                lastDockTypes.forEach(dockType => !dockTypes.includes(dockType) && document.querySelector(dockType)?.click());
            }
        } else if(show === false) {
            // 隐藏侧边栏
            if (activeDocks.length > 0) {
                lastDockTypes = Array.from(activeDocks).map(dock => `[data-type="${dock.dataset.type}"]`);
                lastDockTypes.forEach(dockType => document.querySelector(dockType)?.click());
            } else {
                lastDockTypes = [];
            }
        } else {
            // 自动触发
            if (activeDocks.length > 0) {
                lastDockTypes = Array.from(activeDocks).map(dock => `[data-type="${dock.dataset.type}"]`);
                lastDockTypes.forEach(dockType => document.querySelector(dockType)?.click());
            } else if (lastDockTypes.length > 0) {
                lastDockTypes.forEach(dockType => document.querySelector(dockType)?.click());
            }
        }
        lastProtyle?.querySelector('.protyle-wysiwyg')?.focus();
    }
})();