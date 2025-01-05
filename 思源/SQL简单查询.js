// SQL简单查询
// 支持多字段查询，支持自定义查询结果，支持多种视图table,list,chart,mermaid等
// version 0.0.1
// update: https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/SQL%E7%AE%80%E5%8D%95%E6%9F%A5%E8%AF%A2.js
// 使用帮助：https://ld246.com/article/1736035967300
/*
// 调用示例
// 支持字段后缀进行简单格式化，比如，content as content__link_u_b_i_1, created as created__datetime_2
return query(`sql语句`, item);
return query(`sql语句`, item, 'id, content, created');
return query(`sql语句`, item, 'id, content, created',  ({row, index, toLink, formatTime, ...args}) => {
    row.contnet = toRef(row.contnet, row.id);
    row.created = formatTime(row.created);
});
return query(`sql语句`, item, '',  ({row, index, data, ...args}) => {
    // 这里可以用data做一些全局操作，也可以自定义返回结果，比如list,chart,mermaid等
    // 用Markdown渲染结果
    return renderViewByMarkdown(markdown);
    // 或 用dom渲染结果
    return renderViewByDom(dom);
    // 或 用list渲染结果
    return renderListView(data);
    // 或 用chart渲染结果
    return renderChartView(data);
    // 或 用mermaid渲染结果
    return renderMermaidView(data);
    // 其他
    // generateViewByMarkdown
    // generateViewByDom
    // generateListView
    // generateTaskView
    // generateTableView
    // generateDatabaseView
    // insertDatabaseView
});
// 函数参数完整示例
return query(`sql语句`, item, '字段列表', beforeRender=({row, index, toLink, formatTime, ...args})=>{}, afterRender=({options, data})=>{}, 
            options={showHeader:true, showEvenOdd:false, evenOddColor:'', tableBorder:true, tableBorderColor:'', ...});
// 使用技巧
// 1. 如何查看beforeRender都有哪些参数？可以打印console.log(...args);查看控制台输出await query(':funcs');
// 2. 如何设置选项？可以直接在最后一个参数里设置，也可以在beforeRender回调中 if(index === 0) options.xxxx = xxxx; 设置
// 3. 如何扩展函数？可以在调用query前面直接定义后然后在回调中直接使用，或者在本代码的用户自定义函数区直接添加
// 4. fields作用？可以筛选和排序，注意，比如row.xxx = row.yyy中xxx对应的是fields中指定的字段名，yyy对象sql查询结果返回的字段名
// 5. 如何对列操作？可以通过全局变量与field字段结合操作，也可以拿到data参数后遍历，然后判断是目标列进行操作即可
// 6. 注意，思源默认最大只支持查询64条记录，需要在 设置->搜索->搜索结果显示数 里设置下数量或者SQL中加limit
*/
(async () => {
    // 输出全局变量，如果与现有全局变量名冲突，在此处修改即可
    window.query = query;

    // 默认logo信息，用于显示在嵌入块的标题前面
    const defaultLogo = `<svg style="vertical-align:middle;position: relative;top: -2px;opacity: 0.8;" width="20" height="20" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M461.12 84.352a397.056 397.056 0 0 1 386.304 489.152 40.704 40.704 0 0 1-79.232-18.816 315.648 315.648 0 1 0-76.992 142.784 40.704 40.704 0 0 1 55.68-3.456c2.624 1.536 5.12 3.456 7.36 5.632l186.56 179.968a40 40 0 0 1 0.512 57.088l-0.512 0.512a40.704 40.704 0 0 1-57.088 0.512l-162.24-156.48A397.056 397.056 0 1 1 461.056 84.352z m67.008 157.376c75.904 20.608 128.768 66.56 155.072 135.616a40.704 40.704 0 0 1-76.16 28.992c-16.704-44.096-48.96-72.064-100.288-86.016a40.704 40.704 0 1 1 21.376-78.592z" fill=""></path></svg>`;

    // 默认标题信息，用于显示在嵌入块的提示信息前面
    const defaultTitle = '简单查询 0.0.1';

    // 默认描述信息，用于默认提示信息
    const defaultDesc = '让数据从此不再难查 : )';

    // 注册回调函数中传递的函数
    let callbackFuncs = {
        toRef,
        toLink,
        toTag,
        toMdLink,
        toMdRef,
        formatDateTime,
        formatDate,
        formatTime,
        renderMarkdown,
        addColor,
        addBgColor,
        setColor,
        setBgColor,
        toMdLink,
        toMdRef,
        toMdList,
        toMdTask,
        getTitleImage,
        getTypeText,
        getSubTypeText,
        addNo,
        addStyle,
        alignLeft,
        alignRight,
        setOption,
        md2Block,
        block2Md,
        renderListView,
        renderViewByMarkdown,
        renderViewByDom,
        renderChartView,
        renderMermaidView,
        paddingLeft,
        paddingRight,
        marginLeft,
        marginRight,
        toLineThrough,
        toUnderLine,
        toBold,
        toItalic,
        toS,
        toU,
        toB,
        toI,
        log,
        setWidth,
        setHeadHeight,
        setRowHeight,
        setHeight,
        valignTop,
        valignBottom,
        setAlign,
        setVAlign,
        setHAlign,
        setHVAlign,
        setPin,
        generateViewByMarkdown,
        generateViewByDom,
        generateListView,
        generateTaskView,
        generateTableView,
        generateAVView,
        generateDatabaseView,
        insertDatabaseView,
        generateChartView,
        generateMermaidView,
        onLoopEnd,
        addGenerateQueue,
        generateQueueViews,
        sortRowCustomFieldsFirst,
        sortRowSortFieldsFirst,
        filterData,
        fetchSyncPost,
        showMessage,
    };

    /////////////// 用户自定义函数区 //////////////////////////////////

    function addColor(content, color) {
        return `<span style="color:${color};">${content}</span>`;
    }

    function addBgColor(content, color) {
        return `<span style="background-color:${color};">${content}</span>`;
    }

    // 在现代浏览器中，该函数打印时会按对象的实际顺序显示，而直接console.log(data)不会保持对象的实际顺序
    function log(data, space = 4) {
        console.log(JSON.stringify(data, null, space));
    }

    function paddingLeft(content, num, unit = 'px') {
        unit = /^\d+$/.test(num) ? unit : '';
        return `<span style="padding-left:${num}${unit};">${content}</span>`;
    }

    function paddingRight(content, num, unit = 'px') {
        unit = /^\d+$/.test(num) ? unit : '';
        return `<span style="padding-right:${num}${unit};">${content}</span>`;
    }

    function marginLeft(content, num, unit = 'px') {
        unit = /^\d+$/.test(num) ? unit : '';
        return `<span style="padding-left:${num}${unit};">${content}</span>`;
    }

    function marginRight(content, num, unit = 'px') {
        unit = /^\d+$/.test(num) ? unit : '';
        return `<span style="margin-right:${num}${unit};">${content}</span>`;
    }

    function toLineThrough(content) {
        return `<span style="text-decoration:line-through;">${content}</span>`;
    }

    function toUnderLine(content) {
        return `<span style="text-decoration:underline;">${content}</span>`;
    }

    function toBold(content) {
        return `<span style="font-weight:bold;">${content}</span>`;
    }

    function toItalic(content) {
        return `<span style="font-style: italic;">${content}</span>`;
    }

    function toS(content) {
        return lineThrough(content);
    }

    function toU(content) {
        return toUnderLine(content);
    }

    function toB(content) {
        return toBold(content);
    }

    function toI(content) {
        return toItalic(content);
    }

    function setOption(options, key, value, index) {
        if(index === 0) {
            options[key] = value;
        }
    }

    function alignLeft(row, colName) {
        row[colName + '_style'] = 'justify-content: start;';
    }

    function alignRight(row, colName) {
        row[colName + '_style'] = 'justify-content: end;';
    }

    function valignTop(row, colName) {
        row[colName + '_style'] = 'align-items: start;';
    }

    function valignBottom(row, colName) {
        row[colName + '_style'] = 'align-items: end;';
    }

    function setAlign(row, colName, value) {
        row[colName + '_style'] = 'justify-content: '+getAlign(value)+';';
    }

    function setVAlign(row, colName, value) {
        row[colName + '_style'] = 'align-items: '+getAlign(value)+';';
    }

    function setHAlign(row, colName, value) {
        row[colName + '_head_style'] = 'justify-content: '+getAlign(value)+';';
    }

    function setHVAlign(row, colName, value) {
        row[colName + '_head_style'] = 'align-items: '+getAlign(value)+';';
    }

    function setPin(row, colName, style) {
        style = style ? style+';' : '';
        row[colName + '_pin'] = style;
    }

    function addStyle(content, style) {
        return `<span style="${style}">${content}</span>`
    }

    function addNo(row, colName, value) {
        row[colName] = value;
    }

    function setWidth(row, colName, value) {
        row[colName+'_width'] = value;
    }

    function setHeight(row, colName, value) {
        setRowHeight(row, colName, value);
    }

    function setRowHeight(row, colName, value) {
        row[colName+'_rheight'] = value;
    }

    function setHeadHeight(row, colName, value) {
        row[colName+'_hheight'] = value;
    }

    function setColor(row, colName, value) {
        if(typeof row === 'string') {
            return `<span style="color:${colName}">${row}</span>`;
        }
        row[colName+'_color'] = value;
    }

    function setBgColor(row, colName, value) {
        if(typeof row === 'string') {
            return `<span style="background-color:${colName}">${row}</span>`;
        }
        row[colName+'_bgColor'] = value;
    }

    function toTag(content) {
        return `<span data-type="tag">${content}</span>`;
    }

    function toRef(content, id) {
        return `<span data-type="block-ref" data-subtype="d" data-id="${id}" style="">${content}</span>`;
    }

    function toLink(content, url) {
        return `<span data-type="a" data-href="${url}" style="">${content}</span>`;
    }

    function toMdLink(content, url, title) {
        return `[${content}](${url}${title !== undefined ? ` ${title}`:''})`;
    }

    function toMdRef(content, id) {
        return toMdLink(content, `siyuan://blocks/${id}`, '');
        //return `((${id} '${content}'))`;
    }

    function toMdList(list = []) {
        return list.map(item => `* ${content}}`).join("\n");
    }

    function toMdTask(list = []) {
        return list.map(item => `- [ ] ${content}}`).join("\n");
    }

    // formatStr默认'$1-$2-$3 $4:$5:$6' 分别代表年月日时分秒
    function formatDateTime(content, formatStr = '$1-$2-$3 $4:$5:$6') {
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

    function renderMarkdown(markdown) {
        return md2Block(markdown);
    }

    function renderChartView(option, width, height, align) {
        return {type: 'echarts', data: option, width, height, align};
    }

    function renderMermaidView(code, align) {
        return {type: 'mermaid', data: code, align};
    }

    function generateListMarkdownByArray(data, type = 'list', refIds = [], linkUrls = []) {
        const flagString = type === 'task' ? '- [ ] ' : '* ';
        // 递归生成 Markdown 列表
        const genMarkdown = (data, deep = 0, refIds = [], linkUrls=[]) => {
            return data
                .map((item, index) => {
                    if (Array.isArray(item)) {
                        // 如果是数组，递归处理，并增加层级深度
                        return genMarkdown(item, deep + 1, refIds[index], linkUrls[index]);
                    } else {
                        // 如果是普通项，根据层级深度生成缩进和列表项
                        if(refIds && refIds.length && refIds[index]) {
                            //((20250103090227-262f7nt 'title'))
                            return `${"\t".repeat(deep)}${flagString}((${refIds[index]} '${item}'))\n`;
                        } else if(linkUrls && linkUrls.length && linkUrls[index]) {
                            return `${"\t".repeat(deep)}${flagString}[${item}](${linkUrls[index]})\n`;
                        } else {
                            return `${"\t".repeat(deep)}${flagString}${item}\n`;
                        }
                    }
                })
                .join('');
        };
        // 生成 Markdown 字符串
        const markdown = genMarkdown(data, 0, refIds, linkUrls);
        return markdown;
    }

    // 渲染列表，支持嵌套
    function renderListView(data, refIds = [], linkUrls = []) {
        const markdown = generateListMarkdownByArray(data, 'list', refIds, linkUrls);
        return renderMarkdown(markdown);
    }

    function renderViewByMarkdown(markdown) {
        return renderDomView(md2Block(markdown));
    }

    function renderViewByDom(dom) {
        return dom;
    }

    function md2Block(markdown) {
        return Lute.New().Md2BlockDOM(markdown);
    }

    function block2Md(block) {
        return Lute.New().BlockDOM2Md(block);
    }

    function generateChartView(code, item, pos='after', autoUpdate = false, relation = true) {
        code = typeof code === 'string' ? code : JSON.stringify(code);
        const markdown = `\`\`\`echarts\n${code}\n\`\`\``;
        return generateViewByMarkdown(markdown, item, pos, 'NodeCodeBlock', 'echarts', autoUpdate, relation);
    }

    function generateMermaidView(code, item, pos='after', autoUpdate = false, relation = true) {
        const markdown = `\`\`\`mermaid\n${code}\n\`\`\``;
        return generateViewByMarkdown(markdown, item, pos, 'NodeCodeBlock', 'mermaid', autoUpdate, relation);
    }

    async function generateViewByMarkdown(markdown, item, pos='after', domType = '', domSubType='', autoUpdate = false, relation = true) {
        if(!item) return getError('缺少item参数');
        if(!autoUpdate && isLoading(item)) return getInfo();
        markdown = typeof markdown === 'string' ? markdown : JSON.stringify(markdown) || Object.toString(markdown);
        const result = await insertUpdateBlock(markdown, item, pos, domType, domSubType, relation);
        if(!result || result.code !== 0) {
            console.error(result);
            return getError(result?.msg || '生成失败');
        }
        return getSuccess('生成成功');
    }

    async function generateViewByDom(dom, item, pos='after', domType = '', domSubType='', autoUpdate = false, relation = true) {
        if(!item) return getError('缺少item参数');
        if(!autoUpdate && isLoading(item)) return getInfo();
        const result = await insertUpdateBlock(dom, item, pos, domType, domSubType, relation, 'dom');
        if(!result || result.code !== 0) {
            console.error(result);
            return getError(result?.msg || '生成失败');
        }
        return getSuccess('生成成功');
    }

    async function generateListView(data, item, pos = 'after', refIds = [], linkUrls = [], autoUpdate = false, relation = true) {
        if(!item) return getError('缺少item参数');
        if(!autoUpdate && isLoading(item)) return getInfo();
        const markdown = typeof data === 'string' ? data : generateListMarkdownByArray(data, 'list', refIds, linkUrls);
        const result = await insertUpdateBlock(markdown, item, pos, 'NodeList', ['o', 'u'], relation);
        if(!result || result.code !== 0) {
            console.error(result);
            return getError(result?.msg || '生成失败');
        }
        return getSuccess('生成成功');
    }

    async function generateTaskView(data, item, pos = 'after', refIds = [], linkUrls = [], autoUpdate = false, relation = true) {
        if(!item) return getError('缺少item参数');
        if(!autoUpdate && isLoading(item)) return getInfo();
        const markdown = typeof data === 'string' ? data : generateListMarkdownByArray(data, 'task', refIds, linkUrls);
        const result = await insertUpdateBlock(markdown, item, pos, 'NodeList', 't', relation);
        if(!result || result.code !== 0) {
            console.error(result);
            return getError(result?.msg || '生成失败');
        }
        return getSuccess('生成成功');
    }

    function generateTableMarkdownByData(data) {
        data = data.map(row => sortRowCustomFieldsFirst(row));
        const header = Object.keys(data[0]);
        const headerString = `|${header.join('|')}|\n`;
        const separatorString = `|${header.map(() => '---').join('|')}|\n`;
        const bodyString =  data.map(row => `|${Object.values(row).join('|')}|`).join('\n');
        return `${headerString}${separatorString}${bodyString}`;
    }

    function generateTableMarkdownByArray(data, header = []) {
        if(!header || header.length === 0) header = data.shift();
        const headerString = `|${header.join('|')}|\n`;
        const separatorString = `|${header.map(() => '---').join('|')}|\n`;
        const bodyString = data.map(row => `|${row.join('|')}|`).join('\n');
        return `${headerString}${separatorString}${bodyString}`;
    }

    async function generateTableView(data, item, pos = 'after', autoUpdate = false, relation = true) {
        if(!item) return getError('缺少item参数');
        if(!autoUpdate && isLoading(item)) return getInfo();
        const markdown = typeof data === 'string' ? data : generateTableMarkdownByData(data);
        const result = await insertUpdateBlock(markdown, item, pos, 'NodeTable', '', relation);
        if(!result || result.code !== 0) {
            console.error(result);
            return getError(result?.msg || '生成失败');
        }
        return getSuccess('生成成功');
    }

    // 等待beforeRender循环完毕执行，动态调用函数
    // onLoopEnd('functionNme', ...args)
    function onLoopEnd(functionName, ...args) {
        if(functionName.trim() === 'onFinished') throw new Error('onFinished is not allowed');
        if (typeof callbackFuncs[functionName] === 'function') {
            return (data) => {
                functionName === 'generateQueueViews' ? args[1] = data : args[0] = data;
                return callbackFuncs[functionName](...args);
            }
        }
        throw new Error(`${functionName} is not a function`);
    }

    async function generateAVView(data, item, pos = 'after', idField='', pkField='', autoUpdate = false, relation = true) {
        return generateDatabaseView(data, item, pos, idField, pkField, autoUpdate, relation);
    }

    async function generateDatabaseView(data, item, pos = 'after', idField='', pkField='', autoUpdate = false, relation = true) {
        if(!item) return getError('缺少item参数');
        if(!autoUpdate && isLoading(item)) return getInfo();
        const result = await generateDatabaseByData(data, item, pos, idField, pkField, relation);
        if(!result || result.code !== 0) {
            console.error(result);
            return getError(result?.msg || '生成失败');
        }
        return getSuccess('生成成功');
    }

    async function generateDatabaseByData(data, item, pos = 'after', idField='', pkField='', relation = true, domType = 'NodeAttributeView') {
        const wysiwyg = item.closest('.protyle-wysiwyg');
        const domTypeSelector = domType ? `[data-type="${domType}"]` : '';
        const avBlock = wysiwyg.querySelector(`[custom-query-id="${item.dataset.nodeId}"]${domTypeSelector}`);
        const avId = avBlock && avBlock.dataset.avId ? avBlock.dataset.avId : Lute.NewNodeID();
        const avData = generateAvByTpl(data, avId, idField, pkField);
        if(!avData) return getJson(-1, '生成失败', avData);
        const ret = await putFile(`/data/storage/av/${avId}.json`, JSON.stringify(avData));
        if(!ret || ret.code !== 0) return getJson(-1, ret.msg || '保存数据库失败', ret);
        const markdown = `<div data-type="NodeAttributeView" data-av-id="${avId}" data-av-type="table"></div>`;
        const result = await insertUpdateBlock(markdown, item, pos, domType, '', relation);
        return result;
    }

    async function addGenerateQueue(item, functionName, ...args) {
        if(!item) return getError('缺少item参数');
        if(functionName.trim() === 'addGenerateQueue' || functionName.trim() === 'onLoopEnd') return;
        if (typeof callbackFuncs[functionName] === 'function') {
            if(!getQueriesData(item, 'generateQueue')) setQueriesData(item, 'generateQueue', []);
            const queue = getQueriesData(item, 'generateQueue');
            queue.push({
                functionName,
                args,
                pos: args[2] || 'after'
            });
            setQueriesData(item, 'generateQueue', queue);
        }
    }

    async function generateQueueViews(item, data) {
        if(!item) return getError('缺少item参数');
        const queue = getQueriesData(item, 'generateQueue');
        const beforeTask = queue.filter(item => item.pos === 'before');
        const afterTask = queue.filter(item => item.pos === 'after');
        try {
             // 执行函数
            const  callFunction = async (item) => {
                const {functionName, args, pos } = item;
                if(['onLoopEnd', 'generateQueueViews'].includes(functionName.trim())) return;
                if(typeof callbackFuncs[functionName] !== 'function') return;
                if(data) args[0] = data;
                callbackFuncs[functionName](...args);
            }
            // 正序执行
            beforeTask.forEach(item => {
                callFunction(item);
            });
            // 倒序后执行
            afterTask.reverse();
            afterTask.forEach(item => {
                callFunction(item);
            });
            deleteQueriesData(item, 'generateQueue');
            return getSuccess('生成成功');
        } catch (e) {
            deleteQueriesData(item, 'generateQueue');
            return getError(e.message || '生成失败');
        }
    }

    function getBlockFieldAndId(row, idField, pkField) {
        let  blockId = '', blockField = '';
        if(row[idField]) {
            blockId = row[idField];
            blockField = pkField || idField;
            return {blockId, blockField, isDetached: false};
        }
        if(row['id']) {
            blockId = row['id'];
            blockField = pkField || 'id';
            return {blockId, blockField, isDetached: false};
        }
        idField = Object.keys(row).find(key => key.startsWith('id'));
        if(idField && row[idField]) {
            blockId = row[idField];
            blockField = pkField || idField;
            return {blockId, blockField, isDetached: false};
        }
        const blockIdArr = Object.entries(row).find(val => !val[0].endsWith('_id') && val[0]!=='box' && getFieldType(val[1]) === 'block');
        blockId = blockIdArr && blockIdArr[1] ? blockIdArr[1] : '';
        idField = blockIdArr && blockIdArr[0] ? blockIdArr[0] : '';
        if(blockId && idField) {
            blockField = pkField || idField;
            return {blockId, blockField, isDetached: false};
        }
        return {blockId: Lute.NewNodeID(), blockField: pkField || Object.keys(row).find(val=>val!=='序号'), isDetached: true};
    }

    function generateAvByTpl(data, avId, idField, pkField){
        if(!data || !data.length) return;
        const avData = getAvTpl();
        avData.id = avId;
        // keyValues
        avData.keyValues  = [];
        const colsMap = {};
        const time = new Date().getTime();
        // 添加序号
        colsMap["序号"] = {
            "key": {
                "id": Lute.NewNodeID(),
                "name": "序号",
                "type": "lineNumber",
                "icon": "",
                "numberFormat": "",
                "template": ""
            }
        };
        // 添加其他字段
        for(const row of data) {
            const { blockId, blockField, isDetached } = getBlockFieldAndId(row, idField, pkField);
            for(const [field, value] of Object.entries(row)) {
                const fieldType = field === blockField ? 'block' : getFieldType(value);
                // 每列值
                if(!colsMap[field]) colsMap[field] = {
                    "key": {
                        "id": Lute.NewNodeID(),
                        "name": field,
                        "type": fieldType,
                        "icon": "",
                        "numberFormat": "",
                        "template": ""
                    },
                    "values": [],
                };
                // 每行值
                const fieldValue = {
                    "id": Lute.NewNodeID(),
                    "keyID": colsMap[field].key.id,
                    "blockID": blockId,
                    "isDetached": isDetached,
                    "type": fieldType,
                    "createdAt": time,
                    "updatedAt": time,
                };
                if(fieldType === 'block') {
                    fieldValue[fieldType] = {
                        "id": blockId,
                        "content": value,
                        "created": time,
                        "updated": time
                    }
                } else if(fieldType === 'date') {
                    fieldValue[fieldType] = {
                        "content": new Date(formatDateTime(value)).getTime(),
                        "isNotEmpty": true,
                        "hasEndDate": false,
                        "isNotTime": true,
                        "content2": 0,
                        "isNotEmpty2": true,
                        "formattedContent": ""
                    }
                } else if(fieldType === 'number') {
                    fieldValue[fieldType] = {
                        "content": parseFloat(value),
                        "isNotEmpty": true,
                        "format": "",
                        "formattedContent": value + ""
                    }
                } else  {
                    fieldValue[fieldType] = {
                        "content": value
                    }
                }
                if(!colsMap[field].values) colsMap[field].values = [];
                colsMap[field].values.push(fieldValue);
            }
        }
        // views
        avData.viewID = Lute.NewNodeID();
        avData.views[0].id = avData.viewID;
        avData.views[0].table.id = Lute.NewNodeID();
        // 组装数据
        avData.keyValues = Object.values(colsMap);
        // 获取view columns
        const viewCols = avData.keyValues.map(val => ({
            "id": val.key.id,
            "wrap": false,
            "hidden": false,
            "pin": false,
            "width": ""
        }));
        // 获取views rowIds
        let viewRowIds = avData.keyValues.find(val => val.key.type === 'block')
            ?.values.map(val => val.blockID).filter(val => val);
        if(!viewRowIds || !viewRowIds.length) viewRowIds = avData.keyValues[0]
            ?.values.map(val => val.blockID).filter(val => val);
        avData.views[0].table.columns = viewCols;
        avData.views[0].table.rowIds = viewRowIds;
        return avData;
    }

    function getFieldType(value){
        // 20250102211818-r2d7rk8
        if(/^\d{14}\-[a-z\d]{7}$/i.test(value)) {
            return 'block';
        }
         // 20250102211818
        else if(/^2[01]\d{12}$/i.test(value)) {
            return 'date';
        } else if(/^\d+$/i.test(value)) {
            return 'number';
        } else {
            return 'text';
        }
    }

    async function insertDatabaseView(data, avBlockId, item, autoUpdate = false) {
        if(!item) return getError('缺少item参数');
        if(!autoUpdate && isLoading(item)) return getInfo();
        const result = await insertDatabaseByData(data, avBlockId);
        if(!result || result.code !== 0) {
            console.error(result);
            return getError(result?.msg || '插入失败');
        }
        return getSuccess('插入成功');
    }

    async function insertDatabaseByData(data, avBlockId) {
        const block = await querySql(`SELECT * FROM blocks where type ='av' and id='${avBlockId}'`);
        if(block.length === 0) return getJson(-1, "未找到数据库文档块，请检查数据库文档块id是否正确");
        const avId = block.map(b => getDataAvIdFromHtml(b.markdown))[0];
        const blockIds = data.map(row => row.id).filter(id => id);
        return await addBlocksToAv(blockIds, avId, avBlockId);
    }

    // 插入块到数据库
    async function addBlocksToAv(blockIds, avId, avBlockId) {
        blockIds = typeof blockIds === 'string' ? [blockIds] : blockIds;
        const srcs = blockIds.map(blockId => ({
            "id": blockId,
            "isDetached": false,
        }));
        const input = {
          "avID": avId,
          "blockID": avBlockId,
          'srcs': srcs
        }
        const result = await fetchSyncPost('/api/av/addAttributeViewBlocks', input);
        return result;
    }

    // dataType：待插入数据类型，值可选择 markdown 或者 dom
    async function insertUpdateBlock(data, item, pos = 'after', domType = '', domSubType='', relation = true, dataType = 'markdown', target = '') {
        const wysiwyg = item.closest('.protyle-wysiwyg');
        const domTypeSelector = domType ? `[data-type="${domType}"]` : '';
        let domSubTypeSelector = '';
        if(domSubType && typeof domSubType === 'string') {
            domSubType = domSubType.split(',');
            domSubType.map(val => val.trim()).filter(val => val);
        }
        if(domSubType && Array.isArray(domSubType) && domSubType.length) {
            domSubType = domSubType.map(val => `[data-subtype="${val}"]`);
            domSubTypeSelector = `:is(${domSubType.join(',')})`;
        }
        const blocks = wysiwyg.querySelectorAll(`[custom-query-id="${item.dataset.nodeId}"]${domTypeSelector}${domSubTypeSelector}`);
        if(relation) data = dataType === 'markdown' ? data + `\n{: custom-query-id="${item.dataset.nodeId}"}` : data.replace(/^\<div /i, `<div custom-query-id="${item.dataset.nodeId}" `);
        if(blocks.length > 0) {
            // 更新块
            const errors = [];
            for(const block of blocks){
                const result = await fetchSyncPost('/api/block/updateBlock', {
                    "dataType": dataType,
                    "data": data,
                    "id": block.dataset.nodeId,
                });
                if(!result || result.code !== 0) errors.push(result);
            }
            if(errors.length > 0) {
                return getJson(-1, errors.map(err=>err.msg).join('; '), errors);
            }
            return getJson();
        } else {
            // 插入块
            const result = await fetchSyncPost('/api/block/insertBlock', {
                "dataType": dataType,
                "data": data,
                "nextID": pos === 'before' ? (target||item).dataset.nodeId :  "",
                "previousID": pos === 'after' ? (target||item).dataset.nodeId :  "",
                "parentID": ""
            });
            return result;
        }
    }


    // 显示文档封面
    function getTitleImage(ial, maxWidth = '100px', maxHeight = '') {
        const match = ial.match(/title-img="([^"]*)"/i);
        if (match && match[1]) {
            const img = match[1].replace(/&quot;/ig, '"');
            if(/^background-image\s*:\s*url/i.test(img)) {
                // 自定义头图
                const urlMatch = img.match(/url\("([^"]*)"\)/i);
                if (urlMatch && urlMatch[1]) {
                    const imageUrl = urlMatch[1];
                    return `<img class="grid-row-title-img" style="cursor:pointer;max-width: ${maxWidth};max-height:${maxHeight};" src="${imageUrl}">`
                }
            } else {
                // 默认头图
                return `<img class="grid-row-title-img" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" style="cursor:pointer;width: ${maxWidth};height:${maxHeight};${img}">`
            }
            return ''
        }
        return '';
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

    function isLoading(item) {
        // 动态加载
        if(getQueriesData(item, 'firstLoading')) {
            setQueriesData(item, 'firstLoading', false);
            return true;
        }
        return false;
        // 静态加载
        //return !!queriesData[item.dataset.nodeId]?.isLoading;
    }

    /////////////// 核心功能区 //////////////////////////////////

    // 实例数据
    const queriesData = {};

    function init(item) {
        // if(item) {
        //     setQueriesData(item, 'isLoading', checkLoading());
        // }
    }
    // SQL简单查询
    async function query(sql, item, fields, beforeRender, afterRender, options = {}) {
        let data = [];
        // 初始化数据
        init(item);
        // 返回回到函数结果
        if(typeof sql === 'function') data = await sql();
        // sql语句查询
        else if(typeof sql === 'string') {
            // 解析命令函数
            const cmd = parseCommand(sql);
            if(cmd) return cmd;

            // 返回思源原始样式 select ** from xxx;
            if(/select\s+\*\*\s+from/i.test(sql)) {
                sql = sql.replace('**', '*');
                data = await querySql(sql);
                if(typeof data === 'string') return renderError(data, item);
                return data.map(item => item.id);
            }
            // 返回查询结果
            data = await querySql(sql);
            if(!data) return renderError('未查询到数据', item);
        }
        // 如果是对象等直接返回数据进行渲染
        else data = sql;
        if(!item) {
            console.warn('您未传入item参数直接返回了', data);
            return data;
        }
        return render(data, item, fields, beforeRender, afterRender, options) || [];
    }

    // 渲染html
    async function render(data, item, fields, beforeRender, afterRender, options = {}) {
        let result = '';
        if(data && typeof data !== 'string') {
            try {
                result = await generateTableOrDom(data, item, fields, beforeRender, options); 
                if(result &&  Array.isArray(result)) return result;
            } catch (e) {
                console.error(e);
                result = getError(e.message || '发生未知错误，请打开控制台查看详细信息');
            }
        }
        if(!item) {
            console.error('[简单查询] 缺少item参数，请检查您的代码');
            showMessage('[简单查询] 缺少item参数，请检查您的代码');
            return [];
        }
        whenElementExist(()=>item.querySelector('.b3-form__space--small')).then(async (spaceSmall) => {
            let html = getInfo('未匹配到任何内容');
            if(typeof data === 'string') {
                html = getError(data);
            } else if(result && isObject(result)) {
                html = `<div class="protyle-wysiwyg__embed" data-id="">${getQueryEmbedStyle(item, options, true)}<div class="${result.type}-container"></div></div>`;
            } else {
                html = `<div class="protyle-wysiwyg__embed" data-id="">${result}</div>`;
            }
            spaceSmall.outerHTML = html;
            // 渲染echarts
            if(result && isObject(result) && result.type === 'echarts'){
                await checkEcharts();
                const chartEl = item.querySelector('.protyle-wysiwyg__embed .echarts-container');
                if(chartEl){
                    chartEl.style.display = 'flex';
                    if(result.align === 'left') chartEl.style.justifyContent = 'flex-start';
                    if(result.align === 'center') chartEl.style.justifyContent = 'center';
                    if(result.align === 'right') chartEl.style.justifyContent = 'flex-end';
                    const getSize = () => {
                        const width = parseFloat(result.width) || chartEl.clientWidth;
                        const height = parseFloat(result.height) || width/2.63;
                        return {width, height};
                    };
                    try {
                        const chart = window.echarts.init(chartEl, window.siyuan.config.appearance.mode === 1 ? "dark" : undefined, getSize());
                        chart.setOption(result.data||{});
                        // 使用 ResizeObserver 监听容器大小变化
                        const resizeObserver = new ResizeObserver(() => {
                            chart.resize(getSize());
                        });
                        resizeObserver.observe(chartEl);
                    } catch (e) {
                        console.error(e);
                        showMessage(e.message || 'Chart 渲染失败, 请检查代码', true);
                        errorMessage(chartEl, e.message || 'Chart 渲染失败, 请检查代码');
                    }
                }
            }
            // 渲染mermaid
            // see https://github.com/siyuan-note/siyuan/blob/914c7659388e645395e70224f0d831950275eb05/app/src/protyle/render/mermaidRender.ts#L17
            // see https://github.com/frostime/sy-query-view/blob/351bf3ce4e0ee7ac98dcdf6232fc22fd3695b100/src/core/components.ts#L423
            if(result && isObject(result) && result.type === 'mermaid'){
                const mermaidEl = item.querySelector('.protyle-wysiwyg__embed .mermaid-container');
                if(!mermaidEl) return;
                mermaidEl.style.display = 'flex';
                if(result.align === 'left') mermaidEl.style.justifyContent = 'flex-start';
                if(result.align === 'center') mermaidEl.style.justifyContent = 'center';
                if(result.align === 'right') mermaidEl.style.justifyContent = 'flex-end';
                await checkMermaid();
                const id = "mermaid" + window.Lute.NewNodeID();
                try {
                    const mermaidData = await window.mermaid.render(id, result.data);
                    mermaidEl.innerHTML = mermaidData.svg;
                } catch (e) {
                    // 如果渲染失败，会在 body 中生成一个 div#dmermaid{id} 的元素，需要手动删掉
                    showMessage(e.message || 'Mermaid 渲染失败, 请检查代码', true);
                    console.groupCollapsed('Mermaid failed to render code:');
                    console.warn(e);
                    console.warn(result.data);
                    console.groupEnd();
                    const ele = document.querySelector(`body>div#d${id}`);
                    if (ele) {
                        ele.style.position = 'absolute';
                        ele.style.bottom = '0';
                        ele.classList.add(styles['remove-mermaid']);
                        ele.style.opacity = '0';
                        ele.style.transform = 'translateY(50px)';
                        setTimeout(() => {
                            ele.remove();
                        }, 1000);
                    }
                    errorMessage(mermaidEl, e.message || 'Failed to render mermaid, something wrong with mermaid code');
                }
            }

            // 修改默认标题，描述，logo等
            const currLogo = item.querySelector('.query-logo');
            if(currLogo && options.queryLogo && options.queryLogo !== currLogo.innerHTML) currLogo.innerHTML = options.queryLogo;
            const currTitle = item.querySelector('.query-title');
            if(currTitle && options.queryTitle && currTitle.innerHTML !== options.queryTitle) currTitle.innerHTML = options.queryTitle;
            const currDesc = item.querySelector('.query-msg');
            if(currDesc && options.queryDesc && currDesc.innerHTML === defaultDesc && options.queryDesc !== currDesc.innerHTML) currDesc.innerHTML = options.queryDesc;

            // 让内容不可编辑
            const contenteditableEls = item.querySelectorAll('[contenteditable="true"]');
            contenteditableEls.forEach(item => {
                item.setAttribute('contenteditable', false);
            });
            // 禁止滚动事件传播
            item.querySelector('.protyle-wysiwyg__embed')?.addEventListener('scroll', (event) => {
                event.stopPropagation();
            });
            item.querySelector('.protyle-wysiwyg__embed')?.addEventListener('touchstart', (event) => {
                event.stopPropagation(); // 阻止事件冒泡
            });
            item.querySelector('.protyle-wysiwyg__embed')?.addEventListener('touchmove', (event) => {
                event.stopPropagation(); // 阻止事件冒泡
            });

            // 渲染后回调
            if(typeof afterRender === 'function') {
                try {
                    afterRender({options, data});
                } catch (e) {
                    showMessage(e.message, true);
                    throw e;
                }
            }
        });
        return [];
    }

    function renderError(message, item) {
        return render(message, item);
    }

    function parseCommand(cmd) {
        // 返回全部函数
        if(cmd.startsWith(':funcs')) return callbackFuncs;
        // 返回指定函数
        if(cmd.startsWith(':')) {
            cmd = cmd.substring(1);
            if(callbackFuncs[cmd]) return callbackFuncs[cmd];
            return '没有找到函数：' + cmd;
        }
    }

    // 判断是否正在加载
    // function checkLoading() {
    //     const activeDoc = document.querySelector('[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none)')||document.querySelector('[data-type="wnd"] .protyle:not(.fn__none)');
    //     if(activeDoc && activeDoc.dataset.loading === 'finished'){
    //         return false;
    //     }
    //     return true;
    // }

    async function generateTableOrDom(data, item, fields, beforeRender, options = {}) {
        if(!data || data.length === 0) {
            return getInfo('未匹配到任何内容');
        }
        // 格式化数据
        options = {
            // 默认选项
            ...{
                showHeader: true, // 显示表头
                showEvenOdd: false, // 显示斑马纹
                oddColor: '', // 奇数行背景色，从表头开始算起
                evenColor: '', // 偶数行背景色，从表头开始算起
                tableBorder: true, // 显示表格边框
                tableBorderColor: '', // 边框颜色
                tableBorderStyle: '', // 边框样式
                onlyShowBottomBorder: false, // 只显示底部边框
                tableMaxHeight: '', // 表格最大高度
                tableMaxHeight: '', // 表格最大高度
                tableAlign: '', // 表格对齐
                tableStyle: '', // 表格样式
                cellWidth: '',  // 单元格宽度
                cellHeight: '', // 单元格高度
                cellAlign: '', // 单元格对齐
                cellVAlign: '', // 单元格垂直对齐
                cellStyle: '', // 单元格样式
                headerBackgroundColor:'', // 表头背景色
                headerSticky: false, // 表头是否固定，仅当表格固定高度或tableMaxHeight设置后生效
                headHeight: '', // 表头高度
                headAlign: '', // 表头对齐
                headVAlign: '', // 表头垂直对齐
                headerStyle: '', // 表头样式
                queryTitle: defaultTitle, // 简单查询标题
                queryDesc: defaultDesc, // 简单查询描述
                queryLogo: defaultLogo, // 简单查询logo
            },
            // 用户自定义选项
            ...options
        };
        let styles = [], rawData = {}, rowNo = {value: 0};
        const hasCustomField = Object.keys(data[0]||{}).find(key => key.includes('__'));
        const colsSpace = {};
        let result;
        for (let [index, row] of data.entries()) {
            const rawRow = {};
            // 注意这里的坑，直接修改row的内容，比如row.xx=xxx是可以改变data中的值，而row=[{xx:xxx}]是不会改变data的值，原因是前者改变的引用对象本身，后者改变的是对象的引用
            row = formatRow(row, rawRow, rowNo);
            data[index] = row;
            rawData[index] = rawRow;
            if(typeof beforeRender === 'function') {
                try {
                    result = await beforeRender({...{row, index, data, rawRow, rawData, options}, ...callbackFuncs});
                    // 返回闭包，什么都不做，继续执行
                    // 兼容原生样式
                    if(result && typeof result !== 'function' && Array.isArray(result)) return result;
                    // 渲染chart等
                    if(result && typeof result !== 'function' && isObject(result)) return result;
                    // 兼容自定义dom
                    if(result && typeof result !== 'function') return getQueryEmbedStyle(item, options, true) + result;
                } catch (e) {
                    showMessage(e.message, true);
                    throw e;
                }
            }
            for(const field in row){
                if(row[field+'_style']) {
                    if(!styles[index]) styles[index] = {};
                    styles[index][field+'_style'] = row[field+'_style'] || '';
                    delete row[field+'_style'];
                }
                if(row[field+'_head_style']) {
                    if(!styles[index]) styles[index] = {};
                    styles[index][field+'_head_style'] = row[field+'_head_style'] || '';
                    delete row[field+'_head_style'];
                }
                if(row[field+'_row_style']) {
                    if(!styles[index]) styles[index] = {};
                    styles[index][field+'_row_style'] = row[field+'_row_style'] || '';
                    delete row[field+'_row_style'];
                }
                if(row[field+'_width']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_style']) styles[index][field+'_style'] = '';
                    const width = /^\d+$/.test(row[field+'_width']) ? row[field+'_width']+'px;' : row[field+'_width'];
                    styles[index][field+'_style'] += 'min-width: auto;width:' + width+';';
                    delete row[field+'_width'];
                    if(!colsSpace[field]) colsSpace[field] = width.replace(/;+$/, '');
                }
                if(row[field+'_height']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_style']) styles[index][field+'_style'] = '';
                    const height = /^\d+$/.test(row[field+'_height']) ? row[field+'_height']+'px;' : row[field+'_height'];
                    styles[index][field+'_style'] += 'max-height:fit-content;height:' + height+';';
                    delete row[field+'_height'];
                }
                if(row[field+'_rheight']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_row_style']) styles[index][field+'_row_style'] = '';
                    styles[index][field+'_row_style'] += 'max-height:fit-content;height:' + (/^\d+$/.test(row[field+'_rheight']) ? row[field+'_rheight']+'px;' : row[field+'_rheight']);
                    delete row[field+'_rheight'];
                }
                if(row[field+'_hheight']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_head_style']) styles[index][field+'_head_style'] = '';
                    styles[index][field+'_head_style'] += 'max-height:fit-content;height:' + (/^\d+$/.test(row[field+'_hheight']) ? row[field+'_hheight']+'px;' : row[field+'_hheight']);
                    delete row[field+'_hheight'];
                }
                if(row[field+'_color']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_style']) styles[index][field+'_style'] = '';
                    styles[index][field+'_style'] += 'color:' + row[field+'_color']+';';
                    delete row[field+'_color'];
                }
                if(row[field+'_bgColor']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_style']) styles[index][field+'_style'] = '';
                    styles[index][field+'_style'] += 'background-color:' + row[field+'_bgColor']+';';
                    delete row[field+'_bgColor'];
                }
                if(row[field+'_align']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_style']) styles[index][field+'_style'] = '';
                    styles[index][field+'_style'] += 'justify-content:' + getAlign(row[field+'_align'])+';';
                    delete row[field+'_align'];
                }
                if(row[field+'_valign']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_style']) styles[index][field+'_style'] = '';
                    styles[index][field+'_style'] += 'align-items:' + getAlign(row[field+'_valign'])+';';
                    delete row[field+'_valign'];
                }
                if(row[field+'_halign']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_head_style']) styles[index][field+'_head_style'] = '';
                    styles[index][field+'_head_style'] += 'justify-content:' + getAlign(row[field+'_halign'])+';';
                    delete row[field+'_halign'];
                }
                if(row[field+'_hvalign']) {
                    if(!styles[index]) styles[index] = {};
                    if(!styles[index][field+'_head_style']) styles[index][field+'_head_style'] = '';
                    styles[index][field+'_head_style'] += 'align-items:' + getAlign(row[field+'_hvalign'])+';';
                    delete row[field+'_hvalign'];
                }
                if(row.hasOwnProperty(field+'_pin')) {
                    if(!styles[index]) styles[index] = {};
                    styles[index][field+'_pin'] = row[field+'_pin'] || '';
                    if(!styles[index][field+'_style']) styles[index][field+'_style'] = '';
                    let pinStyle  = styles[index][field+'_pin'] ? styles[index][field+'_pin']+';' : '';
                    if(/left\s*:/i.test(pinStyle) && !/right\s*:/i.test(pinStyle)) {
                        pinStyle += 'right: auto;';
                    } else if(/right\s*:/i.test(pinStyle) && !/left\s*:/i.test(pinStyle)) {
                        pinStyle += 'left: auto;';
                    }
                    styles[index][field+'_style'] += pinStyle;
                    delete row[field+'_pin'];
                }
                if(styles[index] && styles[index][field+'_style'] && !/;$/.test(styles[index][field+'_style'])){
                    styles[index][field+'_style'] = styles[index][field+'_style'] ? styles[index][field+'_style']+';' : '';
                }
            }
        }
        if(fields && typeof fields === 'string') {
            fields = fields.split(',');
            fields = fields.map(item => item.trim());
            fields = fields.filter(item => item);
        }
        // 过滤并排序
        if(fields && fields.length > 0) {
            data = filterData(data, fields);
        }
        // 默认排序
        if((!fields || fields.length === 0) && !hasCustomField) {
            for(const key in data) {
                data[key] = sortRowCustomFieldsFirst(data[key]);
            }
        }
        if(typeof result === 'function') return result(data);
        const rowNum = data.length;
        const colNum = Object.keys(data[0]||{}).length;
        if(colNum === 0 || rowNum === 0) return getInfo('未匹配到任何内容');
        let header = ``;
        if(options.showHeader) {
            let headRow = data[0];
            // if((!fields || fields.length === 0) && !hasCustomField) {
            //     headRow = JSON.parse(JSON.stringify(data[0]||{}));
            //     headRow = sortRowCustomFieldsFirst(headRow);
            // }
            for(const field in headRow){
                if(!colsSpace[field]) colsSpace[field] = '1fr';
                header += `<div class="grid-header ${styles[0] && styles[0].hasOwnProperty(field+'_pin')?'grid-sticky':''}" style="${styles[0]?(styles[0][field+'_style']||''):''}${styles[0]?(styles[0][field+'_head_style']||''):''}">${field}</div>`;
            }
        }
        let body = ``;
        for(let [index, row] of data.entries()){
            //if((!fields || fields.length === 0) && !hasCustomField) row = sortRowCustomFieldsFirst(row);
            for(const field in row){
                body += `<div class="grid-cell ${styles[index] && styles[index].hasOwnProperty(field+'_pin')?'grid-sticky':''}" style="${styles[index]?(styles[index][field+'_style']||''):''}${styles[index]?(styles[index][field+'_row_style']||''):''}">${row[field]}</div>`;
            }
        }
        return `${getStyle(item, rowNum, colNum, options, colsSpace)}
        <div class="protyle-wysiwyg__embed__grid-table grid-table-${item.dataset.nodeId}">
            ${header}
            ${body}
        </div>`;
    }

    // 解析select id as id__hide, content as content__link_u_b_i, created as created__datetime等
    function formatRow(row, rawRow, rowNo) {
        // 检测是否含有用户自定义字段
        const keys = Object.keys(row||{});
        const hasCustomField = keys.find(key => key.includes('__'));
        if(!hasCustomField) {
            rawRow = row;
            return row;
        }
        // 获取id
        const id = row['id'] || row['id__hide'] || row[keys.find(key => key.toLowerCase().includes('id__')||key.toLowerCase().includes('__id')||key.toLowerCase().includes('_id_')||/_id$/i.test(key))] || '';
        // 获取序号列
        const noColName = keys.find(key => key.toLowerCase().includes('__no')||key.toLowerCase().includes('_no_')||/_no$/i.test(key));
        // 获取行高
        const cssUnit = `(?:px|em|rem|pt|%|vw|vh|in|cm|mm|pc|vmin|vmax|ch|ex)?`;
        const rowHeightRe = new RegExp(`__(?:rheight|rh)(\d+${cssUnit})|_(?:rheight|rh)(\d+${cssUnit})_|_(?:rheight|rh)(\d+${cssUnit})$`, 'i');
        const rowHeight = keys.find(key => rowHeightRe.test(key));
        let rowHeightNum = 0;
        if(rowHeight){
            const match = rowHeight.match(rowHeightRe);
            rowHeightNum = match ? match[1] || match[2] || match[3] : 0;
        }
        //获取头部高度
        const headHeightRe = new RegExp(`__(?:hheight|hh)(\d+${cssUnit})|_(?:hheight|hh)(\d+${cssUnit})_|_(?:hheight|hh)(\d+${cssUnit})$`, 'i');
        const headHeight = keys.find(key => headHeightRe.test(key));
        let headHeightNum = 0;
        if(headHeight){
            const match = headHeight.match(headHeightRe);
            headHeightNum = match ? match[1] || match[2] || match[3] : 0;
        }
        //获取排序字段
        const sortedFields = getSortedFields(keys);
        // 渲染自定义样式
        for(const field in row) {
            if(field.indexOf('__') === -1) continue;
            const arr = field.split('__');
            const realField = arr[0];
            rawRow[realField] = row[field];
            let styles = arr[1]?.split('_');
            if(styles && styles.length > 0) {
                styles = styles.map(item=>item.toLowerCase());
                if(styles.includes('hide')||styles.includes('hd')){
                    delete row[field];
                    continue;
                }
                row[realField] = row[field];
                // 填充序号
                if(noColName && realField.toLowerCase() === noColName.split('__')[0].toLowerCase()) {
                    row[realField] = ++rowNo.value;
                }
                if(styles.includes('datetime')||styles.includes('dt')){
                    row[realField] = formatDateTime(row[field]);
                }
                if(styles.includes('date')||styles.includes('d')){
                    row[realField] = formatDate(row[field]);
                }
                if(styles.includes('time')||styles.includes('t')){
                    row[realField] = formatTime(row[field]);
                }
                if(styles.includes('type')) {
                    row[realField] = getTypeText(row[field]);
                }
                if(styles.includes('subtype')||styles.includes('stype')) {
                    row[realField] = getSubTypeText(row[field]);
                }
                if(styles.includes('md')||styles.includes('markdown')){
                    row[realField] = renderMarkdown(row[realField]);
                }
                if(styles.includes('tag')) {
                    row[realField] = toTag(row[realField]);
                }
                if(styles.includes('u')) {
                    row[realField] = toUnderLine(row[realField]);
                }
                if(styles.includes('i')) {
                    row[realField] = toItalic(row[realField]);
                }
                if(styles.includes('b')) {
                    row[realField] = toBold(row[realField]);
                }
                if(styles.includes('s')) {
                    row[realField] = toLineThrough(row[realField]);
                }
                const color = styles.find(item => item.toLowerCase().startsWith('color:') || item.toLowerCase().startsWith('c:'));
                if(color){
                    const val = color.toLowerCase().replace('color:', '').replace('c:', '');
                    if(val) setColor(row, realField, val);
                }
                const bg = styles.find(item => item.toLowerCase().startsWith('bg:'));
                if(bg){
                    const val = bg.toLowerCase().replace('bg:', '');
                    if(val) row[realField+'_row_style'] = 'background-color:'+val+';';
                }
                if(styles.includes('link')){
                    row[realField] = toLink(row[realField], 'siyuan://blocks/'+id);
                }
                if(styles.includes('ref')){
                    row[realField] = toRef(row[realField], id);
                }
                const ml = styles.find(item => item.toLowerCase().startsWith('ml'));
                if(ml){
                    const val = ml.toLowerCase().replace('ml', '');
                    if(val) row[realField] = marginLeft(row[realField], val);
                }
                const mr = styles.find(item => item.toLowerCase().startsWith('mr'));
                if(mr){
                    const val = mr.toLowerCase().replace('mr', '');
                    if(val) row[realField] = marginRight(row[realField], val);
                }
                const pl = styles.find(item => item.toLowerCase().startsWith('pl'));
                if(pl){
                    const val = pl.toLowerCase().replace('pl', '');
                    if(val) row[realField] = paddingLeft(row[realField], val);
                }
                const pr = styles.find(item => item.toLowerCase().startsWith('pr'));
                if(pr){
                    const val = pr.toLowerCase().replace('pr', '');
                    if(val) row[realField] = paddingRight(row[realField], val);
                }
                if(styles.includes('left')||styles.includes('l')){
                    alignLeft(row, realField);
                }
                if(styles.includes('right')||styles.includes('r')){
                    alignRight(row, realField);
                }
                if(styles.includes('top')){
                    valignTop(row, realField);
                }
                if(styles.includes('btm')||styles.includes('bottom')){
                    valignBottom(row, realField);
                }
                const align = styles.find(item => item.toLowerCase().startsWith('align:'));
                if(align){
                    const val = align.toLowerCase().replace('align:', '');
                    if(val) setAlign(row, realField, val);
                }
                const valign = styles.find(item => item.toLowerCase().startsWith('valign:'));
                if(valign){
                    const val = valign.toLowerCase().replace('valign:', '');
                    if(val) setVAlign(row, realField, val);
                }
                const hAlign = styles.find(item => item.toLowerCase().startsWith('halign:'));
                if(hAlign){
                    const val = hAlign.toLowerCase().replace('halign:', '');
                    if(val) setHAlign(row, realField, val);
                }
                const hvAlign = styles.find(item => item.toLowerCase().startsWith('hvalign:'));
                if(hvAlign){
                    const val = hvAlign.toLowerCase().replace('hvalign:', '');
                    if(val) setHVAlign(row, realField, val);
                }
                const width = styles.find(item => item.toLowerCase().startsWith('width') || item.toLowerCase().startsWith('w'));
                if(width){
                    const val = width.toLowerCase().replace('width', '').replace('w', '');
                    if(val) row[realField+'_width'] = val;
                }
                const height = styles.find(item => item.toLowerCase().startsWith('height') || (
                                                    item.toLowerCase().startsWith('h') &&
                                                    !item.toLowerCase().startsWith('halign') &&
                                                    !item.toLowerCase().startsWith('hvalign')
                                                )
                                            );
                if(height){
                    const val = height.toLowerCase().replace('height', '').replace('h', '');
                    if(val) row[realField+'_height'] = val;
                }
                const pin = styles.find(item => item.toLowerCase().startsWith('pin'));
                if(pin){
                    let style = '';
                    // pin:left100px:bgred:z100
                    let pinArr = pin.split(':');
                    pinArr = pinArr.filter(item => item);
                    if(pinArr.length > 0){
                        for(let item of pinArr){
                            item = item.trim().toLowerCase();
                            if(item.startsWith('left')){
                                let left = item.replace('left', '') || 0;
                                left = /^\d+$/.test(left) ? left + 'px' : left;
                                style += `left:${left};`;
                            } else if(item.startsWith('right')){
                                let right = item.replace('right', '') || 0;
                                right = /^\d+$/.test(right) ? right + 'px' : right;
                                style += `right:${right};`;
                            } else if(item.startsWith('bg')){
                                style += `background-color:${item.replace('bg', '')||'var(--b3-theme-background)'};`;
                            } else if(item.startsWith('zindex') || item.startsWith('z')){
                                style += `z-index:${parseInt(item.replace('zindex', '').replace('z', ''))||1};`;
                            }
                        }
                    }
                    if(style) setPin(row, realField, style);
                }
                if(rowHeightNum){
                    row[realField+'_rheight'] = rowHeightNum;
                }
                if(headHeightNum){
                    row[realField+'_hheight'] = headHeightNum;
                }
                delete row[field];
            }
        }
        row = sortRowSortFieldsFirst(row, sortedFields);
        return row;
    }

    function getSortedFields(keys) {
        sortMap = {};
        for(const key of keys){
            const match = key.match(/__(\d+)|_(\d+)_|_(\d+)$/);
            const num = match ? match[1] || match[2] || match[3] : 0;
            if(num) sortMap[num] = key.split('__')[0];
        }
        const newKeys = Object.keys(sortMap);
        newKeys.sort((a, b) => a - b);
        return newKeys.map(num => sortMap[num]);
    }

    function getUnit(val) {
        return /^\d+$/.test(val) ? 'px' : '';
    }

    function getAlign(val) {
        switch (val) {
            case 'left':
            case 'top':
                return 'start';
            case 'right':
            case 'bottom':
                return 'end';
            case 'center':
                return 'center';
            default:
                return 'center';
        }
    }

    function getQueryEmbedStyle(item, options={}, widthStyleTag = false) {
        const id = item.dataset.nodeId;
        return `
        ${widthStyleTag?'<style>':''}
            .protyle-wysiwyg [data-node-id].render-node[data-type=NodeBlockQueryEmbed][data-node-id="${id}"] {
                padding: 0;
                border: 0;
                background-color: transparent;
            }
            .protyle-wysiwyg [data-node-id].render-node[data-type=NodeBlockQueryEmbed][data-node-id="${id}"] > .protyle-wysiwyg__embed {
                border: 0;
                cursor: default;
                overflow: auto;
                ${options.tableMaxWidth?`max-width:${options.tableMaxWidth}${getUnit(options.tableMaxWidth)};`:''}
                ${options.tableMaxHeight?'max-height: '+options.tableMaxHeight+getUnit(options.tableMaxHeight)+';':''}
                ${options.tableAlign && options.tableAlign === 'center'?'margin: 0 auto;':''}
                ${options.tableAlign && options.tableAlign === 'left'?'float: left;':''}
                ${options.tableAlign && options.tableAlign === 'right'?'float: right;':''}
            }
            .protyle-wysiwyg [data-node-id].render-node[data-type=NodeBlockQueryEmbed][data-node-id="${id}"] > .protyle-icons {
                z-index: 2;
            }
            .protyle-wysiwyg [data-node-id].render-node[data-type=NodeBlockQueryEmbed][data-node-id="${id}"] {
                .query-logo, .query-title {
                    margin-right: 8px;
                }
            }
        ${widthStyleTag?'</style>':''}
        `;
    }

    function getStyle(item, rowNum, colNum, options = {}, colsSpace={}) {
        if(colNum === 0 || rowNum === 0) return "";
        if(options.showHeader) rowNum++;  // +1 加上表格头的一行
        const id = item.dataset.nodeId;
        let lastColStyle = [];
        for(let i=colNum;i<=rowNum*colNum;i=i+colNum){
            lastColStyle.push(`.grid-table-${id} > div:nth-child(${i})`);
        }
        let lastRowStyle = [];
        for(let i=rowNum*colNum-(colNum-1);i<=rowNum*colNum;i++){
            lastRowStyle.push(`.grid-table-${id} > div:nth-child(${i})`);
        }
        // 计算奇偶颜色
        const evenSelectors = generateSelectors(colNum);
        const tableBorderStyle = options.tableBorderStyle ? options.tableBorderStyle : `1px solid ${options.tableBorderColor?options.tableBorderColor:'var(--b3-theme-surface-lighter)'};`;
        return `<style>
            ${getQueryEmbedStyle(item, options)}
            .grid-table-${id} {
                display: grid;
                grid-template-columns: ${Object.values(colsSpace).join(' ')||`repeat(${colNum}, 1fr)`};
                grid-auto-rows: minmax(30px, auto);
                border-collapse: collapse;
                width: 100%;
                cursor: text;
                ${options.tableStyle?options.tableStyle:''}
            }
            .grid-table-${id} > div {
                ${(options.tableBorder && !options.onlyShowBottomBorder)?'border: '+tableBorderStyle:''};
                border-right: 0;
                border-bottom: ${(options.tableBorder && options.onlyShowBottomBorder)?tableBorderStyle:0};
                padding: 5px;
                text-align: center;
                max-height: 100px;
                min-width: 200px;
                overflow: auto;
                box-sizing: border-box;
                display: grid;
                justify-content: center;
                align-items: center;
                ${options.cellWidth?`min-width:auto;width:${options.cellWidth}${getUnit(options.cellWidth)};`:''}
                ${options.cellHeight?`max-height:fit-content;height:${options.cellHeight}${getUnit(options.cellHeight)};`:''}
                ${options.cellAlign?'justify-content:'+getAlign(options.cellAlign):''}
                ${options.cellVAlign?'align-items:'+getAlign(options.cellVAlign):''}
                ${options.cellStyle?options.cellStyle:''}
            }
            ${lastColStyle.join(',')} {
                ${(options.tableBorder && !options.onlyShowBottomBorder)?`border-right: ${tableBorderStyle}`:''};
            }
            ${lastRowStyle.join(',')} {
                ${options.tableBorder?`border-bottom: ${tableBorderStyle}`:''};
            }
            .grid-table-${id} > .grid-header {
                font-weight: bold;
                ${options.headerBackgroundColor?'background-color: '+options.headerBackgroundColor+'!important;':''}
                ${options.headerSticky?'position: sticky;top: 0;':''}
                ${options.headHeight?`max-height:fit-content;height:${options.headHeight}${getUnit(options.headHeight)};`:''}
                ${options.headAlign?'justify-content:'+getAlign(options.headAlign):''}
                ${options.headVAlign?'align-items:'+getAlign(options.headVAlign):''}
                ${options.headerStyle?options.headerStyle:''}
            }
            .grid-table-${id} > .grid-sticky {
                position: sticky;
                left: 0; /* 固定在左侧 */
                background-color: var(--b3-theme-background);
                z-index: 1; /* 确保 sticky 元素在其他内容之上 */
            }
            ${options.showEvenOdd ? `
                .protyle-wysiwyg__embed__grid-table.grid-table-${id} {
                    /* 这里从表头开始算起 */
                    ${evenSelectors.odd} {
                        background-color: ${options.oddColor?options.oddColor:'var(--b3-table-even-background)'}; /* 奇数行的背景颜色 */
                    }
                    ${evenSelectors.even} {
                        background-color: ${options.evenColor?options.evenColor:'transparent'}; /* 偶数行的背景颜色 */
                    }
                }
            ` : ''}
        </style>`;
    }

    // 生成奇数行和偶数行的选择器
    function generateSelectors(colNum) {
        let evenSelectors = []; // 偶数行的选择器
        let oddSelectors = [];  // 奇数行的选择器

        // 生成偶数行的选择器
        for (let k = 1; k <= colNum; k++) {
            evenSelectors.push(`div:nth-child(${2 * colNum}n + ${k + colNum})`);
        }

        // 生成奇数行的选择器
        for (let k = 1; k <= colNum; k++) {
            oddSelectors.push(`div:nth-child(${2 * colNum}n + ${k})`);
        }

        // 将选择器拼接成字符串
        const evenSelectorString = evenSelectors.join(',');
        const oddSelectorString = oddSelectors.join(',');

        return {
            even: evenSelectorString,
            odd: oddSelectorString
        };
    }

    function getError(message) {
        return `<span class="query-error" style="${getInfoStyle()};"><span  class="query-logo">${defaultLogo}</span><span  class="query-title">${defaultTitle}</span><span class="query-msg" style="color:red;">${message||'未知错误'}</span></span>`;
    }

    function getInfo(message) {
        return `<span  class="query-info" style="${getInfoStyle()}"><span  class="query-logo">${defaultLogo}</span><span  class="query-title">${defaultTitle}</span><span class="query-msg">${message || defaultDesc}</span></span>`;
    }

    function getSuccess(message) {
        return `<span  class="query-success" style="${getInfoStyle()};"><span  class="query-logo">${defaultLogo}</span><span  class="query-title">${defaultTitle}</span><span class="query-msg" style="color:green;">${message||'执行成功'}</span></span>`;
    }

    function doNothing(message, code=202) {
        return getJson(code, message|| defaultDesc, null);
    }

    function getJson(code=0, message = '', data = null) {
        return {code: code|| 0, msg: message || '', data:data||null};
    }

    function getInfoStyle() {
        return `margin-left: 10px;margin-top: 4px;display: inline-block;`;
    }

    function filterData(data, fields) {
        return data.map(item => {
            return fields.reduce((acc, field) => {
                if (item.hasOwnProperty(field)) {
                    acc[field] = item[field];
                }
                return acc;
            }, {});
        });
    }

    function sortRowCustomFieldsFirst(row, sortFields) {
        sortFields = sortFields || [
            "id", "parent_id", "root_id", "hash", "box", "path", "hpath", "name", "alias", "memo", "tag", "content", "fcontent", "markdown", "length", "type", "subtype", "ial", "sort", "created", "updated"
        ];
        // 创建一个新的对象，按照指定顺序排列
        let sortedRow = {};
        // 1. 先添加 row 中存在但不在 sortFields 中的字段
        for (const key in row) {
            if (!sortFields.includes(key)) { // 只添加不在 sortFields 中的字段
                sortedRow[key] = row[key];
            }
        }
        // 2. 添加 sortFields 中存在的字段
        for (const key of sortFields) {
            if (row.hasOwnProperty(key)) {
                sortedRow[key] = row[key];
            }
        }
        return sortedRow;
    }

    function sortRowSortFieldsFirst(row, sortFields) {
        sortFields = sortFields || [
            "id", "parent_id", "root_id", "hash", "box", "path", "hpath", "name", "alias", "memo", "tag", "content", "fcontent", "markdown", "length", "type", "subtype", "ial", "sort", "created", "updated"
        ];
        // 创建一个新的对象，按照指定顺序排列
        let sortedRow = {};
        // 1. 添加 sortFields 中存在的字段
        for (const key of sortFields) {
            if (row.hasOwnProperty(key)) {
                sortedRow[key] = row[key];
            }
        }
        // 2. 先添加 row 中存在但不在 sortFields 中的字段
        for (const key in row) {
            if (!sortFields.includes(key)) { // 只添加不在 sortFields 中的字段
                sortedRow[key] = row[key];
            }
        }
        return sortedRow;
    }

    // 通过SQL查询数据
    async function querySql(sql) {
        try {
            const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
            if (result.code !== 0) {
                console.error("查询数据库出错", result.msg);
                return result.msg;
            }
            return result.data;
        } catch(e) {
            console.error("查询数据库出错", e.message);
            return e.message;
        }
    }

    // 获取avid
    function getDataAvIdFromHtml(htmlString) {
        // 使用正则表达式匹配data-av-id的值
        const match = htmlString.match(/data-av-id="([^"]+)"/);
        if (match && match[1]) {
        return match[1];  // 返回匹配的值
        }
        return "";  // 如果没有找到匹配项，则返回空
    }

    // see https://github.com/frostime/sy-query-view/blob/351bf3ce4e0ee7ac98dcdf6232fc22fd3695b100/src/core/components.ts#L1027
    async function checkEcharts() {
        if (window.echarts) return true;
        const CDN = '/stage/protyle';
        // Load main echarts library
        const sucess = await addScript(
            `${CDN}/js/echarts/echarts.min.js`,
            "protyleEchartsScript"
        );
        if (!sucess) return false;

        // Optionally load GL extension
        await addScript(
            `${CDN}/js/echarts/echarts-gl.min.js`,
            "protyleEchartsGLScript"
        );
        return true;
    }

    // see https://github.com/frostime/sy-query-view/blob/351bf3ce4e0ee7ac98dcdf6232fc22fd3695b100/src/core/components.ts#L389
    async function checkMermaid() {
        if (window.mermaid) return;
        const cdn = '/stage/protyle';
        //https://github.com/siyuan-note/siyuan/blob/master/app/src/protyle/render/mermaidRender.ts
        const sucess = await addScript(`${cdn}/js/mermaid/mermaid.min.js`, "protyleMermaidScript");
        if (!sucess) return;
        const config = {
            securityLevel: "loose", // 升级后无 https://github.com/siyuan-note/siyuan/issues/3587，可使用该选项
            altFontFamily: "sans-serif",
            fontFamily: "sans-serif",
            startOnLoad: false,
            flowchart: {
                htmlLabels: true,
                useMaxWidth: !0
            },
            sequence: {
                useMaxWidth: true,
                diagramMarginX: 8,
                diagramMarginY: 8,
                boxMargin: 8,
                showSequenceNumbers: true // Mermaid 时序图增加序号 https://github.com/siyuan-note/siyuan/pull/6992 https://mermaid.js.org/syntax/sequenceDiagram.html#sequencenumbers
            },
            gantt: {
                leftPadding: 75,
                rightPadding: 20
            }
        };
        if (window.siyuan.config.appearance.mode === 1) {
            config.theme = "dark";
        }
        window.mermaid.initialize(config);
    }

    function addScript(path, id) {
        return new Promise((resolve) => {
            if (document.getElementById(id)) {
                // 脚本加载后再次调用直接返回
                resolve(false);
                return false;
            }
            const scriptElement = document.createElement("script");
            scriptElement.src = path;
            scriptElement.async = true;
            // 循环调用时 Chrome 不会重复请求 js
            document.head.appendChild(scriptElement);
            scriptElement.onload = () => {
                if (document.getElementById(id)) {
                    // 循环调用需清除 DOM 中的 script 标签
                    scriptElement.remove();
                    resolve(false);
                    return false;
                }
                scriptElement.id = id;
                resolve(true);
            };
        });
    };

    function isObject(value) {
        return value instanceof Object && !(value instanceof Array) && typeof value !=='function';
    }

   function errorMessage(element, message) {
        element.innerHTML = getError(message);
    }

    // 发送消息
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }

    // 请求api
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = {
            method: "POST",
        };
        if (data) {
            if (data instanceof FormData) {
                init.body = data;
            } else {
                init.body = JSON.stringify(data);
            }
        }
        try {
            const res = await fetch(url, init);
            const res2 = returnType === 'json' ? await res.json() : await res.text();
            return res2;
        } catch(e) {
            console.log(e);
            return returnType === 'json' ? {code:e.code||1, msg: e.message||"", data: null} : "";
        }
    }

    function putFile(storagePath, data) {
        const formData = new FormData();
        formData.append("path", storagePath);
        formData.append("file", new Blob([data]));
        return fetch("/api/file/putFile", {
            method: "POST",
            body: formData,
        }).then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                return getJson(-1, "Failed to save file");
            }
        }).catch((error) => {
            console.error(error);
            return getJson(error.code, error.message, error);
        });
    }

    // 等待元素渲染完成后执行
    function whenElementExist(selector) {
        return new Promise(resolve => {
            const checkForElement = () => {
                let element = null;
                if (typeof selector === 'function') {
                    element = selector();
                } else {
                    element = document.querySelector(selector);
                }
                if (element) {
                    resolve(element);
                } else {
                    requestAnimationFrame(checkForElement);
                }
            };
            checkForElement();
        });
    }

    function getAvTpl(){
        return {
            "spec": 0,
            "id": "20250102211816-q4b98ft",
            "name": "",
            "keyValues": [
                {
                    "key": {
                        "id": "20250102211816-54mo9q0",
                        "name": "内容",
                        "type": "block",
                        "icon": "",
                        "numberFormat": "",
                        "template": ""
                    },
                    "values": [
                        {
                            "id": "20250102211828-qrqcobj",
                            "keyID": "20250102211816-54mo9q0",
                            "blockID": "20250102211818-r2d7rk8",
                            "type": "block",
                            "createdAt": 1735823908060,
                            "updatedAt": 1735824170297,
                            "block": {
                                "id": "20250102211818-r2d7rk8",
                                "content": "1111",
                                "created": 1735823908060,
                                "updated": 1735824170297
                            }
                        }
                    ]
                },
                {
                    "key": {
                        "id": "20250102211816-deutay7",
                        "name": "文本",
                        "type": "text",
                        "icon": "",
                        "numberFormat": "",
                        "template": ""
                    },
                    "values": [
                        {
                            "id": "20250102212130-tal4tr3",
                            "keyID": "20250102211816-deutay7",
                            "blockID": "20250102211914-iokcein",
                            "type": "text",
                            "createdAt": 1735824103880,
                            "updatedAt": 1735824104880,
                            "text": {
                                "content": "文本1"
                            }
                        }
                    ]
                },
                {
                    "key": {
                        "id": "20250102211905-6hcaddh",
                        "name": "数字",
                        "type": "number",
                        "icon": "",
                        "numberFormat": "",
                        "template": ""
                    },
                    "values": [
                        {
                            "id": "20250102212144-x2q8y0v",
                            "keyID": "20250102211905-6hcaddh",
                            "blockID": "20250102211914-iokcein",
                            "type": "number",
                            "createdAt": 1735824120763,
                            "updatedAt": 1735824121763,
                            "number": {
                                "content": 11,
                                "isNotEmpty": true,
                                "format": "",
                                "formattedContent": "11"
                            }
                        }
                    ]
                },
                {
                    "key": {
                        "id": "20250102212021-s1cnnvr",
                        "name": "日期",
                        "type": "date",
                        "icon": "",
                        "numberFormat": "",
                        "template": ""
                    },
                    "values": [
                        {
                            "id": "20250102212022-bf02xb4",
                            "keyID": "20250102212021-s1cnnvr",
                            "blockID": "20250102211914-iokcein",
                            "type": "date",
                            "createdAt": 1735824026316,
                            "updatedAt": 1735824050411,
                            "date": {
                                "content": 1735824000000,
                                "isNotEmpty": true,
                                "hasEndDate": false,
                                "isNotTime": true,
                                "content2": 0,
                                "isNotEmpty2": true,
                                "formattedContent": ""
                            }
                        }
                    ]
                },
                {
                    "key": {
                        "id": "20250102212111-pe4cqe4",
                        "name": "序号",
                        "type": "lineNumber",
                        "icon": "",
                        "numberFormat": "",
                        "template": ""
                    }
                }
            ],
            "keyIDs": null,
            "viewID": "20250102211816-nvwupk1",
            "views": [
                {
                    "id": "20250102211816-nvwupk1",
                    "icon": "",
                    "name": "表格",
                    "hideAttrViewName": false,
                    "type": "table",
                    "table": {
                        "spec": 0,
                        "id": "20250102211816-zxhbu0s",
                        "columns": [
                            {
                                "id": "20250102212111-pe4cqe4",
                                "wrap": false,
                                "hidden": false,
                                "pin": false,
                                "width": ""
                            },
                            {
                                "id": "20250102211816-54mo9q0",
                                "wrap": false,
                                "hidden": false,
                                "pin": false,
                                "width": ""
                            },
                            {
                                "id": "20250102211816-deutay7",
                                "wrap": false,
                                "hidden": false,
                                "pin": false,
                                "width": ""
                            },
                            {
                                "id": "20250102211905-6hcaddh",
                                "wrap": false,
                                "hidden": false,
                                "pin": false,
                                "width": ""
                            },
                            {
                                "id": "20250102212021-s1cnnvr",
                                "wrap": false,
                                "hidden": false,
                                "pin": false,
                                "width": ""
                            }
                        ],
                        "rowIds": [
                            "20250102211914-iokcein",
                            "20250102211818-r2d7rk8",
                            "20250102211821-7jtpawm"
                        ],
                        "filters": [],
                        "sorts": [],
                        "pageSize": 50
                    }
                }
            ]
        };
    }

    function setQueriesData(item, key, data) {
        if(!queriesData[item.dataset.nodeId]) queriesData[item.dataset.nodeId] = {};
        queriesData[item.dataset.nodeId][key] = data;
    }

    function getQueriesData(item, key) {
        if(!queriesData[item.dataset.nodeId]) return null;
        if(!queriesData[item.dataset.nodeId].hasOwnProperty(key)) return null;
        return queriesData[item.dataset.nodeId][key];
    }

    function deleteQueriesData(item, key) {
        if(!queriesData[item.dataset.nodeId]) return;
        if(!queriesData[item.dataset.nodeId].hasOwnProperty(key)) return;
        delete queriesData[item.dataset.nodeId][key];
    }

    ///////////// 工具 //////////////////////////
    // 给查询窗口增加添加查询模板功能
    observerProtyleUtil(async protyleUtil => {
        if(protyleUtil.querySelector('button[data-type="code-tpl"]')) return;
        const refresh = protyleUtil.querySelector('[data-type="refresh"]');
        if(!refresh) return;

        // 添加极简代码
        (() => {
            // 创建 <span class="fn__space"></span> 元素
            const spanElement = document.createElement('span');
            spanElement.className = 'fn__space';
            // 创建 <button> 元素
            const buttonElement = document.createElement('button');
            buttonElement.dataset.type = 'code-line-tpl';
            buttonElement.className = 'block__icon block__icon--show b3-tooltips b3-tooltips__nw';
            buttonElement.setAttribute('aria-label', '添加简单代码');
            const svg = `<svg><use xlink:href="#iconInlineCode"></use></svg>`;
            buttonElement.innerHTML = svg;
            buttonElement.onclick = (event) => {
                const textarea = protyleUtil.querySelector('textarea');
                const jsPrefix = textarea.value.indexOf('//!js') === 0 ? '': '//!js';
                textarea.value += `${jsPrefix}
// 使用帮助：https://ld246.com/article/1736035967300
// 注意，如果查询数量过多，可能会造成查询卡顿，建议用limit加以限制
return query(\`
    select id as id__hide,
    '-' as 序号__no_w80_0,
    content as 内容__ref_1,
    type as 文档类型__type_2,
    hpath as 路径__3,
    created as 创建时间__datetime_4,
    updated as 更新时间__datetime_5
    from blocks
    where type='d'
    order by created desc
    limit 5
\`,
// ❗注意，item 代表本嵌入块对象 固定不变，勿动！！！
// 这个👇参数，即item后面的这个参数也可以对字段进行排序和过滤
item, '', '', '',
{
    showHeader: true, // 显示表头
    showEvenOdd: false, // 显示斑马纹
    oddColor: '', // 奇数行背景色，从表头开始算起
    evenColor: '', // 偶数行背景色，从表头开始算起
    tableBorder: true, // 显示表格边框
    tableBorderColor: '', // 边框颜色
    tableBorderStyle: '', // 边框样式
    onlyShowBottomBorder: false, // 只显示底部边框
    tableMaxWidth: '', // 表格最大宽度
    tableMaxHeight: '', // 表格最大高度
    tableAlign: '', // 表格对齐
    tableStyle: '', // 表格样式
    cellWidth: '',  // 单元格宽度
    cellHeight: '', // 单元格高度
    cellAlign: '', // 单元格对齐
    cellVAlign: '', // 单元格垂直对齐
    cellStyle: '', // 单元格样式
    headerBackgroundColor:'', // 表头背景色
    headerSticky: false, // 表头是否固定，仅当表格固定高度或tableMaxHeight设置后生效
    headHeight: '', // 表头高度
    headAlign: '', // 表头对齐
    headVAlign: '', // 表头垂直对齐
    headerStyle: '', // 表头样式
    queryLogo: '', // 简单查询logo，可针对不同的查询设置不同的logo
    queryTitle: '', // 简单查询标题，可针对不同的查询设置不同的标题
    queryDesc: '', // 简单查询描述，可针对不同的查询设置不同的描述
});

// 常用字段后缀说明：
// hide 该字段不会显示，简写hd
// datetime 格式日期和时间，简写dt
// date 格式化日期，简写d
// time 格式化时间，简写t
// link 转换为链接，必须查询id字段
// ref 转换为引用，必须查询id字段
// markdown 渲染Markdown代码，简写md
// tag 渲染为tag标签
// left 左对齐，简写l
// right 右对齐，简写r
// top 垂直顶部对齐
// bottom 垂直底部对齐，简写btm
// u 添加下划线
// i 添加斜体
// b 添加加粗
// s 添加删除线
// color:颜色值 设置文字颜色，简写c，比如，c:red c:#ccc等，注意，使用这个后缀字段需要加单引号，比如，content as '内容__ref_c:red_1'
// bg:颜色值 设置背景颜色，比如，bg:red bg:#ccc等，注意，使用这个后缀字段需要加单引号，比如，content as '内容__ref_bg:red_1'
// width40 设置字段宽度，简写w40，40代表40px
// height100 设置行高度，简写h100，100代表100px
// rheight200 设置行高，简写rh200，200代表200px
// hheight200 设置标题行高，简写hh200，200代表200px
// id 标记为id字段
// no 标记为序号字段
// type 显示文档类型文本
// subtype 显示子类型文本，简写stype
// ml5 左侧外边距宽度，这里的5可以是任意数字，第二个字幕是L的小写字母
// mr 右侧外边距宽度，这里的5可以是任意数字
// pl 左侧内边距宽度，这里的5可以是任意数字，第二个字幕是L的小写字母
// pr 右侧内边距宽度，这里的5可以是任意数字
// algin 左中右水平对齐，比如 align:left、align:center、align:right，注意，使用这个后缀字段需要加单引号
// valign 垂直对齐，比如 valign:top、valign:center、valign:bottom，注意，使用这个后缀字段需要加单引号
// halign 表头水平对齐，比如 halign:left、halign:center、halign:right，注意，使用这个后缀字段需要加单引号
// hvalign 表头垂直对齐，比如 hvalign:top、hvalign:center、hvalign:bottom，注意，使用这个后缀字段需要加单引号
// pin:left100:bg#fff:zindex1 列固定，这里pin是标记固定关键词，left代表左侧固定，100代表距离左侧的距离,默认是0，bg代表背景色，#fff是背景颜色，zindex或z代表层级，默认是1，除了pin，其他都是可选，注意，使用这个后缀字段需要加单引号
`;
                buttonElement.innerHTML = '已添加';
                setTimeout(() => {
                    buttonElement.innerHTML = svg;
                }, 1500);
            };
            // 将 <span> 和 <button> 插入到 refresh 元素的后面
            refresh.after(spanElement, buttonElement);
        })();

        // 添加查询代码
        // 创建 <span class="fn__space"></span> 元素
        const spanElement = document.createElement('span');
        spanElement.className = 'fn__space';
        // 创建 <button> 元素
        const buttonElement = document.createElement('button');
        buttonElement.dataset.type = 'code-tpl';
        buttonElement.className = 'block__icon block__icon--show b3-tooltips b3-tooltips__nw';
        buttonElement.setAttribute('aria-label', '添加复杂代码');
        const svg = `<svg><use xlink:href="#iconCode"></use></svg>`;
        buttonElement.innerHTML = svg;
        buttonElement.onclick = (event) => {
            const textarea = protyleUtil.querySelector('textarea');
            const jsPrefix = textarea.value.indexOf('//!js') === 0 ? '': '//!js';
            textarea.value += `${jsPrefix}
// 使用帮助：https://ld246.com/article/1736035967300
return query(
    // sql查询语句，注意，如果查询数量过多，可能会造成查询卡顿，建议用limit加以限制
    \`select * from blocks where type='d' order by created desc limit 5;\`,
    // item， 固定不变，❗️勿动，代表本嵌入块对象
    item,
    // 字段列表，可以用于过滤和排序，格式'id,content,created'或数组
    '序号,内容,文档类型,路径,创建时间,更新时间',
    // 嵌入块渲染前数据处理，row代表一行数据，data代表全部数据, index是行索引，从0开始，options是全局选项，这里可以临时更改，如果用return返回，则停止循环并立即返回
    ({ row, index, data, options, toLink, toRef, formatDate, formatDateTime, renderMarkdown, getTypeText, renderListView, renderChartView, renderViewByMarkdown, ...args }) => {
        // 可以打印这些参数查看参数的值，args列出所有剩余的可用对象或函数
        // console.log(row, index, data, args);
        // 这里编写您的主要处理逻辑
        row.序号 = index + 1;
        row.序号_width = '80px';
        row.内容 = toRef(row.content, row.id);
        row.文档类型 = getTypeText(row.type);
        row.路径 = row.hpath;
        row.创建时间 = formatDateTime(row.created);
        row.更新时间 = formatDateTime(row.updated);
    },
    // 嵌入块渲染后执行，options是选项，data是上次查询的数据，此时，这些参数只读，再更改无法使已渲染的结果生效，除非你手动修改渲染结果
    ({ options, data }) => {
        // 可以打印这些参数查看结果
        // console.log(options, data);
        // 这里编写您的主要处理逻辑
        
    },
    // 全局选项配置，可以调整渲染结果的样式等
    {
        showHeader: true, // 显示表头
        showEvenOdd: false, // 显示斑马纹
        oddColor: '', // 奇数行背景色，从表头开始算起
        evenColor: '', // 偶数行背景色，从表头开始算起
        tableBorder: true, // 显示表格边框
        tableBorderColor: '', // 边框颜色
        tableBorderStyle: '', // 边框样式
        onlyShowBottomBorder: false, // 只显示底部边框
        tableMaxWidth: '', // 表格最大宽度
        tableMaxHeight: '', // 表格最大高度
        tableAlign: '', // 表格对齐
        tableStyle: '', // 表格样式
        cellWidth: '',  // 单元格宽度
        cellHeight: '', // 单元格高度
        cellAlign: '', // 单元格对齐
        cellVAlign: '', // 单元格垂直对齐
        cellStyle: '', // 单元格样式
        headerBackgroundColor:'', // 表头背景色
        headerSticky: false, // 表头是否固定，仅当表格固定高度或tableMaxHeight设置后生效
        headHeight: '', // 表头高度
        headAlign: '', // 表头对齐
        headVAlign: '', // 表头垂直对齐
        headerStyle: '', // 表头样式
        queryLogo: '', // 简单查询logo，可针对不同的查询设置不同的logo
        queryTitle: '', // 简单查询标题，可针对不同的查询设置不同的标题
        queryDesc: '', // 简单查询描述，可针对不同的查询设置不同的描述
    }
);`;
            buttonElement.innerHTML = '已添加';
            setTimeout(() => {
                buttonElement.innerHTML = svg;
            }, 1500);
        };
        // 将 <span> 和 <button> 插入到 refresh 元素的后面
        refresh.after(spanElement, buttonElement);
    });

    // 等待元素出现
    function observerProtyleUtil(callback) {
        let hasEmit = false;
        // 1. 创建 MutationObserver 实例
        const observer = new MutationObserver((mutationsList) => {
          mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                // 检查新增的节点
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if(node.matches('[data-type="NodeBlockQueryEmbed"][data-content^="//!js"]')) {
                            setQueriesData(node, 'firstLoading', true);
                        }
                    }
                }
            }
            // 2. 获取目标元素
            const targetElement = mutation.target;
            // 3. 检查目标元素是否是 .protyle .protyle-util
            if (targetElement.matches('.protyle .protyle-util')) {
              // 4. 检查 .fn__none 类是否被删除
              if (!targetElement.classList.contains('fn__none')) {
                  if(hasEmit) return;
                  hasEmit = true;
                  callback(targetElement);
                  setTimeout(() => {
                      hasEmit = false;
                  }, 100);
              }
            }
          });
        });
        // 5. 配置并启动监听
        observer.observe(document.body, {
          childList: true, // 监控子节点的变化
          attributes: true, // 监听属性变化
          attributeFilter: ['class'], // 只监听 class 属性
          subtree: true,    // 监听所有后代元素
        });
    }

    // 代码片段自动检查更新
    /*(async function checkUpdate() {
        if(window.snippetsUpdateChecker !== undefined && (window.snippetsUpdateChecker.version||window.snippetsUpdateChecker.isLoading)) return;
        if(!window.snippetsUpdateChecker) window.snippetsUpdateChecker = {};
        window.snippetsUpdateChecker.isLoading = true;
        setTimeout(() => { window.snippetsUpdateChecker.isLoading = false; }, 60000); // 60s超时
        const downUrl = 'https://gitee.com/wish163/mysoft/raw/main/%E6%80%9D%E6%BA%90/snippets_update_checker.js';
        const localUrl = '/snippets/snippets_update_checker.js';
        const file = '/data/snippets/snippets_update_checker.js';
        const reset = () => { window.snippetsUpdateChecker.isLoading = false; };
        const hasLoaded = () => !window.snippetsUpdateChecker.isLoading || window.snippetsUpdateChecker.version;
        const parseJson = (text) => { try{ return JSON.parse(text) }catch(e){ return null } };
        const loadJs = () => {
            const script = document.createElement('script');
            script.src = localUrl;
            script.onload = () => { reset(); };
            document.head.appendChild(script);
        };
        try {
            const res = await fetch("/api/file/getFile", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({path: file}),
            });
            const jsonText = await res.text();
            const json = parseJson(jsonText);
            if(json && json.code === 404) {
                if(hasLoaded()) return;
                const response = await fetch(downUrl); // 不存在下载远程js
                if (!response.ok) {
                    reset();
                    return;
                }
                const jsContent = await response.text();
                if(hasLoaded()) return;
                const formData = new FormData();
                formData.append("path", file);
                formData.append("file", new Blob([jsContent]));
                const result = await fetch("/api/file/putFile", { // 写入js到本地
                    method: "POST",
                    body: formData,
                });
                const json = await result.json();
                if(json && json.code === 0) {
                    if(hasLoaded()) return;
                    loadJs(); // 写入后加载本地js
                } else {
                    reset();
                }
            } else {
                if(hasLoaded()) return;
                loadJs(); // 已存在直接加载本地js
            }
        } catch(e) {
            reset();
            console.error(e);
        }
    })();*/
})();