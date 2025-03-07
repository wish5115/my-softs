// 给笔记本添加文档数
// see https://ld246.com/article/1741339328286
// version 0.0.2
// 0.0.2 兼容手机端
(() => {
    // 给笔记本添加文档数
    whenElementExist('ul[data-url]').then(() => {
        const boxes = document.querySelectorAll('ul[data-url]');
        boxes.forEach(async box => {
            const response = await query(`SELECT count(*) as count FROM blocks where box = '${box.dataset.url}' and type = 'd';`);
            if(!response[0] || !response[0]['count']) return;
            const count = response[0]['count'];
            const li = box.querySelector('li[data-type="navigation-root"]');
            if(!li) return;
            const boxText = li.querySelector('span.b3-list-item__text');
            if(!boxText) return;
            boxText.textContent += ` (${count})`;
        });
    });

    // 监听右键菜单，动态显示文件夹的文档数
    const treeSelector = isMobile()? '#sidebar .b3-list--mobile' : '.sy__file';
    whenElementExist(treeSelector).then((fileTree) => {
        const onMenuShow = (event) => {
            const currLi = event.target.closest('li.b3-list-item:not([data-type="navigation-root"],[data-count="0"])');
            if(!currLi) return;
            whenElementExist('button[data-id="rename"]').then(renameBtn => {
                const html = `<button data-id="docNums" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconList"></use></svg><span class="b3-menu__label">显示文档数</span></button>`;
                renameBtn.insertAdjacentHTML('afterend', html);
                renameBtn.parentElement.querySelector('button[data-id="docNums"]').onclick = async () => {
                    const response = await query(`SELECT count(*) as count FROM blocks where path like '%/${currLi.dataset.nodeId}%' and type = 'd' and id != '${currLi.dataset.nodeId}';`);
                    if(!response[0] || !response[0]['count']) {document.body.click();return;}
                    const count = response[0]['count'];
                    const boxText = currLi.querySelector('span.b3-list-item__text');
                    if(!boxText) return;
                    const text = boxText.textContent.replace(/\s*\(\d+\)$/, '');
                    boxText.textContent = text + ` (${count})`;
                    document.body.click();
                };
            });
        };
        if(isMobile()) {
            // 监听整个文档的点击事件
            fileTree.addEventListener('touchend', (event) => {
                // 检查点击的目标是否是 span[data-type="more-file"]
                if (event.target.closest('span[data-type="more-file"]')) {
                    onMenuShow(event);
                }
            });
        } else {
            fileTree.addEventListener('contextmenu', onMenuShow);
        }
    });
    
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }

    // 查询SQL函数
    async function query(sql) {
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