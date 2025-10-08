// Chart地图创建文档Demo（世界地图版）
// 注意，为精确到省或州
// see https://ld246.com/article/1748879816780  
// ld246-1748879816780 注意，此注释是本chart唯一标志，请勿修改或删除
(async () => {
    // 修正：去掉 URL 前后空格！
    await loadScript('https://jsd.onmicrosoft.cn/npm/echarts/map/js/world.js');

    const chartBlock = document.querySelector('[data-content*="ld246-1748879816780"]');
    const charContainer = chartBlock?.firstElementChild?.nextElementSibling;

    setTimeout(() => {
        const myChart = window.echarts.getInstanceById(
            charContainer?.getAttribute("_echarts_instance_") ||
            charContainer?.querySelector('[_echarts_instance_]')?.getAttribute("_echarts_instance_")
        );
        if (!myChart || myChart.hasListened) return;
        myChart.hasListened = true;
        myChart.on('click', async (params) => {
            if (params.componentSubType === 'map') {
                const protyle = chartBlock.closest('.protyle');
                const currDocId = protyle?.querySelector('.protyle-title')?.dataset?.nodeId;
                let doc = await query(`select * from blocks where id='${currDocId}'`);
                doc = doc[0];
                if (!doc) return;
                const newDocRet = await requestApi('/api/filetree/createDocWithMd', {
                    "notebook": doc.box,
                    "path": doc.hpath + '/',
                    "tags": params.name + ',Maps',
                    "markdown": ""
                });
                if (!newDocRet || newDocRet.code !== 0 || !newDocRet.data) return;
                const newDocId = newDocRet.data;
                let newDoc = await query(`select * from blocks where id='${newDocId}'`);
                newDoc = newDoc[0];
                if (!newDoc) return;
                requestApi('/api/filetree/renameDoc', {
                    "notebook": newDoc.box,
                    "path": newDoc.path,
                    "title": getNow()
                });
                reloadData(myChart);
                window.open('siyuan://blocks/' + newDocId);
            }
        });
    }, 500);

    return {
        title: { text: '世界地图', left: 'center' },
        tooltip: { trigger: 'item' },
        visualMap: {
            min: 0,
            max: 1000,
            left: 'left',
            top: 'bottom',
            text: ['高值', '低值'],
            calculable: true
        },
        series: [{
            name: '文档数',
            type: 'map',
            map: 'world',
            roam: true,
            zoom: 1.0,
            center: [0, 20],
            label: { show: false },
            emphasis: { label: { show: true } },
            data: await getData()
        }]
    };

    async function reloadData(myChart) {
        myChart.setOption({ series: [{ data: await getData() }] });
    }

    async function getData() {
        let data = [];
        const maps = {};
        const docs = await query(`select * from blocks where tag like '%#Maps#%'`);
        docs.forEach(doc => {
            const tags = doc.tag.split(' ');
            tags.forEach(tag => {
                tag = tag.trim().replace(/^#|#$/g, '');
                maps[tag] ? maps[tag]++ : maps[tag] = 1;
            });
        });
        for (const [name, value] of Object.entries(maps)) {
            data.push({ name, value });
        }
        return data;
    }

    function getNow() {
        return new Date().toLocaleString().replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) =>
            [y, m.padStart(2, '0'), d.padStart(2, '0')].join('-')
        );
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function query(sql) {
        const result = await requestApi('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }

    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, { method, body: JSON.stringify(data || {}) })).json();
    }
})()