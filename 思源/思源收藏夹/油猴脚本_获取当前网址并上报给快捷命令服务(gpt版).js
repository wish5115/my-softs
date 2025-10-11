// ==UserScript==
// @name         思源收藏夹预抓取脚本
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  获取当前页面的 URL、title、description、keywords，支持 SPA 路由、hash、切换标签与动态 meta/title 变化。
// @author       ChatGPT
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-end
// ==/UserScript==

(function () {
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

  // ------------------ 辅助函数 ------------------
  function getMeta(name) {
    if (!document.head) return '';
    const meta = document.head.querySelector(`meta[name="${name}" i ]`) ||
                 document.head.querySelector(`meta[property="${name}" i]`);
    let data = meta ? (meta.content || '').trim() : '';
    if(name.toLowerCase() === 'keywords') {
        data = data?.split(/[,，;；|\s]+/)
            ?.map(s => s.trim().toLowerCase())
            ?.filter(Boolean)
            ?.join(',');
    }
    return data;
  }

  function getAnyMeta(...names) {
    for (const n of names) {
      const v = getMeta(n);
      if (v) return v;
    }
    return '';
  }

  // 新增：解析并返回网站图标 URL（同步，从 DOM 解析、且将相对路径解析为绝对 URL，找不到时回退到 /favicon.ico）
  function getFavicon() {
    try {
      if (!document.head) return '';
      const iconSelectorList = [
        'link[rel*="icon" i]',
        'link[rel="shortcut icon" i]',
        'link[rel="apple-touch-icon" i]',
        'link[rel="apple-touch-icon-precomposed" i]',
        'link[rel="mask-icon" i]'
      ];
      let foundHref = '';
      for (let sel of iconSelectorList) {
        const el = document.head.querySelector(sel);
        if (el && el.getAttribute && el.getAttribute('href')) {
          foundHref = (el.getAttribute('href') || '').trim();
          if (foundHref) break;
        }
      }
      if (!foundHref) {
        try {
          const u = new URL(location.href);
          return u.origin + '/favicon.ico';
        } catch (e) {
          return '';
        }
      }
      // protocol-relative (//example.com/foo)
      if (/^\/\//.test(foundHref)) {
        try {
          const u = new URL(location.href);
          foundHref = u.protocol + foundHref;
        } catch (e) {
          // ignore
        }
      } else if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(foundHref)) {
        // relative path -> resolve against current location
        try {
          foundHref = new URL(foundHref, location.href).href;
        } catch (e) {
          // ignore
        }
      }
      return foundHref || '';
    } catch (e) {
      return '';
    }
  }

  function collectInfo() {
    return {
      url: location.href,
      title: document.title || (document.querySelector('title') ? document.querySelector('title').textContent : ''),
      description: getAnyMeta('description', 'og:description', 'twitter:description'),
      keywords: getMeta('keywords') || '',
      icon: getFavicon()
    };
  }

 // 吐司提示
 function toast(msg, t = 3000, top, left) {
     const el = Object.assign(document.createElement('div'), {innerHTML: msg, style: `position:fixed;top:${top||20}px;left:${(left?left+'px':'')||'50%'};${left?'':'transform:translateX(-50%);'}background:#333;color:rgb(255 154 154);font-weight:bold;;padding:8px 16px;border-radius:4px;font-size:14px;z-index:9999;opacity:0;transition:opacity .3s;`});
     document.body.appendChild(el);void el.offsetHeight;el.style.opacity = 1;
     setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 300);}, t);
 }

  // 供用户自定义处理的地方：把 info 发到哪里 / 存哪里 / 在页面显示 等。
  async function handleInfo(info, reason) {
    //if(info.url.toLowerCase() !== location.href.toLowerCase()) return;
    // reason: 'load' | 'locationchange' | 'hashchange' | 'visibilitychange' | 'metachange' | ...
    // ----- 在这里修改为你想要的处理逻辑（发送到本地服务 / 存 localStorage / 显示在 UI 等） -----
    console.log('[page-info]', reason, info);
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
              url: `${serverUrl.replace(/\/$/, '')}/?r=${Date.now()}&action=setWebInfo&content=${encodeURIComponent(JSON.stringify(info))}`,
              timeout: 5000,
              onload: res => console.log('✅ 上报成功:', res.responseText),
              onerror: err => {console.error('❌ 上报失败:', err);toast('❌ 上报网站信息失败，请检查思源是否正常启动？！');},
              ontimeout: () => console.warn('⏱️ 请求超时')
          });
      }

    // 示例：上报到本地服务器（若需要，取消注释并修改 URL）
    // fetch('http://localhost:3000/receive', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({info, reason, ts: Date.now()})}).catch(()=>{});
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

  // 简单去抖，避免短时间内重复触发大量处理
  function debounce(fn, wait = 200) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ------------------ 关键：监听地址变化（支持 SPA） ------------------
  // --- 新增: 覆盖 history.pushState / replaceState 并触发自定义事件 locationchange
  (function patchHistoryEvents() {
    const _pushState = history.pushState;
    const _replaceState = history.replaceState;
    history.pushState = function (...args) {
      const result = _pushState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
    history.replaceState = function (...args) {
      const result = _replaceState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
    // popstate（后退前进）本身触发 popstate，我们也监听并统一处理
    window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
  })();

  // ------------------ 关键：初始加载与 URL 变化的处理 ------------------
  const debouncedHandle = debounce((reason) => {
    const info = collectInfo();
    handleInfo(info, reason);
  }, 150);

  // 初次加载
  window.addEventListener('load', () => debouncedHandle('load'));
  // SPA 的地址变化（pushState/replaceState/popstate）
  window.addEventListener('locationchange', () => debouncedHandle('locationchange'));
  // hash 变化
  window.addEventListener('hashchange', () => debouncedHandle('hashchange'));
  // pageshow（页面从 bfcache 恢复）
  window.addEventListener('pageshow', () => debouncedHandle('pageshow'));

  // ------------------ 关键：tab 切换（可见性变化） ------------------
  // --- 新增: 监听 visibilitychange，当切回标签页时再抓取一次（有些 SPA 在切换回来时会更新内容） ----
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      debouncedHandle('visibilitychange');
    }
  });

  // ------------------ 关键：检测 title/meta 的动态变化 ------------------
  // --- 新增: 使用 MutationObserver 监控 head 内 title/meta 变更 ---
  (function observeMetaTitle() {
    const head = document.head;
    if (!head) return;
    const observer = new MutationObserver((mutations) => {
      // 有任何影响 title/meta 的变更则触发一次抓取（去抖保护）
      let relevant = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          // 新增或移除 meta/title
          if ([...m.addedNodes, ...m.removedNodes].some(n => (n.tagName && (n.tagName.toLowerCase() === 'meta' || n.tagName.toLowerCase() === 'title')))) {
            relevant = true;
            break;
          }
        } else if (m.type === 'attributes') {
          // meta 属性变化（content 等）
          if (m.target && (m.target.tagName && m.target.tagName.toLowerCase() === 'meta')) {
            relevant = true;
            break;
          }
        }
      }
      if (relevant) debouncedHandle('metachange');
    });
    observer.observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ['content'] });

    // 额外监听 title 的文本变更（有些站点只是修改 title.textContent）
    const titleEl = document.querySelector('title');
    if (titleEl) {
      const titleObs = new MutationObserver(() => debouncedHandle('titlechange'));
      titleObs.observe(titleEl, { characterData: true, childList: true, subtree: true });
    }
  })();

  // ------------------ 立即捕获（脚本注入时） ------------------
  // 如果脚本注入时页面已经加载，立刻抓取一次
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    debouncedHandle('injected');
  }

})();
