// 思源代码片段自动检查更新（开发者推广计划）
(() => {
    const urls = [
        'https://cdn.mengze.vip/gh/wish5115/my-softs@main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js',
        'https://gcore.jsdelivr.net/gh/wish5115/my-softs@main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js',
        'https://fastly.jsdelivr.net/gh/wish5115/my-softs@main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js',
        'https://cdn.jsdmirror.com/gh/wish5115/my-softs@main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js',
        'https://update.gf.qytechs.cn/scripts/534829/checkNewVersion.user.js',
        'https://raw.githubusercontent.com/wish5115/my-softs/refs/heads/main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js',
        'https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/snippets_new_version_checker_for_dev.js',
    ];
    function loadScript(index) {
        if (index >= urls.length) { console.warn('所有 CDN 节点都无法加载目标脚本。'); return;}
        const script = document.createElement('script'); script.src = urls[index];
        script.onerror = () => {
            console.warn(`加载失败：${urls[index]}，尝试下一个节点...`);
            script.remove(); loadScript(index + 1);
        }; document.head.appendChild(script);
    } loadScript(0);
})();