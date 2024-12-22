// 思源搜索方式优化
// 选择搜索方式时，当为关键字时显示黑色按钮，查询语法显示绿色，SQL显示橘色，正则表达式显示红色
// 文本输入框同时也提示不同的搜索方式
(()=>{
    observeSearchMethod((searchSyntaxCheck) => {
        const input = searchSyntaxCheck.parentElement?.previousElementSibling?.querySelector('#searchInput');
        // 关键字
        if(searchSyntaxCheck.getAttribute('aria-label').indexOf(siyuan.languages.keyword)!==-1){
            searchSyntaxCheck.querySelector('svg').style.color = '';
            if(input) input.placeholder = '请输入关键字，为空将显示最近更新的块';
        }
        // 查询语法
        else if(searchSyntaxCheck.getAttribute('aria-label').indexOf(siyuan.languages.querySyntax)!==-1){
            searchSyntaxCheck.querySelector('svg').style.color = 'green';
            if(input) input.placeholder = '请输入查询语法，为空将显示最近更新的块';
        }
        // SQL
        else if(searchSyntaxCheck.getAttribute('aria-label').indexOf('SQL')!==-1){
            searchSyntaxCheck.querySelector('svg').style.color = 'orange';
            if(input) input.placeholder = '请输入SQL，为空将显示最近更新的块';
        }
        // 正则表达式
        else if(searchSyntaxCheck.getAttribute('aria-label').indexOf(siyuan.languages.regex)!==-1){
            searchSyntaxCheck.querySelector('svg').style.color = 'red';
            if(input) input.placeholder = '请输入正则表达式，为空将显示最近更新的块';
        }
    });
    function observeSearchMethod(callback) {
        // 选择目标元素（整个文档）
        const targetElement = document.body;
        let hasFound = false;
        // 创建 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
          mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                // 检查新增的节点
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const searchSyntaxCheck = node.querySelector('#searchSyntaxCheck');
                        if(searchSyntaxCheck) {
                            if(hasFound) return;
                            hasFound = true;
                            callback(searchSyntaxCheck);
                            setTimeout(() => {
                                hasFound = false;
                            }, 100);
                        }
                    }
                }
            }
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-label' && mutation.target.id === 'searchSyntaxCheck') {
              callback(mutation.target);
            }
          });
        });
        // 配置 MutationObserver
        const config = {
          childList: true, // 观察子节点的变化(添加/删除)
          attributes: true, // 监听属性变化
          attributeFilter: ['aria-label'], // 只监听 aria-label 属性
          subtree: true, // 监听目标元素及其所有后代元素
        };
        // 开始监听
        observer.observe(targetElement, config);

        // 加载时执行
        whenElementExist('#searchSyntaxCheck').then((searchSyntaxCheck) => {
            callback(searchSyntaxCheck);
        });
    }
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