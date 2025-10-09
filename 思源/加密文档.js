// 加密文档（非真正加密）
// 注意： 该代码并不会加密原文，只是打开文档需要输入密码而已，且是前端加密，专业人员可以通过访问 js 源码分析出密码，因此请勿用于重要信息的保密！
// see https://ld246.com/article/1742364416944
//version 0.0.6
// 0.0.6 增加取消加密需要输入密码功能 感谢 @queguaiya 大佬的提醒
// 0.0.5 修复搜索预览切换和刷新显示明文问题
// 0.0.2 修复偶发显示原文的bug；默认密码框自动获取焦点；默认过期时间改为1秒
// 0.0.3 修复嵌入块显示bug
// 0.0.4 修复搜索预览和模式切换/导出预览被加载显示bug
// 使用方法
// 文档树右键选择加密/取消加密即可
// 查看所有加密文档（把下面的代码粘贴到任意文档中即可）
// {{//!js_esc_newline_return (async ()=&gt;{_esc_newline_    const ids = await fetchSyncPost(&quot;/api/file/getFile&quot;, {path:'/data/storage/encrypted_ids.json'});_esc_newline_    const result = await fetchSyncPost('/api/query/sql', { &quot;stmt&quot;:`select id, content from blocks where id in( ${ids.map(item=&gt;`'${item}'`).join(',')})` });_esc_newline_    const timer=setInterval(()=&gt; {_esc_newline_        if(!item.querySelector('.protyle-wysiwyg__embed')) return;_esc_newline_        clearInterval(timer);_esc_newline_        if(!result || !result.data) return;_esc_newline_        result.data.forEach((row)=&gt;{_esc_newline_            item.querySelector(`.protyle-wysiwyg__embed[data-id=&quot;${row.id}&quot;]`).innerHTML = row.content;_esc_newline_        });_esc_newline_    });_esc_newline_    return ids;_esc_newline_})();}}
// 注意：暂不支持文件夹，不过可以通过先获取文件夹所有文档的 id 后放入/data/storage/encrypted_ids.json 文件中实现
// 加密文档id存储在 /data/storage/encrypted_ids.json文件中
// 所有文档共用一个密码，一个解密所有都解密（暂不支持对单个文档单独设置密码）
(async () => {

    // 解密密码，前中后各5个字符的干扰码，所以你的真实密码在两边
    // 可通过修改getRealPw函数的默认参数，修改干扰码个数
    // 默认密码 123456
    const pw = '12345123abcde45667890';

    // 解密后的过期时间，单位秒，0代表不过期，即直到下次刷新页面前一直有效
    const expireTime = 30;

    // 加密文档id列表
    let encryptedDocIds = await getFile('/data/storage/encrypted_ids.json');
    try{encryptedDocIds = JSON.parse(encryptedDocIds || '[]');}catch(e){encryptedDocIds = []};
    if(encryptedDocIds.code && encryptedDocIds.code !== 0) encryptedDocIds = [];
    
    let pass = false;
    observeEditorLoaded((editor)=>{
        if(pass) return;
        // 监控搜索预览切换和刷新
        if(editor.closest('.search__preview')) {
            const searchPreview = editor.closest('#searchPreview');
            whenElementExist(()=>searchPreview.matches('[data-loading="finished"]') && searchPreview.querySelector('.protyle-breadcrumb__bar .popover__block')).then(async ()=>{
                const block = searchPreview.querySelector('.protyle-breadcrumb__bar .popover__block');
                if(!pass && encryptedDocIds.includes(block?.dataset?.id)) {
                    searchPreview.querySelector('.protyle-wysiwyg').innerHTML = '该文档已加密';
                }
            });
            return;
        }
        // 监控文档加载
        whenElementExist(()=>editor.closest('.protyle')?.dataset?.loading==='finished').then(() => {
            // 获取文档id
            const protyle = editor.closest('.protyle');
            const docId = protyle.querySelector('.protyle-title')?.dataset?.nodeId;
            if(!encryptedDocIds.includes(docId)) return;
            // 生成密码框
            editor.innerHTML = `<input type="text" class="fn__size200 b3-text-field" placeholder="请输入密码"><span id="pwd-tips"></span>`;
            const input = editor.querySelector('input');
            input.focus();
            input.addEventListener('input', ()=>{
                const rpw = getRealPw(pw);
                if(rpw === input.value.trim()) {
                    pass = true;
                    if(expireTime > 0) {
                        setTimeout(()=>{pass = false;}, expireTime*1000);
                    }
                    const protyle = getProtyle();
                    if(protyle?.model?.editor?.reload) {
                        protyle.model.editor.reload();
                    } else {
                        editor.closest('.protyle').querySelector('button[data-type="more"]').click();
                        whenElementExist('#commonMenu button[data-id="refresh"]').then((refresh)=>{
                            refresh.click();
                        });
                    }
                } else {
                    const tips = editor.querySelector('#pwd-tips');
                    tips.innerHTML = '密码错误';
                    tips.style.fontSize = '14px';
                    tips.style.marginTop = '4px';
                    setTimeout(()=>{tips.innerHTML = '';}, 2000);
                }
            });
        });
    });

    // 监听右键菜单
    const treeSelector = isMobile()? '#sidebar .b3-list--mobile' : '.sy__file';
    whenElementExist(treeSelector).then((fileTree) => {
        const onMenuShow = (event) => {
            const currLi = event.target.closest('li.b3-list-item');
            if(!currLi) return;
            // 关闭上次的菜单，防止2个菜单冲突
            window.siyuan.menus.menu.remove();
            whenElementExist('button[data-id="rename"]').then(targetMenu => {
                if(!currLi?.dataset?.nodeId) return;
                const isEncrypted = encryptedDocIds.includes(currLi?.dataset?.nodeId);
                const btnText = isEncrypted ? '取消加密' : '加密';
                const btnIcon = isEncrypted ? '#iconUnlock' : '#iconLock';
                const html = `<button data-id="encrypt" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="${btnIcon}"></use></svg><span class="b3-menu__label">${btnText}</span></button>`;
                targetMenu.insertAdjacentHTML('beforebegin', html);
                targetMenu.parentElement.querySelector('button[data-id="encrypt"]').onclick = async () => {
                    if(isEncrypted) {
                        // result string 确定并返回输入内容 false 取消
                        while (true) {
                            const result = await promptDialog('', '请输入密码', '请输入密码');
                            if(result === false) return;
                            if(result !== getRealPw(pw)) {
                                alert('密码错误，请重新输入');
                                continue;
                            }
                            break;
                        }
                        // 转换为 Set
                        let docSet = new Set(encryptedDocIds);
                        // 删除目标值
                        docSet.delete(currLi.dataset.nodeId);
                        // 转换回数组
                        encryptedDocIds = Array.from(docSet);
                    } else {
                        encryptedDocIds.push(currLi.dataset.nodeId);
                    }
                    // const focusList = document.querySelectorAll(treeSelector+' li.b3-list-item--focus:not([data-type="navigation-root"])');
                    // for(const i in focusList) {
                    //     const li = focusList[i];
                    //     if(li.nodeType !== 1) continue;
                    //     if(li?.dataset?.nodeId) encryptedDocIds.push(li.dataset.nodeId);
                    // }
                    putFile('/data/storage/encrypted_ids.json', JSON.stringify(encryptedDocIds));
                    window.siyuan.menus.menu.remove();
                    showMessage(isEncrypted?'文档已解密，下次打开时生效':'文档已加密，下次打开时生效');
                };
            });
        };
        if(isMobile()) {
            // 监听手机版更多按钮被单击
            fileTree.addEventListener('touchend', (event) => {
                // 检查点击的目标是否是 span[data-type="more-file"]
                if (event.target.closest('span[data-type="more-file"]')) {
                    onMenuShow(event);
                }
            });
        } else {
            // 监听手更多按钮被单击
            fileTree.addEventListener('mouseup', (event) => {
                // 检查点击的目标是否是 span[data-type="more-file"]
                if (event.target.closest('span[data-type="more-file"]')) {
                    onMenuShow(event);
                }
            });
            // 监听文档树右键事件
            fileTree.addEventListener('contextmenu', onMenuShow);
        }
    });

    function getProtyle() {
        try {
            if(document.getElementById("sidebar")) return siyuan.mobile.editor.protyle;
            const currDoc = siyuan?.layout?.centerLayout?.children.map(item=>item.children.find(item=>item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active')||item.panelElement.closest('[data-type="wnd"]')))).find(item=>item);
            return currDoc?.model.editor.protyle;
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 监听编辑器被添加
    let loading = false;
    function observeEditorLoaded(callback) {
        // 创建一个观察者实例并传入回调函数
        const observer = new MutationObserver(async (mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // 监控编辑器被加载
                    if (mutation.target.classList?.contains("protyle-wysiwyg")) {
                        // 防止死循环
                        if(loading) return;
                        loading = true;
                        setTimeout(()=>{loading = false;}, 1000);
                        //回调
                        callback(mutation.target);
                    }
                    // 监控嵌入块
                    if(mutation.target?.dataset?.type === 'NodeBlockQueryEmbed') {
                        const embeds = mutation.target.querySelectorAll('.protyle-wysiwyg__embed');
                        embeds.forEach(async embed => {
                            if(!pass && embed && encryptedDocIds.includes(embed.dataset.id)) {
                                let text = embed.querySelector('.protyle-breadcrumb__text')?.innerHTML;
                                if(!text) {
                                    text = (await requestApi('/api/block/getDocInfo', {id:embed.dataset.id}))?.data?.name;
                                }
                                embed.innerHTML = text + ' (已加密)';
                            }
                        });
                    }
                    mutation.addedNodes.forEach(node => {
                        // 监控预览窗口被加载
                        if (node.nodeType === 1 && node.matches('.block__popover')) {
                            if(!pass && encryptedDocIds.includes(node?.dataset?.oid)) {
                                whenElementExist(()=>node.querySelector('.protyle[data-loading="finished"] .protyle-wysiwyg')).then(async (content)=>{
                                    content.innerHTML = '该文档已加密';
                                });
                            }
                        }
                        // 监控搜索预览被加载
                        if (node.nodeType === 1 && node.matches('.protyle-breadcrumb__item--active') && node.closest('#searchPreview')) {
                            const searchPreview = node.closest('#searchPreview');
                            whenElementExist(()=>searchPreview.matches('[data-loading="finished"]') && searchPreview.querySelector('.protyle-breadcrumb__bar .popover__block')).then(async ()=>{
                                const block = searchPreview.querySelector('.protyle-breadcrumb__bar .popover__block');
                                if(!pass && encryptedDocIds.includes(block?.dataset?.id)) {
                                    searchPreview.querySelector('.protyle-wysiwyg').innerHTML = '该文档已加密';
                                }
                            });
                        }
                        // 监控导出预览被加载
                        if (node.nodeType === 1 && node.matches('h1') && node.closest('.b3-typography')) {
                            whenElementExist(()=>node.matches('h1[id]')).then(async ()=>{
                                if(!pass && encryptedDocIds.includes(node.getAttribute('id'))) {
                                    const typography = node.closest('.b3-typography');
                                    // 遍历并删除所有其他子节点
                                    while (typography.lastElementChild !== node) {
                                        typography.removeChild(typography.lastElementChild);
                                    }
                                    typography.insertAdjacentHTML('beforeend', '<p>该文档已加密</p>');
                                    // 隐藏导航栏复制按钮
                                    const previewAction = typography.closest('.protyle-preview')?.querySelector('.protyle-preview__action');
                                    if(previewAction) previewAction.style.display = 'none';
                                } else {
                                    // 恢复导航栏复制按钮
                                    const previewAction = node.closest('.b3-typography')?.closest('.protyle-preview')?.querySelector('.protyle-preview__action');
                                    if(previewAction) previewAction.style.display = '';
                                }
                            });
                        }
                    });
                }
            }
        });
        // 配置观察选项:
        const config = { 
            childList: true, // 观察子节点的变化(添加/删除)
            subtree: true, // 观察所有后代节点
            attributes: false,
        };
        // 选择需要观察变动的节点
        const targetNode = document.body; // 或者选择更具体的父节点以减少性能消耗
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回一个取消观察的方法
        return () => observer.disconnect();
    }

    // 支持创建文件夹，当isDir true时创建文件夹，忽略文件
     async function putFile(path, content = '', isDir = false) {
        const formData = new FormData();
        formData.append("path", path);
        formData.append("isDir", isDir)
        formData.append("file", new Blob([content]));
        const result = await fetch("/api/file/putFile", {
            method: "POST",
            body: formData,
        });
        const json = await result.json();
        return json;
    }

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    function isMobile() {
        return !!document.getElementById("sidebar");
    }
    
    // 获取文件
    async function getFile(path) {
        return fetch("/api/file/getFile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path,
            }),
        }).then((response) => {
            if (response.ok) {
                return response.text();
            } else {
                throw new Error("Failed to get file content");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    function getRealPw(pw, prefix = 5, lastfix = 5, midfix = 5) {
        if (!pw || pw.length <= prefix + lastfix + midfix) {
            return '';
        }
    
        // 去掉前缀的干扰码
        let trimmedPw = pw.slice(prefix);
    
        // 去掉后缀的干扰码
        trimmedPw = trimmedPw.slice(0, -lastfix);
    
        // 计算中间干扰码的位置
        const midIndex = Math.floor(trimmedPw.length / 2);
    
        // 去掉中间的干扰码
        const realPw =
            trimmedPw.slice(0, midIndex - Math.floor(midfix / 2)) +
            trimmedPw.slice(midIndex + Math.ceil(midfix / 2));
    
        return realPw;
    }

    // 调用示例
    // const result = await promptDialog(defaultValue, title, placehoder, okBtnText, cancelBtnText);
    // result string 确定并返回输入内容 false 取消
    function promptDialog(defaultValue = '', title = '请输入内容', placehoder = '请输入内容', okBtnText = '确定', cancelBtnText = '取消') {
        return new Promise((resolve) => {
            const dialogHtml = `<div data-key="dialog-prompt" class="b3-dialog--prompt b3-dialog--open"><div class="b3-dialog" style="z-index: ${++window.siyuan.zIndex};">
        <div class="b3-dialog__scrim"></div>
        <div class="b3-dialog__container " style="width:520px;height:auto;
        left:auto;top:auto">
        <svg class="b3-dialog__close"><use xlink:href="#iconCloseRound"></use></svg>
        <div class="resize__move b3-dialog__header" onselectstart="return false;">${title}</div>
        <div class="b3-dialog__body"><div class="b3-dialog__content">
        <div class="ft__breakword">
        <input type="password" class="b3-text-field" id="promptDialogInput" style="width:100%;" value="${defaultValue}" placeholder="${placehoder}">
        </div>
        </div>
        <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" id="promptDialogCancelBtn">${cancelBtnText}</button><div class="fn__space"></div>
        <button class="b3-button b3-button--outline" id="promptDialogConfirmBtn">${okBtnText}</button>
        </div></div>
        <div class="resize__rd"></div><div class="resize__ld"></div><div class="resize__lt"></div><div class="resize__rt"></div><div class="resize__r"></div><div class="resize__d"></div><div class="resize__t"></div><div class="resize__l"></div>
        </div></div></div>`;
            document.body.insertAdjacentHTML('beforeend', dialogHtml);
            const dialog = document.querySelector('.b3-dialog--prompt');
            const input = dialog.querySelector('#promptDialogInput');
            setTimeout(()=>input.focus(), 100);
            const resolveHandle = (result) => {
                dialog.remove();
                resolve(result);
                document.removeEventListener('keydown', keydownHandle, true);
            };
            const keydownHandle = (event) => {
                const notOtherKey = !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
                if (event.key === 'Enter' && notOtherKey && document.querySelector('.b3-dialog--prompt')) {
                    // 确定
                    resolveHandle(input.value);
                } else if (event.key === 'Escape' && notOtherKey && document.querySelector('.b3-dialog--prompt')) {
                    // 取消
                    resolveHandle(false);
                }
            };
            dialog.addEventListener('click', (e) => {
                if(
                    e.target.closest('.b3-dialog__scrim') ||
                    e.target.closest('.b3-dialog__close') ||
                    e.target.closest('.b3-button--cancel')
                ) {
                    // 取消
                    resolveHandle(false);
                } else if(e.target.closest('.b3-button--outline')) {
                    // 确定
                    resolveHandle(input.value);
                }
            });
            document.addEventListener('keydown', keydownHandle, true);
        });
    }
})();