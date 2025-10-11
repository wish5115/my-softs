// ==UserScript==
// @name         思源收藏夹预抓取脚本（Qwen版）
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在页面加载、标签切换、地址变化时获取当前页面信息
// @author       Qwen
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 服务类型 siyuan quickcommand siyuan-api-plus
    const serverType = 'siyuan';

    // 预抓取后端服务器地址(对应serverType siyuan)，默认使用思源文件读写api存储抓取的信息
    const serverUrl = 'http://127.0.0.1:6806';

    // 预抓取快捷命令服务(对应serverType quickcommand) 当快捷命令服务不稳定时可以使用下面的思源内核扩展服务
    //const serverUrl = 'http://127.0.0.1:33442';

    // 预抓取思源内核扩展服务(对应serverType siyuan-api-plus) see https://ld246.com/article/1758444561920
    //const serverUrl = 'http://127.0.0.1:6809';

    // 思源api token
    const siyuanToken = 'vqpsx6fhsgckvahh';

    // 定义缓存文件路径，用于保存网页信息(注意，必须是/data目录下)
    const webInfoCacheFile = '/data/storage/favorite_web_info_cache.txt';

    if (window.top !== window.self) return;

     // 吐司提示
    function toast(msg, t = 3000, top, left) {
        const el = Object.assign(document.createElement('div'), {innerHTML: msg, style: `position:fixed;top:${top||20}px;left:${(left?left+'px':'')||'50%'};${left?'':'transform:translateX(-50%);'}background:#333;color:rgb(255 154 154);font-weight:bold;;padding:8px 16px;border-radius:4px;font-size:14px;z-index:9999;opacity:0;transition:opacity .3s;`});
        document.body.appendChild(el);void el.offsetHeight;el.style.opacity = 1;
        setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 300);}, t);
    }

    function putFile(storagePath, data) {
        return new Promise((resolve, reject) => {
            const url = serverUrl.trim().replace(/\/+$/, '');
            const headers = {};
            if (siyuanToken) {
                headers['Authorization'] = 'token ' + siyuanToken;
            }

            const formData = new FormData();
            formData.append("path", storagePath);
            formData.append("file", new Blob([data], { type: 'text/plain' }));

            GM_xmlhttpRequest({
                method: "POST",
                url: url + "/api/file/putFile",
                headers: headers,
                data: formData,
                onload: function(response) {
                    try {
                        if (response.status >= 200 && response.status < 300) {
                            // 解析返回的 responseText（若为 JSON），若服务器以 JSON 报错则视为失败
                            let ok = true;
                            try {
                                const json = response.responseText ? JSON.parse(response.responseText) : null;
                                if (json) {
                                    // 常见的失败标识： success:false 或 code 非 0 或存在 error 字段
                                    if (('success' in json && !json.success) || ('code' in json && json.code !== 0) || ('error' in json && json.error)) {
                                        ok = false;
                                    }
                                }
                            } catch (e) {
                                // 解析失败则忽略（不是 JSON），仍视为 ok
                            }
                            if (ok) resolve(true);
                            else reject(new Error('API 返回错误: ' + (response.responseText || response.status)));
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function(err) {
                    reject(new Error("Network error"));
                }
            });
        });
    }

    async function logPageInfo() {
        const url = window.location.href;
        const title = document.title;
        //const description = document.querySelector('meta[name="description"]')?.content || '无';
        //const keywords = document.querySelector('meta[name="keywords"]')?.content || '无';
        let description = '';
        let keywords = '';
        const descriptionMeta = document.querySelector('meta[name="description" i]') ||
          document.querySelector('meta[property="og:description" i]');
        if (descriptionMeta) {
          description = (descriptionMeta.getAttribute('content') || '').trim();
        }

        // 获取 keywords
        const keywordsMeta = document.querySelector('meta[name="keywords" i]');
        if (keywordsMeta) {
          keywords = (keywordsMeta.getAttribute('content') || '').trim();
          keywords = keywords?.split(/[,，;；|\s]+/)
              ?.map(s => s.trim().toLowerCase())
              ?.filter(Boolean)
              ?.join(',');
        }
        // 新增：尝试解析网站图标（favicon）URL
        let icon = '';
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
            const el = document.querySelector(sel);
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
                const u = new URL(url);
                foundHref = u.protocol + foundHref;
              } catch (e) {
                // ignore
              }
            } else if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(foundHref)) {
              // 相对路径，使用 base href 解析
              try {
                foundHref = new URL(foundHref, url).href;
              } catch (e) {
                // ignore
              }
            }
            icon = foundHref || '';
          } else {
            // 回退：尝试使用站点根目录的 /favicon.ico
            try {
              const u = new URL(url);
              icon = u.origin + '/favicon.ico';
            } catch (e) {
              icon = '';
            }
          }
        } catch (e) {
          console.error('favicon parse error', e);
        }
        if(serverType.toLowerCase() === 'siyuan'){
          const res = await putFile(webInfoCacheFile, encodeURIComponent(JSON.stringify(info)));
          if(!res) {
              console.error('❌ 上报失败:', res);
              toast('❌ 上报网站信息失败，请检查思源是否正常启动？！');
              return;
          }
          console.log('✅ 上报成功:', res)
      } else {
          GM_xmlhttpRequest({
              method: "GET",
              url: `${serverUrl.replace(/\/$/, '')}/??r=${Date.now()}&action=setWebInfo&content=${encodeURIComponent(JSON.stringify({url, title, description, keywords, icon}))}`,
              timeout: 5000,
              onload: res => console.log('✅ 上报成功:', res.responseText),
              onerror: err => {console.error('❌ 上报失败:', err);toast('❌ 上报网站信息失败，请检查思源是否正常启动？！');},
              ontimeout: () => console.warn('⏱️ 请求超时')
          });
      }

        console.log({
            时间: new Date().toLocaleString(),
            URL: url,
            标题: title,
            描述: description,
            关键词: keywords,
            图标: icon
        });
    }

    // 页面加载完成时
    window.addEventListener('load', logPageInfo);

    // 标签切换时
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            logPageInfo();
        }
    });

    // URL 哈希变化（如 #section）
    window.addEventListener('hashchange', logPageInfo);

    // 历史状态变化（SPA常用）
    window.addEventListener('popstate', logPageInfo);

    // 页面显示（包括前进后退）
    window.addEventListener('pageshow', logPageInfo);

    // 初始加载时也执行一次（防止某些情况漏掉）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', logPageInfo);
    } else {
        logPageInfo();
    }

})();