// 搜索不到时回车不新建文档（鼠标点击可新建）
// see https://ld246.com/article/1743579723972
// see https://github.com/siyuan-note/siyuan/blob/1317020c1791edf440da7f836d366567e03dd843/app/src/search/util.ts#L798
(()=>{
    observeSearchNewDocDom((searchNew) => {
        // 加载时修改类型
        searchNew.dataset.type = 'search-new-disabled';
        // 点击时恢复类型
        searchNew.addEventListener('click', function(event) {
            searchNew.dataset.type = 'search-new';
        });
        searchNew.querySelector('.b3-list-item__meta').textContent = '点击创建';
        if(searchNew.nextElementSibling && searchNew.nextElementSibling.matches('.search__empty')) {
            searchNew.nextElementSibling.textContent = `搜索结果为空，点击创建新文档`;
            searchNew.nextElementSibling.addEventListener('click', function(event) {
                searchNew.click();
            });
        }
    });
    function observeSearchNewDocDom(callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver(async (mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // 监控搜索新建文档dom被加载
                        if (node.nodeType === 1 && node.matches('#searchList [data-type="search-new"]')) {
                            callback(node);
                        }
                    });
                }
            }
        });
        // 配置观察选项:
        const config = { 
            childList: true, // 观察子节点的变化(添加/删除)
            subtree: true, // 观察所有后代节点
            attributes: false,
        };
        // 选择需要观察变动的节点
        const targetNode = document.body; // 或者选择更具体的父节点以减少性能消耗
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回一个取消观察的方法
        return () => observer.disconnect();
    }
})();