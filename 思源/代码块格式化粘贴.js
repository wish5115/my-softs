// 代码块之缩进格式化粘贴
// 仅支持2空格，4空格和tab三种格式的缩进
// 注意，混合缩进的代码，可能转换不准确，请使用其他编辑器软件处理后再粘贴！
// see https://ld246.com/article/1746030522663
(()=>{
    // 是否启用智能粘贴快捷键 ctrl+alt+v 智能粘贴
    const enableSmartPasteShortcut = true;

    // 智能粘贴快捷键 ctrl+alt+v 智能粘贴
    if(enableSmartPasteShortcut) document.addEventListener('keydown', async function (e) {
        // 判断是否按下 Ctrl + Alt + V
        if (e.metaKey && e.altKey && !e.shiftKey && e.code === 'KeyV') {
            const hljs = getCursorElement()?.closest('.hljs');
            if(!hljs) return;
            formatCodeThenPaste(smartFormatCode);
        }
    });

    // 添加右键菜单
    document.addEventListener('contextmenu', async function (e) {
        const hljs = e.target.closest('.hljs');
        if(!hljs) return;
        whenElementExist('#commonMenu [data-id="pasteEscaped"]').then(element => {
            // 获取思源Tab空格数
            const tabSpace = window.siyuan?.config?.editor?.codeTabSpaces;
            // 智能粘贴菜单
            const addSmartPasteMenuItem = () => {
                const shortCutString = isMac() ? '⌘⌥V' : 'Ctrl+Alt+V';
                const smartPasteHtml = `<button data-id="smartPaste" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">智能转换空白符后粘贴</span><span class="b3-menu__accelerator">${shortCutString}</span></button>`;
                element.insertAdjacentHTML('afterend', smartPasteHtml);
                const smartBtn = element.parentElement.querySelector('[data-id="smartPaste"]');
                smartBtn.addEventListener('click', (e) => {
                    formatCodeThenPaste(smartFormatCode);
                    window.siyuan.menus.menu.remove();
                });
            };
            
            if(tabSpace === 4) {
                // 添加智能转换后粘贴
                addSmartPasteMenuItem();
                // 添加转换tab/2空格到4空格后粘贴
                const tab2To4Html = `<button data-id="tab2To4Paste" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">转换tab/2空格 -> 4空格后粘贴</span></button>`;
                element.insertAdjacentHTML('afterend', tab2To4Html);
                const tab2To4Btn = element.parentElement.querySelector('[data-id="tab2To4Paste"]');
                tab2To4Btn.addEventListener('click', (e) => {
                    formatCodeThenPaste(replaceTabAndTwoToFour);
                    window.siyuan.menus.menu.remove();
                });
            } else if(tabSpace === 2) {
                // 添加智能转换后粘贴
                addSmartPasteMenuItem();
                // 添加转换tab/4空格到2空格后粘贴
                const tab4To2Html = `<button data-id="tab4To2Paste" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">转换tab/4空格 -> 2空格后粘贴</span></button>`;
                element.insertAdjacentHTML('afterend', tab4To2Html);
                const tab4To2Btn = element.parentElement.querySelector('[data-id="tab4To2Paste"]');
                tab4To2Btn.addEventListener('click', (e) => {
                    formatCodeThenPaste(replaceTabAndFourToTwo);
                    window.siyuan.menus.menu.remove();
                });
            } else if(tabSpace === 0) {
                // 添加智能转换后粘贴
                addSmartPasteMenuItem();
                // 添加转换4空格到Tab后粘贴
                const space4ToTabHtml = `<button data-id="space4ToTabPaste" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">转换4空格 -> Tab后粘贴</span></button>`;
                element.insertAdjacentHTML('afterend', space4ToTabHtml);
                const space4ToTabBtn = element.parentElement.querySelector('[data-id="space4ToTabPaste"]');
                space4ToTabBtn.addEventListener('click', (e) => {
                    formatCodeThenPaste(replaceFourToTab);
                    window.siyuan.menus.menu.remove();
                });
                // 添加转换2空格到Tab后粘贴
                const space2ToTabHtml = `<button data-id="space2ToTabPaste" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#"></use></svg><span class="b3-menu__label">转换2空格 -> Tab后粘贴</span></button>`;
                element.insertAdjacentHTML('afterend', space2ToTabHtml);
                const space2ToTabBtn = element.parentElement.querySelector('[data-id="space2ToTabPaste"]');
                space2ToTabBtn.addEventListener('click', (e) => {
                    formatCodeThenPaste(replaceTwoToTab);
                    window.siyuan.menus.menu.remove();
                });
            }
        });
    }, true);
    function smartFormatCode(text) {
        // 获取思源Tab空格数
        const tabSpace = window.siyuan?.config?.editor?.codeTabSpaces;
        // 检测代码是2空格4空格还是tab
        const codeTypes = detectIndentation(text);
        // 如果和目标格式一致，直接返回
        const tabSpaceString = tabSpace > 0 ? `space${tabSpace}` : 'tab';
        if(codeTypes?.type === tabSpaceString) return text;
        // 不同情况下的智能选择
        if(tabSpace === 4){
            if(codeTypes?.type === 'space2' || codeTypes?.type === 'tab') {
                return replaceTabAndTwoToFour(text);
            } else {
                showMessage('检测到代码空白符格式混乱，请手动处理后粘贴');
                return;
            }
        } else if(tabSpace === 2) {
            if(codeTypes?.type === 'space4' || codeTypes?.type === 'tab') {
                return replaceTabAndFourToTwo(text);
            } else {
                showMessage('检测到代码空白符格式混乱，请手动处理后粘贴');
                return;
            }
        } else if(tabSpace === 0) {
            if(codeTypes?.type === 'space4'){
                return replaceFourToTab(text);
            } else if(codeTypes?.type === 'space2') {
                return replaceTwoToTab(text);
            } else {
                showMessage('检测到代码空白符格式混乱，请手动处理后粘贴');
                return;
            }
        } else {
            showMessage('目前仅支持对2空格，4空格及tab空白符的格式化');
            return;
        }
    }
    async function formatCodeThenPaste(formatFunction) {
        let text = await getClipText();
        if(!text) return;
        if(!typeof formatFunction === 'function') return;
        text = formatFunction(text);
        if(!text) return;
        insertToEditor(text);
    }
    function replaceTabAndTwoToFour(text) {
        if(detectIndentation(text)?.type === 'space4') return text;
        // 处理文本：行首的Tab和2空格替换为4空格
        const processedText = text.replace(/^[\t ]+/gm, (match) => {
            return match
                .replace(/(  )/g, '    ') // 每2空格转4空格
                .replace(/\t/g, '    '); // Tab转4空格
        });
        return processedText;
    }
    function replaceTabAndFourToTwo(text) {
        if(detectIndentation(text)?.type === 'space2') return text;
        // 处理文本：行首的Tab和2空格替换为4空格
        const processedText = text.replace(/^[\t ]+/gm, (match) => {
            return match
                .replace(/(    )/g, '  ') // 每4空格转2空格
                .replace(/\t/g, '  '); // Tab转2空格
        });
        return processedText;
    }
    function replaceFourToTab(text) {
        if(detectIndentation(text)?.type === 'tab') return text;
        // 处理文本：行首的Tab和2空格替换为4空格
        const processedText = text.replace(/^[ ]+/gm, (match) => {
            return match
                .replace(/(    )/g, '\t'); // 每4空格转Tab
        });
        return processedText;
    }
    function replaceTwoToTab(text) {
        if(detectIndentation(text)?.type === 'tab') return text;
        // 处理文本：行首的Tab和2空格替换为4空格
        const processedText = text.replace(/^[ ]+/gm, (match) => {
            return match
                .replace(/(  )/g, '\t'); // 每2空格转Tab
        });
        return processedText;
    }
    async function getClipText() {
        try {
          const text = await navigator.clipboard.readText();
          return text;
        } catch (error) {
          return '';
        }
    }
    function insertToEditor(processedText) {
        // 插入处理后的文本
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(processedText);
        range.insertNode(textNode);
        range.setStart(textNode, textNode.length);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        // 触发input事件
        const editableElement = range.startContainer.parentElement.closest('[contenteditable]');
        if (editableElement) editableElement.dispatchEvent(new Event('input', { bubbles: true }));
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
    // 检测代码是2空格4空格还是tab
    function detectIndentation(code) {
      const lines = code.split('\n');
      const stats = { tab: 0, space2: 0, space4: 0, mixed: 0 };
    
      for (const line of lines) {
        const indent = line.match(/^[\t ]+/)?.[0] || '';
        if (!indent) continue;
    
        const hasTab = /\t/.test(indent);
        const spaceLen = indent.replace(/\t/g, '').length;
    
        // 分类统计缩进类型
        if (hasTab && spaceLen > 0) {
          stats.mixed++;
        } else if (hasTab) {
          stats.tab++;
        } else {
          if (spaceLen % 4 === 0) stats.space4++;
          else if (spaceLen % 2 === 0) stats.space2++;
          else stats.mixed++;
        }
      }
    
      // 情况1: 全部统计为零（无缩进）
      if (Object.values(stats).every(v => v === 0)) {
        return { type: 'none', details: stats };
      }
    
      // 计算最大值和候选类型
      const max = Math.max(...Object.values(stats));
      const candidates = Object.entries(stats)
        .filter(([_, count]) => count === max)
        .map(([type]) => type);
    
      // 情况2: 存在多个候选类型（不含mixed）或 mixed是候选之一
      const hasMultipleCandidates = candidates.length > 1;
      const isMixedDominant = candidates.includes('mixed');
      
      return {
        type: hasMultipleCandidates || isMixedDominant ? 'mixed' : candidates[0],
        details: stats
      };
    }
    function whenElementExist(selector, node, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let isResolved = false;
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) {isResolved = true; resolve(el);} else if(!isResolved) requestAnimationFrame(check);
            };
            check();
            setTimeout(() => {
                if (!isResolved) {
                    reject(new Error(`Timeout: Element not found for selector "${selector}" within ${timeout}ms`));
                }
            }, timeout);
        });
    }
    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
})();