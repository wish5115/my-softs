// 批量折叠和展开标题
// 使用方法：
// 1. alt + 点击标题前的箭头按钮，折叠/展开所有同级标题
// 2. ctrl/meta + alt + 点击标题前的箭头按钮，折叠/展开所有标题
// 3. 选择情况下，仅折叠/展开已选择的部分的标题
(() => {
    // 操作后当前操作按钮立即隐藏
    const currGutterHideAfterClick = true;

    // 监听鼠标单击事件
    document.addEventListener('mousedown', function(event) {
        if(!event.altKey || event.button !== 0) return;
        const hArrow = event.target.closest('.protyle-gutters:has(button[data-type="NodeHeading"]) button[data-type="fold"]');
        if(!hArrow) return;
        const hButton = hArrow.parentElement.querySelector('button[data-type="NodeHeading"]');
        if(!hButton) return;
        const currHeadId = hButton.dataset?.nodeId;
        const currHead  = document.querySelector(`div[data-node-id="${currHeadId}"]`);
        const hType = currHead?.dataset?.subtype;
        const isFold = !!currHead?.getAttribute('fold');
        const isSelected = currHead.classList.contains('protyle-wysiwyg--select');
        const selectedSelector = isSelected ? '.protyle-wysiwyg--select' : '';
        const protyle = getProtyleByMouseAt(event);
        if(isHasCtrlKey(event) && event.altKey && !event.shiftKey) {
            // 仅 ctrl/meta + 点击触发
            // 获取所有标题
            const heads = protyle.querySelectorAll(`.protyle-wysiwyg [data-type="NodeHeading"]${selectedSelector}`);
            foldHeads(heads, isFold);
            hideGutterAfterClick(hButton, hArrow);
        } else if(event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            // 仅 alt+点击触发
            // 获取所有同级标题
            const heads = protyle.querySelectorAll(`.protyle-wysiwyg [data-type="NodeHeading"][data-subtype="${hType}"]${selectedSelector}`);
            foldHeads(heads, isFold);
            hideGutterAfterClick(hButton, hArrow);
        }
    });

    // 批量折叠/展开标题
    function foldHeads(heads, isFold) {
        heads.forEach(head => {
            const headId = head.dataset?.nodeId;
            if(!headId) return;
            const willFoldState = !isFold;
            const isHeadFold = !!head.getAttribute('fold');
            if(isHeadFold === willFoldState) return;
            foldBlock(headId, willFoldState);
        });
    }
    
    // 折叠/展开块
    async function foldBlock(id, isFold = true) {
        const result = await fetchSyncPost('/api/block/' + (isFold ? 'foldBlock' : 'unfoldBlock'), {id: id});
        if(!result || result.code !== 0) console.error(result);
    }

    // 操作后的按钮处理
    function hideGutterAfterClick(hButton, hArrow) {
        // 操作后当前操作按钮立即隐藏
        if(currGutterHideAfterClick) {
            hButton.style.display = 'none';
            hArrow.style.display = 'none';
        } else {
            const arrowSvg = hArrow.querySelector('svg');
            if(!arrowSvg.style.transform || arrowSvg.style.transform === '') {
                arrowSvg.style.transform = 'rotate(90deg)';
            } else {
               arrowSvg.style.transform = '';
            }
        }
    }
    
    // 通过鼠标位置获取protyle元素
    function getProtyleByMouseAt(event) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        // 调用 document.elementFromPoint 获取元素
        const element = document.elementFromPoint(mouseX, mouseY);
        if(element) return element.closest('.protyle');
        return null;
    }

    // 判断是否有ctrl键盘，兼容Mac
    function isHasCtrlKey(event) {
        if(isMac()) return event.metaKey;
        return event.ctrlKey;
    }
    
    // 判断是否Mac
    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }
    
    // 请求api
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = {
            method: "POST",
        };
        if (data) {
            if (data instanceof FormData) {
                init.body = data;
            } else {
                init.body = JSON.stringify(data);
            }
        }
        try {
            const res = await fetch(url, init);
            const res2 = returnType === 'json' ? await res.json() : await res.text();
            return res2;
        } catch(e) {
            console.log(e);
            return returnType === 'json' ? {code:e.code||1, msg: e.message||"", data: null} : "";
        }
    }
})();