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
            zoom: 1.0, // 设置初始缩放级别为3:cite[2]:cite[10]
            scaleLimit: {
                min: 1,   // 最小缩放级别:cite[5]
                max: 10   // 最大缩放级别:cite[5]
            },
            label: {
                emphasis: {
                    show: false
                }
            },
            // 中文国家名映射（注，由于地名或许有变化或错误，仅供参考）
            nameMap: {
                "Afghanistan":"阿富汗",
                "Albania":"阿尔巴尼亚",
                "Algeria":"阿尔及利亚",
                "Angola":"安哥拉",
                "Argentina":"阿根廷",
                "Armenia":"亚美尼亚",
                "Australia":"澳大利亚",
                "Austria":"奥地利",
                "Azerbaijan":"阿塞拜疆",
                "Bahamas":"巴哈马",
                "Bahrain":"巴林",
                "Bangladesh":"孟加拉国",
                "Belarus":"白俄罗斯",
                "Belgium":"比利时",
                "Belize":"伯利兹",
                "Benin":"贝宁",
                "Bhutan":"不丹",
                "Bolivia":"玻利维亚",
                "Bosnia and Herz.":"波斯尼亚和黑塞哥维那",
                "Botswana":"博茨瓦纳",
                "Brazil":"巴西",
                "British Virgin Islands":"英属维京群岛",
                "Brunei":"文莱",
                "Bulgaria":"保加利亚",
                "Burkina Faso":"布基纳法索",
                "Burundi":"布隆迪",
                "Cambodia":"柬埔寨",
                "Cameroon":"喀麦隆",
                "Canada":"加拿大",
                "Cape Verde":"佛得角",
                "Cayman Islands":"开曼群岛",
                "Central African Rep.":"中非共和国",
                "Chad":"乍得",
                "Chile":"智利",
                "China":"中国",
                "Colombia":"哥伦比亚",
                "Comoros":"科摩罗",
                "Congo":"刚果",
                "Costa Rica":"哥斯达黎加",
                "Croatia":"克罗地亚",
                "Cuba":"古巴",
                "Cyprus":"塞浦路斯",
                "Czech Rep.":"捷克共和国",
                "Côte d'Ivoire":"科特迪瓦",
                "Dem. Rep. Congo":"刚果民主共和国",
                "Dem. Rep. Korea":"朝鲜",
                "Denmark":"丹麦",
                "Djibouti":"吉布提",
                "Dominican Rep.":"多米尼加共和国",
                "Ecuador":"厄瓜多尔",
                "Egypt":"埃及",
                "El Salvador":"萨尔瓦多",
                "Equatorial Guinea":"赤道几内亚",
                "Eritrea":"厄立特里亚",
                "Estonia":"爱沙尼亚",
                "Ethiopia":"埃塞俄比亚",
                "Falkland Is.":"福克兰群岛",
                "Fiji":"斐济",
                "Finland":"芬兰",
                "Fr. S. Antarctic Lands":"所罗门群岛",
                "France":"法国",
                "Gabon":"加蓬",
                "Gambia":"冈比亚",
                "Georgia":"格鲁吉亚",
                "Germany":"德国",
                "Ghana":"加纳",
                "Greece":"希腊",
                "Greenland":"格陵兰",
                "Guatemala":"危地马拉",
                "Guinea":"几内亚",
                "Guinea-Bissau":"几内亚比绍",
                "Guyana":"圭亚那",
                "Haiti":"海地",
                "Honduras":"洪都拉斯",
                "Hungary":"匈牙利",
                "Iceland":"冰岛",
                "India":"印度",
                "Indonesia":"印度尼西亚",
                "Iran":"伊朗",
                "Iraq":"伊拉克",
                "Ireland":"爱尔兰",
                "Isle of Man":"马恩岛",
                "Israel":"以色列",
                "Italy":"意大利",
                "Jamaica":"牙买加",
                "Japan":"日本",
                "Jordan":"约旦",
                "Kazakhstan":"哈萨克斯坦",
                "Kenya":"肯尼亚",
                "Korea":"韩国",
                "Kuwait":"科威特",
                "Kyrgyzstan":"吉尔吉斯斯坦",
                "Lao PDR":"老挝",
                "Latvia":"拉脱维亚",
                "Lebanon":"黎巴嫩",
                "Lesotho":"莱索托",
                "Liberia":"利比里亚",
                "Libya":"利比亚",
                "Lithuania":"立陶宛",
                "Luxembourg":"卢森堡",
                "Macedonia":"马其顿",
                "Madagascar":"马达加斯加",
                "Malawi":"马拉维",
                "Malaysia":"马来西亚",
                "Maldives":"马尔代夫",
                "Mali":"马里",
                "Malta":"马耳他",
                "Mauritania":"毛利塔尼亚",
                "Mauritius":"毛里求斯",
                "Mexico":"墨西哥",
                "Moldova":"摩尔多瓦",
                "Monaco":"摩纳哥",
                "Mongolia":"蒙古",
                "Montenegro":"黑山共和国",
                "Morocco":"摩洛哥",
                "Mozambique":"莫桑比克",
                "Myanmar":"缅甸",
                "Namibia":"纳米比亚",
                "Nepal":"尼泊尔",
                "Netherlands":"荷兰",
                "New Caledonia":"新喀里多尼亚",
                "New Zealand":"新西兰",
                "Nicaragua":"尼加拉瓜",
                "Niger":"尼日尔",
                "Nigeria":"尼日利亚",
                "Norway":"挪威",
                "Oman":"阿曼",
                "Pakistan":"巴基斯坦",
                "Panama":"巴拿马",
                "Papua New Guinea":"巴布亚新几内亚",
                "Paraguay":"巴拉圭",
                "Peru":"秘鲁",
                "Philippines":"菲律宾",
                "Poland":"波兰",
                "Portugal":"葡萄牙",
                "Puerto Rico":"波多黎各",
                "Qatar":"卡塔尔",
                "Reunion":"留尼旺",
                "Romania":"罗马尼亚",
                "Russia":"俄罗斯",
                "Rwanda":"卢旺达",
                "S. Geo. and S. Sandw. Is.":"南乔治亚和南桑威奇群岛",
                "S. Sudan":"南苏丹",
                "San Marino":"圣马力诺",
                "Saudi Arabia":"沙特阿拉伯",
                "Senegal":"塞内加尔",
                "Serbia":"塞尔维亚",
                "Sierra Leone":"塞拉利昂",
                "Singapore":"新加坡",
                "Slovakia":"斯洛伐克",
                "Slovenia":"斯洛文尼亚",
                "Solomon Is.":"所罗门群岛",
                "Somalia":"索马里",
                "South Africa":"南非",
                "Spain":"西班牙",
                "Sri Lanka":"斯里兰卡",
                "Sudan":"苏丹",
                "Suriname":"苏里南",
                "Swaziland":"斯威士兰",
                "Sweden":"瑞典",
                "Switzerland":"瑞士",
                "Syria":"叙利亚",
                "Tajikistan":"塔吉克斯坦",
                "Tanzania":"坦桑尼亚",
                "Thailand":"泰国",
                "Togo":"多哥",
                "Tonga":"汤加",
                "Trinidad and Tobago":"特立尼达和多巴哥",
                "Tunisia":"突尼斯",
                "Turkey":"土耳其",
                "Turkmenistan":"土库曼斯坦",
                "U.S. Virgin Islands":"美属维尔京群岛",
                "Uganda":"乌干达",
                "Ukraine":"乌克兰",
                "United Arab Emirates":"阿拉伯联合酋长国",
                "United Kingdom":"英国",
                "United States":"美国",
                "Uruguay":"乌拉圭",
                "Uzbekistan":"乌兹别克斯坦",
                "Vanuatu":"瓦努阿图",
                "Vatican City":"梵蒂冈城",
                "Venezuela":"委内瑞拉",
                "Vietnam":"越南",
                "W. Sahara":"西撒哈拉",
                "Yemen":"也门",
                "Yugoslavia":"南斯拉夫",
                "Zaire":"扎伊尔",
                "Zambia":"赞比亚",
                "Zimbabwe":"津巴布韦"
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