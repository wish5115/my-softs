// 嵌入查询支持多字段查询
// see https://ld246.com/article/1750463052773
// version 0.0.5
// 0.0.5 添加-- sort 指令
// 0.0.4 jsformat和style支持/**/多行注释
// 0.0.3.1 修复隐藏字段正则匹配错误问题
// 0.0.3 完全重构实现方式，为了兼容复制SQL，放弃了部分使用上的灵活性
// 0.0.2 修复个别指令失效及被个别字符影响的问题

// 使用示例
/*
-- 直接使用字段查询
select content, created from blocks where type='d' and trim(content) != '' limit 2

-- 通过指令控制显示字段
-- view id hide
-- render markdown false
select * from blocks where type='p' and trim(markdown) != '' limit 2

-- 添加样式和格式化
-- style created {font-weight:bold;float:right;color:red;}
-- format created datetime
select content, created from blocks where type='d' and trim(content) != '' limit 2

常用指令如下：
样式指令：-- style 字段名 {样式内容}，例如：-- style created {color:red;}
格式化指令：-- format 字段名 函数名，例如：-- format created datetime，默认created，updated字段是datetime
js格式化指令：-- jsformat 字段名 {js代码}，例如：-- jsformat updated {return 'hello '+fieldVal}，字段的值会被return的结果覆盖，默认可使用的变量，embedBlockID，currDocId，currBlockId，fieldName，fieldValue，fieldOriginValue
渲染指令：-- render 字段名 true/false，例如：-- render markdown false，只有markdown字段有效，默认true
隐藏字段指令：-- view 字段名 show/hide，例如：-- view id hide，隐藏字段也可以在sql的字段上写标记，比如，select id__hide, content from...
字段排序指令：-- sort 字段名, 字段名, ...，例如：-- sort id, content, created，字段的将按照这个指定的顺序显示
强制使用自定义SQL -- custom true，默认情况下只有一个select * from的SQL被认为是思源默认SQL（思源默认SQL只能返回块Markdown一个字段），但当使用该指令时，则强制认为是自定义SQL。
强制不处理隐藏字段 -- not-deal-hide true，默认情况，使用select id__hide, content from...，会把__hide认为隐藏字段，但当使用该指令时，会忽略__hide标记

js格式化指令常用变量说明：
embedBlockID，currBlockId，这两个变量是同一个意思，即当前嵌入块的块id
currDocId，当前文档的id
fieldName，当前字段的字段名，比如id, root_id, content等
fieldValue，当前字段的值，可能是格式化后的结果
fieldOriginValue，当前字段的原始值，即数据库中的值

格式化指令的常用函数有：
datetime 格式为 年-月-日 时:分:秒
date 格式为 年-月-日
time 格式为 时:分:秒
type 把类型转换为文字描述，默认type字段已格式化
subtype 把子类型转换为文字描述，默认subtype字段已格式化

高级指令：
支持多行注释的指令，仅jsformat和style支持，如下示例
（由于注释无法嵌套这里用#代替*表示多行注释）
/#
jsformat content {
    // your codes
}
#/
/#
style content {
    // your codes
}
#/

其他：
SQL中支持 {{CurrDocId}} 和 {{CurrBlockId}} 标记，分别代表当前文档id和当前嵌入块id(有时需要排除当前嵌入块时有用)
*/
(() => {
    searchEmbedBlock(async (embedBlockID, currDocId, stmt, blocks, hideFields) => {
        const errors = { msg: '' };
        if (isSiYuanDefaultSql(stmt)) {
            if (stmt && blocks.length == 0) {
                const results = await querySql(stmt, errors);
                if (results.length === 0 && errors.msg) {
                    showErrors(embedBlockID, errors);
                }
            }
            return;
        }
        const meta = parseSQLMeta(stmt);
        meta.ids = { embedBlockID, currDocId };
        if (Array.isArray(hideFields) && hideFields.length > 0) {
            hideFields.forEach(field => meta.views[field] = 'hide');
        }
        const results = await querySql(stmt, errors);
        if (stmt && results.length === 0 && errors.msg) {
            showErrors(embedBlockID, errors);
        }
        if (results && results.length > 0) {
            let newBlocks = [];
            for (let index = 0; index < results.length; index++) {
                const result = results[index];
                if (blocks && blocks.length > 0) {
                    // 如果select *查到内容
                    let block;
                    if (result?.id === blocks[index]?.block?.id) {
                        // 如果索引匹配
                        block = blocks[index]?.block;
                    } else {
                        // 如果索引不匹配
                        block = blocks.find(item => item.block?.id === result?.id);
                    }
                    if (block) {
                        // 更新内容
                        block.content = await getContent(result, meta, block.content);
                        block.flag = true;
                    }
                } else {
                    // 如果select *未查到内容
                    const block = await getBlock(result, await getContent(result, meta));
                    block.block.flag = true;
                    newBlocks.push(block);
                }
            }
            // 把新数据插入原blocks数据中
            if ((!blocks || blocks.length == 0) && newBlocks && newBlocks.length > 0) {
                newBlocks.forEach(block => blocks.push(block));
            }
            // 以result为准，删除多余的记录
            blocks.forEach((item, index) => {
                if (!item.block?.flag) blocks.splice(index, 1);
            });
        }
    });
    async function getContent(result, meta, content) {
        // 解析内容
        if (content) {
            return await getFieldsHtml(result, meta, content);
        }
        return await getFieldsHtml(result, meta);
    }
    // -- view id hide
    // -- style created {color:red;}
    // -- format created datetime
    // -- render markdown false
    // -- jsformat updated {return 'hello '+fieldVal}
    // -- sort id, content, created
    // 格式化字段的值
    async function getFieldsHtml(result, meta, markdown) {
        let fieldsHtml = '', orderedFieldsHtml = [], notOrderedFieldsHtml = [];
        const entries = Object.entries(result);
        for (let index = 0; index < entries.length; index++) {
            const [field, originVal] = entries[index];
            if (meta.views[field]?.toLowerCase() === 'hide') continue;
            let fieldVal = originVal;
            if (field === 'created' || field === 'updated') fieldVal = formatField('datetime', originVal);
            if (field === 'type') fieldVal = formatField('type', originVal);
            if (field === 'subtype') fieldVal = formatField('subtype', originVal);
            if (meta.formats[field]) fieldVal = formatField(meta.formats[field], originVal);
            if (meta.renders.hasOwnProperty(field)) {
                fieldVal = meta.renders[field] === true ? markdown || renderMarkdown(originVal) : originVal;
            } else {
                if (field === 'markdown') fieldVal = markdown || renderMarkdown(originVal) || originVal;
            }
            if (meta.jsformats[field]) {
                // 创建动态函数
                try {
                    const functionBody = `return (async () => { ${meta.jsformats[field] || ''} })();`;
                    const fieldFunction = new Function(
                        "embedBlockID", "currDocId", "currBlockId", "fieldName", "fieldValue", "fieldOriginValue", functionBody
                    );
                    const ret = await fieldFunction(meta.ids.embedBlockID, meta.ids.currDocId, meta.ids.embedBlockID, field, fieldVal, originVal);
                    fieldVal = ret === undefined ? fieldVal : ret;
                } catch (e) {
                    fieldVal = '<span class="ft__error">jsformat errors: ' + (e.message || '未知错误') + '</span>';
                    console.log(e);
                }
            }
            const defStyle = field === 'created' || field === 'updated' ? 'float:right;' : '';
            const html = `<span class="embed-${field}" style="display:inline-block;${index > 0 ? 'margin-left:10px;' : ''}${defStyle}${meta.styles[field] || ''}">${fieldVal}</span>`;
            // 字段排序
            const sortIndex = meta.sorts.findIndex(item=>item===field);
            if(sortIndex !== -1) orderedFieldsHtml[sortIndex] = html;
            else notOrderedFieldsHtml.push(html);
        }
        fieldsHtml = orderedFieldsHtml.join('') + notOrderedFieldsHtml.join('');
        if (markdown) {
            return fieldsHtml;
        }
        return `<div data-node-id="${result?.id || ''}" data-node-index="1" data-type="NodeParagraph" class="p" updated="${result?.updated || ''}"><div contenteditable="false" spellcheck="true">${fieldsHtml}</div><div class="protyle-attr" contenteditable="false">​</div></div>`;
    }
    function formatField(fn, val) {
        if (fn === 'datetime') {
            return formatDateTime(val);
        }
        if (fn === 'date') {
            return formatDate(val);
        }
        if (fn === 'time') {
            return formatTime(val);
        }
        if (fn === 'type') {
            return getTypeText(val);
        }
        if (fn === 'subtype') {
            return getSubTypeText(val);
        }
    }
    // formatStr默认'$1-$2-$3 $4:$5:$6' 分别代表年月日时分秒
    function formatDateTime(content, formatStr = '$1-$2-$3 $4:$5:$6') {
        if (!/^\d+$/.test(content)) return content;
        if ((content + '').length === 13) {
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
    function searchEmbedBlock(callback) {
        const originalFetch = window.fetch;
        window.fetch = async function (url, init) {
            // 只处理目标接口
            if (url.toString().endsWith('/api/search/searchEmbedBlock')) {
                // 获取请求参数stmt，并重写获取stmt
                let embedBlockID, stmt, currDocId, hideFields;
                if (init && init.body) {
                    try {
                        // 1. 反序列化请求 body
                        const req = JSON.parse(init.body);
                        embedBlockID = req.embedBlockID;
                        stmt = req.stmt;
                        currDocId = getCurrDocId(embedBlockID);
                        // 替换 {{CurDocId}}
                        if (stmt.indexOf('{{CurDocId}}') !== -1 || stmt.indexOf('{{curDocId}}') !== -1) {
                            stmt = stmt.replace('{{CurDocId}}', currDocId).replace('{{curDocId}}', currDocId);
                        }
                        // 替换 {{CurBlockId}}
                        if (stmt.indexOf('{{CurBlockId}}') !== -1 || stmt.indexOf('{{curBlockId}}') !== -1) {
                            stmt = stmt.replace('{{CurBlockId}}', embedBlockID).replace('{{curBlockId}}', embedBlockID);
                        }
                        // 替换隐藏字段
                        if (!/--\s+not-deal-hide\s+true/gi.test(stmt)) {
                            const regex = /(\b\w+)__hide\b/gi;
                            if (regex.test(stmt)) {
                                regex.lastIndex = 0;
                                hideFields = [...stmt.matchAll(regex)].map(item => item[1]);
                                stmt = stmt.replace(regex, '$1');
                            }
                        }
                        // 2. 在这里“重写” stmt
                        req.stmt = stmt;
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
                    await callback(embedBlockID, currDocId, stmt, blocks, hideFields);
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
    async function getBlock(row, content) {
        let breadcrumbs = [];
        if (siyuan.config.editor.embedBlockBreadcrumb) {
            breadcrumbs = await getBlockBreadcrumb(row.id, row.type, row.hpath);
        }
        return {
            "block": {
                "box": row.box || '',
                "path": row.path || '',
                "hPath": row.hpath || '',
                "id": row.id || '',
                "rootID": row.root_id || '',
                "parentID": row.parent_id || '',
                "name": "",
                "alias": "",
                "memo": "",
                "tag": "",
                "content": content,
                "fcontent": row.fcontent || '',
                "markdown": row.markdown || '',
                "folded": false,
                "type": "NodeParagraph",
                "subType": "",
                "refText": "",
                "refs": null,
                "defID": "",
                "defPath": "",
                "ial": row.ial ? JSON.parse(row.ial) : {},
                "children": null,
                "depth": 0,
                "count": 0,
                "sort": 0,
                "created": "",
                "updated": "",
                "riffCardID": "",
                "riffCard": null
            },
            "blockPaths": breadcrumbs || []
        };
    }
    async function getBlockBreadcrumb(blockId, type = '', hpath = '') {
        const result = await requestApi("/api/block/getBlockBreadcrumb", {
            id: blockId,
            excludeTypes: []
        });
        if (!result || result.code !== 0) return [];
        const breadcrumbs = result.data;
        if (type === 'd' && breadcrumbs[0]?.name === '' && hpath) breadcrumbs[0].name = hpath;
        return breadcrumbs;
    }
    function isSiYuanDefaultSql(stmt) {
        if (!stmt) return true;
        if (/--\s+custom\s+true/i.test(stmt)) return false;
        const regex = /select\s+\*\s+from/gi;
        const matches = stmt.match(regex);
        // 如果 matches 存在且长度为 1，则表示恰好出现了一次
        return Array.isArray(matches) && matches.length === 1;
    }
    function parseSQLMeta(sql, type = '') {
        const result = {
            views: {},
            styles: {},
            formats: {},
            renders: {},
            jsformats: {},
            sorts: []
        };
        // 1) 用非贪婪模式抓出所有 C-style 注释
        const blockCommentRE = /\/\*([\s\S]*?)\*\//g;
        for (const [, commentBody] of sql.matchAll(blockCommentRE)) {
            const body = commentBody.trim();
            // jsformat key { ... }
            let m = body.match(/^jsformat\s+(\w+)\s*\{([\s\S]*?)\}$/);
            if (m) {
                const [, key, code] = m;
                result.jsformats[key] = code.trim();
                continue;
            }
            // style key { ... }
            m = body.match(/^style\s+(\w+)\s*\{([\s\S]*?)\}$/);
            if (m) {
                const [, key, css] = m;
                result.styles[key] = css.trim();
                continue;
            }
        }
        // 2) 去掉所有 block 注释，免得它们影响后续的单行解析
        sql = sql.replace(blockCommentRE, '');
        // 3) 处理单行注释指令
        for (let line of sql.split('\n')) {
            const t = line.trim();
            if ((!type || type === 'views') && t.startsWith('-- view ')) {
                const [, , key, val] = t.split(/\s+/);
                if (key && val != null) result.views[key] = val;
            }
            else if ((!type || type === 'formats') && t.startsWith('-- format ')) {
                const parts = t.replace(/^--\s+format\s+/, '').split(/\s+/);
                const key = parts.shift();
                if (key) result.formats[key] = parts.join(' ');
            }
            else if ((!type || type === 'renders') && t.startsWith('-- render ')) {
                const [, , key, val] = t.split(/\s+/);
                if (key) {
                    result.renders[key] = /^(true|false)$/i.test(val)
                        ? val.toLowerCase() === 'true'
                        : val;
                }
            }
            else if ((!type || type === 'styles') && t.startsWith('-- style ')) {
                const m2 = t.replace(/^--\s+style\s+/, '').match(/^(\w+)\s*\{([^}]*)\}$/);
                if (m2) result.styles[m2[1]] = m2[2].trim();
            }
            else if ((!type || type === 'jsformats') && t.startsWith('-- jsformat ')) {
                const m3 = t.replace(/^--\s+jsformat\s+/, '').match(/^(\w+)\s*\{([^}]*)\}$/);
                if (m3) result.jsformats[m3[1]] = m3[2].trim();
            }
            else if ((!type || type === 'sorts') && t.startsWith('-- sort ')) {
                // -- sort key1,key2, key3
                const list = t.replace(/^--\s+sort\s+/, '').split(',').map(k => k.trim()).filter(Boolean);
                result.sorts = list;
            }
        }
        // 4) 如果只想取某个子集，就返回它
        if (type && type in result) {
            return result[type];
        }
        return result;
    }
    function getCurrDocId(embedBlockID) {
        const protyle = document.querySelector('[data-node-id="' + embedBlockID + '"]')?.closest('.protyle');
        const docId = protyle?.querySelector('.protyle-title')?.dataset?.nodeId;
        return docId;
    }
    async function querySql(sql, errors = {}) {
        const result = await requestApi('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            errors.msg = "查询数据库出错：" + (result.msg || '未知错误');
            console.error("查询数据库出错", result.msg || '未知错误');
            return [];
        }
        return result.data;
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, { method: method, body: JSON.stringify(data || {}) })).json();
    }
    function renderMarkdown(markdown) {
        const lute = getLute();
        const blockDom = lute.Md2BlockDOM(markdown);
        return blockDom.replace();
    }
    function getLute() {
        const setLute = (options) => {
            const lute = window.Lute.New();
            lute.SetSpellcheck(window.siyuan.config.editor.spellcheck);
            lute.SetProtyleMarkNetImg(window.siyuan.config.editor.displayNetImgMark);
            lute.SetFileAnnotationRef(true);
            lute.SetHTMLTag2TextMark(true);
            lute.SetTextMark(true);
            lute.SetHeadingID(false);
            lute.SetYamlFrontMatter(false);
            lute.PutEmojis(options.emojis);
            lute.SetEmojiSite(options.emojiSite);
            lute.SetHeadingAnchor(options.headingAnchor);
            lute.SetInlineMathAllowDigitAfterOpenMarker(true);
            lute.SetToC(false);
            lute.SetIndentCodeBlock(false);
            lute.SetParagraphBeginningSpace(true);
            lute.SetSetext(false);
            lute.SetFootnotes(false);
            lute.SetLinkRef(false);
            lute.SetSanitize(options.sanitize);
            lute.SetChineseParagraphBeginningSpace(options.paragraphBeginningSpace);
            lute.SetRenderListStyle(options.listStyle);
            lute.SetImgPathAllowSpace(true);
            lute.SetKramdownIAL(true);
            lute.SetTag(true);
            lute.SetSuperBlock(true);
            lute.SetMark(true);
            lute.SetInlineAsterisk(window.siyuan.config.editor.markdown.inlineAsterisk);
            lute.SetInlineUnderscore(window.siyuan.config.editor.markdown.inlineUnderscore);
            lute.SetSup(window.siyuan.config.editor.markdown.inlineSup);
            lute.SetSub(window.siyuan.config.editor.markdown.inlineSub);
            lute.SetTag(window.siyuan.config.editor.markdown.inlineTag);
            lute.SetInlineMath(window.siyuan.config.editor.markdown.inlineMath);
            lute.SetGFMStrikethrough1(false);
            lute.SetGFMStrikethrough(window.siyuan.config.editor.markdown.inlineStrikethrough);
            lute.SetMark(window.siyuan.config.editor.markdown.inlineMark);
            lute.SetSpin(true);
            lute.SetProtyleWYSIWYG(true);
            if (options.lazyLoadImage) {
                lute.SetImageLazyLoading(options.lazyLoadImage);
            }
            lute.SetBlockRef(true);
            if (window.siyuan.emojis[0].items.length > 0) {
                const emojis = {};
                window.siyuan.emojis[0].items.forEach(item => {
                    emojis[item.keywords] = options.emojiSite + "/" + item.unicode;
                });
                lute.PutEmojis(emojis);
            }
            return lute;
        };
        // 1. 优化查找函数（仅匹配 .editor.protyle 结尾路径）
        function findProtylePaths(obj) {
            const results = [];
            const seen = new Set();
            function walk(obj, path = '') {
                if (!obj || seen.has(obj)) return;
                seen.add(obj);
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    // 检查是否以 .editor.protyle 结尾
                    if (currentPath.endsWith('.editor.protyle')) {
                        results.push({ path: currentPath, value });
                    }
                    if (typeof value === 'object') {
                        walk(value, currentPath);
                    }
                }
            }
            walk(obj);
            return results;
        }
        // 2. 获取目标对象
        const protylePaths = findProtylePaths(window.siyuan);
        const firstProtyle = protylePaths[0]?.value;
        if (firstProtyle) {
            // 3. 动态设置 lute 并调用
            firstProtyle.lute = setLute({
                emojiSite: firstProtyle.options?.hint?.emojiPath,
                emojis: firstProtyle.options?.hint?.emoji,
                headingAnchor: false,
                listStyle: firstProtyle.options?.preview?.markdown?.listStyle,
                paragraphBeginningSpace: firstProtyle.options?.preview?.markdown?.paragraphBeginningSpace,
                sanitize: firstProtyle.options?.preview?.markdown?.sanitize,
            });
            // 4. 获取lute实例
            return firstProtyle.lute;
        } else {
            console.warn('未找到符合条件的 protyle 对象');
            return Lute.New();
        }
    }
    function whenElementExist(selector, node = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function'
                        ? selector()
                        : node.querySelector(selector);
                } catch (err) {
                    return resolve(null);
                }
                if (el) {
                    resolve(el);
                } else if (Date.now() - start >= timeout) {
                    resolve(null);
                } else {
                    requestAnimationFrame(check);
                }
            }
            check();
        });
    }
    function showErrors(embedBlockID, errors) {
        whenElementExist('[data-node-id="' + embedBlockID + '"] .protyle-wysiwyg__embed.ft__smaller').then((el) => {
            el.innerHTML = errors.msg;
            el.classList.add('ft__error');
            el.style.fontSize = '14px';
            errors.msg = '';
        });
    }
})();