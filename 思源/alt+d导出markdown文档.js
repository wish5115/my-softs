// alt+d 导出markdown文档(docId为空导出当前文档)
// see https://ld246.com/article/1743689632996
{
    // 导出文档的id(docId为空导出当前文档)
    const docId = '';
    
    // alt+d事件
    document.addEventListener('keydown', async function(event) {
        // 检查是否按下了 Alt 键和 D 键，并确保没有按下其他修饰键
        if (
            event.altKey &&                  // Alt 键被按下
            event.code === 'KeyD' &&         // D 键被按下
            !event.shiftKey &&               // Shift 键未被按下
            !event.ctrlKey &&                // Ctrl 键未被按下
            !event.metaKey                   // Cmd 键（Meta 键）未被按下
        ) {
            event.preventDefault(); // 阻止默认行为（可选）
            const result = await fetchSyncPost('/api/export/exportMd', {id:docId||getCurrentDocId()});
            window.open(result.data.zip);
        }
    }, true);

    // 获取当前文档id
    function getCurrentDocId() {
        return (document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)'))?.querySelector('.protyle-title')?.dataset?.nodeId;
    }

    // api请求
    async function fetchSyncPost(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
}