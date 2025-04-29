// 思源代码块自动缩进和ctrl+/添加注释
// see https://ld246.com/article/1745642027248
// version 0.0.5
// 0.0.2 改进计算光标前的空白符算法，从全结点扫描到仅扫描上一个换行符到光标处的结点，性能大幅度提升
// 0.0.3 增加代码注释功能
// 0.0.4 修复注释潜在bug，去掉commentWithSpace参数，改为配置设置空格数
// 0.0.5 修复取消注释时的潜在bug

// 原理是首先获取上一行的缩进空白符，然后再根据不同语言的特点，在不同关键词下增加不同的缩进
// 上一行的缩进空白符是保底缩进，如果是无法识别的语言，就默认与上一行缩进对齐了
// 如果是已知语言的已知关键词，则根据langRules配置里的规则，调用action进行计算最终缩进
// 注意，添加注释时，最好选中整行或非空白符的开始处，如果选中行的一半，则从一半处注释，下次也最好选择一半取消注释（即同上次选择一致），否则可能非预期结果。
// 另外，不要选择空白符的中间开始注释，因为取消注释时，会计算注释标记后面或结束符的前面的空白符数，如果不足思源tabSpace整数倍，则会删除这多余的空白符，这是为了兼容其他软件的注释而做出的牺牲，而在空白符中间选择，很可能破坏空白符的结构。
(() => {
    // 是否开启自动缩进 true 开启 false 不开启
    const isEnableAutoIndent = true;
    
    // 是否开启添加注释 true 开启 false 不开启
    // ctrl/meta + / 添加注释，再次按ctrl/meta + / 则取消注释
    const isEnableComment = true;
    
    ////////////// 多语言配置部分 /////////////////
    // 可扩展更多语言规则
    // 正则表示不同关键词结尾的前面应该加什么样的缩进，具体缩进数由action函数决定
    // action 默认调用addIndent添加缩进，默认是上一行的缩进+空格或tab（这个由思源 tab 空格数设置决定的）
    // 当然也可以在action里自行处理，base参数就是上一行的缩进空白符
    // comment是注释配置，如果单行配置只需要配置prefix即可，如果多行注释，还需要配置suffix，
    // isWrap的意思是多行注释下，如果true，则只会在选中文本前后添加注释标记，如果false，则每行都添加注释
    const langRules = {
        // JavaScript/TypeScript
        javascript: {
            pattern: /([{([]|=>|\b(if|for|while|switch|function|class)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },

        // js，同JavaScript
        js: {
            pattern: /([{([]|=>|\b(if|for|while|switch|function|class)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // Python
        python: {
            pattern: /(:\s*|\\\s*)$/,  // 冒号结尾或行尾续行符
            action: (base) => addIndent(base),
            comment: {
                prefix: '# ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // HTML/XML
        html: {
            pattern: /<(?!\/?[a-z]+\s*\/?>)[^>]+>$/i,  // 未闭合标签
            action: (base) => addIndent(base),
            comment: {
                prefix: '<!-- ', // 多行注释包裹
                suffix: ' -->',
                isWrap: false
            },
        },
    
        // CSS/LESS/SCSS
        css: {
            pattern: /{\s*$/,  // CSS规则开始
            action: (base) => addIndent(base),
            comment: {
                prefix: '/* ', // 多行注释包裹（CSS 无单行注释）
                suffix: ' */',
                isWrap: false
            },
        },
    
        // Java/C/C++/C#
        java: {
            pattern: /([{([]|\b(if|for|while|switch)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // PHP
        php: {
            pattern: /(:\s*|{\s*|\(|\[|\b(if|foreach|for|while|switch|function)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // Ruby
        ruby: {
            pattern: /(\b(do|if|unless|while|until|def|class|module)\b.*|\{\s*|->\s*)$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '# ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // Swift
        swift: {
            pattern: /([{([]|\b(if|for|while|switch|func|class)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // Go
        go: {
            pattern: /([{([]|\b(if|for|switch|func)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
        // golang同Go
        golang: {
            pattern: /([{([]|\b(if|for|switch|func)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // Rust
        rust: {
            pattern: /([{([]|\b(if|for|while|loop|match|fn)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // SQL
        sql: {
            pattern: /(\b(BEGIN|CASE|WHEN|THEN|ELSE)\b|\(\s*)$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '-- ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },
    
        // Markdown
        markdown: {
            pattern: /([*\-+]|\d+\.)\s.*$/,  // 列表项
            action: (base) => addIndent(base, ' '.repeat(3)),  // 列表缩进3空格
            comment: {
                prefix: '<!-- ', // HTML 式多行注释（Markdown 无原生注释）
                suffix: ' -->',
                isWrap: false
            },
        },
    
        // YAML
        yaml: {
            pattern: /:\s*$/,  // 冒号结尾
            action: (base) => addIndent(base, ' '.repeat(2)),  // 固定2空格缩进
            comment: {
                prefix: '# ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },

        // Shell/Bash
        shell: {
            pattern: /(\b(do|if|then|else|while|for|case)\b|{\s*|\(\s*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '# ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },

        // PowerShell
        powershell: {
            pattern: /({|\(|\[|\b(begin|process|end|if|foreach|for|while|function)\b.*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '# ', // 单行注释
                suffix: '',
                isWrap: false
            },
        },

        // Batch (bat/cmd)
        bat: {
            pattern: /(\b(if|else|for)\b.*\))\s*$/i,
            action: (base) => addIndent(base, ' '.repeat(4)), // 通常bat使用4空格缩进
            comment: {
                prefix: 'REM ', // 批处理注释
                suffix: '',
                isWrap: false
            },
        },
        cmd: { // cmd复用bat的配置
            pattern: /(\b(if|else|for)\b.*\))\s*$/i,
            action: (base) => addIndent(base, ' '.repeat(4)),
            comment: {
                prefix: 'REM ',
                suffix: '',
                isWrap: false
            },
        },

        // AppleScript
        applescript: {
            pattern: /(\b(on|tell|if|repeat|with|using terms from)\b|->\s*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '-- ', // AppleScript注释
                suffix: '',
                isWrap: false
            },
        },

        // VBScript
        vbscript: {
            pattern: /(\b(If|For|Do|While|Function|Sub|Class)\b.*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: "' ",   //VBScript单引号注释
                suffix: '',
                isWrap: false
            },
        },
         // vbs，同VBScript
        vbs: {
            pattern: /(\b(If|For|Do|While|Function|Sub|Class)\b.*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: "' ",   //VBScript单引号注释
                suffix: '',
                isWrap: false
            },
        },

        // C++
        "c++": {
            pattern: /([{([]|\b(if|for|while|switch|class|namespace)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', 
                suffix: '',
                isWrap: false
            },
        },
        cpp: { // cpp 别名同 C++
            pattern: /([{([]|\b(if|for|while|switch|class|namespace)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ',
                suffix: '',
                isWrap: false
            },
        },

        // C
        c: {
            pattern: /([{([]|\b(if|for|while|switch)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '/* ', // C风格多行注释
                suffix: ' */',
                isWrap: false
            },
        },

        // Objective-C
        "objectivec": {
            pattern: /(@(interface|implementation|protocol)\b|\b(if|for|while)\b.*\)|{\s*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ',
                suffix: '',
                isWrap: false
            },
        },
        objc: { // objc 别名
            pattern: /(@(interface|implementation|protocol)\b|\b(if|for|while)\b.*\)|{\s*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ',
                suffix: '',
                isWrap: false
            },
        },

        // C#
        "c#": {
            pattern: /([{([]|\b(if|for|while|switch|class|namespace)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ',
                suffix: '',
                isWrap: false
            },
        },
        csharp: { // csharp 别名
            pattern: /([{([]|\b(if|for|while|switch|class|namespace)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ',
                suffix: '',
                isWrap: false
            },
        },

        // VB.NET
        "vbnet": {
            pattern: /(\b(If|For|While|Select|Class|Sub|Function)\b.*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: "' ", 
                suffix: '',
                isWrap: false
            },
        },
        
        vb: { // vb 别名
            pattern: /(\b(If|For|While|Select|Class|Sub|Function)\b.*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: "' ",
                suffix: '',
                isWrap: false
            },
        },

        // Lua
        lua: {
            pattern: /(\b(do|if|then|else|for|while|function)\b|{\s*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '-- ', 
                suffix: '',
                isWrap: false
            },
        },

        // Dart
        dart: {
            pattern: /([{([]|=>|\b(if|for|while|switch|class|function)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ',
                suffix: '',
                isWrap: false
            },
        },

        // Vim Script
        vim: {
            pattern: /(\b(function|if|for|while)\b.*)\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '" ', 
                suffix: '',
                isWrap: false
            },
        },

        // JSON (通常不需要自动缩进，但可添加基本规则)
        json: {
            pattern: /([{\[])\s*$/,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // JSON 本身不支持注释，但某些解析器允许
                suffix: '',
                isWrap: false
            },
        },

        // XML (复用HTML配置并增强)
        xml: {
            pattern: /<(?!\/?[a-zA-Z]+\s*\/?>)[^>]+>$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '<!-- ',
                suffix: ' -->',
                isWrap: false
            },
        },
    
        // 通用规则（兜底）
        _default: {
            pattern: /([{([]|\b(if|for|while|function)\b.*\))\s*$/i,
            action: (base) => addIndent(base),
            comment: {
                prefix: '// ', // 默认使用单行注释
                suffix: '',
                isWrap: false
            },
        }
    };
    
    ////////////// 监听回车事件部分 /////////////////
    let hljs;
    const tabSpace = window.siyuan?.config?.editor?.codeTabSpaces || 4;
    document.addEventListener('keydown', (event) => {
        const ctrlKey = isMac() ? event.metaKey : event.ctrlKey;
        if (event.key === 'Enter') {
            // 自动缩进事件
            if(!isEnableAutoIndent) return;
            // 非代码块返回
            hljs = getCursorElement()?.closest('.hljs');
            if (!hljs) return;
            // 先获取当前缩进后再等待默认回车完成后插入空白符，因此这里不要阻止默认按键行为
            handleNewLineIndentation();
        } else if (ctrlKey && event.key === '/' && !event.shiftKey && !event.altKey) {
            // 添加注释事件
            if(!isEnableComment) return;
            // 非代码块返回
            hljs = getCursorElement()?.closest('.hljs');
            if (!hljs) return;
            event.preventDefault();
            event.stopPropagation();
            const lang = detectLanguage()||'_default';
            const rules = langRules[lang]?.comment;
            if(!rules?.prefix) return;
            toggleComment(rules?.prefix, rules?.suffix, rules?.isWrap, tabSpace);
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
    // 此方案是从光标位置扫描到上一个出现换行符的结点，从而计算出从上一个换行符到光标结点之间的空白符
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

    ////////////// 增加注释部分 /////////////////
    function toggleComment(commentPrefix, commentSuffix, isWrap, tabSpace = 4) {
        // isWrap 是否使用多行注释
        // isWrapped 是否已添加了多行注释
        if (!commentSuffix) {
            isWrap = false;
        }
    
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
    
        const range = selection.getRangeAt(0);
        let selectedText = selection.toString();
        const lines = selectedText.split('\n');
    
        let isWrapped = false;
        if (isWrap) {
            const trimmed = selectedText.trim();
            isWrapped = trimmed.startsWith(commentPrefix.trim()) && 
                       trimmed.endsWith(commentSuffix.trim()) &&
                       (selectedText.startsWith(commentPrefix.trim()) || 
                        selectedText.endsWith(commentSuffix.trim()));
        }
    
        let processedText;
        if (isWrap) {
            // 多行注释
            if (isWrapped) {
                // 取消注释

                // 去掉分隔符两边空格（兼容多种情况考虑）
                commentPrefix = commentPrefix.trim();
                commentSuffix = commentSuffix.trim();
                
                // 兼容多个空格情况
                const spaces = calculateCommentSpaces(selectedText, commentPrefix, commentSuffix);
                const prefixSpaces = spaces.afterPrefix % tabSpace > 0 ? ' '.repeat(spaces.afterPrefix % tabSpace) : '';
                const suffixSpaces = spaces.beforeSuffix % tabSpace > 0 ? ' '.repeat(spaces.beforeSuffix % tabSpace) : '';
                processedText = selectedText.replace(new RegExp(`${escapeRegExp(commentPrefix)}${prefixSpaces}`), '');
                //processedText = processedText.replace(new RegExp(`${suffixSpaces}${escapeRegExp(commentSuffix)}`), '');
                processedText = replaceLastRegex(processedText, new RegExp(`${suffixSpaces}${escapeRegExp(commentSuffix)}`, 'g'), '');
    
                // 仅兼容一个空格
                // let prefixIndex = selectedText.indexOf(commentPrefix);
                // let suffixIndex = selectedText.lastIndexOf(commentSuffix);
    
                // // 处理注释前缀后的空格
                // let prefixEndIndex = prefixIndex + commentPrefix.length;
                // if (selectedText[prefixEndIndex - 1] === ' ') {
                //     prefixEndIndex++;
                // }
    
                // // 处理注释后缀前的空格
                // let suffixStartIndex = suffixIndex;
                // if (selectedText[suffixStartIndex - 1] === ' ') {
                //     suffixStartIndex--;
                // }
    
                // processedText = selectedText.slice(0, prefixIndex) +
                //                selectedText.slice(prefixEndIndex, suffixStartIndex) +
                //                selectedText.slice(suffixIndex + commentSuffix.length);
            } else {
                // 添加注释
                processedText = commentPrefix + selectedText + commentSuffix;
            }
        } else {
            // 单行注释
            // 选中行是否都添加了注释
            const isAllCommented = isSelectionCommented(lines, commentPrefix?.trim(), commentSuffix?.trim());
            // 如果都添加了注释，则取消注释，否则添加注释
            const shouldAdd = !isAllCommented;
    
            processedText = lines.map(line => {
                if (line.trim() === '') return line;
    
                if (shouldAdd) {
                    // 添加注释
                    return commentSuffix ? 
                        `${commentPrefix}${line}${commentSuffix}` : 
                        commentPrefix + line;
                } else {
                    // 取消注释
                    
                    // 去掉分隔符两边空格（兼容多种情况考虑）
                    commentPrefix = commentPrefix.trim();
                    commentSuffix = commentSuffix.trim();
    
                    // 计算注释前缀后的空格和注释后缀前的空格
                    const spaces = calculateCommentSpaces(line, commentPrefix, commentSuffix);
                    const prefixSpaces = spaces.afterPrefix % tabSpace > 0 ? ' '.repeat(spaces.afterPrefix % tabSpace) : '';
                    const suffixSpaces = spaces.beforeSuffix % tabSpace > 0 ? ' '.repeat(spaces.beforeSuffix % tabSpace) : '';
                    // 替换掉注释
                    const pattern = commentSuffix ? 
                        `^(\\s*)${escapeRegExp(commentPrefix)}${prefixSpaces}(.*?)${suffixSpaces}${escapeRegExp(commentSuffix)}(\\s*)$` :
                        `^(\\s*)${escapeRegExp(commentPrefix)}${prefixSpaces}(.*?)$`;
    
                    return line.replace(new RegExp(pattern), commentSuffix ? '$1$2$3' : '$1$2');
                }
            }).join('\n');
        }
    
        // 更新dom
        range.deleteContents();
        const textNode = document.createTextNode(processedText);
        range.insertNode(textNode);
    
        range.selectNodeContents(textNode);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    
        // 触发input事件
        const editableElement = range.startContainer.parentElement.closest('[contenteditable]');
        if (editableElement) editableElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function isLineCommented(line, prefix, suffix) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return false;
        if (suffix === '') {
            return trimmedLine.startsWith(prefix);
        } else {
            return trimmedLine.startsWith(prefix) && trimmedLine.endsWith(suffix);
        }
    }
    
    function isSelectionCommented(lines, prefix, suffix) {
        const nonEmptyLines = lines.filter(line => line.trim() !== '');
        return nonEmptyLines.length === 0 || nonEmptyLines.every(line => isLineCommented(line, prefix, suffix));
    }
    
    function calculateCommentSpaces(str, prefix, suffix) {
        // 找到注释的起始和结束位置
        const start = str.indexOf(prefix);
        const end = str.lastIndexOf(suffix);
    
        if (start === -1 || end === -1) {
            return { afterPrefix: 0, beforeSuffix: 0 };
        }
        // 计算 /* 后的空格数
        let afterPrefix = 0;
        let i = start + prefix.length; // 从 /* 后面的第一个字符开始
        while (i < end && str[i] === ' ') {
            afterPrefix++;
            i++;
        }
        // 计算 */ 前的空格数
        let beforeSuffix = 0;
        let j = end - 1; // 从 */ 前面的第一个字符开始
        while (j >= start && str[j] === ' ') {
            beforeSuffix++;
            j--;
        }
        return { afterPrefix, beforeSuffix };
    }
    
    function replaceLastRegex(str, regex, replacement) {
        const matches = Array.from(str.matchAll(regex)); // 获取所有匹配项
        if (matches.length === 0) return str; // 没有匹配项，直接返回原字符串
    
        // 获取最后一个匹配项的位置和长度
        const lastMatch = matches[matches.length - 1];
        const startIndex = lastMatch.index;
        const matchedLength = lastMatch[0].length;
    
        return (
            str.slice(0, startIndex) + 
            replacement + 
            str.slice(startIndex + matchedLength)
        );
    }

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

    // 判断系统平台
    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }
})();