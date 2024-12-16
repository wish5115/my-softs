//!js
// SQL自定义查询结果
// see https://ld246.com/article/1734338710962
return (async () => {
    const tag = 'demo1';
    const sql = `
        SELECT * FROM blocks where type = 'd' and tag like '%#${tag}#%' or id in (
            SELECT parent_id FROM blocks where type <> 'd' and tag = '%#${tag}#%'
        ) ORDER BY created desc;
    `;
    const result = await query(sql);
    // 渲染结果
    return render(result, ['封面图','文档标题', '创建时间'], (row, {toRef, formatDate})=>{
        row['文档标题'] = toRef(row['content'], row['id']);
        row['创建时间'] = formatDate(row['created']);
        row['封面图'] = showTitleImage(row['ial'], '100px');
    }, () => {
        // 图片绑定事件
        const imgs = item.querySelectorAll('.protyle-wysiwyg__embed__grid-table .grid-row-title-img');
        imgs.forEach(img => {
            img.onclick = () => {
                window.open(img.src);
            };
        });
    });

    /////// 用户自定义函数 /////////////////////

    // 注册回调函数中传递的函数
    function getCallbackFuncs() {
        return {
            toRef,
            toLink,
            formatDateTime,
            formatDate,
        }
    }

    function showTitleImage(ial, maxWidth = '100px', maxHeight = '') {
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

    function toRef(content, id) {
        return `<span data-type="block-ref" data-subtype="d" data-id="${id}" style="">${content}</span>`;
    }

    function toLink(content, url) {
        return `<span data-type="a" data-href="${url}" style="">${content}</span>`;
    }

    // formatStr默认'$1-$2-$3 $4:$5:$6' 分别代表年月日时分秒
    function formatDateTime(content, formatStr = '$1-$2-$3 $4:$5:$6') {
        return content.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/, formatStr);
    }

    // formatStr默认'$1-$2-$3' 分别代表年月日
    function formatDate(content, formatStr = '$1-$2-$3') {
        return formatDateTime(content, formatStr);
    }

    /////// 核心代码 /////////////////////

    // 渲染html
    function render(result, fields, onRender, afterRender) {
        whenElementExist(()=>item.querySelector('.b3-form__space--small')).then((spaceSmall) => {
            let html = getInfo('未匹配到任何内容');
            if(typeof result === 'string') {
                html = getError(result);
            } else {
                html = `<div class="protyle-wysiwyg__embed" data-id="">${generateTable(result, fields, onRender)}</div>`;
            }
            spaceSmall.outerHTML = html;
            if(afterRender) afterRender();
        });
        return [];
    }

    function generateTable(data, fields, onRender) {
        if(!data || data.length === 0) {
            return getInfo('未匹配到任何内容');
        }
        // 格式化数据
        const options = {evenOddColor: false, tableBorder: true};
        let styles = [];
        for (const [index, row] of data.entries()) {
            if(typeof onRender === 'function') {
                onRender(row, {...getCallbackFuncs(), ...{index, data, options}});
            }
            for(const field in row){
                if(row[field+'_style']) {
                    if(!styles[index]) styles[index] = {};
                    styles[index][field+'_style'] = row[field+'_style'] || '';
                    delete row[field+'_style'];
                }
            }
        }
        if(fields && fields.length > 0) {
            data = filterData(data, fields);
        }
        const rowNum = data.length;
        const colNum = Object.keys(data[0]).length;
        let header = ``;
        for(const key in data[0]){
            header += `<div class="header">${key}</div>`;
        }
        let body = ``;
        for(const [index, row] of data.entries()){
            for(const field in row){
                body += `<div style="${styles[index]?(styles[index][field+'_style']||''):''}">${row[field]}</div>`;
            }
        }
        return `${getStyle(rowNum, colNum, options)}
        <div class="protyle-wysiwyg__embed__grid-table grid-table${item.dataset.nodeId}">
            ${header}
            ${body}
        </div>`;
    }

    function getStyle(rowNum, colNum, options = {}) {
        rowNum++;  // +1 加上表格头的一行
        const id = item.dataset.nodeId;
        let lastColStyle = [];
        for(let i=colNum;i<=rowNum*colNum;i=i+colNum){
            lastColStyle.push(`.grid-table${id} > div:nth-child(${i})`);
        }
        let lastRowStyle = [];
        for(let i=rowNum*colNum-(colNum-1);i<=rowNum*colNum;i++){
            lastRowStyle.push(`.grid-table${id} > div:nth-child(${i})`);
        }
        // 计算奇偶颜色
        const evenSelectors = generateSelectors(colNum);
        return `<style>
            .protyle-wysiwyg [data-node-id].render-node[data-type=NodeBlockQueryEmbed][data-node-id="${id}"] {
                margin: 0;
                padding: 0;
                border: 0;
                background-color: transparent;
            }
            .protyle-wysiwyg [data-node-id].render-node[data-type=NodeBlockQueryEmbed][data-node-id="${id}"] > .protyle-wysiwyg__embed {
                border: 0;
                cursor: default;
                overflow: auto;
            }
            .grid-table${id} {
                display: grid;
                grid-template-columns: repeat(${colNum}, 1fr);
                grid-auto-rows: minmax(30px, auto);
                border-collapse: collapse;
                width: 100%;
                cursor: text;
            }
            .grid-table${id} > div {
                ${options.tableBorder?`border: 1px solid var(--b3-theme-surface-lighter)`:''};
                border-right: 0;
                border-bottom: 0;
                padding: 5px;
                text-align: center;
            }
            ${lastColStyle.join(',')} {
                ${options.tableBorder?`border-right: 1px solid var(--b3-theme-surface-lighter);`:''};
            }
            ${lastRowStyle.join(',')} {
                ${options.tableBorder?`border-bottom: 1px solid var(--b3-theme-surface-lighter);`:''};
            }
            .grid-table${id} > .header {
                font-weight: bold;
            }
            ${options.evenOddColor ? `
                .protyle-wysiwyg__embed__grid-table.grid-table${id} {
                    ${evenSelectors.even} {
                        background-color: transparent; /* 偶数行的背景颜色 */
                    }
                    ${evenSelectors.odd} {
                        background-color: var(--b3-table-even-background); /* 奇数行的背景颜色 */
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
        return `<span style="${getInfoStyle()};color:red;">${message}</span>`;
    }

    function getInfo(message) {
        return `<span style="${getInfoStyle()}">${message}</span>`;
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

    // 通过SQL查询数据
    async function query(sql) {
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
})();