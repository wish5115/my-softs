// ==UserScript==
// @name         获取页面信息（URL, Title, Meta）
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  在页面加载、标签切换、地址变化时获取当前页面信息
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 快捷命令服务 当快捷命令服务不稳定时可以使用下面的思源内核扩展服务
    const serverUrl = 'http://127.0.0.1:33442';

    // 思源内核扩展服务 see https://ld246.com/article/1758444561920
    //const serverUrl = 'http://127.0.0.1:6809';

     // 吐司提示
    function toast(msg, t = 3000, top, left) {
        const el = Object.assign(document.createElement('div'), {innerHTML: msg, style: `position:fixed;top:${top||20}px;left:${(left?left+'px':'')||'50%'};${left?'':'transform:translateX(-50%);'}background:#333;color:rgb(255 154 154);font-weight:bold;;padding:8px 16px;border-radius:4px;font-size:14px;z-index:9999;opacity:0;transition:opacity .3s;`});
        document.body.appendChild(el);void el.offsetHeight;el.style.opacity = 1;
        setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 300);}, t);
    }

    function logPageInfo() {
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
        GM_xmlhttpRequest({
            method: "GET",
            url: `${serverUrl.replace(/\/$/, '')}/??r=${Date.now()}&action=setWebInfo&content=${encodeURIComponent(JSON.stringify({url, title, description, keywords, icon}))}`,
            timeout: 5000,
            onload: res => console.log('✅ 上报成功:', res.responseText),
            onerror: err => {console.error('❌ 上报失败:', err);toast('❌ 上报网站信息失败，请检查快捷命令服务是否正常？！');},
            ontimeout: () => console.warn('⏱️ 请求超时')
        });

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