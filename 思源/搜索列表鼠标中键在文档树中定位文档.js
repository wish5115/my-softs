// 搜索列表，鼠标中键在文档树中定位文档
(()=>{
    document.addEventListener('mousedown', async function(event) {
        // 检查是否按下了鼠标中键
        const isModifierKeyPressed = event.button === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
        if (isModifierKeyPressed) {
            const item = event.target.closest('[data-type="search-item"]');
            if(!item) return;
            const docId = item?.dataset?.rootId;
            if(!docId) return;
            const docInfo = await requestApi('/api/filetree/getDoc', {id: docId});
            if(!docInfo?.data?.path || !docInfo?.data?.box) return;
            (siyuan?.mobile?.docks?.file||siyuan?.mobile?.files||siyuan.layout.leftDock.data.file).selectItem(docInfo.data.box, docInfo.data.path);
            const closeBtn = item.closest('.b3-dialog__container')?.querySelector('.b3-dialog__close');
            if(!closeBtn) return;
            closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    },true);
    
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
})();