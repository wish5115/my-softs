// 思源搜索选中文本或访问选中链接，支持ai搜索和翻译
(()=>{
    // 搜索引擎URL，%s% 是搜索关键词
    const searchUrl = 'https://cn.bing.com/search?q=%s%';
    // ai引擎URL，%s% 是查询关键词，支持deepseek-r1
    const aiUrl = 'https://chat.baidu.com/search?word=%s%';
    // 翻译引擎URL，%s% 是翻译关键词
    const fanyiUrl = 'https://fanyi.baidu.com/mtpe-individual/multimodal?query=%s%';

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

        // 当按钮被单击执行
        const onButtonClicked = (searchUrl) => {
            const selection = window.getSelection().toString();
            let url = '';
            if(selection.toLowerCase().startsWith('https://') || selection.toLowerCase().startsWith('http://')) {
                url = selection;
            } else {
                url = searchUrl.replace('%s%', encodeURIComponent(selection));
            }
            window.open(url);
        };
        
        // 左键单击
        let clickCount = 0;
        search.onclick  = (event) => {
          clickCount++;
          setTimeout(() => {
            if (clickCount === 1) {
              onButtonClicked(searchUrl);
            }
            clickCount = 0; // 重置计数器 
          }, 300);
        };

        // 左键双击
        search.ondblclick  = (event) => {
          clickCount = 0; // 双击时直接重置计数器 
          onButtonClicked(aiUrl);
        };

        // 右键单击
        search.oncontextmenu = (event) => {
            event.preventDefault(); // 阻止默认右键菜单
            onButtonClicked(fanyiUrl);
        };
    });
})();