// 高亮选中文本和快捷键高亮下一个关键词
// 功能：
//   1. 高亮选中文本
//   2. ctrl/meta + alt + p 高亮下一个关键词
//   3. shift + ctrl/meta + alt + p 高亮上一个关键词
// 鸣谢：本代码改自JeffreyChen大佬的关键词高亮插件 https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork
// 反馈：https://ld246.com/article/1733916154649
// see https://ld246.com/article/1733799680272
// version 0.0.4
// 更新记录
// 0.0.2 新增 shift + ctrl/meta + alt + p 高亮上一个关键词
// 0.0.3 修复向下向上搜索关键词时，没有从选中文本处开始搜索的问题
// 0.0.4 兼容暗色主题下，选中文本浅灰色字体看不清的问题
(() => {
    // 样式可以在这里修改
    addStyle(`
        /* 双击关键词高亮样式 */
        ::highlight(selected-results) {
            background-color: rgb(235 235 5);
            color: rgb(0, 0, 0);
        }
        /* ctrl+alt+p/shift+ctrl+alt+p 高亮样式 */
        ::highlight(focus-result) {
            background-color: rgb(255, 150, 50);
            color: rgb(0, 0, 0);
        }
        /* 选中文本的颜色 */
        ::selection{
            color: rgb(0,0,0);
        }
    `);
    
    let selectedText = '';
    document.addEventListener('mouseup', (event) => {
        const selection = window.getSelection().toString().trim();
        if (selection !== '' && selection !== selectedText) {
            selectedText = selection;
            const editor = event.target.closest('.protyle-wysiwyg');
            highlight(selectedText);
        }
    });

    document.addEventListener('mousedown', () => {
        unhighlight();
    });

    document.addEventListener('keydown', (event) => {
        // 检查是否同时按下了 Ctrl/Meta + Alt + P
        const ctrlKey = isMac() ? event.metaKey : event.ctrlKey;
        const ctrlKey2 = isMac() ? event.ctrlKey : event.metaKey;
        if (ctrlKey && event.altKey && event.code === 'KeyP' && !event.shiftKey && !ctrlKey2) {
            event.preventDefault();
            searchNext();
            
        } else if(event.shiftKey && ctrlKey && event.altKey && event.code === 'KeyP' && !ctrlKey2) {
            event.preventDefault();
            searchLast();
        } else {
            unhighlight();
        }
    });

    function highlight(text) {
        unhighlight();
        if(!text) return;
        highlightHitResult(text, true);
    }

    function unhighlight() {
        selectedText = '';
        // 清除高亮
        CSS.highlights.clear();
    }

    function addStyle(css) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    // 搜索并高亮结果
    // see https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/blob/5eaa68a650b06e4ad2c7a2e6eb43601cdca67799/src/Search.vue#L68
    // see https://developer.mozilla.org/zh-CN/docs/Web/API/CSS_Custom_Highlight_API
    let resultCount = 0; // 存储结果数量
    let resultIndex = 0; // 当前选中结果索引
    let resultRange = []; // 存储结果范围
    let isFirstHighlight = true; // 标志是否是首次高亮
    let initialSelectionIndex = -1; // 保存首次选中的索引
    function highlightHitResult(value, change) {
        // 如果文本框内容改变，搜索结果和索引计数都立刻清零
        if (change == true) {
            resultIndex = 0
            resultCount = 0
            isFirstHighlight = true; // 每次改变搜索词时重置首次高亮标志
        }
    
        // 首先，选取所有符合条件的元素
        // const elements = document.querySelectorAll('.layout-tab-container > div:not(.fn__none) .protyle-wysiwyg [data-node-id]');
        // 获取文档根,后续直接对全文档文本进行搜索,
        const docRoot = document.querySelector('.layout-tab-container > div:not(.fn__none) .protyle-wysiwyg');
        //console.log("docRoot:")
        //console.log(docRoot)
        const docText=docRoot.textContent.toLowerCase();
        const docLen=docText.length;
    
        // 准备一个数组来保存所有文本节点
        const allTextNodes = [];
        let incr_lens = [];
        let cur_len0=0;
    
        const treeWalker = document.createTreeWalker(docRoot, NodeFilter.SHOW_TEXT);
        let currentNode = treeWalker.nextNode();
        while (currentNode) {
            allTextNodes.push(currentNode);
            cur_len0+=currentNode.textContent.length
            incr_lens.push(cur_len0);
            currentNode = treeWalker.nextNode();
        }
    
        // 清除上个高亮
        CSS.highlights.clear();
    
        // 为空判断
        const str = value.trim().toLowerCase()
        if (!str) return
        let textNodeCnt=allTextNodes.length
        let cur_nodeIdx=0;
        let txtNode
        // 查找所有文本节点是否包含搜索词，并创建对应的 Range 对象
        // 把全局匹配索引转换为文本节点的索引和offset,使得range可以跨多个文本节点
        let ranges = [];
        let startIndex = 0;
        let endIndex=0;
        let foundInitialSelection = false;
        while ((startIndex = docText.indexOf(str, startIndex)) !== -1) {
            const range = document.createRange();
            endIndex=startIndex + str.length
            // console.log(`开始结束索引:${startIndex}-${endIndex}`)
            try {
                while (cur_nodeIdx<textNodeCnt-1 && incr_lens[cur_nodeIdx]<=startIndex){
                  cur_nodeIdx++
                }
                txtNode= allTextNodes[cur_nodeIdx]
                let startOffset=startIndex-incr_lens[cur_nodeIdx]+txtNode.textContent.length;
                // console.log(`cur_nodeIdx:${cur_nodeIdx}|offset:${startOffset}|txtNode:${txtNode.textContent}`)
                range.setStart(txtNode, startOffset);
    
                while (cur_nodeIdx<textNodeCnt-1 && incr_lens[cur_nodeIdx]<endIndex){
                  cur_nodeIdx++
                }
                txtNode= allTextNodes[cur_nodeIdx]
                let endOffset=endIndex-incr_lens[cur_nodeIdx]+txtNode.textContent.length;
                range.setEnd(txtNode,endOffset);
                ranges.push(range);

                // 如果是首次高亮并且还没有找到初始选择，则尝试匹配当前选择与新创建的range
                if (isFirstHighlight && !foundInitialSelection) {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const selectedRange = selection.getRangeAt(0);
                        if (selectedRange.compareBoundaryPoints(Range.START_TO_START, range) === 0 &&
                            selectedRange.compareBoundaryPoints(Range.END_TO_END, range) === 0) {
                            initialSelectionIndex = ranges.length; // 因为数组索引从0开始，所以这里直接用长度表示索引+1
                            foundInitialSelection = true;
                        }
                    }
                }
            } catch (error) {
                console.error("Error setting range in node:", error);
            }
            startIndex = endIndex;
        }
        // 创建高亮对象
        const searchResultsHighlight = new Highlight(...ranges.flat())
        resultCount = ranges.flat().length
        resultRange = ranges.flat()
        // console.log(ranges.flat())
    
        // 注册高亮
        CSS.highlights.set("selected-results", searchResultsHighlight)

        // 如果找到了初始选择，设置resultIndex为初始选择的位置
        if (foundInitialSelection) {
            resultIndex = initialSelectionIndex;
            isFirstHighlight = false; // 设置为非首次高亮
        }

        // 滚动页面到当前选中的结果，注意这里的索引需要减去1，因为resultIndex是从1开始计数的
        // scroollIntoRanges(resultIndex - 1)
    }
    
    function scroollIntoRanges(index) {
        const ranges = resultRange;
        const range = ranges[index]
        // const parent = range.commonAncestorContainer.parentElement
        // parent.scrollIntoView({ behavior: 'smooth', block: "center" })
    
        const docContentElement  = document.querySelector('.layout-tab-container > div:not(.fn__none) >.protyle-content');
        let doc_rect=docContentElement.getBoundingClientRect()
        let mid_y=doc_rect.top+doc_rect.height/2
        let range_rect = range.getBoundingClientRect();
        docContentElement.scrollBy(0,range_rect.y-mid_y)
      
        CSS.highlights.set("focus-result", new Highlight(range))
    }

    // ctrl+alt+p下一个
    function searchNext() {
        selectedText = window.getSelection().toString().trim();
        highlightHitResult(selectedText, false);
        if (resultIndex < resultCount) {
            resultIndex = resultIndex + 1
        }
        else if (resultIndex >= resultCount && resultCount != 0) {
            resultIndex = 1
        }
        else if (resultCount == 0) {
            resultIndex = 0
        }
        scroollIntoRanges(resultIndex -1)
    }

    // shift+ctrl+alt+p上一个
    function searchLast() {
        selectedText = window.getSelection().toString().trim();
        highlightHitResult(selectedText, false)
        if ((resultIndex > 1 && resultIndex <= resultCount) && resultCount != 0) {
            resultIndex = resultIndex - 1
        }
        else if ((resultIndex <= 1 || resultIndex > resultCount) && resultCount != 0) {
            resultIndex = resultCount
        }
        else if (resultCount == 0) {
            resultIndex = 0
        }
        scroollIntoRanges(resultIndex -1)
    }
})();