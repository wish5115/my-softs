// 代码片段自动检查更新
(async function checkUpdate() {
    if(window.snippetsUpdateChecker !== undefined && (window.snippetsUpdateChecker.version||window.snippetsUpdateChecker.isLoading)) return;
    if(!window.snippetsUpdateChecker) window.snippetsUpdateChecker = {};
    window.snippetsUpdateChecker.isLoading = true;
    setTimeout(() => { window.snippetsUpdateChecker.isLoading = false; }, 60000); // 60s超时
    const downUrl = 'https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/snippets_update_checker.js';
    const localUrl = '/snippets/snippets_update_checker.js';
    const file = '/data/snippets/snippets_update_checker.js';
    const reset = () => { window.snippetsUpdateChecker.isLoading = false; };
    const hasLoaded = () => !window.snippetsUpdateChecker.isLoading || window.snippetsUpdateChecker.version;
    const loadJs = () => {
        const script = document.createElement('script');
        script.src = localUrl;
        script.onload = () => { reset(); };
        document.head.appendChild(script);
    };
    try {
        const res = await fetch("/api/file/getFile", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({path: file}),
        });
        const json = await res.json();
        if(json && json.code === 404) {
            if(hasLoaded()) return;
            const response = await fetch(downUrl); // 不存在下载远程js
            if (!response.ok) {
                reset();
                return;
            }
            const jsContent = await response.text();
            if(hasLoaded()) return;
            const formData = new FormData();
            formData.append("path", file);
            formData.append("file", new Blob([jsContent]));
            const result = await fetch("/api/file/putFile", { // 写入js到本地
                method: "POST",
                body: formData,
            });
            const json = await result.json();
            if(json && json.code === 0) {
                if(hasLoaded()) return;
                loadJs(); // 写入后加载本地js
            } else {
                reset();
            }
        } else {
            if(hasLoaded()) return;
            loadJs(); // 已存在直接加载本地js
        }
    } catch(e) {
        reset();
    }
})();