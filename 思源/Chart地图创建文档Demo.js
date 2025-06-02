// Chart地图创建文档Demo
// see https://ld246.com/article/1748879816780
// ld246-1748879816780 注意，此注释是本chart唯一标志，请勿修改或删除
// 注意，不要在最后一行加;号，因为该代码在函数调用内不能加;号
// 修改 chart 高度可通过块菜单“图表”修改
// 更多参数请参考 https://echarts.apache.org/examples/zh/editor.html?c=map-usa-projection
(async () => {
    // 建议把china.js下载到本地，比如 /public/china.js
    await loadScript('https://jsd.onmicrosoft.cn/npm/echarts/map/js/china.js');
    const chartBlock = document.querySelector('[data-content*="ld246-1748879816780"]');
    const charContainer = chartBlock?.firstElementChild?.nextElementSibling;
    let data = [];
    if(!charContainer?.getAttribute('_echarts_instance_')){
        setTimeout(() => {
            const myChart = window.echarts.getInstanceById(charContainer.getAttribute("_echarts_instance_"));
            myChart.on('click', async (params) => {
                if (params.componentSubType === 'map') {
                    // 获取当前文档信息
                    const protyle = chartBlock.closest('.protyle');
                    const currDocId = protyle?.querySelector('.protyle-title')?.dataset?.nodeId;
                    let doc = await query(`select * from blocks where id='${currDocId}'`);
                    doc = doc[0];
                    if(!doc) return;
                    // 创建文档
                    const newDocRet = await requestApi('/api/filetree/createDocWithMd', {
                        "notebook": doc.box,
                        "path": doc.hpath+'/',
                        "tags": params.name + ',Maps',
                        "markdown": ""
                    });
                    if(!newDocRet || newDocRet.code !== 0 || !newDocRet.data) return;
                    const newDocId = newDocRet.data;
                    // 获取新文档信息
                    let newDoc = await query(`select * from blocks where id='${newDocId}'`);
                    newDoc = newDoc[0];
                    if(!newDoc) return;
                    // 修改新名字为当前时间
                    requestApi('/api/filetree/renameDoc', {
                        "notebook": newDoc.box,
                        "path": newDoc.path,
                        "title": getNow()
                    });
                    // chart重载数据
                    reloadData(myChart);
                    // 打开新文档
                    window.open('siyuan://blocks/'+newDocId);
                }
            });
        }, 500);
    }
    // 返回地图选项
    return {
        title: {
            text: '旅游地图',
            left: 'center'
        },
        tooltip: {
            trigger: 'item'
        },
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
            map: 'china',
            roam: false, // 是否允许缩放和平移
            label: {
                show: true
            },
            data: await getData()
        }]
    };
    // chart重载数据
    async function reloadData(myChart) {
        myChart.setOption({
            series: [{
                data: await getData()
            }]
        });
    }
    // 获取地图文档数据
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
        for(const [name, value] of Object .entries(maps)) {
            data.push({name, value});
        }
        return data;
    }
    function getNow() {
        return new Date().toLocaleString().replace(/(\d+)\/(\d+)\/(\d+)/, ( _, y, m, d ) =>
            [y, m.padStart(2,'0'), d.padStart(2,'0')].join('-')
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
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
})()