// 思源剑桥查词
// see https://ld246.com/article/1760544378300
// 查词内容解析自 https://dictionary.cambridge.org
// 核心代码改自 https://github.com/yaobinbin333/bob-plugin-cambridge-dictionary/blob/cbdab3becad9b3b33165ff99dff4bab44ed54e17/src/entry.ts#L17
// version 0.0.8.3
// 0.0.8.3 新增当简体中文页面查询不到时自动转到英文页面查询
// 0.0.8.2 单词下增加词性；增加动词变化；增加弱读音标
// 0.0.8.1 修改全球发音bug；改进工具栏默认用剑桥词典发音和默认插入剑桥词典发音
// 0.0.8 增加添加生词时右键按钮可以输入备注
// 0.0.7 钉住时，选中即可查词；添加生词可不新增今日文档；新增添加到书签、发音、插入发音按钮
// 0.0.6.9 theThirdDicts.command 支持回调函数；增加生词本功能
// 0.0.6.8 点击单词标题可以输入查词
// 0.0.6.6 增加全球真人发音
// 0.0.6 改进第三方词典配置，可以自由搭配显示位置
// 0.0.5.1 增加在未查到时也可以自定义第三方词典
// 0.0.5 把备用词典和第三方词典整合为一个，统一叫第三方词典，统一配置
// 0.0.4 增加更多词典支持，仅限在文本选择工具栏显示，默认不开启（已废弃）
// 0.0.3 新增自动朗读和钉住功能，默认自动朗读
// 0.0.2 增加备用词典，默认是沙拉查词，也可通过配置修改为其他查词
(() => {
  // 是发查词完成自动朗读 true 自动朗读 false 不自动朗读
  const isAutoReadOnLoaded = true;

  // 自动朗读哪种发音 us 美式发音 uk 英式发音
  const autoReadType = 'us';

  // 是否开启钉住功能，钉住后窗口失去焦不会关闭 true 开启 false 不开启
  const enablePin = true;

  // 钉住时，是否选中直接查词？true 直接查词 false 点击剑桥词典按钮查词
  const isQueryWhenSelectWhenPined = true;

  // AI 搜索url
  const aiSearchUrl = 'https://chat.baidu.com/search?word={{keyword}}';
  // AI查词提示词
  const aiPrompt = `你是一个查词助手，帮我查询“{{keyword}}”，并注明音标，发音，常见释义，例句等，如果可能可适当配些插图或视频。`;
  
  // 是否开启更多词典 true 开启 false 不开启
  const enableTheThirdDicts = true;

  // 更多词典设置
  const theThirdDicts = [
    {
      // 名字，通常用于提示或显示
      name: '沙拉查词',
      // 图标6x16大小
      icon: 'https://saladict.crimx.com/icons/favicon-16x16.png',
      // 打开命令
      command: `utools://沙拉查词/沙拉查词?{{keyword}}`,
      // 显示位置 toolbar 工具栏; dictpage 剑桥词典内; notfound 查不到时; all 所有位置; 也可以任意组合，用逗号隔开即可; 为空均不显示
      position: 'all',
    },
    {
      // 名字，通常用于提示或显示
      name: '中英词典',
      // 图标16x16大小
      icon: 'https://b3logfile.com/file/2025/10/1760663431439TYe0SV_2-ujPYk4O.png?imageView2/2/interlace/1/format/webp',
      // 打开命令
      command: `utools://中英词典/中英词典?{{keyword}}`,
      position: 'dictpage, notfound',
    },
    {
      // 名字，通常用于提示或显示
      name: 'AI助手',
      // 图标16x16大小
      icon: 'https://b3logfile.com/file/2025/10/ailogo-rcvBWYB.png?imageView2/2/interlace/1/format/webp',
      // 打开命令
      command: `utools://AI%20助手/AI%20助手?${aiPrompt}`,
      position: 'dictpage, notfound',
    },
    {
      // 名字，通常用于提示或显示
      name: '问AI',
      // 图标16x16大小
      icon: 'https://gips0.baidu.com/it/u=1125504705,2263448440&fm=3028&app=3028&f=PNG&fmt=auto&q=75&size=f16_16',
      // 打开命令
      command: aiSearchUrl,
      position: 'notfound',
    },
    /*{
      // 名字，通常用于提示或显示
      name: 'Bing',
      // 图标16x16大小
      icon: 'https://cn.bing.com/favicon.ico',
      // 打开命令
      command: 'https://cn.bing.com/search?q={{keyword}}',
      position: 'toolbar',
    },
    {
      // 名字，通常用于提示或显示
      name: '百度',
      // 图标16x16大小
      icon: 'https://www.baidu.com/favicon.ico',
      // 打开命令
      command: 'https://www.baidu.com/s?wd={{keyword}}',
      position: 'toolbar',
    },*/
    // 添加到生词本
    {
      // 名字，通常用于提示或显示
      name: '添加到生词本（右键输入备注）',
      // 图标16x16大小
      icon: 'https://b3logfile.com/file/2025/10/%E7%94%9F%E8%AF%8D%E6%9C%AC-GQxAnkD.png?imageView2/2/interlace/1/format/webp',
      // 打开命令 eventType:click/contextmenu
      command: async ({selection, theThirdDict, result, event, eventType}) => {
        // 设置生词本笔记本ID和路径等
        const notebookId = '20240224233354-t4fptpl'; // 笔记本id
        const wordBookPath = '/English/学习笔记'; // 生词本路径
        const addNewWordInTodayDoc = true; // 是否把生词添加到今日文档中，true 是 false 添加到wordBookPath文档中 
        const haveAddedScope = 'today'; // 是否已添加判断范围 today 仅在今日生词文档中判断；all 在所有生词文档中判断
        
        const today = new Date().toLocaleDateString().replace(/\//g, '-');
        const todayPath = wordBookPath.replace(/\/$/, '')+'/'+today;
        const wordBookDocId = await requestApi('/api/filetree/getIDsByHPath', {notebook:notebookId, path:wordBookPath});
        if(wordBookDocId?.data?.length === 0){
          showMessage('笔记ID或生词本路径错误', true);
          return;
        }
        let docId = '';
        if(addNewWordInTodayDoc) {
          const todyDocId = await requestApi('/api/filetree/getIDsByHPath', {notebook:notebookId, path:todayPath});
          docId = todyDocId?.data?.[0] || '';
          if(todyDocId?.data?.length === 0) {
            const res = await requestApi('api/filetree/createDocWithMd', {notebook:notebookId, path:todayPath, markdown:''});
            docId = res?.data || '';
          }
        } else {
          const wordDocId = await requestApi('/api/filetree/getIDsByHPath', {notebook:notebookId, path:wordBookPath});
          docId = wordDocId?.data?.[0] || '';
        }
        if(!docId){
          showMessage(addNewWordInTodayDoc?'今日生词文档不存在':'获取生词本文档ID失败', true);
          return;
        }
        const queryScopeSql = haveAddedScope === 'today' ? `root_id='${docId}'` : '1'
        const wordList = await querySql(`select * from blocks where ${queryScopeSql} and type='p' and ial like '%custom-word="${selection}"%' limit 1`);
        if(wordList.length > 0){
          showMessage('该生词已添加');
          return;
        }
        let remark = '', pos = '';
        if(eventType === 'contextmenu') {
          // 获取右键按钮的位置
          let inputPos = '', parentEl, btnEl;
          let btn = event.target.closest('.protyle-toolbar button[data-type^="theThirdDict"]');
          if(btn) {
            pos = 'toolbar';
            btnEl = btn;
            parentEl = btn.closest('.protyle-toolbar');
            inputPos = {top: 30, left: 0};
          } else {
            btn = event.target.closest('.word img[title="'+theThirdDict?.name+'"]');
            if(btn) {
              pos = 'dictpage';
              btnEl = btn;
              parentEl = btn.closest('.word');
              inputPos = {top: 78, right: 15};
            }
          }
          if(!pos || !parentEl || !btnEl) return;
          // 简单记忆
          window.tmpCBLastWord = window.tmpCBLastWord || '';
          if(selection && window.tmpCBLastWord !== selection) {
            window.tmpCBLastWord = selection;
            setTimeout(()=>parentEl.querySelector('.quick-input-box').value = '', 50);
          }
          // 保存选区
          if(pos === 'toolbar') saveSelection();
          // 获取输入框备注
          remark = await showInputBox(btnEl, parentEl, '', '请输入备注', inputPos) || '';
          if(!remark) {
            if(pos === 'toolbar') restoreSelection();
            //showMessage('已取消添加');
            return;
          }
          remark = `（备注：${remark}）`;
        }
        const res = await requestApi('/api/block/insertBlock', {
          "dataType": "markdown",
          "data": `${selection}${remark}\n`,
          "nextID": "",
          "previousID": "",
          "parentID": docId
        });
        if(!res || res.code !== 0) {
          if(pos === 'toolbar') restoreSelection();
          showMessage('添加失败' + res.msg, true);
        }
        const blockId = res?.data?.[0]?.doOperations?.[0]?.id || '';
        if(blockId) {
          await requestApi('/api/attr/setBlockAttrs', {
            "id": blockId,
            "attrs": { "custom-word": selection }
          });
        }
        if(pos === 'toolbar') restoreSelection();
        showMessage('添加成功');
      },
      position: 'toolbar, dictpage',
    },
    // 添加当前块到书签
    {
      // 名字，通常用于提示或显示
      name: '添加当前块到书签',
      // 图标16x16大小
      icon: 'https://b3logfile.com/file/2025/10/bookmarek-md3lOLx.png?imageView2/2/interlace/1/format/webp',
      // 打开命令
      command: async ({selection, theThirdDict, result, event}) => {
        const bookmarkName = '英语学习';
        const block = getCursorElement()?.closest('.protyle-wysiwyg [data-node-id][data-type]');
        if(!block?.dataset?.nodeId) return;
        const res = await requestApi('/api/attr/setBlockAttrs', {
          "id": block.dataset.nodeId,
          "attrs": { "bookmark": bookmarkName }
        });
        if(res && res.code == 0) showMessage('书签添加成功');
        else showMessage('书签添加失败' + res.msg, true);
      },
      position: 'toolbar',
    },
    // 朗读
    {
      // 名字，通常用于提示或显示
      name: '朗读',
      // 图标16x16大小
      icon: 'https://b3logfile.com/file/2025/10/sound-iu4utGB.png?imageView2/2/interlace/1/format/webp',
      // 打开命令
      command: async ({selection, theThirdDict, result, event, eventType}) => {
        const soundRegion = 'us'; // 你希望的区域发音 uk 英音 us 美音
        const soundFrom = 'cb'; // 声音来源 yd 有道 cb 剑桥
        
        if(soundFrom === 'yd') {
          // 有道参数 type=1表示英式发音，type=2表示美式发音
          playAudio(`http://dict.youdao.com/dictvoice?type=${soundRegion === 'uk' ? '1' : '2'}&audio=${selection}`);
        } else {
          playAudio(await getAudioUrlFromCamBridge(selection, soundRegion));
        }
      },
      position: 'toolbar',
    },
    // 在该词后插入发音按钮
    {
      // 名字，通常用于提示或显示
      name: '在该词后插入发音按钮',
      // 图标16x16大小
      icon: 'https://b3logfile.com/file/2025/10/insertSound-NKjrjlO.png?imageView2/2/interlace/1/format/webp',
      // 打开命令
      command: async ({selection, theThirdDict, result, event, eventType}) => {
        const soundRegion = 'both'; // 你希望的区域发音 en 英音 am 美音 both 两者都有，默认both
        const soundFrom = 'cb'; // 声音来源 yd 有道 cb 剑桥 
        
        if(!window.enableLinkAudioJs){
          showMessage('请先安装自动发音链接最新版代码！<br /><a href="https://ld246.com/article/1734238897997" target="_blank">点这里查看和安装</a><br />', true);
          return;
        }
        const block = getCursorElement()?.closest('.protyle-wysiwyg [data-node-id][data-type]');
        if(!block?.dataset?.nodeId) return;
        const soundCode = soundRegion === 'both' ? `us: [*](${soundFrom}:${selection}:am) uk: [*](${soundFrom}:${selection}:en)` : `[*](${soundFrom}:${selection}:${soundRegion})`;
        sendTextToEditable(block, `${selection} ${soundCode}`);
      },
      position: 'toolbar',
    }
  ];

  if(!!document.getElementById("sidebar")) return; // 不支持手机版
  // 查词UI界面
  const html = `
      <style>
        button.protyle-toolbar__item img {
            max-width: 14px;
            max-height: 14px;
        }
        .cambridge-popup {
          position: fixed;
          top: 100px;
          left: 300px;
          width: 420px;
          max-height: 500px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          z-index: 9999;
          overflow: hidden;
          /* display: flex;*/
          display: none;
          flex-direction: column;
          color: #413732;
        }
    
        /* 标题栏（可拖动区域） */
        .cambridge-popup .popup-header {
          padding: 8px 15px 8px 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
          cursor: move;
          user-select: none;
          position: relative;
        }
    
        .cambridge-popup .popup-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }
    
        /* 关闭按钮 */
        .cambridge-popup .close-btn,
        .cambridge-popup .pin-btn{
          position: absolute;
          top: 8px;
          right: 8px;
          background: #e9ecef;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 20px;
          opacity: 0.7;
        }
        .cambridge-popup .pin-btn{
            right: 40px;
        }
    
        .cambridge-popup .close-btn:hover,
        .cambridge-popup .pin-btn:hover{
          background: #dee2e6;
          opacity: 1;
        }
    
        /* 内容区（不可拖动） */
        .cambridge-popup .popup-body {
          padding: 15px;
          padding-top: 10px;
          overflow-y: auto;
          flex: 1;
          max-height: 480px;
        }
    
        .cambridge-popup .word {
          font-size: 24px;
          font-weight: bold;
          /*margin-bottom: 8px;*/
          word-wrap: break-word;
        }

        .cambridge-popup .posgram{
          padding-left: 5px;
        }

        .cambridge-popup .word #searchInput {
          width: 230px;
          outline: none;
          background: transparent;
          border: 1px solid transparent; /* 占位但不可见 */
          border-radius: 8px;
          font-size: 24px;
          font-weight: bold;
          padding: 0;
          padding-left: 5px;
          padding-bottom: 5px;
          line-height: 20px;
        }
        .cambridge-popup .word #searchInput:focus{
          border-color: #888;
        }
    
        .cambridge-popup .phonetics {
          display: flex;
          gap: 2px;
          /* gap: 16px; */
          margin-top: 5px;
          margin-bottom: 5px;
          /*margin-bottom: 8px;*/
          font-size: 14px;
          flex-wrap: wrap;
        }
    
        .cambridge-popup .phonetic-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
    
        .cambridge-popup .audio-btn,
        .cambridge-popup .global-btn{
          background: none;
          border: none;
          color: #007AFF;
          cursor: pointer;
          font-size: 14px;
          padding: 0px 2px;
        }
    
        .cambridge-popup .audio-btn .audio-icon,
        .cambridge-popup .global-btn .global-icon{
          vertical-align: middle;
          cursor: pointer;
          border: none;
          fill: none;
          stroke: #555;
        }
        .cambridge-popup .global-btn .global-icon{
          width: 19px;
          height: 19px;
          stroke: none;
          fill: #555;
        }
        .cambridge-popup .audio-btn .audio-icon:hover{
          stroke: #000;
        }
        .cambridge-popup .global-btn .global-icon:hover{
          fill: #000;
        }
    
        .cambridge-popup .part-item {
          margin: 8px 0;
          padding: 6px 0;
          border-left: 3px solid #007BFF;
          padding-left: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
    
        .cambridge-popup .detail-section {
          margin-top: 16px;
        }
    
        .cambridge-popup .detail-title {
          font-weight: bold;
          color: #545454;
          margin: 12px 0 6px 0;
        }
    
        .cambridge-popup .example {
          margin: 10px 0;
          padding: 8px;
          background: #f1f8ff;
          border-radius: 4px;
          font-size: 14px;
        }
    
        .cambridge-popup .example-en {
          font-style: italic;
          margin-bottom: 4px;
        }
    
        .cambridge-popup .example-zh {
          color: #444;
        }
    
        /* 底部来源说明 */
        .cambridge-popup .footer {
          padding: 5px 15px;
          border-top: 1px solid #eee;
          background: #fafafa;
          color: #888;
          line-height: 20px;
        }
    
        .cambridge-popup .footer a {
          font-size: 14px;
          color: #666;
        }
    
        .cambridge-popup .footer .copyright {
          font-size: 12px;
          float: right;
          cursor: pointer;
        }
        .cambridge-popup .footer .copyright:hover{
          text-decoration: underline;
        }
        .cambridge-popup .cb-level {
            font-weight: bold;
        }
        .cambridge-popup .cambridge-ad{
          cursor: pointer;
        }
        .cambridge-popup .cambridge-ad div {
          margin: 12px 0;
          padding: 10px;
          background: #fff8e1;
          border: 1px solid #ffd54f;
          border-radius: 6px;
          font-size: 13px;
          text-align: center;
          color: #5d4037;
          opacity: 0.85;
        }
        .cambridge-popup .cambridge-ad a {
          display: inline-block;
          margin-top: 6px;
          color: #d32f2f;
          font-weight: bold;
          text-decoration: none;
        }

        .cambridge-popup .close-btn::before {
          content: "×";
          transform: translateY(-1.6px);
          display: block;
        }

        .third-dict-icon {
          float: right;
          vertical-align: middle;
          margin-top: 10px;
          cursor: pointer;
        }

        .third-dict-links {
          font-size: 16px;
          font-weight: normal;
          margin-top: 10px;
          display: inline-block;
        }
        .thirdDictLink {
          cursor: pointer;
        }

        .pin-btn svg {
          height: 13.5px;
          width: 13.5px;
          fill: currentColor;
          transform: scale(1.18);
          margin-top: 2px;
        }

        /*************************** 这里添加黑色主题样式 *************************/
        .cambridge-popup.cb-dark {
          background: #1e1e1e;
          border-color: #444;
          color: #e0e0e0;
        }

        .cambridge-popup.cb-dark .popup-header {
          background: #2d2d2d;
          border-bottom-color: #444;
        }

        .cambridge-popup.cb-dark .popup-title {
          color: #f0f0f0;
        }

        .cambridge-popup.cb-dark .close-btn,
        .cambridge-popup.cb-dark .pin-btn{
          background: #3c3c3c;
          color: #aaa;
        }

        .cambridge-popup.cb-dark .close-btn:hover,
        .cambridge-popup.cb-dark .pin-btn:hover{
          background: #555;
          color: #fff;
        }

        .cambridge-popup.cb-dark .popup-body {
          background: #1e1e1e;
        }

        .cambridge-popup.cb-dark .word,
        .cambridge-popup.cb-dark .word #searchInput{
          color: #ffffff;
        }

        .cambridge-popup.cb-dark .phonetic-item {
          color: #cccccc;
        }

        .cambridge-popup.cb-dark .global-btn{
          margin-left: 2px;
        }

        .cambridge-popup.cb-dark .audio-btn,
        .cambridge-popup.cb-dark .global-btn{
          color: #4da6ff;
        }

        .cambridge-popup.cb-dark .audio-icon {
          stroke: #cccccc;
        }
        .cambridge-popup.cb-dark .global-icon {
          fill: #cccccc;
        }

        .cambridge-popup.cb-dark .part-item {
          background: #262626;
          border-left-color: #007BFF;
          color: #e0e0e0;
        }

        .cambridge-popup.cb-dark .detail-title {
          color: #eaeaea;
        }

        .cambridge-popup.cb-dark .example {
          background: #252526;
        }

        .cambridge-popup.cb-dark .example-en {
          color: #d4d4d4;
        }

        .cambridge-popup.cb-dark .example-zh {
          color: #e0e0e0;
        }

        .cambridge-popup.cb-dark .footer {
          background: #252525;
          border-top-color: #444;
          color: #999;
        }

        .cambridge-popup.cb-dark .footer a {
          color: #aaa;
        }

        .cambridge-popup.cb-dark .footer a:hover,
        .cambridge-popup.cb-dark .footer .copyright:hover{
          color: #ddd;
        }

        .cambridge-popup.cb-dark .cb-level {
          color: #ffd700;
        }

        .cambridge-popup.cb-dark .audio-btn .audio-icon:hover{
          stroke: #fff;
        }
        .cambridge-popup.cb-dark .global-btn .global-icon:hover{
          fill: #fff;
        }

        .cambridge-popup.cb-dark .cambridge-ad div {
          background: #332d22;
          border-color: #b58c00;
          color: #ffe082;
        }

        .cambridge-popup.cb-dark .cambridge-ad a {
          color: #ffcc80 !important;
        }

        /* 全球发音列表样式 */
        .cambridge-popup .global-voices-list {
          position: absolute;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 50%;
          z-index: 10000;
          display: none;
          padding: 0;
          top: 0;
          right: 15px;
        }

        .cambridge-popup .global-voices-list .voice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
          font-weight: bold;
        }

        .cambridge-popup .global-voices-list .voice-header .close-voices-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
          opacity: 0.7;
          transform: scale(1.18);
          margin-top: -3px;
          margin-right: -5px;
        }

        .cambridge-popup .global-voices-list .voice-header .close-voices-btn:hover {
          opacity: 1;
        }

        .cambridge-popup .global-voices-list .voice-content {
          max-height: 180px;
          overflow-y: auto;
        }

        .cambridge-popup .global-voices-list .voice-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .cambridge-popup .global-voices-list .voice-item:hover {
          background-color: #f5f5f5;
        }

        .cambridge-popup .global-voices-list .voice-item .voice-icon {
          margin-right: 8px;
          width: 20px;
          height: 20px;
          fill: #555;
          margin-top: -8px;
        }

        .cambridge-popup .global-voices-list .voice-item .voice-info {
          display: flex;
          gap: 8px;
          font-size: 14px;
        }

        .cambridge-popup.cb-dark .global-voices-list {
          background: #1e1e1e;
          border-color: #444;
          color: #e0e0e0;
        }

        .cambridge-popup.cb-dark .global-voices-list .voice-header {
          background: #2d2d2d;
          border-bottom-color: #444;
          color: #f0f0f0;
        }

        .cambridge-popup.cb-dark .global-voices-list .voice-header .close-voices-btn {
          color: #aaa;
        }

        .cambridge-popup.cb-dark .global-voices-list .voice-header .close-voices-btn:hover {
          color: #fff;
        }

        .cambridge-popup.cb-dark .global-voices-list .voice-item:hover {
          background-color: #2d2d2d;
        }

        .cambridge-popup.cb-dark .global-voices-list .voice-item .voice-icon {
          fill: #cccccc;
        }

        .cambridge-popup.cb-dark .global-voices-list .voice-item .voice-info {
          color: #e0e0e0;
        }
      </style>
      <div id="cambridgePopup" class="cambridge-popup">
        <div class="popup-header" id="dragHandle">
          <h2 class="popup-title"><img style="vertical-align:middle;" src="https://dictionary.cambridge.org/zhs/external/images/favicon.ico?version=6.0.57" /> 剑桥词典</h2>
          <button class="pin-btn">
            <svg><use xlink:href="#iconPin"></use></svg>
          </button>
          <button class="close-btn"></button>
        </div>
        <div class="popup-body">
          <!-- 数据占位 -->
          <div class="word">Loading</div>
          <div class="phonetics">
            <div class="phonetic-item">
              <span>英</span>
              <span>[Loading]</span>
              <button class="audio-btn">
                <svg class="audio-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
                  <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
              </button>
            </div>
            <div class="phonetic-item">
              <span>美</span>
              <span>[Loading]</span>
              <button class="audio-btn">
                <svg class="audio-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
                  <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
              </button>
            </div>
          </div>
    
          <div class="part-item">Loading</div>
    
          <div class="detail-section">
            <div class="detail-title">英文释义</div>
            <div>Loading</div>
            <div class="detail-title">中文释义</div>
            <div>Loading</div>
            <div class="example">
              <div class="example-en">Loading</div>
              <div class="example-zh">Loading</div>
            </div>
          </div>
        </div>
        <div class="footer">
          <a class="cb-more" target="_blank"
            href="https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD-%E6%B1%89%E8%AF%AD-%E7%AE%80%E4%BD%93/">更多释义</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a class="cb-ai" target="_blank"
            href="https://chat.baidu.com/search?word=">问AI</a>
          <span class="copyright">打赏作者</span>
        </div>
      </div>
    `;
  document.body.insertAdjacentHTML('beforeend', html);
  const placeHoder = document.querySelector('#cambridgePopup .popup-body').outerHTML;
  if(!enablePin) document.querySelector('#cambridgePopup .pin-btn').style.display = 'none';

  const baseUrl = 'https://dictionary.cambridge.org';
  const showAd = true;

  // 监听工具栏出现
  document.addEventListener('selectionchange', (event) => {
    const selection = window.getSelection().toString().trim();
    if (!selection) return;
    const protyle = event.target.activeElement?.closest('.protyle');
    if (!protyle) return;
    const toolbar = protyle.querySelector('.protyle-toolbar');
    if (!toolbar) return;
    let assistantSelectBtn = toolbar.querySelector('button[data-type="cambridgePopup"]');
    // 钉住时，选择即查词
    if(assistantSelectBtn && enablePin && isQueryWhenSelectWhenPined && isPined) {
      assistantSelectBtn.click();
    }
    if (assistantSelectBtn) return;
    // 创建按钮
    const button = `<button class="protyle-toolbar__item b3-tooltips b3-tooltips__ne" style="font-size:14px;" data-type="cambridgePopup" aria-label="剑桥词典"><img style="vertical-align:middle;" src="https://dictionary.cambridge.org/zhs/external/images/favicon.ico?version=6.0.57" /></button>`;
    toolbar.insertAdjacentHTML('afterbegin', button);
    assistantSelectBtn = toolbar.querySelector('button[data-type="cambridgePopup"]');
    const clickHandler = (event) => {
      event.stopPropagation();
      toolbar.classList.add("fn__none");
      if(window.siyuan.config.appearance.mode === 1) {
        // 黑色主题
        popup.classList.add('cb-dark');
      } else {
        // 亮色主题
        popup.classList.remove('cb-dark');
      }
      popup.style.zIndex = ++window.siyuan.zIndex;
      popup.style.display = 'flex';
      //assistantSelectBtn.removeEventListener('click', clickHandler);
      // 开始查词
      const selection = window.getSelection().toString().trim();
      queryWords(selection);
    };
    assistantSelectBtn.addEventListener('click', clickHandler);

    // 工具栏第三方词典列表
    if(enableTheThirdDicts) {
      theThirdDicts.forEach((theThirdDict, index) => {
        const positionFilter = pos => !pos||pos.split(/[,，]/).map(p=>p.trim()).filter(Boolean).some(p=>['toolbar', 'both', 'all'].includes(p));
        if(positionFilter(theThirdDict.position)){
          const button = `<button class="protyle-toolbar__item b3-tooltips b3-tooltips__ne" style="font-size:14px;" data-type="theThirdDict${index}" aria-label="${theThirdDict.name}"><img style="vertical-align:middle;" src="${theThirdDict.icon}" /></button>`;
          toolbar.insertAdjacentHTML('afterbegin', button);
          btn = toolbar.querySelector(`button[data-type="theThirdDict${index}"]`);
          btn.addEventListener('click', (e) => {
            const selection = window.getSelection().toString().trim();
            if(typeof theThirdDict.command === 'function') {
              theThirdDict.command({selection, theThirdDict, result: null, event:e, eventType:'click'});
            } else {
              window.open(theThirdDict.command.replace('{{keyword}}', selection));
            }
          });
          if(typeof theThirdDict.command === 'function') {
            btn.addEventListener('contextmenu', (e) => {
              const selection = window.getSelection().toString().trim();
              theThirdDict.command({selection, theThirdDict, result: null, event:e, eventType:'contextmenu'});
            });
          }
        }
      });
    }
  });

  // 开始查词
  function queryWords(keyword) {
    const selection = keyword;
    let path = 'dictionary/english-chinese-simplified';
    const completion = (result) => {
      // 未查到
      if (result.error) {
        if(path === 'dictionary/english-chinese-simplified') {
          path = 'dictionary/english';
          translate({ text: keyword, detectFrom: "en", path: path }, completion);
          return;
        }
        let theTirdDictStr = '';
        if(enableTheThirdDicts) {
          const positionFilter = d => !d.position||d.position.split(/[,，]/).map(p=>p.trim()).filter(Boolean).some(p=>['notfound', 'both', 'all'].includes(p));
          const theTirdDictLinks = theThirdDicts.filter(positionFilter).map((d,i) => `<a class="thirdDictLink" data-href="${encodeURIComponent(d.command)}" data-index="${i}">${d?.name}</a>`);
          theTirdDictStr = `<br /><span class="third-dict-links">试试 ${theTirdDictLinks.join(' 或 ')}<span>`;
        }
        const popupBody = popup.querySelector('.popup-body');
        popupBody.innerHTML = `<div class="word">未找到结果！${theTirdDictStr}</div>`;
        popupBody.querySelector('.third-dict-links').addEventListener('click', (e) => {
          const link = e.target?.closest('.thirdDictLink');
          if(!link) return;
          const command = decodeURIComponent(link?.dataset?.href || '');
          if(command === aiSearchUrl) window.open(command.replace('{{keyword}}', aiPrompt.replace('{{keyword}}', selection)));
          else {
            const theThirdDict = theThirdDicts[link?.dataset?.index];
            if(typeof theThirdDict?.command === 'function') {
              theThirdDict.command({selection, theThirdDict, result, event:e});
            } else {
              window.open(command.replace('{{keyword}}', selection));
            }
          }
        });
        return;
      }
      const toDict = result.result.toDict;

      // === 动态填充 UI ===
      const body = popup.querySelector('.popup-body');
      body.innerHTML = '';

      // 单词
      const wordEl = document.createElement('div');
      wordEl.className = 'word';
      wordEl.innerHTML = `<input type="text" id="searchInput" data-value="${toDict.word}" value="${toDict.word}" />`;
      const searchInput = wordEl.querySelector('#searchInput');
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
          const keyword = this.value.trim();
          if(keyword) queryWords(keyword);
        }
      });
      searchInput.addEventListener('blur', function(e) {
        if(this.value !== this.dataset?.value) this.value = this.dataset?.value;
      });
      // 查词页面右侧-第三方词典图标
      if(enableTheThirdDicts) {
        theThirdDicts.forEach((theThirdDict, index) => {
          const positionFilter = pos => !pos||pos.split(/[,，]/).map(p=>p.trim()).filter(Boolean).some(p=>['dictpage', 'both', 'all'].includes(p));
          if(positionFilter(theThirdDict.position)) {
            const theThirdDictIcon = document.createElement('img');
            theThirdDictIcon.src = theThirdDict?.icon;
            theThirdDictIcon.title = theThirdDict.name;
            theThirdDictIcon.className = 'third-dict-icon';
            if(index > 0) theThirdDictIcon.style.marginRight = '10px';
            wordEl.appendChild(theThirdDictIcon);
            theThirdDictIcon.addEventListener('click', (e) => {
              if(typeof theThirdDict?.command === 'function') {
                theThirdDict.command({selection:toDict.word, theThirdDict, result, event:e, eventType:'click'});
              } else {
                window.open(theThirdDict.command.replace('{{keyword}}', toDict.word));
              }
            });
            if(typeof theThirdDict?.command === 'function') {
              theThirdDictIcon.addEventListener('contextmenu', (e) => {
                theThirdDict.command({selection:toDict.word, theThirdDict, result, event:e, eventType:'contextmenu'});
              });
            }
          }
        });
      }
      body.appendChild(wordEl);

      // 单词词性
      const posgramEl = document.createElement('div');
      posgramEl.className = 'posgram';
      posgramEl.textContent = toDict.posgram;
      body.appendChild(posgramEl);

      // 音标
      const phoneticsEl = document.createElement('div');
      phoneticsEl.className = 'phonetics';
      toDict.phonetics.forEach(p => {
        if (!p.ipa) return;
        const item = document.createElement('div');
        item.className = 'phonetic-item';
        const regionText = p.region === 'us' ? '美' : '英';
        item.innerHTML = `
                      <span>${regionText}</span>
                      <span>[${p.ipa}]${p.ipaWeak ? ` weak [${p.ipaWeak}]` : ''}</span>
                      <button class="audio-btn" data-audio="${p.audio}">
                        <svg class="audio-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
                          <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
                        </svg>
                      </button>
                  `;
        phoneticsEl.appendChild(item);
        
        // 自动朗读
        if(isAutoReadOnLoaded && autoReadType === p.region) {
          playAudio(baseUrl + p.audio);
        }
      });
      
      // 全球发音
      const item = document.createElement('div');
      item.className = 'phonetic-item';
      item.innerHTML = `<button class="global-btn" title="全球真人发音">
                          <svg t="1760713446134" class="global-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17008" width="28" height="28">
                            <path stroke-width="1.5" d="M512 85.333333c234.666667 0 426.666667 192 426.666667 426.666667s-192 426.666667-426.666667 426.666667S85.333333 746.666667 85.333333 512 277.333333 85.333333 512 85.333333z m136.533333 89.6v64c-0.341333 30.122667-1.365333 57.344-4.266666 76.8-8.192 53.162667-55.552 94.549333-108.288 94.165334L520.533333 409.6l-59.733333-8.533333h-4.266667c-15.36 0-27.264 10.368-32.597333 24.874666L422.4 430.933333v106.666667c0 44.330667-26.624 84.864-65.536 100.010667L349.866667 640l-8.533334 4.266667-153.6 38.4c59.733333 115.2 183.466667 192 320 192 17.066667 0 34.133333 0 51.2-2.176l12.8-2.090667-4.266666-4.266667-25.6-21.333333c-38.4-29.866667-46.933333-89.6-17.066667-128l8.277333-8.064c6.058667-5.674667 13.098667-11.52 20.394667-15.232l5.461333-2.304 8.533334-4.266667 42.666666-17.066666c12.8-4.266667 21.333333-17.066667 21.333334-34.133334-4.266667-64 12.8-110.933333 55.466666-128 59.733333-25.6 115.2-8.533333 183.466667 55.466667 4.266667-17.066667 4.266667-34.133333 4.266667-51.2 0-153.6-93.866667-281.6-226.133334-337.066667z m64 401.066667c-8.533333 4.266667-12.8 17.066667-8.533333 55.466667 4.266667 46.933333-21.333333 85.333333-64 106.666666l-8.533333 4.266667-14.464 4.906667-17.237334 6.357333-8.533333 3.541333c-6.144 2.730667-9.813333 4.906667-10.965333 6.528-4.266667 8.533333-4.266667 17.066667 4.266666 25.6l51.2 42.666667 15.658667 15.445333 5.674667-2.645333c83.157333-37.418667 154.154667-107.221333 189.312-193.706667l1.578666-3.114666a15.744 15.744 0 0 0 0.810667-1.792 18.261333 18.261333 0 0 0-5.248-7.509334l-2.986667-2.944c-59.733333-59.733333-93.866667-72.533333-128-59.733333zM512 145.066667c-200.533333 0-362.666667 162.133333-362.666667 362.666666 0 28.458667 2.986667 56.874667 8.874667 85.333334l3.925333 17.066666 157.866667-38.4c11.392-3.797333 22.741333-14.336 25.173333-25.6l0.426667-4.266666v-106.666667a105.514667 105.514667 0 0 1 99.541333-106.453333L452.266667 328.533333h17.066666l59.733334 8.533334a41.258667 41.258667 0 0 0 36.949333-25.344L567.466667 302.933333l4.266666-98.133333V153.6c-17.066667-4.266667-40.533333-8.533333-59.733333-8.533333z" p-id="17009"></path>
                          </svg>
                        </button>`;
      phoneticsEl.appendChild(item);
      body.appendChild(phoneticsEl);

      // 全球发音列表容器
      const globalVoicesList = document.createElement('div');
      globalVoicesList.className = 'global-voices-list';
      body.appendChild(globalVoicesList);

      // 添加全球发音点击事件
      item.querySelector('.global-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if(globalVoicesList.style.display === 'block') {
          globalVoicesList.style.display = 'none';
          return;
        }
        // Loading
        globalVoicesList.innerHTML = 'Loading...';
        setTimeout(() => {
          if(globalVoicesList.style.display !== 'block') {
            globalVoicesList.style.zIndex = ++window.siyuan.zIndex;
            globalVoicesList.style.display = 'block';
          }
        }, 500);
        // 计算并设置弹窗位置
        const btnRect = item.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        // 判断按钮在弹窗中的相对位置（以弹窗中心为界）
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const popupCenterX = popupRect.left + popupRect.width / 2;
        if (btnCenterX < popupCenterX) {
          // 按钮靠左 → 弹窗显示在右侧（对齐按钮右边缘）
          //const leftPos = btnRect.right - popupRect.left;
          //globalVoicesList.style.left = `${leftPos}px`;
          globalVoicesList.style.right = '';
          globalVoicesList.style.left = `15px`;
        } else {
          // 按钮靠右 → 弹窗显示在左侧（对齐按钮左边缘）
          //const rightPos = popupRect.right - btnRect.left;
          //globalVoicesList.style.right = `${rightPos}px`;
          globalVoicesList.style.left = '';
          globalVoicesList.style.right = `15px`;
        }
        const topOffset = btnRect.bottom - popupRect.top;
        globalVoicesList.style.top = `${topOffset}px`;
        // 获取全球发音
        const keyword = toDict.word;
        let voices = await getGlobalVoices(keyword.toLowerCase());
        if(voices.length === 0 && keyword.toLowerCase() !== selection.toLowerCase()) {
          voices = await getGlobalVoices(selection.toLowerCase());
        }
        // 清空内容
        globalVoicesList.innerHTML = '';
        // 构建标题
        const header = document.createElement('div');
        header.className = 'voice-header';
        header.innerHTML = `
          <span>有 ${voices.length} 个发音</span>
          <button class="close-voices-btn">×</button>
        `;
        globalVoicesList.appendChild(header);

        // 创建内容容器
        const contentContainer = document.createElement('div');
        contentContainer.className = 'voice-content';
        globalVoicesList.appendChild(contentContainer);

        if (voices.length === 0) {
          const noVoiceItem = document.createElement('div');
          noVoiceItem.className = 'voice-item';
          noVoiceItem.textContent = '暂无全球发音';
          contentContainer.appendChild(noVoiceItem);
        } else {
          voices.forEach(voice => {
            const voiceItem = document.createElement('div');
            voiceItem.className = 'voice-item';
            voiceItem.innerHTML = `
              <svg class="voice-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.7143 18.1786H8C7.44772 18.1786 7 17.7109 7 17.134V10.866C7 10.2891 7.44772 9.82136 8 9.82136H10.7143L14.3177 7.28302C14.9569 6.65978 16 7.1333 16 8.04673V19.9533C16 20.8667 14.9569 21.3402 14.3177 20.717L10.7143 18.1786Z" stroke-width="1.5"></path>
                <path d="M19 18C19.6341 17.4747 20.1371 16.8511 20.4802 16.1648C20.8234 15.4785 21 14.7429 21 14C21 13.2571 20.8234 12.5215 20.4802 11.8352C20.1371 11.1489 19.6341 10.5253 19 10" stroke-width="1.5" stroke-linecap="round"></path>
              </svg>
              <div class="voice-info">
                <span>${voice.gender}</span>
                <span>${voice.country}</span>
              </div>
            `;
            voiceItem.addEventListener('click', () => {
              playAudio(voice.audio);
            });
            contentContainer.appendChild(voiceItem);
          });
          // 更多发音
          const voiceItem = document.createElement('div');
          voiceItem.className = 'voice-item';
          voiceItem.innerHTML = `<div class="voice-info" style="margin-left:7px;">更多&gt;&gt;</div>`;
          voiceItem.addEventListener('click', () => {
            window.open(`https://zh.forvo.com/search/${toDict.word}/en_usa/`);
          });
          contentContainer.appendChild(voiceItem);
        }
        if(globalVoicesList.style.display !== 'block') {
          globalVoicesList.style.zIndex = ++window.siyuan.zIndex;
          globalVoicesList.style.display = 'block';
        }

        // 绑定关闭按钮事件
        header.querySelector('.close-voices-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          globalVoicesList.style.display = 'none';
        });
      });

      // 绑定查词弹窗事件
      popup.addEventListener('click', (e) => {
        if(!e.target.closest('.global-voices-list')) {
          e.stopPropagation();
          globalVoicesList.style.display = 'none';
        }
      });
      
      // 点击空白关闭全球发音列表
      document.addEventListener('click', (e) => {
        if (!globalVoicesList.contains(e.target) && !item.contains(e.target)) {
          globalVoicesList.style.display = 'none';
        }
      });

      // 动词变化
      const irregEl = document.createElement('div');
      irregEl.className = 'posgram';
      irregEl.innerHTML = toDict.irregText;
      body.appendChild(irregEl);

      // 所有翻译（parts）
      toDict.parts.forEach(part => {
        const partEl = document.createElement('div');
        partEl.className = 'part-item';
        partEl.textContent = `${part.part} ${part.means.join('; ')}`;
        body.appendChild(partEl);
      });

      // 随机广告
      if(showAd) {
        const ads = [
          `
            <strong>🎁 七牛AI平台大放送！</strong><br>
            体验即送 <b>1300万Token</b>，邀请10人即享 <b>1亿+Token</b>！<br>
            <a data-href="https://s.qiniu.com/FfQvia">👉 点击立即领取 ←</a>
          `,
          `
            推荐免费AI平台：
            <a data-href="https://cloud.siliconflow.cn/i/8kP68u0B">硅基流动</a>
          `,
          `
            推荐国外AI平台：
            <a data-href="https://api.gpt.ge/register?aff=GlNE">V-API</a>&nbsp;
            <span>模型多、稳定快速，价格比官方更划算。</span>
          `,
          `
            学知识，学编程，
            <a data-href="https://www.zhihu.com/people/wilsonses">关注作者</a>，
            <span>不迷路！</span>
          `
        ];
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        const adEl = document.createElement('div');
        adEl.className = 'cambridge-ad';
        adEl.innerHTML = `<div>${randomAd}</div>`;
        body.appendChild(adEl);
        body.querySelector('.cambridge-ad').addEventListener('click', function() {
          window.open(this.querySelector('a[data-href]')?.dataset?.href);
        });
      }

      // 详细释义（additions）
      const detailSection = document.createElement('div');
      detailSection.className = 'detail-section';
      toDict.additions.forEach(add => {
        const titleEl = document.createElement('div');
        titleEl.className = 'detail-title';
        titleEl.textContent = add.part;
        detailSection.appendChild(titleEl);

        if (add.part.startsWith('例句')) {
          const [en, zh] = add.means[0].split('\n');
          const exampleEl = document.createElement('div');
          exampleEl.className = 'example';
          exampleEl.innerHTML = `
                          <div class="example-en">${en || ''}</div>
                          <div class="example-zh">${zh || ''}</div>
                      `;
          detailSection.appendChild(exampleEl);
        } else {
          const defEl = document.createElement('div');
          defEl.innerHTML = markLevel(add.means[0] || '');
          detailSection.appendChild(defEl);
        }
      });
      body.appendChild(detailSection);

      // 更新底部链接
      const more = popup.querySelector('.footer a.cb-more');
      if (more) {
        const encodedWord = encodeURIComponent(toDict.word);
        more.href = `${baseUrl}/${path}/${encodedWord}`;
      }
      const ai = popup.querySelector('.footer a.cb-ai');
      if (ai) {
        const encodedWord = encodeURIComponent(aiPrompt.replace('{{keyword}}', toDict.word));
        ai.href = aiSearchUrl.replace('{{keyword}}', encodedWord);
      }
    }
    translate({ text: keyword, detectFrom: "en", path: path }, completion);
  }

  /**
   *
   * @param {object} query
   * @param {string} query.detectFrom = en; 一定不是 auto
   * @param {string} query.detectTo = "zh-Hans" 一定不是 auto
   * @param {string} query.from = auto 可能是 auto
   * @param {string} query.to = auto 可能是 auto
   * @param {string} query.text = "string"
   * @param {*} completion
   * see https://github.com/yaobinbin333/bob-plugin-cambridge-dictionary/blob/cbdab3becad9b3b33165ff99dff4bab44ed54e17/src/entry.ts#L17
   */
  /* 调用示例
  translate({ text: "example", detectFrom: "en" }, (result) => {
      console.log(result);
  });
  */
  async function translate(query, completion) {
    if (query.detectFrom !== 'en' || !query.text || query.text.split(' ').length > 3) {
      completion({ error: { type: 'notFound' } });
      return;
    }

    const text = query.text.split(' ').join('-');
    const encodedText = encodeURIComponent(text);
    const path = query?.path?.trim() || 'dictionary/english-chinese-simplified';
    const url = `${baseUrl}/${path}/${encodedText}`;
    //const url = `${baseUrl}/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD-%E6%B1%89%E8%AF%AD-%E7%AE%80%E4%BD%93/${encodedText}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const htmlText = await response.text();
      main(htmlText, completion);
    } catch (err) {
      console.error(`Fetch error: ${err}`);
      completion({
        error: { type: 'network', message: String(err) }
      });
    }
  }

  function main(htmlText, completion) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const headwordEl = doc.querySelector('.headword');
    const word = getText(headwordEl);
    const hasWord = headwordEl !== null;

    console.log(`word: ${word}`);

    if (!hasWord) {
      completion({ error: { type: 'notFound' } });
      return;
    }

    // 获取词性
    const posgram = doc.querySelector('.posgram')?.textContent?.trim() || '';

    // 获取动词变化
    
    const irreg = doc.querySelector('.entry:first-of-type')?.querySelector('.pos-header .irreg-infls');
    const strongs = irreg?.querySelectorAll('b');
    let irregText = irreg?.textContent?.trim() || '';
    if(irregText?.startsWith('-') && irregText?.endsWith('-')) irregText = '';
    if(irregText && strongs.length) {
      strongs.forEach(b => {
        irregText = irregText.replace(b.textContent, `<b>${b.textContent}</b>`);
      });
    }

    // 音标和音频
    const usBlock = doc.querySelector('.us');
    const ukBlock = doc.querySelector('.uk');

    let ukWeak = '';
    const ukWeakBlock = usBlock?.nextElementSibling;
    if(ukWeakBlock && !ukWeakBlock.matches('.us')) {
      ukWeak = ukWeakBlock?.querySelector('.pron .ipa')?.textContent?.trim() || '';
    }
    const usWeak = usBlock?.nextElementSibling?.querySelector('.pron .ipa')?.textContent?.trim() || '';

    const phonetics = [
      makePhonetic(
        usBlock?.querySelector('.pron .ipa'),
        usBlock?.querySelector('[type="audio/mpeg"]'),
        'us',
        usWeak
      ),
      makePhonetic(
        ukBlock?.querySelector('.pron .ipa'),
        ukBlock?.querySelector('[type="audio/mpeg"]'),
        'uk',
        ukWeak
      )
    ];

    console.log(`phonetics: ${JSON.stringify(phonetics)}`);

    const parts = [];
    const partMap = new Map();

    const entryEls = qa('.entry-body__el', doc);
    const explanationCnt = entryEls.length;
    console.log(`explanation count: ${explanationCnt}`);

    entryEls.forEach((el) => {
      const curPartSpeech =
        getText(el.querySelector('.posgram')) ||
        getText(el.querySelector('.anc-info-head')) ||
        'unknown';

      qa('.dsense', el).forEach((dsenseEl) => {
        qa('.def-block', dsenseEl).forEach((defBlockEl) => {
          const enExplanation = getText(defBlockEl.querySelector('.ddef_h'));
          const cnExplanation = getText(defBlockEl.querySelector('.ddef_b')?.firstElementChild);

          pushPart(parts, `${curPartSpeech}-英文释义`, enExplanation);
          pushPart(parts, `${curPartSpeech}-中文释义`, cnExplanation);
          if (cnExplanation) {
            addMap(partMap, curPartSpeech, cnExplanation);
          }

          let exampleCnt = 0;
          let shouldPushEg = true;

          qa('.examp', defBlockEl).forEach((exampEl) => {
            const enExample = getText(exampEl.querySelector('.eg'));
            const cnExample = getText(exampEl.querySelector('.eg')?.nextElementSibling);

            if (shouldPushEg && (enExample || cnExample)) {
              pushPart(parts, `例句${exampleCnt + 1}`, `${enExample}\n${cnExample}`);
            }

            exampleCnt++;
            if (explanationCnt > 1 && exampleCnt >= 1) {
              shouldPushEg = false;
            }
          });
        });
      });
    });

    console.log(`parts: ${JSON.stringify(parts)}`);

    const res = {
      from: 'en',
      to: 'zh-Hans',
      fromParagraphs: [word],
      toDict: {
        phonetics: phonetics,
        additions: transformToAdditions(parts),
        parts: mapToParts(partMap),
        word: word,
        posgram: posgram,
        irregText: irregText,
      },
      raw: '',
      toParagraphs: [word],
    };

    completion({
      result: res
    });

    console.log(`res: ${JSON.stringify(res)}`);
  }

  function markLevel(str) {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const level = levels.find(l => str.startsWith(l));
    if (level?.length) {
      return str.replace(level, `<span class="cb-level">${level}</span>`);
    }
    return str;
  }

  function addMap(map, key, value) {
    if (map.has(key)) {
      map.get(key).push(value);
    } else {
      map.set(key, [value]);
    }
  }

  function mapToParts(map) {
    const parts = [];
    map.forEach((value, key) => {
      parts.push({
        part: key,
        means: value
      });
    });
    return parts;
  }

  // 安全获取文本
  function getText(el) {
    return el?.textContent?.trim() || '';
  }

  // 查询单个元素
  function q(selector, context = document) {
    return context.querySelector(selector);
  }

  // 查询多个元素
  function qa(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

  function makePhonetic(ipaEl, audioEl, region, ipaWeak) {
    return {
      ipa: getText(ipaEl),
      ipaWeak: ipaWeak,
      audio: audioEl?.getAttribute('src') || '',
      region: region
    };
  }

  function pushPart(parts, part, ...means) {
    const trimmedMeans = means.map(m => m.trim()).filter(m => m);
    if (trimmedMeans.length > 0) {
      parts.push({
        part: part.trim(),
        means: trimmedMeans
      });
    }
  }

  // 假设 transformToAdditions 已定义（你需保留该函数）
  // 如果没有，请提供或临时返回空数组
  function transformToAdditions(parts) {
    // 示例：直接返回原结构，或按需转换
    return parts;
  }

  // 播放音频
  function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
  }

  function closePopup(isPined = false) {
    if(!isPined) {
      popup.style.display = 'none';
      //popupBody.innerHTML = placeHoder;
    }
  }

  // === 拖动逻辑：仅限标题栏 ===
  const popup = document.getElementById('cambridgePopup');
  const popupBody = popup.querySelector('.popup-body');
  const dragHandle = popup.querySelector('#dragHandle');

  let isDragging = false;
  let offsetX, offsetY;

  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    popup.style.left = `${e.clientX - offsetX}px`;
    let top = e.clientY - offsetY;
    // 限制不能超过距离视窗顶部32px
    if (top < 32) {
        top = 32;
    }
    popup.style.top = `${top}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  popup.querySelector('.close-btn').addEventListener('click', () => {
    closePopup();
  });

  popup.querySelector('.audio-btn').addEventListener('click', () => {
    playAudio();
  });

  // 点击空白关闭
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target)) {
      closePopup(isPined);
    }
  });

  // 阻止内容区点击关闭
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 播放音频
  popupBody.addEventListener('click', (e) => {
    const audioBtn = e.target?.closest('.audio-btn');
    if (!audioBtn) return;
    playAudio(baseUrl + audioBtn?.dataset?.audio);
  });
  // esc退出
  document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if(popup?.style?.display !== 'none') closePopup();
      }
  });
  // 钉住取消钉住
  let isPined = false;
  popup.querySelector('.pin-btn').addEventListener('click', function(e) {
    const use = this.querySelector('svg use');
    if(use.getAttribute('xlink:href') === '#iconPin') {
      // 钉住
      isPined = true;
      use.setAttribute('xlink:href', '#iconUnpin');
    } else {
      // 取消钉住
      isPined = false;
      use.setAttribute('xlink:href', '#iconPin');
    }
  });
  // 打赏作者
  popup.querySelector('.copyright').addEventListener('click', () => {
    window.open('https://ld246.com/article/1760544378300#%E6%89%93%E8%B5%8F%E4%BD%9C%E8%80%85');
  });

  // 获取全球发音
  async function getGlobalVoices(keyword) {
    const url = `https://dict.eudic.net/dicts/en/${encodeURIComponent(keyword)}`;
    const response = await fetch(url);
    const html = await response.text();
  
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  
    const gvDetails = doc.querySelector('.gv_details');
    if (!gvDetails) return [];
  
    const items = gvDetails.querySelectorAll('.gv_item');
    const result = [];
  
    for (const item of items) {
      const voice = item.querySelector('.gv-voice');
      const gender = item.querySelector('.gv_person');
      const country = item.querySelector('.gv_contury'); // 注意拼写
  
      if (voice && gender && country) {
        result.push({
          audio: voice.getAttribute('data-rel')?.trim() || '',
          gender: gender.textContent.trim(),
          country: country.textContent.trim()
        });
      }
    }
  
    return result;
  }
  async function requestApi(url, data, method = 'POST') {
      return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
  }
  function showMessage(message, isError = false, delay = 7000) {
    return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
        "method": "POST",
        "body": JSON.stringify({"msg": message, "timeout": delay})
    });
  }
  async function querySql(sql) {
    const result = await requestApi('/api/query/sql', { "stmt": sql });
    if (result.code !== 0) {
        console.error("查询数据库出错", result.msg);
        return [];
    }
    return result.data;
 }
  function getCursorElement() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // 获取选择范围的起始位置所在的节点
        const startContainer = range.startContainer;
        // 如果起始位置是文本节点，返回其父元素节点
        const cursorElement = startContainer.nodeType === Node.TEXT_NODE
            ? startContainer.parentElement
            : startContainer;
        return cursorElement;
    }
    return null;
 }
 function sendTextToEditable(element, text) {
    // 聚焦到编辑器
    element.focus();
    // 发送文本
    document.execCommand('insertHTML', false, text);
    // 触发 input 事件
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
  }
  function showInputBox(element, parentEl=document.body, defaultValue='', placeholder='', pos={}, style='') {
    return new Promise((resove)=>{
      // 创建并显示输入框
      let inputBox = parentEl.querySelector('.quick-input-box');
      if (!inputBox) {
          inputBox = document.createElement('input');
          inputBox.type = 'text';
          inputBox.value = defaultValue;
          inputBox.className = 'quick-input-box b3-text-field fn__block';
          inputBox.placeholder = placeholder;
          inputBox.style = `
              position: absolute;
              top: 30px;
              let: 0;
              width: 300px;
              padding: 5px;
              border: 1px solid #888;
              margin-top: 5px;
              background-color: var(--b3-theme-background);
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              display: none;
              z-index: ${++siyuan.zIndex};
              ${style}
          `;
  
          parentEl.appendChild(inputBox); // 将输入框插入到 body 中，确保它浮动显示
      }
  
      // 设置输入框的显示位置
      const rect = element.getBoundingClientRect();
      inputBox.style.top = (pos.top || rect.height) + 'px';
      if(pos.right) {
        inputBox.style.left = 'auto';
        inputBox.style.right = pos.right + 'px';
      } else {
        inputBox.style.left = (pos.left || 0) + 'px';
        inputBox.style.right = 'auto';
      }
      
      // 显示输入框
      inputBox.style.display = 'block';
  
      // 监听 Enter 键提交
      inputBox.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
              inputBox.style.display = 'none';
              resove(inputBox.value); // 这里可以替换成其他提交逻辑
              //parentEl?.removeChild(inputBox); // 提交后移除输入框
          }
          // 监听 Esc 键关闭
          if (e.key === 'Escape') {
              e.stopPropagation();
              inputBox.style.display = 'none';
              resove('');
              //parentEl?.removeChild(inputBox); // 按 Esc 关闭输入框
          }
      });
      // 失去焦点关闭
      inputBox.addEventListener('blur', function (e) {
        inputBox.style.display = 'none';
        resove('');
        //parentEl?.removeChild(inputBox);
      });
  
      // 聚焦输入框
      inputBox.focus();
    });
  }
  let savedSelection = null;
  function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelection = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    }
  }
  function restoreSelection() {
    if (!savedSelection) return;
  
    const selection = window.getSelection();
    selection.removeAllRanges();
  
    const range = document.createRange();
    range.setStart(savedSelection.startContainer, savedSelection.startOffset);
    range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
  
    selection.addRange(range);
  }
  async function getAudioUrlFromCamBridge(word, region = 'us') {
      if (!word || (region !== 'us' && region !== 'uk')) {
        return '';
      }
    
      const baseUrl = 'https://dictionary.cambridge.org';
      const formattedWord = word.split(' ').join('-');
      const encodedWord = encodeURIComponent(formattedWord);
      const url = `${baseUrl}/dictionary/english-chinese-simplified/${encodedWord}`;
    
      try {
        const response = await fetch(url);
        if (!response.ok) return '';
    
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
    
        const block = doc.querySelector(region === 'us' ? '.us' : '.uk');
        if (!block) return '';
    
        const audioEl = block.querySelector('source[type="audio/mpeg"]');
        const relativePath = audioEl?.getAttribute('src');
        if (!relativePath) return '';
    
        return baseUrl + relativePath;
      } catch (err) {
        console.error('获取剑桥发音失败:', err);
        return '';
      }
    }
})();