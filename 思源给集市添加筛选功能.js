// 功能：给集市添加筛选功能（筛选开启/关闭）
// 版本：0.0.4
// 更新记录：
// 0.0.2 修改css样式使之仅在已下载插件下生效，避免使其他选项卡受到干扰
// 0.0.3 修复全部时，在非下载插件下筛选框未隐藏的bug
// 0.0.4 增加不同筛选模式下的插件计数
// see https://ld246.com/article/1731574996052
(async ()=>{
    // 状态存储位置
    const actionStoragePath = '/data/storage/bazaar_filter.json';
    
    // 样式模板
    const templateSelector = `[data-name="bazaar"]:has([data-type="myPlugin"]:not(.b3-button--outline)):has([data-type="downloaded"].item--focus)`;
    const templateStyle = (actionStyle) => `
        .b3-select_ld1731574996052 {display: none;}
        ${templateSelector} {
            .b3-select_ld1731574996052 {display: block;}
            ${actionStyle || ''}
        }
    `;
    // 全部样式
    const allCardSelector = '.b3-card';
    const allStyle = templateStyle();
    // 筛选开启时的样式
    const onCardSelector = `.b3-card:has(.b3-switch[data-type="plugin-enable"][type="checkbox"]:not(:checked))`;
    const onStyle = templateStyle(`
        ${onCardSelector} {
            display: none;
        }
    `);
    // 筛选关闭时的样式
    const offCardSelector = `.b3-card:has(.b3-switch[data-type="plugin-enable"][type="checkbox"]:checked)`;
    const offStyle =  templateStyle(`
        ${offCardSelector} {
            display: none;
        }
    `);
    watchForSetting('dialog-setting', (setting) => {
        watchForEnableBtn('.config__tab-container[data-name="bazaar"]', '[data-type="plugins-enable"]', async (enableBtn) => {
            const lastSpace = Array.from(enableBtn.parentElement.querySelectorAll('.fn__space'))?.pop();
            if(!lastSpace) return;
            let countEl = enableBtn.nextElementSibling;
            if(!countEl?.classList?.contains('counter')) countEl = null;
            // 创建一个新的 <select> 元素
            const select = document.createElement('select');
            select.className = 'b3-select fn__flex-center b3-select_ld1731574996052';
            select.style.marginTop = '-4px';
            // 定义选项数组
            const options = [
                { value: 'all', text: '全部' },
                { value: 'on', text: '已开启' },
                { value: 'off', text: '已关闭' }
            ];
            // 遍历选项数组，为每个选项创建一个 <option> 元素
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                select.appendChild(opt);
            });
            // 将 <select> 元素插入到 lastSpace 的后面
            lastSpace.parentNode.insertBefore(select, lastSpace.nextSibling);
            // 添加 change 事件监听器
            select.addEventListener('change', function() {
                const selectedValue = this.value;
                // 根据选中的值执行相应的操作
                switch (selectedValue) {
                    case 'all':
                        manageStyle('update', allStyle);
                        saveActionState('all');
                        updateCount('all', countEl, setting);
                        break;
                    case 'on':
                        manageStyle('update', onStyle);
                        saveActionState('on');
                        updateCount('on', countEl, setting);
                        break;
                    case 'off':
                        manageStyle('update', offStyle);
                        saveActionState('off');
                        updateCount('off', countEl, setting);
                        break;
                    default:
                        manageStyle('update', allStyle);
                        saveActionState('all');
                        updateCount('all', countEl, setting);
                }
            });
            // 初始化状态
            const lastAction = await getActionState();
            select.value = lastAction;
            const styleAction = getStyleAction(lastAction);
            manageStyle(styleAction.action, styleAction.cssText);
            const stopObserve = observeCounterChange(countEl, () => {
                stopObserve();
                updateCount(lastAction, countEl, setting);
            });
        });
    });
    function updateCount(action, countEl, setting) {
        if(!countEl) return;
        if(action === 'all'){
            countEl.textContent = setting.querySelectorAll(templateSelector+' '+allCardSelector).length;
        }
        if(action === 'on'){
            countEl.textContent = setting.querySelectorAll(templateSelector+' '+onCardSelector).length;
        }
        if(action === 'off'){
            countEl.textContent = setting.querySelectorAll(templateSelector+' '+offCardSelector).length;
        }
    }
    function getStyleAction(action) {
        if(action === 'all') {
            return {action: 'add', cssText: allStyle};
        }
        if(action === 'on') {
            return {action: 'add', cssText: onStyle};
        }
        if(action === 'off') {
            return {action: 'add', cssText: offStyle};
        }
    }
    async function saveActionState(action) {
        try {
            putFile(actionStoragePath, JSON.stringify({action: action}))
        } catch(e) {
            console.log(e);
        }
    }
    async function getActionState() {
        try {
            let lastAction = await getFile(actionStoragePath);
            if(!lastAction) return 'all';
            lastAction = JSON.parse(lastAction || '{}');
            if(!lastAction || !lastAction.action) return 'all';
            return lastAction.action;
        } catch(e) {
            console.log(e);
            return 'all';
        }
    }
    function manageStyle(action, cssText) {
        const styleId = 'ld246_article_1731574996052';
        let styleTag = document.getElementById(styleId);

        if (action === 'add' || action === 'update') {
            if (styleTag) {
                // 如果已经存在 <style> 标签，则更新其内容
                styleTag.innerHTML = cssText;
            } else {
                // 否则创建新的 <style> 标签
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                styleTag.type = 'text/css';
                styleTag.innerHTML = cssText;
                document.head.appendChild(styleTag);
            }
        } else if (action === 'delete') {
            if (styleTag) {
                // 删除现有的 <style> 标签
                document.head.removeChild(styleTag);
            }
        }
    }
    /**
     * 监听带有特定 data-key 属性的元素被添加到 body 中
     * @param {string} key - 要监听的 data-key 值
     * @param {function} callback - 当检测到新元素时调用的回调函数
     */
    function watchForSetting(key, callback) {
        // 创建一个观察器实例并传入回调函数
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('data-key') === key) {
                            callback(node); // 调用外部提供的回调函数
                        }
                    }
                }
            }
        });
    
        // 配置观察选项:
        const config = { 
            childList: true, // 观察直接子节点的变化
            subtree: true    // 观察所有后代节点的变化
        };
    
        // 选择需要观察变动的节点
        const targetNode = document.body;
    
        // 开始观察目标节点
        observer.observe(targetNode, config);
    
        // 返回一个函数，用于停止观察
        return () => {
            observer.disconnect();
        };
    }
    function watchForEnableBtn(containerSelector, targetSelector, callback) {
        // 获取容器元素
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Container not found:', containerSelector);
            return;
        }
    
        // 创建一个观察器实例并传入回调函数
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node.querySelector(targetSelector);
                            if(element) {
                                callback(element); // 调用外部提供的回调函数
                            }
                        }
                    }
                }
            }
        });
    
        // 配置观察选项:
        const config = { 
            childList: true, // 观察直接子节点的变化
            subtree: true    // 观察所有后代节点的变化
        };
    
        // 开始观察目标节点
        observer.observe(container, config);
    
        // 返回一个函数，用于停止观察
        return () => {
            observer.disconnect();
        };
    }
    function observeCounterChange(targetNode, callback) {
      if (!targetNode) {
        console.error(`Element with targetNode "${targetNode}" not found.`);
        return;
      }
    
      // 观察器的配置
      const config = { 
        childList: true,       // 观察直接子节点的添加和移除
        subtree: true,         // 观察所有后代节点
        characterData: true,   // 观察字符数据的变化
        characterDataOldValue: true // 记录旧的字符数据
      };
    
      // 当观察到变动时执行的回调函数
      const observerCallback = function(mutationsList, observer) {
        for (let mutation of mutationsList) {
          if (mutation.type === 'characterData' || mutation.type === 'childList') {
            // 检查文本内容是否真的发生了变化
            if (targetNode.innerText !== mutation.oldValue) {
              callback(targetNode.innerText, mutation.oldValue);
            }
          }
        }
      };
    
      // 创建一个观察器实例并传入回调函数
      const observer = new MutationObserver(observerCallback);
    
      // 以上述配置开始观察目标节点
      observer.observe(targetNode, config);
    
      // 返回一个函数，用于停止观察
      return () => {
        observer.disconnect();
      };
    }
    // 存储文件
    function putFile(storagePath, data) {
          const formData = new FormData();
          formData.append("path", storagePath);
          formData.append("file", new Blob([data]));
          return fetch("/api/file/putFile", {
              method: "POST",
              body: formData,
          }).then((response) => {
              if (response.ok) {
                  //console.log("File saved successfully");
              }
              else {
                  throw new Error("Failed to save file");
              }
          }).catch((error) => {
              console.error(error);
          });
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
})();