// chart世界图和数据库联动
// see https://ld246.com/article/1760670464780
(async () => {
    // 加载世界地图
    await loadScript('https://jsd.onmicrosoft.cn/npm/echarts/map/js/world.js  ');

    const VIEW_ID = '20251017103424-3cdhvbt'

    const cityData = await getData();

return {
    title: { text: '世界地图', left: 'center' },
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'item',
        formatter: function(params) {
            if (params.data) {
                return `${params.data.name}<br/>坐标: ${params.data.value[0]}, ${params.data.value[1]}`;
            }
            return params.name;
        }
    },
    // geo 保持用于 scatter 的投影与交互（缩放/拖拽）
    geo: {
        map: 'world',
        roam: true,
        zoom: 1.0,
        scaleLimit: { min: 1, max: 10 },
        label: { emphasis: { show: false } },
    },
    series: [
        // 波纹效果层（半透明）
        {
            name: '地点-effect',
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: cityData,
            symbol: 'pin',
            symbolSize: function() {
                const base = 28; // 固定基准尺寸
                return [Math.max(12, base), Math.max(18, Math.round(base * 1.2))];
            },
            rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
            hoverAnimation: true,
            itemStyle: { color: 'rgba(255,107,107,0.9)', shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.25)' },
            z: 2
        },
        // 主定位图标与标签
        {
            name: '城市',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: cityData,
            symbol: 'pin',
            symbolSize: function() {
                const base = 22;
                return [Math.max(10, base), Math.max(14, Math.round(base * 1.15))];
            },
            label: {
                show: true,
                formatter: '{b}',
                position: 'right',
                distance: 10,
                color: '#333',
                fontSize: 12
            },
            itemStyle: {
                color: '#FF6B6B',
                borderColor: '#FFFFFF',
                borderWidth: 1.5,
                shadowBlur: 8,
                shadowColor: 'rgba(0,0,0,0.35)'
            },
            emphasis: { label: { show: true, fontWeight: 'bold', color: '#000' } },
            z: 3
        }
    ]
}
// ...existing code...

    async function getData() {
        let data = [];

        if (VIEW_ID) {
            try {
                const payload = { id: VIEW_ID, page: 1, pageSize: 99999 };
                const rd = await requestApi('/api/av/renderAttributeView', payload) || {};

                // 兼容 rd.view / rd.data.view / rd.data
                const view = rd.view || (rd.data && (rd.data.view || rd.data)) || {};
                const columns = Array.isArray(view.columns) ? view.columns : (Array.isArray(rd.columns) ? rd.columns : []);
                const rowsRaw = Array.isArray(view.rows) ? view.rows : (Array.isArray(rd.rows) ? rd.rows : []);

                const id2Name = {};
                for (const c of columns) {
                    if (c && c.id) id2Name[c.id] = c.name || c.id;
                }

                const rows = rowsRaw.map(r => {
                    const o = { id: r && r.id };
                    const cells = Array.isArray(r.cells) ? r.cells : [];
                    for (let i = 0; i < cells.length; i++) {
                        const cell = cells[i] || {};
                        const v = cell.value || {};
                        const keyID = v.keyID || '';
                        const colName = (columns[i] && (columns[i].name || columns[i].id)) || (keyID ? (id2Name[keyID] || keyID) : ('C' + i));
                        o[colName] = unwrapAttrVal(v);
                    }
                    return o;
                });

                for (const r of rows) {
                    const lng = toNumber(r['经度'] ?? r['longitude'] ?? r['lon'] ?? r['lng']);
                    const lat = toNumber(r['纬度'] ?? r['latitude'] ?? r['lat']);
                    if (isFinite(lng) && isFinite(lat)) {
                        // 使用主键列内容作为地点名称
                        const name = (r['主键'] != null && r['主键'] !== '') ? String(r['主键']) : (r['名称'] || r['name'] || r.id || '');
                        // 只返回 [lng, lat]，去掉数值字段
                        data.push({
                            name: name,
                            value: [lng, lat],
                            blockId: r.id
                        });
                    }
                }
            } catch (e) {
                console.warn('renderAttributeView 读取失败：', e);
            }
        }

        return data;
    }

    function toNumber(v) {
        if (v == null) return NaN;
        if (typeof v === 'number') return v;
        const n = Number(v);
        return isFinite(n) ? n : NaN;
    }

    function unwrapAttrVal(v){
      if (v == null) return null;
      if (typeof v !== 'object') return v;
      if (Object.prototype.hasOwnProperty.call(v, 'content')) { var c=v.content; if (typeof c==='string'||typeof c==='number'||typeof c==='boolean') return c; }
      if (v.text && typeof v.text.content==='string') return v.text.content;
      if (v.number && typeof v.number.content==='number') return v.number.content;
      if (v.date && typeof v.date.content==='number') return v.date.content;
      if (v.checkbox && typeof v.checkbox.checked==='boolean') return v.checkbox.checked;
      if (v.url && typeof v.url.content==='string') return v.url.content;
      if (v.email && typeof v.email.content==='string') return v.email.content;
      if (v.phone && typeof v.phone.content==='string') return v.phone.content;
      if (v.select && typeof v.select.content==='string') return v.select.content;
      if (Array.isArray(v.mSelect)) { var arr=v.mSelect.map(function(it){return it&&it.content;}).filter(function(x){return x!=null;}); return arr; }
      if (v.relation && Array.isArray(v.relation.contents)) { return v.relation.contents.map(function(it){ if(!it||typeof it!=='object') return null; if(it.block&&(it.block.content||it.block.id)) return it.block.content||it.block.id; if(Object.prototype.hasOwnProperty.call(it,'content')) return it.content; if(it.text&&typeof it.text.content==='string') return it.text.content; if(it.number&&typeof it.number.content==='number') return it.number.content; return null; }); }
      if (Array.isArray(v.relation)) return v.relation.map(function(it){ return it && (it.content || it.blockID); });
      if (Array.isArray(v.mAsset)) return v.mAsset.length;
      if (v.template && (typeof v.template.content==='string' || typeof v.template.content==='number')) return v.template.content;
      if (v.rollup && v.rollup.contents && Array.isArray(v.rollup.contents)) { try { var vals=v.rollup.contents.map(function(it){ if(!it||typeof it!=='object') return null; if(it.number&&typeof it.number.content==='number') return it.number.content; if(it.text&&typeof it.text.content==='string') return it.text.content; if(it.date&&typeof it.date.content==='number') return it.date.content; if(it.checkbox&&typeof it.checkbox.checked==='boolean') return it.checkbox.checked; if(it.url&&typeof it.url.content==='string') return it.url.content; if(it.email&&typeof it.email.content==='string') return it.email.content; if(it.phone&&typeof it.phone.content==='string') return it.phone.content; if(it.block&&(it.block.content||it.block.id)) return it.block.content||it.block.id; return null; }).filter(function(x){ return x!=null; }); if(vals.length===0) return null; var allNum=vals.every(function(x){return typeof x==='number'&&isFinite(x);}); if(allNum){ var s=0; for(var i=0;i<vals.length;i++) s+=vals[i]; return s; } if(vals.length===1) return vals[0]; return vals; } catch(e){} }
      if (v.created && typeof v.created.content==='number') return v.created.content;
      if (v.updated && typeof v.updated.content==='number') return v.updated.content;
      if (v.block) return v.block.content || v.block.id || null;
      return null;
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

    async function requestApi(url, data, method = 'POST') {
        const res = await fetch(url, {method: method, body: JSON.stringify(data||{}), credentials: 'same-origin', headers: {'Content-Type':'application/json'}});
        return await res.json();
    }
})()