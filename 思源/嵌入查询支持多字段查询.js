// 嵌入查询支持多字段查询
// see 
// version 0.0.1

// 使用示例
/*
-- 直接使用字段查询
select content, created from blocks where type='d' and trim(content) != '' limit 2

-- 通过指令控制显示字段
-- fields content,created
-- render markdown false
select * from blocks where type='p' and trim(markdown) != '' limit 2

-- 添加样式和格式化
-- field created {font-weight:bold;float:right;color:red;}
-- format created datetime
select content, created from blocks where type='d' and trim(content) != '' limit 2

常用指令如下：
字段指令：-- fields 字段名, 字段名，例如：-- fields content,created
字段+样式指令：-- field 字段名 {样式内容}，例如：-- field created {color:red;}
格式化指令：-- format 字段名 函数名，例如：-- format created datetime，默认created，updated字段是datetime
渲染指令：-- render 字段名 true/false，例如：-- render markdown false，只有markdown字段有效，默认true

格式化指令的常用函数有：
datetime 格式为 年-月-日 时:分:秒
date 格式为 年-月-日
time 格式为 时:分:秒
type 把类型转换为文字描述，默认type字段已格式化
subtype 把子类型转换为文字描述，默认subtype字段已格式化
*/
(() => {
    searchEmbedBlock(async (embedBlockID, stmt, blocks) => {
        const meta = parseSQLMeta(stmt);
        const fields = getFields(stmt, meta);
        if(Object.keys(fields||{}).length === 0) return;
        const sql = stmt.replace('from', `${Object.keys(getFields(stmt, meta, false)||{}).join(', ').replace(/(.+)/, ', $1')}, id from`);
        const results = await querySql(sql);
        if(results && results.length > 0) {
            results.forEach((result, index) => {
                if(blocks && blocks.length > 0) {
                    // 如果select *查到内容
                    let block;
                    if(result.id === blocks[index]?.block?.id) {
                        // 如果索引匹配
                        block = blocks[index]?.block;
                    } else {
                        // 如果索引不匹配
                       block = blocks.find(item => item.block?.id === result.id);
                    }
                    if(block) {
                        // 更新内容
                        block.content = getContent(result, stmt, meta, block.content);
                    }
                } else {
                    // 如果select *未查到内容
                    const block = getBlock(result, getContent(result, stmt, meta));
                    blocks.push(block);
                }
            });
        }
    });
    function getContent(result, stmt, meta, content) {
        // 解析内容
        if(content) {
            let container = document.createElement('div');
            container.innerHTML = content;
            let contenteditable = container.querySelector('div[contenteditable="false"][spellcheck="true"]');
            const markdown = contenteditable.innerHTML;
            const fieldsHtml = getFieldsHtml(result, stmt, meta, markdown);
            // 替换文本内容
            if (contenteditable) {
                contenteditable.innerHTML = fieldsHtml;
            }
            return container.innerHTML;
        }
        return getFieldsHtml(result, stmt, meta, markdown);
    }
    function getFieldsHtml(result, stmt, meta, markdown) {
        let fieldsHtml = '';
        const fields = getFields(stmt, meta);
        const formats = getFormats(stmt, meta);
        const renders = getRenders(stmt, meta);
        Object.entries(fields).forEach(([field, style], index) => {
            let fieldVal = result[field] || '';
            if(field === 'created' || field === 'updated') fieldVal = formatField('datetime', fieldVal);
            if(field === 'type') fieldVal = formatField('type', fieldVal);
            if(field === 'subtype') fieldVal = formatField('subtype', fieldVal);
            if(formats[field]) fieldVal = formatField(formats[field], fieldVal);
            if(field === 'markdown') fieldVal = markdown || fieldVal;
            if(renders.hasOwnProperty(field)) fieldVal = renders[field] === true ? markdown : fieldVal;
            const defStyle = field === 'created' || field === 'updated' ? 'float:right;' : '';
            fieldsHtml += `<span class="embed-${field}" style="display:inline-block;${index>0?'margin-left:10px;':''}${defStyle}${style||''}">${fieldVal}</span>`;
        });
        if(markdown) {
            return fieldsHtml;
        }
        return `<div data-node-id="${result?.id||''}" data-node-index="1" data-type="NodeParagraph" class="p" updated="${result?.updated||''}"><div contenteditable="false" spellcheck="true">${fieldsHtml}</div><div class="protyle-attr" contenteditable="false">​</div></div>`;
    }
    function formatField(fn, val) {
        if(fn === 'datetime') {
            return formatDateTime(val);
        }
        if(fn === 'date') {
            return formatDate(val);
        }
        if(fn === 'time') {
            return formatTime(val);
        }
        if(fn === 'type') {
            return getTypeText(val);
        }
        if(fn === 'subtype') {
            return getSubTypeText(val);
        }
    }
    // formatStr默认'$1-$2-$3 $4:$5:$6' 分别代表年月日时分秒
    function formatDateTime(content, formatStr = '$1-$2-$3 $4:$5:$6') {
        if(!/^\d+$/.test(content)) return content;
        if((content+'').length === 13) {
            const timestamp = parseInt(content);
            // 创建一个 Date 对象
            const date = new Date(timestamp);
            // 提取年、月、日、时、分、秒
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要加 1
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            // 拼接成 YYYYMMDDHHMMSS 格式
            content = `${year}${month}${day}${hours}${minutes}${seconds}`;
        }
        return content?.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/, formatStr);
    }
    // formatStr默认'$1-$2-$3' 分别代表年月日
    function formatDate(content, formatStr = '$1-$2-$3') {
        return formatDateTime(content, formatStr);
    }
    // formatStr默认'$4:$5:$6' 分别代表时分秒
    function formatTime(content, formatStr = '$4:$5:$6') {
        return formatDateTime(content, formatStr);
    }
    function getTypeText(type) {
        // 块类型映射
        const blockType = {
            d: '文档块',
            h: '标题块',
            l: '列表块',
            i: '列表项',
            c: '代码块',
            m: '公式块',
            t: '表格块',
            b: '引述块',
            s: '超级块',
            p: '段落块',
            tb: '分隔线',
            video: '视频块',
            audio: '音频块',
            widget: '挂件块',
            iframe: 'iframe',
            query_embed: '嵌入块',
            '': '',
            null: '',
            undefined: '',
        };
        return blockType[type] || type;
    }
    function getSubTypeText(subtype) {
        // 子类型映射
        const subtypes = {
            o: '有序列表',
            u: '无序列表',
            t: '任务列表',
            h1: '一级标题',
            h2: '二级标题',
            h3: '三级标题',
            h4: '四级标题',
            h5: '五级标题',
            h6: '六级标题',
            '': '',
            null: '',
            undefined: '',
        };
        return subtypes[subtype] || subtype;
    }
    function searchEmbedBlock(callbak) {
        const originalFetch = window.fetch;
        window.fetch = async function (url, init) {
            // 只处理目标接口
            if (url.toString().endsWith('/api/search/searchEmbedBlock')) {
                // 获取请求参数stmt，并重写获取stmt
                let embedBlockID, stmt;
                if (init && init.body) {
                    try {
                        // 1. 反序列化请求 body
                        const req = JSON.parse(init.body);
                        embedBlockID = req.embedBlockID;
                        stmt = req.stmt;
        
                        // 2. 在这里“重写” stmt
                        req.stmt = stmt.replace(/select[\s\S]+?from/ui, 'select * from');
        
                        // 3. 把改好的对象序列化回 init.body
                        init = {
                            ...init,
                            body: JSON.stringify(req)
                        };
                    } catch (e) {
                        console.warn('无法解析请求 body 为 JSON，跳过拦截并使用原始请求：', e);
                        // 如果解析失败，就直接走原始 fetch，不影响逻辑
                        return originalFetch(url, init);
                    }
                }

                // 真正发请求
                const response = await originalFetch(url, init);
                
                // 克隆一份 response，用来读 body
                const cloned = response.clone();
                let bodyJson;
                try {
                    bodyJson = await cloned.json();
                } catch (e) {
                    console.warn('无法解析响应数据 为 JSON:', e);
                    // 如果不是 JSON，直接返回原始 response
                    return response;
                }
                // 排序返回结果
                const blocks = bodyJson?.data?.blocks;
                if (Array.isArray(blocks)) {
                    // 处理返回数据
                    await callbak(embedBlockID, stmt, blocks);
                    // 把修改后的数据串回去，构造一个新的 Response
                    const newBody = JSON.stringify(bodyJson);
                    const { status, statusText, headers } = response;
                    return new Response(newBody, { status, statusText, headers });
                }
            }
            
            // 默认返回原始 response
            return originalFetch(url, init);
        };
    }
    function getBlock(row, content) {
        return {
            "block": {
                "box": row.box,
                "path": row.path,
                "hPath": row.hpath,
                "id": row.id,
                "rootID": row.root_id,
                "parentID": row.parent_id,
                "name": "",
                "alias": "",
                "memo": "",
                "tag": "",
                "content": content,
                "fcontent": row.fcontent,
                "markdown": row.markdown,
                "folded": false,
                "type": "NodeParagraph",
                "subType": "",
                "refText": "",
                "refs": null,
                "defID": "",
                "defPath": "",
                "ial": row.ial?JSON.parse(row.ial):{},
                "children": null,
                "depth": 0,
                "count": 0,
                "sort": 0,
                "created": "",
                "updated": "",
                "riffCardID": "",
                "riffCard": null
            },
            "blockPaths": []
        };
    }
    function extractSelectFields(sql) {
        // 1. 拿到 select ... from 之间的内容
        const sel = sql.match(/select\s+([\s\S]*?)\s+from/i);
        if (!sel) return [];
        // 2. 按逗号（不在括号内）切分
        const parts = sel[1].split(/,(?![^(]*\))/);
        return parts.map(raw => {
            let field = raw.trim();
            // 3a. 有别名 as xxx
            const asMatch = field.match(/(.+?)\s+as\s+(.+)$/i);
            if (asMatch) {
                return asMatch[2].trim();
            }
            // 3b. 函数调用 fn(...)
            const fnMatch = field.match(/^([A-Za-z_]\w*)\s*\(\s*([\s\S]+)\s*\)$/);
            if (fnMatch) {
                const fnName = fnMatch[1];
                const argsStr = fnMatch[2];
                // 拆参数（不在更深层括号里的逗号）
                const args = argsStr.split(/,(?![^(]*\))/).map(arg => arg.trim());
                const newArgs = args.map(arg => {
                    // 如果是纯标识符，给它加双引号
                    if (/^[A-Za-z_]\w*$/.test(arg)) {
                        return `"${arg}"`;
                    }
                    // 否则原样返回
                    return arg;
                });
                return `${fnName}(${newArgs.join(', ')})`;
            }
            // 3c. 普通字段
            return field;
        });
    }
    function getFields(stmt, meta, containsSqlFields = true) {
        let fields = {};
        if(meta && meta.fields) fields = meta.fields;
        else fields = parseSQLMeta(stmt, 'fields');
        if(containsSqlFields) {
            const sqlFields = extractSelectFields(stmt);
            sqlFields.forEach(field => {
                field = field.trim();
                if(field!=='*' && !fields[field]) fields[field] = "";
            });
        }
        return fields;
    }
    function getFormats(sql, meta) {
        if(meta && meta.formats) return meta.formats;
        return parseSQLMeta(sql, 'formats');
    }
    function getRenders(sql, meta) {
        if(meta && meta.renders) return meta.renders;
        return parseSQLMeta(sql, 'renders');
    }
    function parseSQLMeta(sql, type = null) {
        const result = {};
        // 如果 type 不合法或未传入，初始化所有对象
        if (!type) {
            result.formats = {};
            result.renders = {};
            result.fields = {};
        }
        const lines = sql.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            // 匹配 -- fields 多字段列表
            if (trimmed.startsWith('-- fields')) {
                if (!type || type === 'fields') {
                    // 提取字段列表，按逗号分割
                    const listStr = trimmed.replace(/^--\s+fields\s+/, '');
                    const keys = listStr.split(/\s*,\s*/).filter(k => k);
                    for (const key of keys) {
                        if (type === 'fields') {
                            result[key] = '';
                        } else {
                            result.fields[key] = '';
                        }
                    }
                }
                continue;
            }
            // 根据 type 决定是否解析某类注释
            if (trimmed.startsWith('-- format')) {
                if (!type || type === 'formats') {
                    const parts = trimmed.replace(/^--\s+format\s+/, '').split(/\s+/);
                    if (parts.length >= 2) {
                        const key = parts[0];
                        const value = parts.slice(1).join(' ');
                        if (type === 'formats') {
                            result[key] = value;
                        } else {
                            result.formats[key] = value;
                        }
                    }
                }
                continue;
            }
            if (trimmed.startsWith('-- render')) {
                if (!type || type === 'renders') {
                    const parts = trimmed.replace(/^--\s+render\s+/, '').split(/\s+/);
                    if (parts.length >= 2) {
                        const key = parts[0];
                        const valStr = parts[1];
                        let val;
                        if (valStr.toLowerCase() === 'true') val = true;
                        else if (valStr.toLowerCase() === 'false') val = false;
                        else val = valStr;
                        if (type === 'renders') {
                            result[key] = val;
                        } else {
                            result.renders[key] = val;
                        }
                    }
                }
                continue;
            }
            if (trimmed.startsWith('-- field')) {
                if (!type || type === 'fields') {
                    const matchWithStyle = trimmed.match(/--\s+field\s+(\w+)\s+{([^}]*)}/);
                    const matchNoStyle = trimmed.match(/--\s+field\s+(\w+)/);
                    if (matchWithStyle) {
                        const key = matchWithStyle[1];
                        const style = matchWithStyle[2].trim();
                        if (type === 'fields') {
                            result[key] = style;
                        } else {
                            result.fields[key] = style;
                        }
                    } else if (matchNoStyle) {
                        const key = matchNoStyle[1];
                        if (type === 'fields') {
                            result[key] = '';
                        } else {
                            result.fields[key] = '';
                        }
                    }
                }
                continue;
            }
        }
        return result;
    }
    async function querySql(sql) {
        const result = await requestApi('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, { method: method, body: JSON.stringify(data || {}) })).json();
    }
})();