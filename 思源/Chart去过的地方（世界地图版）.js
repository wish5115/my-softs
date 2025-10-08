// Chart去过的地方（世界地图版）
// 注意由于世界地图文件太大，未精确到省或州
// 注意，不要在最后一行加;号，因为该代码在函数调用内不能加;号
// 修改 chart 高度可通过块菜单"图表"修改
// 更多参数请参考 https://echarts.apache.org/examples/zh/editor.html?c=scatter-map
// see https://ld246.com/article/1759893902998
// 高德地图拾取器 https://lbs.amap.com/tools/picker
// 百度地图拾取器 https://lbs.baidu.com/maptool/getpoint
// 经纬度转换工具 https://tool.lu/coordinate 转换为 WGS84 即可，转换后保留 5–6 位小数就足够了
// 经纬度转换工具2 https://www.mapchaxun.cn/bathLocationChange/
(async () => {
    // 加载中国地图js
    await loadScript('https://jsd.onmicrosoft.cn/npm/echarts/map/js/world.js  ');


    const chartBlock = document.querySelector('[data-content*="ld246-1759026927394"]');
    const charContainer = chartBlock?.firstElementChild?.nextElementSibling;
    setTimeout(() => {
        const myChart = window.echarts.getInstanceById(charContainer.getAttribute("_echarts_instance_")||charContainer?.querySelector('[_echarts_instance_]')?.getAttribute("_echarts_instance_"));
        if(!myChart || myChart?.hasListened) return;
        myChart.hasListened = true;
        myChart.on('click', async (params) => {
            if (params.componentType==="series" && params.componentSubType === "scatter" && params?.data?.blockId) {
                // 打开所在块
                window.open('siyuan://blocks/'+params.data.blockId);
            }
        });
    }, 500);
  
    // 获取数据
    const cityData = await getData();
  
    // 返回地图选项
    return {
        title: {
            text: '世界足迹',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.data) {
                    return `${params.data.name}<br/>坐标: ${params.data.value[0]}, ${params.data.value[1]}<br/>数值: ${params.data.value[2]}`;
                }
                return params.name;
            }
        },
        geo: {
            map: 'world',
            roam: true,
            zoom: 1.5, // 设置初始缩放级别为3:cite[2]:cite[10]
            scaleLimit: {
                min: 1,   // 最小缩放级别:cite[5]
                max: 10   // 最大缩放级别:cite[5]
            },
            label: {
                emphasis: {
                    show: false
                }
            },
            itemStyle: {
                normal: {
                    areaColor: '#CDCDCD',
                    borderColor: '#FEFFFF'
                },
                emphasis: {
                    areaColor: '#FEFFFF'
                }
            }
        },
        series: [{
            name: '城市',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: cityData,
            symbolSize: function(val) {
                return Math.sqrt(val[2]) / 5;
            },
            label: {
                show: true,
                formatter: '{b}'
            },
            itemStyle: {
                color: '#FFD983'
            }
        }]
    };
  
    // 获取城市坐标数据
    async function getData() {
        let data = [];
  
        // 查询包含custom-location属性的块
        const blocks = await query(`
            SELECT * 
            FROM blocks
            WHERE id IN (
                SELECT block_id
                FROM attributes
                WHERE name = 'custom-location' 
            )
        `);
  
        // 处理提取的数据
        for (const block of blocks) {
            // 获取该块的custom-location属性值
            const attributes = await query(`
                SELECT value 
                FROM attributes 
                WHERE block_id = '${block.id}' AND name = 'custom-location'
            `);
      
            if (attributes.length > 0) {
                const attrValue = attributes[0].value;
                // 解析属性值，格式如：🌱八达岭长城:: [116.016802, 40.356188, 1000]
                const match = attrValue.match(/(.*):: \[([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)\]/);
                if (match) {
                    const cityName = match[1].trim();
                    const lng = parseFloat(match[2]);
                    const lat = parseFloat(match[3]);
                    const value = parseFloat(match[4]);
              
                    data.push({
                        name: cityName,
                        value: [lng, lat, value],
                        blockId: block.id,
                    });
                }
            }
        }
  
        // 如果没有找到数据，使用默认数据
        if (data.length === 0) {
            data = [
                {name: '北京', value: [116.46, 39.92, 2000]},
                {name: '上海', value: [121.48, 31.22, 1800]},
                {name: '杭州', value: [120.19, 30.26, 1000]}
            ];
        }
  
        return data;
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