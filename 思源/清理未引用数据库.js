// 清理未引用数据库
// 默认会移动到/data/trash/av目录中
// 使用方法：
// 1. 思源主菜单底部 -> 清理未引用数据库（如果打开了控制台，可以在控制台查看详情）
// 2. 在控制台执行 clearUnRefAvs() 即可
(()=>{
    // 定义未引用的数据库移动到哪
    let trashPath = '/data/trash/av/';

    // 把函数导出，以便控制台调用，如果有冲突可以在这里修改或关闭
    window.clearUnRefAvs = clearUnRefAvs;

    // 监听主菜单
    whenElementExist('#commonMenu .b3-menu__items').then((mainMenu) => {
        observeMainMenu(mainMenu, async ()=>{
            if(mainMenu.querySelector('button[data-id="clearUnRefAvs"]')) return;
            const sp2 = mainMenu.querySelector('button[data-id="separator_2"]');
            const btnString = `<button data-id="clearUnRefAvs" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconTrashcan"></use></svg><span class="b3-menu__label">清理未引用数据库</span></button>`;
            sp2.insertAdjacentHTML('beforebegin', btnString);
            const clearBtn = mainMenu.querySelector('button[data-id="clearUnRefAvs"]');
            clearBtn.onclick = (event) => {
                document.body.click(); // 关闭主菜单
                clearUnRefAvs(true); // 开始清理
            };
        });
    });

    // 清理未引用数据库函数
    async function clearUnRefAvs(showMsg = false) {
         // 查询在用数据库
        const avs = await querySql(`select * from blocks where type = 'av' limit 999999;`);
        const avIds = avs.map(av => getAvIdFromHtml(av.markdown));
    
        // 获取待删除数据库文件
        const fileRes = await requestApi('/api/file/readDir', {path: '/data/storage/av/'});
        if(!fileRes || fileRes.code !== 0) {
            console.log('未找到数据库文件');
            if(showMsg) showMessage('未找到数据库文件', true);
            return;
        }
        const delFiles = fileRes.data.filter(file => !file.isDir && file.name.endsWith('.json') && !avIds.includes(file.name.replace('.json', '')));
        if(delFiles.length === 0) {
            console.log('没有找到未引用的数据库');
            if(showMsg) showMessage('没有找到未引用的数据库', true);
            return;
        }
    
        // 创建文件夹
        trashPath = trashPath.replace(/\/$/, '') + '/';
        const ret = await putFile(trashPath, '', true);
        if(!ret || ret.code !== 0) {
            console.log('创建文件夹'+trashPath+'失败');
            if(showMsg) showMessage('创建文件夹'+trashPath+'失败', true);
            return;
        }
        
        //移动数据库文件
        const dels = [];
        await Promise.all(delFiles.map(async (file) => {
            const ret = await moveFile(file);
            if (ret) {
                dels.push('已删除数据库 ' + file.name);
            }
        }));

        // 输出结果
        console.log(`已成功删除${dels.length}个未引用的数据库`, dels);
        if(showMsg) showMessage(`已成功删除${dels.length}个未引用的数据库`);
    }

    async function moveFile(file, tries = 0) {
        const res = await requestApi('/api/file/renameFile', {
            path: '/data/storage/av/'+file.name,
            newPath: trashPath+file.name,
        });
        if(res && res.code === 409) {
            if(tries > 3) return false;
            await requestApi('/api/file/removeFile', {
                path: trashPath+file.name,
            });
            return moveFile(file, ++tries);
        }
        if(res && res.code === 0) {
            return true;
        }
        console.log(`移动文件${file}失败`, JSON.stringify(res));
        return false;
    }
    
    // 获取avid
    function getAvIdFromHtml(htmlString) {
        // 使用正则表达式匹配data-av-id的值
        const match = htmlString.match(/data-av-id="([^"]+)"/);
        if (match && match[1]) {
        return match[1];  // 返回匹配的值
        }
        return "";  // 如果没有找到匹配项，则返回空
    }
    async function querySql(sql) {
        try {
            const result = await requestApi('/api/query/sql', { "stmt": sql });
            if (result.code !== 0) {
                console.error("查询数据库出错", result.msg);
                return [];
            }
            return result.data;
        } catch(e) {
            console.error("查询数据库出错", e.message);
            return [];
        }
    }
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
    // 调用 await requestApi('/api/block/getChildBlocks', {id: '20241208033813-onlvfmp'});
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }

    // 发送消息
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    // 等待元素出现
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }

    /**
     * 监控 body 直接子元素中 #commonMenu 的添加
     * @returns {MutationObserver} 返回 MutationObserver 实例，便于后续断开监听
     */
    function observeMainMenu(selector, callback) {
        let hasSetting = false;
        let hasUserGuide = false;
        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
            // 遍历所有变化
            for (const mutation of mutationsList) {
                // 检查是否有节点被添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 遍历所有添加的节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查节点是否是图片菜单
                        if(hasSetting && hasUserGuide) return;
                        if (node.nodeType === 1 && node.dataset?.id === 'config') {
                            hasSetting = true;
                        }
                        if (node.nodeType === 1 && node.dataset?.id === 'userGuide') {
                            hasUserGuide = true;
                        }
                        if(hasSetting && hasUserGuide) {
                           callback();
                           setTimeout(() => {
                               hasSetting = false;
                               hasUserGuide = false;
                           }, 200);
                        }
                    });
                }
            }
        });
    
        // 开始观察 body 的直接子元素的变化
        selector = typeof selector === 'string' ? document.querySelector(selector) : selector;
        observer.observe(selector || document.body, {
            childList: true, // 监听子节点的添加
            subtree: false, // 仅监听直接子元素，不监听子孙元素
        });
    
        // 返回 observer 实例，便于后续断开监听
        return observer;
    }
})();