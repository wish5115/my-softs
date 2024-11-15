// 功能：修改数据库主键引用块的标题
// 版本：0.0.2
// 更新记录
// 0.0.1 初始版本，实现了可手动修改数据库主键引用块的标题
// 0.0.2 修复多个数据库切换焦点失效问题
// 问题反馈：https://ld246.com/article/1731215224093
// 使用方法：把代码放到思源js代码片段即可，修改方式和普通字段一样，点击编辑即可。
// 删除自定义标题方法：在输入框输入空值即可删除，或进入引用块属性面板，删除dbid-开头的自定义属性即可，可参考下面的原理帖子。
// 原理：https://ld246.com/article/1730621536283/comment/1731085168853?r=wilsons#comments
(()=>{
    let documentListened = false;
    observeElementCreation(
        document.body,
        '.av__row:not(.av__row--header) [data-dtype="block"]:has([data-type="block-ref"])',
        async cell => {
            // 获取数据库id
            const av = cell.closest('[data-av-type="table"][data-av-id]');
            const avId = av?.dataset.avId;
            const text = cell.querySelector('.av__celltext--ref');
            if(text) text.dataset.text = text.textContent;
            let blockId;
            if(avId) {
                // 获取块属性
                const block = cell.querySelector('[data-type="block-ref"]');
                blockId = block?.dataset.id;
                if(blockId){
                    let blockAttrs = {};
                    try {
                         blockAttrs = await fetchSyncPost('/api/attr/getBlockAttrs', {"id": blockId});
                    } catch(e) {
                        console.log(e);
                    }
                    if(blockAttrs.code === 0 && blockAttrs.data) {
                        blockAttrs = blockAttrs.data;
                        const customText = blockAttrs['custom-dbid-' + avId];
                        if(customText){
                            // 修改文本名称
                            if(text) text.textContent = customText;
                        }
                    }
                }
            }
            
            // 单元格单击事件，动态添加输入框
            cell.addEventListener('click', (event) => {
                // 如果引用块标题则返回
                if(event.target.tagName === 'SPAN' && event.target.classList.contains('av__celltext--ref')) {
                    return;
                }
                event.stopPropagation();
                // 移除多余的激活单元格样式
                const selectCells = document.querySelectorAll('.av__cell.av__cell--active.av__cell--select');
                selectCells.forEach(item => {
                    if(item !== cell) {
                        item.classList.remove('av__cell--active');
                        item.classList.remove('av__cell--select');
                    }
                });
                // 添加输入框并获取焦点
                addAvMask(cell);
                const inputElement = document.querySelector('.av__mask--rename .b3-text-field');
                inputElement.select();
                inputElement.focus();
                // 输入框点击事件
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
                // 输入框按键事件
                inputElement.addEventListener('keydown', (event) => {
                    if (event.isComposing) {
                        return;
                    }
                    if(event.key === "Escape"|| event.key === "Tab" || (event.key === "Enter" && !event.shiftKey && isNotCtrl(event))){
                        event.preventDefault();
                        event.stopPropagation();
                        updateCellValue(blockId, avId, inputElement, text, cell, av, event);
                    }
                });
                // 输入框关闭事件
                inputElement.parentElement.addEventListener('click', (event) => {
                    updateCellValue(blockId, avId, inputElement, text, cell, av);
                });
            });
            // 更新按钮阻止冒泡
            cell.querySelector('[data-type="block-more"]')?.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            // 监听document按键事件（仅在第一个单元格被添加时创建一次）
            if(!documentListened) {
                documentListened = true;
                document.addEventListener('keydown', (event) => {
                    if (event.isComposing) {
                        return;
                    }
                    // 当按回车时打开输入框
                    if (event.key === "Enter" && !event.shiftKey && isNotCtrl(event)) {
                        const inputElement = document.querySelector('.av__mask--rename .b3-text-field');
                        if(!inputElement) {
                            const selectCell = document.querySelector('.av__cell.av__cell--active.av__cell--select[data-dtype="block"]:has([data-type="block-ref"])');
                            if(selectCell) selectCell.click();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    }
                });
            }
        }
    );
    // 更新单元格
    async function updateCellValue(blockId, avId, inputElement, text, cell, av, event) {
        if(blockId && avId && inputElement) {
            let value = inputElement.value.trim();
            // 修改块属性，空值删除，注意这里的key不能用custom-av开头
            await fetchSyncPost('/api/attr/setBlockAttrs', {
                "id": blockId,
                "attrs": {
                    ["custom-dbid-" + avId]: value
                }
            });
            // 如果value为空，尝试获取块的内容
            text = text || cell.querySelector('.av__celltext--ref');
            if(!value && text) {
                value = text.dataset.text || '';
            }
            // 更新文本值
            if(text) text.textContent = value;
            // 删除输入框
            inputElement.parentElement.remove();
            // 修复av__cell--active样式丢失问题
            cell.classList.add('av__cell--active');
            // 解决多个表格切换焦点失效问题
            av?.querySelector('.av__header .av__title')?.focus();
            // 解决tab，方向键无法改变焦点问题
            pressKeyboard({key: 'Escape', keyCode: 27}, document);
            // 模拟触发tab键
            if(event?.key === "Tab"){
                pressKeyboard({key: 'Tab', keyCode: 9});
            }
        }
    }
    // 添加输入框
    function addAvMask(cell) {
        // see https://github.com/siyuan-note/siyuan/blob/487c48427ae8e3b840d209047cc316273c7a3931/app/src/protyle/render/av/cell.ts#L363
        let html = "";
        let cellRect = cell.getBoundingClientRect();
        let height = cellRect.height;
        const contentElement = cell.closest('.protyle-content');
        if (contentElement) {
            const contentRect = contentElement.getBoundingClientRect();
            if (cellRect.bottom > contentRect.bottom) {
                height = contentRect.bottom - cellRect.top;
            }
        }
        const style = `style="padding-top: 6.5px;position:absolute;left: ${cellRect.left}px;top: ${cellRect.top}px;width:${Math.max(cellRect.width, 25)}px;height: ${height}px"`;
        html = `<textarea ${style} spellcheck="false" class="b3-text-field">${cell.firstElementChild.textContent}</textarea>`;
        document.body.insertAdjacentHTML("beforeend", `<div class="av__mask av__mask--rename" style="z-index: ${++window.siyuan.zIndex}">${html}</div>`);
    }
    // 是否非ctrl键true是，false不是
    function isNotCtrl(event) {
        if (!event.metaKey && !event.ctrlKey) {
            return true;
        }
        return false;
    }
    // 模拟按键
    function pressKeyboard(keyInit, element) {
        element = element || getProtyleEl();
        keyInit["bubbles"] = true;
        let keydownEvent = new KeyboardEvent('keydown', keyInit);
        element?.dispatchEvent(keydownEvent);
        let keyUpEvent = new KeyboardEvent('keyup', keyInit);
        element?.dispatchEvent(keyUpEvent);
    }
    // 获取当前文档编辑器元素
    function getProtyleEl() {
        return document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr');
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
    // 监听元素被创建
    function observeElementCreation(parentNode, selector, onElementCreated) {
        // 配置观察器选项
        const config = { 
            childList: true, // 观察直接子节点的添加和移除
            subtree: true    // 观察所有后代节点
        };
        // 当检测到变动时执行的回调函数
        const callback = function(mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 使用 querySelectorAll 查找所有符合条件的新元素
                            const elements = node.querySelectorAll(selector);
                            elements.forEach(element => {
                                onElementCreated(element); // 调用外部提供的回调函数
                            });
                        }
                    });
                }
            }
        };
        // 创建一个观察器实例并传入回调函数
        const observer = new MutationObserver(callback);
        // 开始观察目标节点
        observer.observe(parentNode, config);
        // 返回一个函数来停止观察
        return () => observer.disconnect();
    }
    // 统计代码
    (function tongji(enable) {
        if(!enable) return;
        !function(p){"use strict";!function(t){var s=window,e=document,i=p,c="".concat("https:"===e.location.protocol?"https://":"http://","sdk.51.la/js-sdk-pro.min.js"),n=e.createElement("script"),r=e.getElementsByTagName("script")[0];n.type="text/javascript",n.setAttribute("charset","UTF-8"),n.async=!0,n.src=c,n.id="LA_COLLECT",i.d=n;var o=function(){s.LA.ids.push(i)};s.LA?s.LA.ids&&o():(s.LA=p,s.LA.ids=[],o()),r.parentNode.insertBefore(n,r)}()}({id:"KctUAV1SBR5tEp7H",ck:"KctUAV1SBR5tEp7H"});
    })(1);
})()