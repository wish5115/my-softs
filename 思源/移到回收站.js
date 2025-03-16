// 移到回收站（支持批量移动）
// see https://ld246.com/article/1742083860299
// version 0.0.2
// 0.0.2 修复来源属性添加失败问题；增加isShowConfirm参数
// 0.0.3 增加情况回收站和回收站还原功能
(() => {

    // 回收站笔记本id，可在笔记本右键设置中查看
    const toBoxId = '20250316032243-coo9k2t';

    // 删除文档或清空回收站时，是否弹窗确认对话框，true弹出，fasle不弹出
    const isShowConfirm = true;
    
    // 监听右键菜单，动态显示文件夹的文档数
    const treeSelector = isMobile()? '#sidebar .b3-list--mobile' : '.sy__file';
    whenElementExist(treeSelector).then((fileTree) => {
        const onMenuShow = (event) => {
            const currLi = event.target.closest('li.b3-list-item');
            if(!currLi) return;
            // 关闭上次的菜单，防止2个菜单冲突
            document.body.click();
            whenElementExist('button[data-id="delete"]').then(targetMenu => {
                // 修改删除按钮
                const targetLabel = targetMenu.querySelector('.b3-menu__label');
                targetLabel.style.color = siyuan.config.appearance.mode === 0 ? '#f53c3c' : '#ff7171';
                targetLabel.textContent = '永久删除';

                // 增加相关按钮
                if(currLi.matches('[data-type="navigation-root"]')) {
                    targetLabel.textContent = '删除回收站';
                    // 增加清空按钮
                    const html = `<button data-id="clearAll" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTrashcan"></use></svg><span class="b3-menu__label">清空回收站</span></button>`;
                    targetMenu.insertAdjacentHTML('beforebegin', html);
                    targetMenu.parentElement.querySelector('button[data-id="clearAll"]').onclick = async () => {
                        if(isShowConfirm) if(!confirm('您确定要清空回收站吗？')) {document.body.click();return;}
                        const docs = document.querySelectorAll(`[data-url="${toBoxId}"] > ul > li`);
                        docs.forEach(doc => {
                            fetchSyncPost('/api/filetree/removeDoc', {
                              "notebook": toBoxId,
                              "path": doc.dataset.path
                            });
                        });
                        showMessage('已清空回收站');
                        document.body.click();
                    };
                } else if(currLi.closest(`[data-url="${toBoxId}"]`)) {
                    // 增加还原按钮，仅顶级文件或文件夹增加还原按钮
                    if(currLi.matches('[data-url] > ul > li')){
                        const html = `<button data-id="moveToPath" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconOpenWindow"></use></svg><span class="b3-menu__label">还原</span></button>`;
                        targetMenu.insertAdjacentHTML('beforebegin', html);
                        targetMenu.parentElement.querySelector('button[data-id="moveToPath"]').onclick = async () => {
                            const focusList = document.querySelectorAll(treeSelector+' li.b3-list-item--focus:not([data-type="navigation-root"])');
                            document.body.click();
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
                } else {
                    // 增加移动到回收站按钮
                    const html = `<button data-id="moveToTrash" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTrashcan"></use></svg><span class="b3-menu__label">移动到回收站</span></button>`;
                    targetMenu.insertAdjacentHTML('beforebegin', html);
                    targetMenu.parentElement.querySelector('button[data-id="moveToTrash"]').onclick = async () => {
                        if(isShowConfirm) if(!confirm('您确定要移动这些文档到回收站吗？')) {document.body.click();return;};
                        
                        document.body.click();
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

    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
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
})();