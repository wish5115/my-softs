// name 代码片段自动检查更新(CDN)（开发者推广计划）
// version 0.0.1
// updateUrl https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev_cdn.js
(() => {
    const urls = ['jsd.onmicrosoft.cn','gcore.jsdelivr.net','fastly.jsdelivr.net','quantil.jsdelivr.net','originfastly.jsdelivr.net','cdn.jsdmirror.cn','cdn.jsdmirror.com','cdn.mengze.vip','update.gf.qytechs.cn','jsd.nmmsl.top','cdn.bili33.top','jsdelivr.qaq.qa','gitee.com','raw.githubusercontent.com'];
    function loadScript(index) {
        if (index >= urls.length) { console.warn('所有 CDN 节点都无法加载目标脚本。'); return;}
        const script = document.createElement('script'), prefixs = {'gitee.com':'wish163/mysoft/raw/','raw.githubusercontent.com':'wish5115/my-softs/refs/heads/','update.gf.qytechs.cn':'scripts/534829/checkNewVersion.user.js'};
        script.src = 'https://'+urls[index]+'/'+(prefixs[urls[index]]||'gh/wish5115/my-softs@')+(urls[index]==='update.gf.qytechs.cn'?'':'main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js');
        script.onerror = () => { console.warn(`加载失败：${urls[index]}，尝试下一个节点...`); script.remove(); loadScript(index + 1);}; document.head.appendChild(script);
    } loadScript(0);
})();