// 思源代码块自动缩进
//see 
// version 0.0.2
// 0.0.2 改进计算光标前的空白符算法，从全结点扫描到仅扫描上一个换行符到光标处的结点，性能大幅度提升

// 原理是首先获取上一行的缩进空白符，然后再根据不同语言的特点，在不同字符下增加不同的缩进
// 上一行的缩进空白符是保底缩进，如果是无法识别的语言，就默认与上一行缩进对齐了
// 如果是已知语言的已知标记符，则根据langRules配置里的规则，调用action进行计算最终缩进
(() => {
    ////////////// 多语言配置部分 /////////////////
    // 可扩展更多语言规则
    // 正则表示不同字符结尾的前面应该加什么样的缩进，具体缩进数由action函数决定
    // action 默认调用adaddIndent添加缩进，默认是上一行的缩进+\t
    // 当然也可以在action里自行处理，base参数就是上一行的缩进空白符
    const langRules = {
      // JavaScript/TypeScript
      javascript: {
        pattern: /([{([]|=>|\b(if|for|while|switch|function|class)\b.*\))\s*$/,
        action: (base) => addIndent(base)
      },
    
      // Python
      python: {
        pattern: /(:\s*|\\\s*)$/,  // 冒号结尾或行尾续行符
        action: (base) => addIndent(base)
      },
    
      // HTML/XML
      html: {
        pattern: /<(?!\/?[a-z]+\s*\/?>)[^>]+>$/i,  // 未闭合标签
        action: (base) => addIndent(base)
      },
    
      // CSS/LESS/SCSS
      css: {
        pattern: /{\s*$/,  // CSS规则开始
        action: (base) => addIndent(base)
      },
    
      // Java/C/C++/C#
      java: {
        pattern: /([{([]|\b(if|for|while|switch)\b.*\))\s*$/,
        action: (base) => addIndent(base)
      },
    
      // PHP
      php: {
        pattern: /(:\s*|{\s*|\(|\[|\b(if|foreach|for|while|switch|function)\b.*\))\s*$/,
        action: (base) => addIndent(base)
      },
    
      // Ruby
      ruby: {
        pattern: /(\b(do|if|unless|while|until|def|class|module)\b.*|\{\s*|->\s*)$/,
        action: (base) => addIndent(base)
      },
    
      // Swift
      swift: {
        pattern: /([{([]|\b(if|for|while|switch|func|class)\b.*\))\s*$/,
        action: (base) => addIndent(base)
      },
    
      // Go
      go: {
        pattern: /([{([]|\b(if|for|switch|func)\b.*\))\s*$/,
        action: (base) => addIndent(base)
      },
    
      // Rust
      rust: {
        pattern: /([{([]|\b(if|for|while|loop|match|fn)\b.*\))\s*$/,
        action: (base) => addIndent(base)
      },
    
      // SQL
      sql: {
        pattern: /(\b(BEGIN|CASE|WHEN|THEN|ELSE)\b|\(\s*)$/i,
        action: (base) => addIndent(base)
      },
    
      // Markdown
      markdown: {
        pattern: /([*\-+]|\d+\.)\s.*$/,  // 列表项
        action: (base) => addIndent(base, ' '.repeat(3))  // 列表缩进3空格
      },
    
      // YAML
      yaml: {
        pattern: /:\s*$/,  // 冒号结尾
        action: (base) => addIndent(base, ' '.repeat(2))  // 固定2空格缩进
      },
    
      // 通用规则（兜底）
      _default: {
        pattern: /([{([]|\b(if|for|while|function)\b.*\))\s*$/,
        action: (base) => addIndent(base)
      }
    };
    
    ////////////// 监听回车事件部分 /////////////////
    let hljs;
    const tabSpace = window.siyuan?.config?.editor?.codeTabSpaces || 4;
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            // 非代码块返回
            hljs = getCursorElement()?.closest('.hljs');
            if (!hljs) return;
            // 先获取当前缩进后再等待默认回车完成后插入空白符，因此这里不要阻止默认按键行为
            handleNewLineIndentation();
        }
    }, true);

    ////////////// 插入缩进部分 /////////////////
    async function handleNewLineIndentation() {
      // 这里先获取当前缩进后再等待默认回车完成后插入空白符
      const indent = getSmartIndent();//getCurrentIndent();
      await waitForBrowserDefault(); //等待新行插入后继续
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // 创建缩进的文本节点
      const newLineNode = document.createTextNode(indent);
      range.insertNode(newLineNode);
      
      // 移动光标到新行的缩进之后
      const newRange = document.createRange();
      newRange.setStart(newLineNode, indent.length);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    ////////////// 智能缩进部分，根据不同语言规则缩进 /////////////////
    function getSmartIndent(lang = 'auto') {
      const base = getCurrentIndent();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const line = getCurrentLineText(range);
      
      // 自动检测语言（示例实现）
      if (lang === 'auto') {
        lang = detectLanguage() || '_default';
      }
      const rules = langRules[lang] || langRules._default;

      // 仅检查当前语言规则和兜底规则
      if (rules.pattern.test(line)) return rules.action(base);
      if (langRules._default.pattern.test(line)) return langRules._default.action(base);
      
      return base; // 保持原缩进
    }

    // 辅助函数，添加缩进
    function addIndent(base, unit = tabSpace > 0 ? ' '.repeat(tabSpace) : '\t') {
      return base + unit; 
    }

    function detectLanguage() {
        if(!hljs) return '';
        return hljs?.parentElement?.querySelector('.protyle-action__language')?.textContent?.trim() || '';
    }
    
    // 辅助函数：获取当前行完整文本
    function getCurrentLineText(range) {
      const node = range.startContainer;
      const offset = range.startOffset;
      
      if (node.nodeType !== Node.TEXT_NODE) return '';
      
      const text = node.textContent;
      let lineStart = text.lastIndexOf('\n', offset - 1) + 1;
      let lineEnd = text.indexOf('\n', offset);
      
      return text.slice(
        lineStart, 
        lineEnd === -1 ? undefined : lineEnd
      );
    }

    ////////////// 保持与上一行的开始位置对齐（兜底方案） /////////////////
    // 次方案是从光标位置扫描到上一个出现换行符的结点，从而计算出从上一个换行符到光标结点之间的空白符
    function getCurrentIndent() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return '';
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        let offset = range.startOffset;
    
        // 处理当前文本节点中的内容
        let lineText = '';
        let textBeforeCursor = '';
        if (node.nodeType === Node.TEXT_NODE) {
            textBeforeCursor = node.textContent.slice(0, offset);
            let lastNewLinePos = textBeforeCursor.lastIndexOf('\n');
            if (lastNewLinePos !== -1) {
                lineText = textBeforeCursor.slice(lastNewLinePos + 1);
                return lineText.match(/^[ \t]*/)[0] || '';
            }
            lineText = textBeforeCursor;
        }
    
        // 向前遍历兄弟及父节点查找换行符
        let prevNode = getPreviousNode(node);
        while (prevNode) {
            const text = getNodeText(prevNode);
            const lastNewLinePos = text.lastIndexOf('\n');
            if (lastNewLinePos !== -1) {
                lineText = text.slice(lastNewLinePos + 1) + lineText;
                break;
            } else {
                lineText = text + lineText;
            }
            prevNode = getPreviousNode(prevNode);
        }
    
        // 提取缩进部分
        const indentMatch = lineText.match(/^[ \t]*/);
        return indentMatch ? indentMatch[0] : '';
    }
    
    // 辅助函数：获取节点的文本内容（递归）
    function getNodeText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            let text = '';
            for (let child of node.childNodes) {
                text += getNodeText(child);
            }
            return text;
        }
        return '';
    }
    
    // 辅助函数：获取前一个节点（考虑DOM结构）
    function getPreviousNode(node) {
        // 尝试获取前一个兄弟节点
        let previousSibling = node.previousSibling;
        if (previousSibling) {
            // 找到兄弟节点的最后一个叶子节点（深度优先）
            return getLastLeafNode(previousSibling);
        } else {
            // 没有前一个兄弟节点，则向上递归父节点
            let parent = node.parentNode;
            if (parent && parent !== (hljs || document.body)) {
                return getPreviousNode(parent);
            }
        }
        return null;
    }
    
    // 辅助函数：获取节点的最后一个叶子节点（用于深度优先遍历）
    function getLastLeafNode(node) {
        while (node && node.hasChildNodes()) {
            node = node.lastChild;
        }
        return node;
    }
    
    // 此方案是遍历获取所有文本节点
    // function getCurrentIndent() {
    //   const selection = window.getSelection();
    //   if (!selection.rangeCount) return '';
    //   const range = selection.getRangeAt(0);
    //   const node = range.startContainer;
    //   const offset = range.startOffset;
    
    //   // 获取contenteditable根元素
    //   const editableDiv = node.nodeType === Node.TEXT_NODE 
    //     ? node.parentNode.closest('[contenteditable="true"]') 
    //     : node.closest('[contenteditable="true"]');
    //   if (!editableDiv) return '';
    
    //   // 收集所有文本节点并构建全局文本
    //   const textNodes = getAllTextNodes(editableDiv);
    //   let globalText = '';
    //   const nodeOffsets = textNodes.map(textNode => {
    //     const start = globalText.length;
    //     globalText += textNode.textContent;
    //     return { node: textNode, start, end: globalText.length };
    //   });
    
    //   // 找到当前节点对应的全局偏移
    //   const currentEntry = nodeOffsets.find(entry => entry.node === node);
    //   if (!currentEntry) return '';
    //   const globalOffset = currentEntry.start + offset;
    
    //   // 确定行起始位置
    //   let lineStart = 0;
    //   for (let i = 0; i < globalOffset; i++) {
    //     if (globalText[i] === '\n') lineStart = i + 1;
    //   }
    
    //   // 提取行内容并匹配缩进
    //   const lineEnd = globalText.indexOf('\n', lineStart);
    //   const lineContent = globalText.substring(
    //     lineStart,
    //     lineEnd === -1 ? undefined : lineEnd
    //   );
    //   return (lineContent.match(/^[ \t]*/) || [''])[0];
    // }
    
    // 辅助函数：获取所有文本节点
    // function getAllTextNodes(root) {
    //   const nodes = [];
    //   const walker = document.createTreeWalker(
    //     root, 
    //     NodeFilter.SHOW_TEXT, 
    //     null, 
    //     false
    //   );
    //   while (walker.nextNode()) nodes.push(walker.currentNode);
    //   return nodes;
    // }

    ////////////// 功能辅助函数部分 /////////////////
    // 获取光标所在元素
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

    // 等待浏览器默认行为结束（这里是指按下回车完成）
    async function waitForBrowserDefault() {
        // 通过双重事件循环等待确保浏览器完成布局
        await Promise.resolve();  // 等待当前任务完成
        await new Promise(r => requestAnimationFrame(r)); // 等待渲染更新
    }
})();