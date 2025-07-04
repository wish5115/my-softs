// 嵌入块复制查询结果
(()=>{
    let mouseInEmbed = false;
    document.addEventListener('mouseover', (e) => {
        if (mouseInEmbed) return;
        mouseInEmbed = true;
        setTimeout(() => mouseInEmbed = false, 40);
        const embed = e.target.closest('[data-type="NodeBlockQueryEmbed"]');
        if (!embed) return;
        let copy = embed.querySelector('.protyle-action__copyEmbedResult');
        if (copy) return;
        const menu = embed.querySelector('.protyle-icons .protyle-action__menu');
        const html = `<span aria-label="复制查询结果" class="b3-tooltips__nw b3-tooltips protyle-icon protyle-action__copyEmbedResult"><svg><use xlink:href="#iconCopy"></use></svg></span>`;
        menu.insertAdjacentHTML("beforebegin", html);
        copy = embed.querySelector('.protyle-action__copyEmbedResult');
        copy.addEventListener("click", (e) => {
            e.stopPropagation();
            let text = "";
            const hasEmbedCol = embed.querySelector('.protyle-wysiwyg__embed span.embed-col');
            if(hasEmbedCol) {
                const embedList = embed.querySelectorAll('.protyle-wysiwyg__embed');
                if (embedList.length > 0) {
                    let rowsText = [];
                    embedList.forEach(item => {
                        let colText = "";
                        const cols = item.querySelectorAll('span.embed-col');
                        // 查询扩展
                        if (cols.length > 0) {
                            const colsText = [];
                            cols.forEach(col => {
                                colsText.push(extractFormattedText(col));
                            });
                            colText = colsText.join("\t");
                        }
                        rowsText.push(colText);
                    });
                    text = rowsText.join("\n");
                }
            }
            if(text.trim() == "") {
                text = extractFormattedText(embed);
            }
            if(!text.trim()) return;
            copyToClipboard(text);
            const useElement = copy.querySelector('use');
            if (useElement) {
                useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#iconSelect');
                setTimeout(() => {
                    useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#iconCopy');
                }, 1000);
            }
        });
    });
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('复制失败:', err);
        }
    }
    /**
     * 提取指定元素下的文本内容：
     * – data-av-type="table" 按 .av__row 为行、.av__celltext 为列，用 \t 分隔
     * – 标准 table/display:table/display:table-row 同样支持
     * – 其他块元素前后各加换行占位（但最终空行会被过滤）
     * – 去除零宽字符、合并空白、去掉所有空行
     * @param {HTMLElement} root - 起始元素
     * @returns {string} 纯文本输出
     */
    function extractFormattedText(root) {
        const blockDisplays = new Set([
            'block', 'flex', 'grid', 'list-item',
            'table', 'table-caption'
        ]);
        function cleanText(str) {
            return str
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
        let lines = [];
        function processCustomTable(tableEl) {
            lines.push('');  // 占位，后续会被过滤掉
            const rows = Array.from(tableEl.querySelectorAll('.av__row'));
            rows.forEach(row => {
                const cols = Array.from(row.querySelectorAll('.av__celltext'))
                    .map(cell => cleanText(cell.textContent));
                lines.push(cols.join('\t'));
            });
            lines.push('');
        }
        function walk(node) {
            if (node.nodeType === Node.ELEMENT_NODE
                && node.getAttribute('data-av-type') === 'table') {
                processCustomTable(node);
                return;
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const style = window.getComputedStyle(node);
                const disp = style.display;

                if (disp === 'table') {
                    lines.push('');
                    node.childNodes.forEach(walk);
                    lines.push('');
                    return;
                }
                if (disp === 'table-row') {
                    const cells = Array.from(node.querySelectorAll('td, th'))
                        .map(td => cleanText(td.textContent));
                    lines.push(cells.join('\t'));
                    return;
                }
                if (blockDisplays.has(disp)) {
                    lines.push('');
                    node.childNodes.forEach(walk);
                    lines.push('');
                    return;
                }
            }
            if (node.nodeType === Node.TEXT_NODE) {
                const txt = cleanText(node.nodeValue);
                if (!txt) return;
                if (lines.length === 0) {
                    lines.push(txt);
                } else {
                    lines[lines.length - 1] += (lines[lines.length - 1] ? ' ' : '') + txt;
                }
                return;
            }
            node.childNodes.forEach(walk);
        }
        walk(root);
        // 最终：只保留非空行
        return lines
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .join('\n');
    }
})();