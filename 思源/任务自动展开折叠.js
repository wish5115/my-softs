// 任务自动展开折叠
(()=>{
    // 这些任务将不受该功能影响
    const excludes = [
        //'20250613111622-l84hm21',
    ];
    
    observeProtyleLoaded((protyle)=>{
        const tasks = protyle.querySelectorAll('.protyle-wysiwyg [data-node-index][data-subtype="t"] > [data-subtype="t"]:not([fold="1"]):has([data-subtype="t"])');
        tasks.forEach(task => {
            if(excludes.includes(task.dataset.nodeId)) return;
            foldBlock(task.dataset.nodeId, true);
        });
    });
    document.addEventListener('click', (event)=>{
        if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const firstTask = event.target.closest('.protyle-wysiwyg [data-node-index][data-subtype="t"] > [data-subtype="t"]:has([data-subtype="t"])');
        if(firstTask) {
            if(!excludes.includes(firstTask.dataset.nodeId)) foldBlock(firstTask.dataset.nodeId, false);
        } else {
            const wysiwyg = event.target.closest('.protyle-wysiwyg') || getWysiwyg();
            const tasks = wysiwyg.querySelectorAll('[data-node-index][data-subtype="t"] > [data-subtype="t"]:has([data-subtype="t"])');
            tasks.forEach(task => {
                if(excludes.includes(task.dataset.nodeId)) return;
                foldBlock(task.dataset.nodeId, true);
            });
        }
    });
    // 折叠/展开块
    async function foldBlock(id, isFold = true) {
        const result = await requestApi('/api/block/' + (isFold ? 'foldBlock' : 'unfoldBlock'), {id: id});
        if(!result || result.code !== 0) console.error(result);
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    function getWysiwyg() {
        return document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr');
    }
    // 监听protyle加载完成，注意这个是开始加载完成时，不是加载时
    // 调用示例 observeProtyleLoaded((protyle)=>console.log(protyle))
    function observeProtyleLoaded(callback, parentElement) {
        if(typeof parentElement === 'string') parentElement = document.querySelector(parentElement);
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-loading') {
                    const targetElement = mutation.target; // 发生变化的目标元素
                    // 判断目标元素是否匹配指定选择器
                    if (targetElement.matches('.protyle')) {
                        const dataLoadingValue = targetElement.getAttribute('data-loading');
                        // 如果 data-loading 的值为 "finished"，触发回调
                        if (dataLoadingValue === 'finished') {
                            callback(targetElement);
                        }
                    }
                }
            });
        });
        // 配置观察选项
        const config = {
            attributes: true, // 监听属性变化
            attributeFilter: ['data-loading'], // 仅监听 data-loading 属性
            subtree: true, // 监听父容器及其所有后代元素
        };
        // 启动观察
        observer.observe(parentElement||document.body, config);
    }
})();