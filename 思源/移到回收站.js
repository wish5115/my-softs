// 移到回收站（支持批量移动）
// see https://ld246.com/article/1742083860299
// version 0.0.6
// 0.0.6 用自定义弹出代替confirm
// 0.0.5 修复咋非回收站笔记右键菜单上显示清空回收站和移动到回收站的bug
// 0.0.4 文档右上侧按钮中的下拉菜单增加移动到回收站功能
// 0.0.3 增加情况回收站和回收站还原功能
// 0.0.2 修复来源属性添加失败问题；增加isShowConfirm参数
(() => {

    // 回收站笔记本id，可在笔记本右键设置中查看
    const toBoxId = '20250316032243-coo9k2t';

    // 删除文档或清空回收站时，是否弹窗确认对话框，true弹出，false不弹出
    const isShowConfirm = true;
    
    // 监听右键菜单，动态显示文件夹的文档数
    const treeSelector = isMobile()? '#sidebar .b3-list--mobile' : '.sy__file';
    whenElementExist(treeSelector).then((fileTree) => {
        const onMenuShow = (event) => {
            const currLi = event.target.closest('li.b3-list-item');
            if(!currLi) return;
            // 关闭上次的菜单，防止2个菜单冲突
            window.siyuan.menus.menu.remove();
            whenElementExist('button[data-id="delete"]').then(targetMenu => {
                // 修改删除按钮
                const targetLabel = targetMenu.querySelector('.b3-menu__label');
                targetLabel.style.color = siyuan.config.appearance.mode === 0 ? '#f53c3c' : '#ff7171';
                targetLabel.textContent = '永久删除';

                // 增加相关按钮
                if(currLi.matches('ul[data-url="'+toBoxId+'"] [data-type="navigation-root"]')) {
                    targetLabel.textContent = '删除回收站';
                    // 增加清空按钮
                    const html = `<button data-id="clearAll" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTrashcan"></use></svg><span class="b3-menu__label">清空回收站</span></button>`;
                    targetMenu.insertAdjacentHTML('beforebegin', html);
                    targetMenu.parentElement.querySelector('button[data-id="clearAll"]').onclick = async () => {
                        if(isShowConfirm) if(!(await confirmDialog('您确定要清空回收站吗？'))) {window.siyuan.menus.menu.remove();return;}
                        const docs = document.querySelectorAll(`[data-url="${toBoxId}"] > ul > li`);
                        docs.forEach(doc => {
                            fetchSyncPost('/api/filetree/removeDoc', {
                              "notebook": toBoxId,
                              "path": doc.dataset.path
                            });
                        });
                        showMessage('已清空回收站');
                        window.siyuan.menus.menu.remove();
                    };
                } else if(currLi.closest(`[data-url="${toBoxId}"]`)) {
                    // 增加还原按钮，仅顶级文件或文件夹增加还原按钮
                    if(currLi.matches('[data-url] > ul > li')){
                        const html = `<button data-id="moveToPath" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconOpenWindow"></use></svg><span class="b3-menu__label">还原</span></button>`;
                        targetMenu.insertAdjacentHTML('beforebegin', html);
                        targetMenu.parentElement.querySelector('button[data-id="moveToPath"]').onclick = async () => {
                            const focusList = document.querySelectorAll(treeSelector+' li.b3-list-item--focus:not([data-type="navigation-root"])');
                            window.siyuan.menus.menu.remove();
                            let failCount = 0;
                            for(const i in focusList) {
                                const li = focusList[i];
                                if(li.nodeType !== 1) continue;
                                const attrs = await fetchSyncPost('/api/attr/getBlockAttrs', {id:li.dataset.nodeId});
                                const box = attrs?.data['custom-from-box']||'';
                                let path = attrs?.data['custom-from-path']||'';
                                const pathArr = path.split('/');
                                pathArr.pop();
                                path = pathArr.join('/')+'.sy';
                                path = path === '.sy' ? '/' : path;
                                const result = await fetchSyncPost('/api/filetree/moveDocs', {
                                  "fromPaths": [li.dataset.path],
                                  "toNotebook": box,
                                  "toPath": path
                                });
                                if(!result || result.code !== 0) {
                                    failCount++;
                                }
                            }
                            if(focusList.length === failCount){
                                showMessage('还原失败', true);
                            } else if(failCount) {
                                showMessage('部分文档还原失败', true);
                            } else {
                                showMessage('还原成功');
                            }
                        };
                    }
                } else if(!currLi.matches('[data-type="navigation-root"]')) {
                    // 增加移动到回收站按钮
                    const html = `<button data-id="moveToTrash" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTrashcan"></use></svg><span class="b3-menu__label">移动到回收站</span></button>`;
                    targetMenu.insertAdjacentHTML('beforebegin', html);
                    targetMenu.parentElement.querySelector('button[data-id="moveToTrash"]').onclick = async () => {
                        if(isShowConfirm) if(!(await confirmDialog('您确定要移动这些文档到回收站吗？'))) {window.siyuan.menus.menu.remove();return;};
                        
                        window.siyuan.menus.menu.remove();
                        const focusLis = document.querySelectorAll(treeSelector+' li.b3-list-item--focus:not([data-type="navigation-root"])');
                        
                        // 设置来源path
                        const pathAndIdList = Array.from(focusLis).map(item => ({id:item.dataset.nodeId, path:item.dataset.path, box:item.closest('[data-url]')?.dataset?.url||''}));
                        for(const i in pathAndIdList) {
                            const item = pathAndIdList[i];
                            await fetchSyncPost('/api/attr/setBlockAttrs', {
                                "id": item.id,
                                "attrs": {
                                    "custom-from-path": item.path,
                                    "custom-from-box": item.box,
                                }
                            });
                        }
    
                        // 移动到回收站
                        const paths = Array.from(focusLis).map(item => item.dataset.path);
                        const result = await fetchSyncPost('/api/filetree/moveDocs', {
                          "fromPaths": paths,
                          "toNotebook": toBoxId,
                          "toPath": "/"
                        });
                        if(result && result.code === 0) {
                            showMessage('文档已移动到回收站');
                        } else {
                            console.error('移动到回收站失败', result);
                            showMessage('移动到回收站失败', true);
                        }
                    };
                }
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

    // 监听鼠标点击事件
    document.addEventListener('mouseup', (event) => {
        // 检查点击的目标元素是否具有 data-type="doc"
        if (event.target.closest('button[data-type="doc"]')) {
            whenElementExist('button[data-id="delete"]').then((delBtn) => {
                if(!delBtn) return;
                const delBtnLabel = delBtn.querySelector('.b3-menu__label');
                delBtnLabel.style.color = siyuan.config.appearance.mode === 0 ? '#f53c3c' : '#ff7171';
                delBtnLabel.textContent = '永久删除';
                // 生成按钮
                const html = `
                    <button data-id="moveToTrash2" class="b3-menu__item b3-menu__item--current">
                        <svg class="b3-menu__icon" style="">
                            <use xlink:href="#iconTrashcan"></use>
                        </svg>
                        <span class="b3-menu__label">移动到回收站</span>
                    </button>`;
                delBtn.insertAdjacentHTML('beforebegin', html);
                const toTrashBtn = delBtn.parentElement.querySelector('button[data-id="moveToTrash2"]');
                if(!toTrashBtn) return;
                toTrashBtn.onclick = async () => {
                    window.siyuan.menus.menu.remove();

                    // 获取文档信息
                    const protyle = event.target.closest('.protyle');
                    const docId = protyle?.querySelector('.protyle-title')?.dataset?.nodeId;
                    if(!docId) return;
                    let doc = await querySql(`select path,box from blocks where id = '${docId}'`);
                    doc = doc[0];
                    if(!doc || !doc.path || !doc.box) return;

                    // 判断是否已在回收站中
                    if(doc.box === toBoxId) {
                        showMessage('文档已在回收站中', true);
                        return;
                    }

                    // 设置文档来源
                    await fetchSyncPost('/api/attr/setBlockAttrs', {
                        "id": docId,
                        "attrs": {
                            "custom-from-path": doc.path,
                            "custom-from-box": doc.box,
                        }
                    });

                     // 移动到回收站
                    const result = await fetchSyncPost('/api/filetree/moveDocs', {
                      "fromPaths": [doc.path],
                      "toNotebook": toBoxId,
                      "toPath": "/"
                    });
                    if(result && result.code === 0) {
                        showMessage('文档已移动到回收站');
                    } else {
                        console.error('移动到回收站失败', result);
                        showMessage('移动到回收站失败', true);
                    }

                    // 关闭当前文档
                    const wnd = protyle.closest('[data-type="wnd"]');
                    if(!wnd) return;
                    const focusTabCloseBtn = wnd.querySelector('.layout-tab-bar li.item--focus .item__close');
                    if(!focusTabCloseBtn) return;
                    if(focusTabCloseBtn.closest('li.item--pin')) {
                        focusTabCloseBtn.click();
                        await sleep(40);
                    }
                    focusTabCloseBtn.click();
                };
            });
        }
    });

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    async function querySql(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }

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

    function isMobile() {
        return !!document.getElementById("sidebar");
    }

    // 等待元素出现（简版）
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }

    // 调用示例
    // const result = await confirmDialog(html, okBtnText, cancelBtnText);
    // result true 确定 false 取消
    function confirmDialog(html = '您确定要继续吗？', title = '⚠️ 确认信息', okBtnText = '确定', cancelBtnText = '取消') {
        return new Promise((resolve) => {
            const dialogHtml = `<div data-key="dialog-confirm" class="b3-dialog--confirm b3-dialog--open"><div class="b3-dialog" style="z-index: ${++window.siyuan.zIndex};">
        <div class="b3-dialog__scrim"></div>
        <div class="b3-dialog__container " style="width:520px;height:auto;
        left:auto;top:auto">
        <svg class="b3-dialog__close"><use xlink:href="#iconCloseRound"></use></svg>
        <div class="resize__move b3-dialog__header" onselectstart="return false;">${title}</div>
        <div class="b3-dialog__body"><div class="b3-dialog__content">
        <div class="ft__breakword">${html}</div>
        </div>
        <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" id="confirmDialogCancelBtn">${cancelBtnText}</button><div class="fn__space"></div>
        <button class="b3-button b3-button--outline" id="confirmDialogConfirmBtn">${okBtnText}</button>
        </div></div>
        <div class="resize__rd"></div><div class="resize__ld"></div><div class="resize__lt"></div><div class="resize__rt"></div><div class="resize__r"></div><div class="resize__d"></div><div class="resize__t"></div><div class="resize__l"></div>
        </div></div></div>`;
            document.body.insertAdjacentHTML('beforeend', dialogHtml);
            const dialog = document.querySelector('.b3-dialog--confirm');
            const resolveHandle = (result) => {
                dialog.remove();
                resolve(result);
                document.removeEventListener('keydown', keydownHandle, true);
            };
            const keydownHandle = (event) => {
                const notOtherKey = !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
                if (event.key === 'Enter' && notOtherKey && document.querySelector('.b3-dialog--confirm')) {
                    // 确定
                    resolveHandle(true);
                } else if (event.key === 'Escape' && notOtherKey && document.querySelector('.b3-dialog--confirm')) {
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
                    resolveHandle(true);
                }
            });
            document.addEventListener('keydown', keydownHandle, true);
        });
    }
})();