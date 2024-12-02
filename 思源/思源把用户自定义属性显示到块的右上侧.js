// 思源把用户自定义属性显示到块的右上侧
// see https://ld246.com/article/1732940163490
// 注意，打开属性面板通过模拟按键实现，如果修改了打开属性快捷键请修改openCustomAttrsPage函数的按键映射，否则可能无法模拟按键
// version: 0.0.3
// 更新记录
// 0.0.2 可自定义是否显示提示，可自定义属性白名单和黑名单
// 0.0.3 
//   1. 修复自定义属性删除后，自定义属性图标残留问题；
//   2. 修复嵌套块的外层自定义属性与第一个子块自定义属性合并问题（注意，这里的合并与已知问题1中所说的重叠是不同的，合并指二者内容显示到一起了，重叠指上下文字显示有重叠部分）
//   3. 修复多层嵌套后代块自定义属性无法显示的问题
// 已知问题：
//   1. 嵌套块的外层命名，别名，自定义属性等与第一个子块的命名，别名，自定义属性重叠问题是思源已知问题，暂无法解决。详见：https://github.com/siyuan-note/siyuan/issues/13333
//   2. 长文动态加载可能有问题，暂不支持！！！
(()=>{
    // 鼠标移上去是否显示提示
    const isShowTips = false;

    // 属性白名单
    // 下面的自定义属性们显示到右侧，不设置保持空即可。
    // 不需要带custom-前缀，白名单和黑名单有任意一个生效即生效
    let onlyTheseAttrs = [
        //'',
    ];

    // 属性黑名单
    // 下面的自定义属性们不显示到右侧，不设置保持空即可。
    // 不需要带custom-前缀，白名单和黑名单有任意一个生效即生效
    let notTheseAttrs = [
        'avs', // 默认过滤数据库的自定义属性
    ];
    
    // 自定义属性的svg
    const attrSvg = `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6354" width="64" height="64"><path d="M512 2.56C231.424 2.56 3.584 229.888 3.584 510.976S231.424 1018.88 512 1018.88s508.416-227.328 508.416-508.416S793.088 2.56 512 2.56z m0 941.568c-239.616 0-433.664-194.048-433.664-433.664C78.336 270.848 272.384 76.8 512 76.8s433.664 194.048 433.664 433.664-194.048 433.664-433.664 433.664z" fill="#5f6368" p-id="6355"></path><path d="M455.68 304.128c0-14.848 5.12-27.136 15.872-36.352 10.752-9.216 24.064-14.336 40.96-14.336s30.72 4.608 41.472 14.336 15.872 21.504 15.872 36.352c0 14.848-5.12 27.136-15.872 36.864s-24.576 14.848-40.96 14.848-29.696-5.12-40.448-14.848c-11.264-10.24-16.896-22.528-16.896-36.864z m7.68 443.904V412.16h97.792V747.52H463.36z" fill="#5f6368" p-id="6356"></path></svg>`;

    // 格式化白名单和黑名单
    if(onlyTheseAttrs.length > 0) onlyTheseAttrs = onlyTheseAttrs.map(item => item.replace(/^custom\-/i, ''));
    if(notTheseAttrs.length > 0) notTheseAttrs = notTheseAttrs.map(item => item.replace(/^custom\-/i, ''));
    
    // 监听自定义属性被添加
    let lastAttrWrap = null;
    observeCustomAttributes('custom-', (element, attrName, attrValue, type) => {
        // 过滤白名单和黑名单，有任意一个生效即生效
        if(onlyTheseAttrs.length > 0 && !onlyTheseAttrs.includes(attrName.replace(/^custom\-/i, ''))) return;
        if(notTheseAttrs.length > 0 && notTheseAttrs.includes(attrName.replace(/^custom\-/i, ''))) return;
        // 判断属性值是否为空
        if(!attrValue) return;
        // 把自定义属性显示到右侧
        const protyleAttr = element.lastElementChild;
        if(!protyleAttr || !protyleAttr.classList.contains('protyle-attr')) return;
        // 创建wrap
        let customAttrsWrap = protyleAttr.querySelector('.protyle-attr--custom');
        if(!customAttrsWrap){
            customAttrsWrap = document.createElement('div');
            customAttrsWrap.className = 'protyle-attr--custom';
            customAttrsWrap.innerHTML = attrSvg;
            customAttrsWrap.addEventListener('click', (event) => {
                openCustomAttrsPage(element);
            });
            protyleAttr.appendChild(customAttrsWrap);
        }
        // 创建属性
        let attrEl = customAttrsWrap.querySelector('.' + attrName);
        if(!attrEl){
            attrEl = document.createElement('span');
            attrEl.className = 'custom-attr-item ' + attrName;
            customAttrsWrap.appendChild(attrEl);
        }
        attrEl.textContent = attrValue;
        // 添加标题
        if (isShowTips) {
            if(lastAttrWrap !== customAttrsWrap) {
                lastAttrWrap = customAttrsWrap;
                customAttrsWrap.title = '';
                setTimeout(() => {
                    lastAttrWrap = null;
                    customAttrsWrap.title = customAttrsWrap.title.replace(/\n$/, '');
                }, 1000);
            }
            customAttrsWrap.title += attrName + ' : ' + attrValue + "\n";
        }
    });

    // 添加样式
    addStyle(`.protyle-attr--custom { .custom-attr-item:not(:last-child) {margin-right: 4px;} svg {fill: currentColor;} }`);

    // 添加style标签
    function addStyle(css) {
        // 创建一个新的style元素
        const style = document.createElement('style');
        // 设置CSS规则
        style.innerHTML = css;
        // 将style元素添加到<head>中
        document.head.appendChild(style);
    }

    // 打开属性面板，并切换到自定义属性选项卡
    function openCustomAttrsPage(node) {
        // 模拟按键
        let keyInit = {
            ctrlKey: !isMac(),
            altKey: true,
            metaKey: isMac(),
            shiftKey: false,
            key: 'A',
            keyCode: 65
        }
        keyInit["bubbles"] = true;
        let keydownEvent = new KeyboardEvent('keydown', keyInit);
        (node || document.getElementsByTagName("body")[0]).dispatchEvent(keydownEvent);
        let keyUpEvent = new KeyboardEvent('keyup', keyInit);
        (node || document.getElementsByTagName("body")[0]).dispatchEvent(keyUpEvent);
        // 模拟点击
        whenElementExist('div.b3-dialog--open[data-key="dialog-attr"]').then((dialog) => {
            dialog.querySelector('.layout-tab-bar .item--full[data-type="custom"]').click();
        });
    }

    // 判断是否Mac
    function isMac() {
        return navigator.platform.indexOf("Mac") > -1;
    }

    // 等待元素渲染完成后执行
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let element = null;
                if (typeof selector === 'function') {
                    element = selector();
                } else {
                    element = document.querySelector(selector);
                }
                if (element) {
                    resolve(element);
                } else {
                    requestAnimationFrame(checkForElement);
                }
            };
            checkForElement();
        });
    }

    // 监听用户自定义属性出现
    function observeCustomAttributes(prefix = 'custom-', callback, targetNode = document.body) {
        let lastAttrNames = [], lastAttrNamesTimer = null;
        // 观察器的配置
        const config = { childList: true, attributes: true, subtree: true };
        // 创建一个观察器实例并传入回调函数
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                // 监听自定义属性加载
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        if(node.nodeType === Node.ELEMENT_NODE) {
                            // 获取所有以'custom-'开头的属性
                            const customAttrs = Array.from(node.attributes).filter(attr => attr.name.startsWith(prefix));
                            if (customAttrs.length > 0) {
                                customAttrs.forEach(attr => {
                                    callback(node, attr.name, attr.value, 'load');
                                });
                            }
                            // 获取所有后代元素以'custom-'开头的属性
                            const subs = node.querySelectorAll('[data-type][data-node-id]');
                            if (subs.length > 0) {
                                subs.forEach(el => {
                                    const customAttrs = Array.from(el.attributes).filter(attr => attr.name.startsWith(prefix));
                                    if (customAttrs.length > 0) {
                                        customAttrs.forEach(attr => {
                                            callback(el, attr.name, attr.value, 'load');
                                        });
                                    }
                                });
                            }
                        }
                    }
                }
                // 监听自定义属性修改
                if (mutation.type === 'attributes') {
                    const attributeName = mutation.attributeName;
                    // 检查属性名是否以指定前缀开头
                    if (attributeName.startsWith(prefix)) {
                        // 防止多次重复触发
                        if(lastAttrNames.includes(attributeName)) continue;
                        lastAttrNames.push(attributeName);
                        if(!lastAttrNamesTimer) lastAttrNamesTimer = setTimeout(() => {
                            lastAttrNames = [];
                            lastAttrNamesTimer = null;
                        }, 1000);
                        // 如果提供了回调函数，则调用它
                        if (typeof callback === 'function') {
                            callback(mutation.target, attributeName, mutation.target.getAttribute(attributeName), 'add');
                        }
                    }
                }
            }
        });
        // 开始观察目标节点
        observer.observe(targetNode, config);
        // 返回一个断开连接的方法
        return () => observer.disconnect();
    }
})();