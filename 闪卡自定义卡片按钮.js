// 闪卡自定义卡片按钮（支持手机版）
// see 
(()=>{
    // 自定义卡片按钮
    const cardButtons = [
        // 第0个按钮（对应原跳过）
        {
            // 按钮文字
            text: '稍后复习',
            // 按钮表情图标
            icon: '😴',
            // 按钮提示文字（鼠标悬停提示文字）
            // 这里换行，提示也会换行，居中显示，忽略空白符
            tipText: `
                一般在当前状态不佳
                内容暂时不需要掌握
                想要调整复习节奏时
                (避免一次性复习过多)
            `,
        },
        
        // 第1个按钮（对应原重来）
        {
            // 按钮文字
            text: '完全不会',
            // 按钮表情图标
            icon: '🤯',
            // 按钮提示文字（鼠标悬停提示文字）
            // 这里换行，提示也会换行，居中显示，忽略空白符
            tipText: `完全不了解，需要重新学习`,
        },
    
        // 第2个按钮（对应原困难）
        {
            // 按钮文字
            text: '有点难',
            // 按钮表情图标
            icon: '😕',
            // 按钮提示文字（鼠标悬停提示文字）
            // 这里换行，提示也会换行，居中显示，忽略空白符
            tipText: `有一定了解，但掌握得不够牢固`,
        },
    
        // 第3个按钮（对应原良好）
        {
            // 按钮文字
            text: '掌握不错',
            // 按钮表情图标
            icon: '😊',
            // 按钮提示文字（鼠标悬停提示文字）
            // 这里换行，提示也会换行，居中显示，忽略空白符
            tipText: `掌握得较好，但仍需巩固`,
        },
    
        // 第4个按钮（对应原简单）
        {
            // 按钮文字
            text: '非常熟悉',
            // 按钮表情图标
            icon: '😎',
            // 按钮提示文字（鼠标悬停提示文字）
            // 这里换行，提示也会换行，居中显示，忽略空白符
            tipText: `
                已掌握或掌握得非常好
                复习频率可以降低
            `,
        }
    ];
    const originTexts = [
        window.siyuan.languages.skip, // 跳过
        window.siyuan.languages.cardRatingAgain, // 重来
        window.siyuan.languages.cardRatingHard, // 困难
        window.siyuan.languages.cardRatingGood, // 良好
        window.siyuan.languages.cardRatingEasy, // 简单
    ]; 
    watchDialogOpenCard((card)=>{
        const buttons = card.querySelectorAll('.card__action :is(button[data-type="-3"],button[data-type="1"],button[data-type="2"],button[data-type="3"],button[data-type="4"])');
        let cardAction;
        buttons.forEach(button => {
            // 防止提示超出容器出现滚动条
            if(!cardAction) {
                cardAction = button.closest('.card__action');
                cardAction.style.overflowX = 'clip';
            }
            const index = button.dataset.type > 0 ? button.dataset.type : 0;
            const newButton = cardButtons[index];
            // 替换文本
            for (const node of button.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    // 只修改文本节点
                    node.textContent = node.textContent.replace(originTexts[index], newButton.text);
                }
            }
            // 替换图标
            const icon = button.querySelector('.card__icon');
            icon.textContent = newButton.icon;
            // 替换提示文字
            const originTipText = button.getAttribute('aria-label');
            const newTipText = newButton.tipText.trim().split('\n').map(i=>i.trim()).join('\n');
            button.setAttribute('aria-label', originTipText + `\n${newTipText}`)
        });
    });
    // 监听闪卡被打开
    function watchDialogOpenCard(callback) {
      const targetNode = document.body;
      const config = { childList: true };
      const observer = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            // 遍历新增的节点
            for (const node of mutation.addedNodes) {
              // 判断是否是直接子元素且匹配 data-key="dialog-opencard"
              if (node.nodeType === Node.ELEMENT_NODE && node.matches && node.matches('[data-key="dialog-opencard"]')) {
                callback(node);
              }
            }
          }
        }
      });
      observer.observe(targetNode, config);
      return observer;
    }
})();