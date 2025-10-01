// 思源网站收藏夹数据优化
(() => {
    setTimeout(() => {
        onLinkEdit((menu) => {
            // 编辑表单出现时触发
            const label = menu.querySelector('.b3-menu__item > .b3-menu__label');
            if(label.querySelector('#avLinkIcon')) return;
            label.insertAdjacentHTML('beforeend', `
                <div class="fn__hr"></div>
                获取图标<br />
                <input class="b3-switch fn__flex-center" id="avLinkIcon" type="checkbox" checked="">
            `);
            const linkIcon = label.querySelector('#avLinkIcon');
            const links = label.querySelectorAll('textarea');
            const link = links[0];
            const title = links[1];

            if (typeof window.siyuan?.menus?.menu?.removeCB === 'function') {
                const original = window.siyuan.menus.menu.removeCB;

                // 只拦截一次
                window.siyuan.menus.menu.removeCB = async function (...args) {
                    // 编辑保存时触发
                    if (linkIcon.checked && link.value.toLowerCase().startsWith('http')) {
                        const cells = document.querySelectorAll('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) .protyle-wysiwyg [custom-my-favriate="true"] .av__cell[data-dtype="mAsset"]:has(.av__celltext--url[data-url="'+link.value+'"])');
                        if(cells.length > 1) {
                            alert('该链接已存在');
                            return;
                        } else {
                            document.querySelector('body > .av__panel')?.remove();
                            const cell = cells[0];
                            const icon = await getWebIcon(link.value);
                            const linkData = [
                                {
                                    type: "image",
                                    name: '',
                                    content: icon.icon,
                                },
                                {
                                    type: "file",
                                    name: title.value,
                                    content: link.value,
                                }
                            ];
                            requestApi("/api/av/setAttributeViewBlockAttr", {
                                avID: cell?.closest('[data-type="NodeAttributeView"]')?.dataset?.avId,
                                keyID: cell.dataset.colId,
                                rowID: cell.closest('.av__row').dataset.id,
                                cellID: cell.dataset.id,
                                value: { mAsset: linkData },
                            });
                        }
                    }

                    original.apply(this, args); // 执行原逻辑

                    // 恢复原函数（只拦截这一次）
                    window.siyuan.menus.menu.removeCB = original;
                };
            }
        });
    }, 2000);

    function onLinkEdit(callback) {
        const menu = document.querySelector('#commonMenu > .b3-menu__items');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 遍历新增节点
                    mutation.addedNodes.forEach((node) => {
                        // 检查是否为 Element 类型且是 body 的直接子元素
                        if (node.nodeType === Node.ELEMENT_NODE
                            && node.parentNode === menu
                            && menu.parentNode?.matches('[data-name="av-asset-link"], [data-name="av-asset-edit"]')
                            && menu.textContent.includes(window.siyuan.languages.link)
                            && menu.textContent.includes(window.siyuan.languages.title)
                            && document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) .protyle-wysiwyg [custom-my-favriate="true"] .av__cell[data-dtype="mAsset"]')
                        ) {
                            callback(menu);
                        }
                    });
                }
            });
        });

        // 开始观察 body 元素
        observer.observe(menu, {
            childList: true,   // 监听子元素增删
            subtree: false     // 不递归监听后代元素（只监听直接子元素）
        });
    }

    async function getWebIcon(href) {
        let json = {icon: '' };
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76";

        try {
            let result;
            // 先获取快捷命令服务
            if (config.useQuickCommandServer && isBrowser && href.toLowerCase() === currentBrowserUrl.toLowerCase()) {
                result = await forwardProxy(
                    `${quickCommandServerUrl.replace(/\/$/, '')}/?r=${Date.now()}&action=getWebInfo`, 'GET', null,
                    [{ 'User-Agent': userAgent }],
                    10000, 'text/html'
                );
                if (result?.data?.body) {
                    try {
                        json = JSON.parse(decodeURIComponent(result?.data?.body));
                        return json;
                    } catch (e) {
                        return json;
                    }
                }
            }

            // 获取网络页面
            result = await forwardProxy(
                href, 'GET', null,
                [{ 'User-Agent': userAgent }],
                60000, 'text/html'
            );

            const data = result?.data;
            if (!data || Math.floor(data.status / 100) !== 2) {
                return json;
            }

            const html = data.body;
            if (!html || typeof html !== 'string') {
                return json;
            }

            // 1. 先用正则提取 head 标签部分
            const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
            let headContent = headMatch ? headMatch[1] : html;

            // 2. 用正则去除 script 和 style 标签及其内容
            headContent = headContent
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

            // 3. 构造一个完整的 HTML 文档用于 DOMParser 解析
            const htmlDoc = `<!DOCTYPE html><html><head>${headContent}</head><body></body></html>`;

            // 4. 使用 DOMParser 解析
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlDoc, 'text/html');

            // 尝试解析网站图标（favicon）URL
            try {
                // 优先查找常见的 icon link 标签
                const iconSelectorList = [
                    'link[rel*="icon" i]',
                    'link[rel="shortcut icon" i]',
                    'link[rel="apple-touch-icon" i]',
                    'link[rel="apple-touch-icon-precomposed" i]',
                    'link[rel="mask-icon" i]'
                ];
                let foundHref = '';
                for (let sel of iconSelectorList) {
                    const el = doc.querySelector(sel);
                    if (el && el.getAttribute && el.getAttribute('href')) {
                        foundHref = (el.getAttribute('href') || '').trim();
                        if (foundHref) break;
                    }
                }
                // 如果找到了 link href，规范化为绝对 URL
                if (foundHref) {
                    // 处理 protocol-relative URL (e.g. //example.com/favicon.ico)
                    if (/^\/\//.test(foundHref)) {
                        try {
                            const u = new URL(href);
                            foundHref = u.protocol + foundHref;
                        } catch (e) {
                            // ignore
                        }
                    } else if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(foundHref)) {
                        // 相对路径，使用 base href 解析
                        try {
                            foundHref = new URL(foundHref, href).href;
                        } catch (e) {
                            // ignore
                        }
                    }
                    json.icon = foundHref || '';
                } else {
                    // 回退：尝试使用站点根目录的 /favicon.ico
                    try {
                        const u = new URL(href);
                        json.icon = u.origin + '/favicon.ico';
                    } catch (e) {
                        json.icon = '';
                    }
                }
            } catch (e) {
                console.error('favicon parse error', e);
            }

        } catch (error) {
            console.error('Error fetching or parsing web info:', error);
        }

        return json;
    }

    async function forwardProxy(url, method = 'GET', payload = {}, headers = [], timeout = 7000, contentType = 'text/html') {
        const data = {
            url: url,
            method: method,
            timeout: timeout,
            contentType: contentType,
            headers: headers,
            payload: payload
        };
        return requestApi('/api/network/forwardProxy', data);
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, { method: method, body: JSON.stringify(data || {}) })).json();
    }
})();