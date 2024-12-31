// 思源搜索选中文本或访问选中链接
(()=>{
    // 搜索引擎URL，%s% 是搜索关键词
    const searchUrl = 'https://cn.bing.com/search?q=%s%';

    document.addEventListener('selectionchange', (event) => {
        const selection = window.getSelection().toString();
        if(!selection) return;
        const protyle = event.target.activeElement?.closest('.protyle');
        if(!protyle) return;
        const toolbar = protyle.querySelector('.protyle-toolbar');
        if(!toolbar) return;
        let search = toolbar.querySelector('button[data-type="search"]');
        if(search) {
            if(selection.toLowerCase().startsWith('https://') || selection.toLowerCase().startsWith('http://')){
                search.setAttribute('aria-label', '访问');
                search.querySelector('svg use').setAttribute('xlink:href', '#iconLanguage');
            } else {
                search.setAttribute('aria-label', '搜索');
                search.querySelector('svg use').setAttribute('xlink:href', '#iconSearch');
            }
            return;
        }
    
        // 创建按钮
        const button = `<button class="protyle-toolbar__item b3-tooltips b3-tooltips__ne" data-type="search" aria-label="搜索/访问"><svg><use xlink:href="#iconSearch"></use></svg></button>`;
        toolbar.insertAdjacentHTML('afterbegin', button);
        search = toolbar.querySelector('button[data-type="search"]');
        search.onclick = () => {
            const selection = window.getSelection().toString();
            let url = '';
            if(selection.toLowerCase().startsWith('https://') || selection.toLowerCase().startsWith('http://')) {
                url = selection;
            } else {
                url = searchUrl.replace('%s%', encodeURIComponent(selection));
            }
            window.open(url);
        }
    });
})();