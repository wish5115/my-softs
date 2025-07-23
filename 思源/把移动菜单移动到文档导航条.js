// 把移动菜单移动到文档导航条
// 通过模拟点击菜单按钮实现
{
    const main = (protyle)=>{
        // 发布服务下不显示
        if(window.siyuan.config.readonly) return;

        if(protyle?.querySelector('.protyle-breadcrumb [data-type="move"]')) return;
        const exitFocusBtn = protyle.querySelector('.protyle-breadcrumb [data-type="exit-focus"]');
        if(!exitFocusBtn) return;
        const moveHtml = `<button class="block__icon fn__flex-center ariaLabel" aria-label="移动" data-type="move"><svg><use xlink:href="#iconMove"></use></svg></button>`;
        exitFocusBtn.insertAdjacentHTML('afterend', moveHtml);
        const moveBtn = protyle.querySelector('.protyle-breadcrumb [data-type="move"]');
        if(!moveBtn) return;
        moveBtn.addEventListener('click', async () => {
            // 锁定状态下不可修改
            const icon = protyle?.querySelector('button[data-type="readonly"] use')?.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if(icon === '#iconLock') {
                showMessage('锁定状态不可用');
                return
            }

            const docBtn = protyle.querySelector('.protyle-breadcrumb [data-type="doc"]');
            docBtn.click();
            menuMoveBtn = await whenElementExist('#commonMenu[data-name="titleMenu"] button[data-id="move"]');
            menuMoveBtn.click();
        });
    };

    // 监听protyle加载
    whenElementExist('.protyle:not(.fn__none)').then(main);
    observeProtyleLoad(main);

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
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