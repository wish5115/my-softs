//!js
// 思源查询最近30天更新的文档
return (async () => {
    // sql查询语句
    // 查询过去去30天的文档
    const sql = `
        SELECT * FROM blocks
        WHERE type = 'd'
        -- 👇排除目录或子目录，可在思源目录右键，复制->复制可读路径 获取
        AND hpath not like '%/your/path%'
        AND created >= strftime('%Y%m%d%H%M%S', 'now', 'localtime', '-30 days')
        order by updated desc
    `;
    // 查询最近一个月内创建的文档
    /*
    const sql = `
        SELECT * FROM blocks
        WHERE type = 'd'
        -- 👇排除目录或子目录，可在思源目录右键，复制->复制可读路径 获取
        AND hpath not like '%/your/path%'
        AND created >= strftime('%Y%m%d%H%M%S', 'now', 'localtime', '-1 month')
        order by updated desc
    `;
    */

    // 查询数据库
    const result = await query(sql);
    // 渲染结果，去掉回调里的updated参数👇即可去掉右侧日期，更多字段看下面的renderFields函数的注释说明
    return renderFields('content, updated', (row) => {
        // 👇更新日期格式化，仅显示日期
        row['updated'] = row['updated'].replace(/(\d{4})(\d\d)(\d\d)\d+/, '$1-$2-$3');
        // 👇更新日期格式化，显示日期和时间
        //row['updated'] = row['updated'].replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3 $4:$5:$6');
        // 更新日期样式
        row['updated_style'] = 'float:right;margin-left:0;flex-shrink: 0;color:var(--b3-theme-on-surface-light);';
        // 标题样式
        row['content_style'] = 'flex-grow: 1;';
        // 行样式
        row['style'] = 'display: flex; justify-content: space-between; align-items: center;';
    });

    /////// 功能函数区 ///////

    // 渲染字段
    // 调用示例
    // renderFields('content, created'); 或 renderFields(['content', 'created'])
    // 或 renderFields('content,created', (row) => {row['created'] = row['created'].replace(/(\d{4})(\d\d)(\d\d)\d+/, '$1-$2-$3');});
    // 或 row['xxxx_style'] 设置某字段样式；row['style'] 设置行样式
    // renderFields('content,created', (row) => {row['created_style'] = 'float:right;margin-left:0;'; row['style']='';});
    function renderFields(fields, callback, fieldStyle, rowStyle) {
        let html = '';
        if(typeof result === 'string') return error(result);
        result.forEach(item => {
            if(callback) callback(item);
            if(typeof fields === 'string') {
                fields = fields.split(',').map(field => field.trim());
            }
            let fieldsHtml = '';
            fields.forEach((field, i) => {
                if(field === '') return;
                if(fieldsHtml === '') {
                    // 第一个字段
                    fieldsHtml += `<span data-type="block-ref" data-id="${item.id}" data-subtype="d" style="${fieldStyle||''};${item[field+'_style']||''}">${item[field]}</span>`;
                } else {
                    // 后面的字段
                    fieldsHtml += `<span style="margin-left:20px;${fieldStyle||''};${item[field+'_style']||''}">${item[field]}</span>`;
                }
            });
            html += `<div class="protyle-wysiwyg__embed" data-id="${item.root_id}"><div data-node-index="1" data-type="NodeParagraph" class="p"><div contenteditable="true" spellcheck="false" style="${rowStyle||''};${item['style']||''}">${fieldsHtml}</div><div class="protyle-attr" contenteditable="false"></div></div></div>`;
        });
        return render(html || '<div style="color:var(--b3-theme-secondary);margin-top:3px;">没有找到符合条件的内容</div>');
    }

    // 查询SQL函数
    async function query(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return "查询数据库出错：" + result.msg;
        }
        return result.data;
    }

    // 渲染结果函数
    function render(html, style) {
        onRender('.b3-form__space--small').then((container) => {
            style = style || '';
            if(style){
                html = `<div class="protyle-wysiwyg__embed" style="${style}">${html}</div>`;
            }
            container.outerHTML = html;
        });
        return [];
    }
    // 渲染错误输出
    function error(html, style) {
        return render(`<div style="margin-top:3px;">${html}</div>`, style || 'color:red;');
    }
    // 监听dom渲染
    function onRender(selector) {
        return new Promise(resolve => {
            const check = () => {
                let el = item.querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();