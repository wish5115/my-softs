// SQL简单查询 alasql扩展
// 该代码片段需配SQL简单查询使用 see https://ld246.com/article/1736035967300#%E6%96%B0%E5%B9%B4%E5%A4%A7%E7%A4%BC%E5%8C%85
// 把该代码添加到思源代码片段中即可
{
    // 动态加载alasql库
    const src = 'https://cdn.bootcdn.net/ajax/libs/alasql/4.5.0/alasql.min.js';
    const script = document.createElement('script');
    //script.onload = () => {
        // 这里也可以注册alasql函数（不推荐）
        // alasql.fn.xxx = () => {};
    //}
    script.src = src;
    document.head.appendChild(script);
}