// 文档面包屑添加文档树和大纲按钮
// see https://ld246.com/article/1751087267927
// pc版代码
(()=>{
    if(window.siyuan?.mobile) return;
    const main = (protyle)=>{
        if(!protyle) return;
        const exitFocusBtn = protyle.querySelector('.protyle-breadcrumb [data-type="exit-focus"]');
        if(!exitFocusBtn) return;
        if(!protyle?.querySelector('.protyle-breadcrumb [data-type="outline"]')) {
            exitFocusBtn.insertAdjacentHTML('afterend', `<button class="block__icon fn__flex-center ariaLabel" aria-label="大纲" data-type="outline"><svg><use xlink:href="#iconAlignCenter"></use></svg></button>`);
            const outlineBtn = protyle.querySelector('.protyle-breadcrumb [data-type="outline"]');
            if(!outlineBtn) return;
            outlineBtn.addEventListener('click', () => {
                document.querySelector('[data-hotkeylangid="outline"]').click();
            });
        }
        if(!protyle?.querySelector('.protyle-breadcrumb [data-type="docTree"]')) {
            exitFocusBtn.insertAdjacentHTML('afterend', `<button class="block__icon fn__flex-center ariaLabel" aria-label="文档树" data-type="docTree"><svg><use xlink:href="#iconFiles"></use></svg></button>`);
            const docTreeBtn = protyle.querySelector('.protyle-breadcrumb [data-type="docTree"]');
            if(!docTreeBtn) return;
            docTreeBtn.addEventListener('click', () => {
                document.querySelector('[data-hotkeylangid="fileTree"]').click();
            });
        }
    };

    // 监听protyle加载
    whenElementExist('.protyle:not(.fn__none)').then(main);
    observeProtyleLoad(main);

    function whenElementExist(selector, node = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function'
                        ? selector()
                        : node.querySelector(selector);
                } catch (err) {
                    return resolve(null);
                }
                if (el) {
                    resolve(el);
                } else if (Date.now() - start >= timeout) {
                    resolve(null);
                } else {
                    requestAnimationFrame(check);
                }
            }
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
})();

// 移动端代码
setTimeout(() => {
    if(!window.siyuan?.mobile) return;
    const targetButton = document.querySelector('#editor .protyle-breadcrumb [data-type="exit-focus"]');
    if (!targetButton) return;
    targetButton.insertAdjacentHTML('afterend', `<button class="block__icon fn__flex-center ariaLabel" aria-label="大纲" data-type="outline"><svg><use xlink:href="#iconAlignCenter"></use></svg></button>`);
    const outline = targetButton.nextElementSibling;
    targetButton.insertAdjacentHTML('afterend', `<button class="block__icon fn__flex-center ariaLabel" aria-label="文档树" data-type="docTree"><svg><use xlink:href="#iconFiles"></use></svg></button>`);
    const tree = targetButton.nextElementSibling;
    tree.addEventListener('click', ()=>{
        click('#toolbarFile');
        click('[data-type="sidebar-file-tab"]');
    });
    outline.addEventListener('click', ()=>{
        click('#toolbarFile');
        click('[data-type="sidebar-outline-tab"]');
    });
    function click(el) {
        if(typeof el === 'string') el = document.querySelector(el);
        el.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
    }
}, 1000);