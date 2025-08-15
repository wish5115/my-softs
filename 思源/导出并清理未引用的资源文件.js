// 导出并清理未引用的资源文件
// 默认会移动到/data/trash/assets目录中
(()=>{
    // 定义未引用的数据库移动到哪
    let trashPath = '/data/trash/';

    // 把函数导出，以便控制台调用，如果有冲突可以在这里修改或关闭
    window.exportUnUsedAssets = exportUnUsedAssets;

    // 发布模式不显示
    if(window.siyuan.config.readonly) return;

    // 监听主菜单
    whenElementExist('#commonMenu .b3-menu__items').then((mainMenu) => {
        observeMainMenu(mainMenu, async ()=>{
            if(mainMenu.querySelector('button[data-id="exportUnUsedAssets"]')) return;
            const sp2 = mainMenu.querySelector('button[data-id="separator_2"]');
            const btnString = `<button data-id="exportUnUsedAssets" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconUpload"></use></svg><span class="b3-menu__label">导出清理未引用资源</span></button>`;
            sp2.insertAdjacentHTML('beforebegin', btnString);
            const clearBtn = mainMenu.querySelector('button[data-id="exportUnUsedAssets"]');
            clearBtn.onclick = (event) => {
                window.siyuan.menus.menu.remove(); // 关闭主菜单
                exportUnUsedAssets(true); // 开始清理
            };
        });
    });

    // 清理未引用数据库函数
    async function exportUnUsedAssets(showMsg = false) {

        // 创建文件夹
        const trashAssetsPath = trashPath+'assets';
        const ret = await putFile(trashAssetsPath, '', true);
        if(!ret || ret.code !== 0) {
            console.log('创建文件夹'+trashAssetsPath+'失败');
            if(showMsg) showMessage('创建文件夹'+trashAssetsPath+'失败', true);
            return;
        }
        
        // 查询所有未引用的资源文件
        const delFiles = (await requestApi('/api/asset/getUnusedAssets'))?.data?.unusedAssets || [];
        
        //移动数据库文件
        const dels = [];
        await Promise.all(delFiles.map(async (file) => {
            const ret = await moveFile(file);
            if (ret) {
                dels.push('已删除文件 ' + file);
            }
        }));

        // 输出结果
        console.log(`已成功删除${dels.length}个未引用的资源文件`, dels);
        if(showMsg) showMessage(`已成功删除${dels.length}个未引用的资源文件`);
    }

    async function moveFile(file, tries = 0) {
        const res = await requestApi('/api/file/renameFile', {
            path: '/data/'+file,
            newPath: trashPath+file,
        });
        if(res && res.code === 409) {
            if(tries > 3) return false;
            await requestApi('/api/file/removeFile', {
                path: trashPath+file,
            });
            return moveFile(file, ++tries);
        }
        if(res && res.code === 0) {
            return true;
        }
        console.log(`移动文件${file}失败`, JSON.stringify(res));
        return false;
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
})();