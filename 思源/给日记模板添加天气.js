//!js
// 给日记模板添加天气
// see https://ld246.com/article/1734407382742
// see https://ld246.com/article/1734002304855
return (async () => {
    // 等待时长，默认60秒
    const waitForTime = 60;
    getWeather();
    async function getWeather () {
        const weather = await fetch('https://wttr.in/?format=1');
        const text = await weather.text();
        render(text);
    };
    async function render(text) {
        const protyle = item.closest('.protyle-wysiwyg');
        const datetimeP = protyle?.querySelector('.sb:first-child .p:first-child');
        if(!datetimeP) return;
        const datetimeEl = datetimeP.querySelector('[contenteditable="true"]');
        if(!datetimeEl) return;
        datetimeEl.innerHTML = datetimeEl.innerHTML + ' ' + text.trim().replace(/\s+/g, ' ');
        // 删除嵌入块
        fetchSyncPost('/api/block/deleteBlock', {id: item?.dataset?.nodeId});
        // 更新日期块
        fetchSyncPost('/api/block/updateBlock', {
            "dataType": "dom",
            "data": datetimeP.outerHTML,
            "id": datetimeP.dataset.nodeId
        });
        // 清除定时器
        if(timer) clearTimeout(timer);
    }
    let timer = 0;
    whenRender().then(el => {
        el.outerHTML = '正在获取天气...';
        timer = setTimeout(() => {
            // 删除嵌入块
            if(!item?.dataset?.nodeId) return;
            fetchSyncPost('/api/block/deleteBlock', {id: item?.dataset?.nodeId});
        }, waitForTime * 1000);
    });
    function whenRender(selector = '.b3-form__space--small') {
        return new Promise(resolve => {
            const check = () => {
                let el = item.querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
    return [];
})();