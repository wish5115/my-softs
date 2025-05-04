// name 代码片段自动检查更新（开发者推广计划）
// version 0.0.1
// updateUrl https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js
(async function checkNewVersion() {
    if(!window.snippetsNewVersions) window.snippetsNewVersions = {};
    if(window.snippetsNewVersions.newVersionLoader) return;
    window.snippetsNewVersions.newVersionLoader = checkNewVersion;
    const domains = ['jsd.onmicrosoft.cn/gh/wish5115/my-softs@','gcore.jsdelivr.net/gh/wish5115/my-softs@','cdn.jsdmirror.cn/gh/wish5115/my-softs@','gitee.com/wish163/mysoft/raw/','gitee.com/wish163/mysoft/raw/'];
    const localUrl = '/snippets/snippets_new_version_checker.js';
    const file = '/data/snippets/snippets_new_version_checker.js';
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const parseJson = (text) => { try{ return JSON.parse(text) }catch(e){ return null } };
    const loadJs = () => {
        if(window?.snippetsNewVersions?.setInterval) return;
        const script = document.createElement('script');
        script.src = localUrl; document.head.appendChild(script);
    };
    for (let index = 0; index < 5; index++) { // 尝试5次
        await sleep(index * 1000); // 每次暂停 0 1 2 3 4 秒
        const downUrl = 'https://' + domains[index] + 'main/%E6%80%9D%E6%BA%90/snippets_new_version_checker.js';
        try {
            const res = await fetch("/api/file/getFile", {
                method: "POST", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({path: file}),
            });
            const jsonText = await res.text();
            const json = parseJson(jsonText);
            if(json && json.code === 404) {
                const response = await fetch(downUrl); // 不存在下载远程js
                if (!response.ok) { continue; return; }
                const jsContent = await response.text();
                const formData = new FormData();
                formData.append("path", file);
                formData.append("file", new Blob([jsContent]));
                const result = await fetch("/api/file/putFile", { // 写入js到本地
                    method: "POST", body: formData,
                });
                const json = await result.json();
                if(json && json.code === 0) {
                    loadJs(); /* 写入后加载本地js */  break;
                } else { continue; }
            } else { loadJs(); /* 已存在直接加载本地js */ break; }
        } catch(e) {  console.warn(e); continue; }
    }
})();