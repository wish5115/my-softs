//!js
// 功能：批量导入文档到数据库-笔记本版
// 【注意】思源默认最大查询返回结果限制为64条记录，如果您的子文档数大于64，需在设置->搜索->搜索结果显示数里修改限制
// version 0.0.6.2
// 更新记录：
// 0.0.6 增加导出模板；增加手动执行时，未设置文档块ID和数据库块ID时，弹出输入对话框；增加导入数据库前的预览和确认功能。
// 0.0.6.1 修复按目录树文档排序的bug
// 0.0.6.2 修复意外死循环导致内核崩溃的bug
return (async ()=>{

    /////////////// --- 配置区 --- /////////////////

    // 定义父文档块id，可选，根据自己的父文档块id进行修改
    let docBlockId = '';

    //（1） 定义数据库块id，必填，根据自己的数据库块id进行修改
    let dbBlockId = '';

    //（2） 笔记id
    const box = '';

    // 设置最大嵌套层级，默认7级，这个是从笔记下的一级目录开始算1级
    let maxLevel = 7;

    //获取所有子文档的sql查询语句
    const docsSql = (docBlockId, maxLevel, extendSql) => `
        select *
        from blocks
        where type = 'd'
        and box = '${box}'
        -- 查询所有子文档
        -- and path like '%${docBlockId}%'
        -- 不包含父文档自身
        -- and id != '${docBlockId}'
        -- 动态扩展SQL的变量
        -- ${extendSql}
        -- 查询文档层级限制最大多少级
        and (LENGTH(path) - LENGTH(REPLACE(path, '/', ''))) / LENGTH('/') <= ${maxLevel}
        order by sort asc, created desc;
    `;

    // 定义脚本简短名称，可以针对不同的模板设置不同的名称，会显示在脚本的最前面
    const shortName = "[批量导入文档到数据库0.0.6版]";

    // 定义备注，可以针对不同的模板设置不同的备注，在未执行是显示的文本说明，runOnLoad 为false时，有效
    const memo = "点击右侧刷新按钮开始执行";

    // 加载时是否执行，默认false，加载时不执行，true为加载时执行
    const runOnLoad = false;

    // 是否显示确认对话框，默认true显示，false不显示
    const showConfirm = true;

    // 排序方式, 默认为true，按文档树顺序排序后插入，false 按SQL搜索结果插入
    const sortByTreeOrder = true;

    // 当未配置docBlockId和dbBlockId时，是否弹窗提示输入框，true显示，false不显示
    const isShowInputBox = false;

    // 文档块和数据库输入对话框，是否记住上次的输入，默认true，false则不记住
    const isRememberLastInput = true;

    // 模板导出路径，默认是模板根目录
    const templatesPath = "/data/templates";

    /////////////// --- 主逻辑区 --- //////////////////

    // 定义全局变量
    let total = 0,
    extendSql = '',
    lastDialogClass = '',
    lastDialogHtml = '',
    isLoading = checkLoading();

    // 防止意外死循环
    if(window.doc2dbImporterRuning) return error(`操作太过频繁，请稍后重试`);
    window.doc2dbImporterRuning = true;
    // 这里保证3秒钟内只会被执行一次，可根据您脚本具体执行时间进行调整（这种调整通常可停止某些原因导致的死循环）
    setTimeout('window.doc2dbImporterRuning = false', 3000);

    // 参数判断
    if(runOnLoad && isLoading && (!box || !dbBlockId)) return error("请输入正确的笔记id和数据库块id");
    //if(runOnLoad && isLoading && (!docBlockId || !dbBlockId)) return error("请输入正确的块id和数据库块id");

    // 初始化数据
    await init();

    // 智能显示输入框
    if(!await showInputBox()){
        return render("用户取消了导入");
    }

    // 检查参数
    if(!isShowInputBox && !dbBlockId) {
        return error("请先设置数据库文档块id");
    }

    // 判断是否加载
    if(!runOnLoad && isLoading) return render(`<span>${memo}</span>${help()}`);

    // 执行SQL并格式化数据
    const docs = await getDataBySql(docsSql(docBlockId, maxLevel, extendSql));
    let docIds = docs.map(i => i.id);
    total = docIds.length;
    if(total === 0) return error("未找到父文档块数据");
    const docsMap = {};
    docs.forEach(doc => {
        docsMap[doc.id] = doc.content;
    });

    //读取数据库json
    const db = await getDataBySql(`SELECT * FROM blocks where type ='av' and id='${dbBlockId}'`);
    if(db.length === 0) return error("未找到数据库文档块，请检查数据库文档块id是否正确");
    const avId = db.map(av => getDataAvIdFromHtml(av.markdown))[0];
    //const dbData = await getFile(`/data/storage/av/${avId}.json`)
    const dbData = await getDbData(avId);

    // 按文档树顺序排序
    //if(sortByTreeOrder && docBlockId) {
    if(sortByTreeOrder && box) {
        //let parentBlockData = await getDataBySql(`select * from blocks where id = '${docBlockId}' and type='d'`);
        //if(parentBlockData.length === 0) return error(`获取父文档数据失败，请检查父文档块id是否正确`);
        //parentBlockData = parentBlockData[0];
        const sortIds = [];
        const getSubLists = async (path) => {
            const levelCount = path.split('/').length - 1;
            if(levelCount > maxLevel) return;
            const subList = await fetchSyncPost('/api/filetree/listDocsByPath', {
                "notebook": box,
                "path": path
            });
            if(subList.code !== 0) console.log('获取'+path+'子文档排序数据失败');
            if(subList.code === 0){
                if(subList.data.files.length === 0) return;
                for(const sub of subList.data.files) {
                    sortIds.push(sub.id);
                    await getSubLists(sub.path);
                }
            }
        };
        //await getSubLists(parentBlockData.path);
        //if(isHasParentDoc()) sortIds.unshift(docBlockId);
        await getSubLists('/');
        docIds = sortDocIdsBySortIds(docIds, sortIds);
    }

    //提示用户确认
    if(!isLoading && showConfirm){
        const listItems = docIds.map(docId=>`<div class="b3-dialog__sql-js__preview"><span data-type="block-ref" data-id="${docId}" data-subtype="d">${docsMap[docId]||"未命名"}</span></div>`).join('');
        const ret = await showDialog(`
            <div>以下${total}个文档即将导入到${dbData.name||''}数据库，是否继续？</div>
            <div>
                ${listItems}
            </div>
        `, {okBtn:"继续", width: "500px"});
        if (!ret) {
            return render("用户取消了导入");
        }
    }

    // 组装文档数据参数
    const srcs = docIds.map(docId => ({
        "id": docId,
        "isDetached": false,
    }));

    // 获取当前时间
    const nowTime = formatDate(new Date());

    // 插入文档数据到数据库
    // see https://github.com/siyuan-note/siyuan/blob/b244f8aed18e7a41d4b27889d870442154ba1462/app/src/protyle/util/editorCommonEvent.ts#L1043
    const result = await fetchSyncPost('/api/transactions', {
        "session": protyle.id || siyuan.ws.app.appId,
        "app": siyuan.ws.app.appId,
        "transactions": [
            {
                "doOperations": [
                    {
                        "action": "insertAttrViewBlock",
                        "avID": avId,
                        "previousID": "",
                        "srcs": srcs,
                        "blockID": dbBlockId
                    },
                    {
                        "action": "doUpdateUpdated",
                        "id": dbBlockId,
                        "data": nowTime
                    }
                ],
                "undoOperations": [
                    {
                        "action": "removeAttrViewBlock",
                        "srcIDs": docIds,
                        "avID": avId
                    },
                    {
                        "action": "doUpdateUpdated",
                        "id": dbBlockId,
                        "data": nowTime
                    }
                ]
            }
        ],
        "reqId": new Date().getTime()
    });

    // 错误返回
    if(result.code !== 0) {
        return error(`导入失败，错误信息：${result.msg}`);
    }

    //成功返回结果
    return render(`已导入完毕！共计导入 ${total} 个文档或块。`);

    ////////////// --- 功能函数区 --- ////////////////////////

    // sql中是否包含父文档
    function isHasParentDoc() {
        const sql = docsSql(docBlockId, maxLevel, extendSql);
        // 不是 -- 或 /* 开头的父文档的sql
        if(new RegExp(`(?<!(--|/\\*)\\s*)and\\s+id\\s*(!=|<>)\\s*'${docBlockId}'`, 'i').test(sql)){
            return false;
        }
        return true;
    }

    // 初始化功能按钮和弹窗等
    async function init() {
        //// 添加导出按钮 ////
        const icons =  await whenElementExist(()=>item.querySelector('.protyle-icons'));
        // 查找最后一个图标元素（即.protyle-icon--last）
        const lastIconElement = icons.querySelector('.protyle-icon--last');
        // 创建一个新的span元素
        const save = document.createElement('span');
        save.setAttribute('aria-label', '导出为模板');
        save.classList.add('b3-tooltips__nw', 'b3-tooltips', 'protyle-icon', 'protyle-action__save-to-tpl');
        save.innerHTML='<svg><use xlink:href="#iconUpload"></use></svg>';
        save.onclick = async function () {
            const html = `
            <label>请输入模板名</label>
            <input type="text" placeholder="不能包含这些字符&lt;&gt;:&quot;/\|?*" />
            `;
            const onSubmit = async (dialog, close) => {
                const input = dialog.querySelector("input[type=text]")?.value || "";
                if(!input) {
                    alert("模板名不能为空");
                    focusInput(dialog);
                    return false;
                }
                if(!/^[^<>:"\\\/|?*]*$/.test(input)){
                    alert("模板名不能包含以下字符：< > : \" / \\ | ? *");
                    focusInput(dialog);
                    return false;
                }
                const tplFile = `${templatesPath.replace(/\/+$/, '')}/${input.replace(/\.md/i, '')}.md`;
                if(await isFileExist(tplFile)) {
                    alert("模板已存在，请重新输入");
                    focusInput(dialog);
                    return false;
                }
                return input;
            };
            const focusInput = (dialog) => {
                setTimeout(() => {
                    dialog.querySelector("input[type=text]")?.focus();
                }, 100);
            };
            const onOpen = (dialog) => {
                focusInput(dialog);
            };

            // 获取用户输入
            const tplName = await showDialog(html, {title:""}, onOpen, onSubmit);
            if(!tplName) return;
            // 获取模板数据
            const tplData = await getDataBySql(`select markdown from blocks where id = '${item.dataset.nodeId}'`);
            if(!tplData || !tplData[0] || !tplData[0].markdown) {
                alert("导出模板失败，未获取到模板数据");
                return;
            }
            // 写入模板
            const tplFile = `${templatesPath.replace(/\/+$/, '')}/${tplName.replace(/\.md/i, '')}.md`;
            putFileContent(tplFile, tplData[0].markdown);
            // 发送通知
            showMessage(`模板导出成功<br />路径：${templatesPath.replace(/\/+$/, '')}`);
            if(isPc()) {
                const msgContent = await whenElementExist("#message .b3-snackbar__content");
                const br = document.createElement("br");
                const button = document.createElement("button");
                button.classList.add('b3-button', 'b3-button--white');
                button.textContent = '打开文件位置';
                button.onclick = async () => {
                    const file = require('path').join(siyuan.config.system.workspaceDir, tplFile);
                    require('electron').ipcRenderer.send("siyuan-open-folder", file);
                };
                msgContent.appendChild(br);
                msgContent.appendChild(button);
            }
        };
        // 将新span元素插入到.protyle-icon--last之前
        lastIconElement.before(save);

        //// 添加弹出框 ////
        initDialog();
    }

    // 显示用户输入对话框
    async function showInputBox() {
        // 如果未设置参数，弹出弹窗提示输入
        if(isShowInputBox && !isLoading && (!docBlockId || !dbBlockId)) {
            await whenElementExist(".b3-dialog__sql-js");
            const input  = await showDialog(`
                <label>请输入父文档块ID</label>
                <input class="docBlockId" type="text" value="${docBlockId}" placeholder="在父文档块菜单中复制ID即可" />
                <sapn class="b3-dialog__sql-js__view" data-type="block-ref" data-id="${docBlockId}" data-subtype="d">预览</sapn>
                <label>请输入数据库块ID</label>
                <input class="dbBlockId" type="text" value="${dbBlockId}" placeholder="在数据库块菜单中复制ID即可" />
                <sapn class="b3-dialog__sql-js__view" data-type="block-ref" data-id="${dbBlockId}" data-subtype="d">预览</sapn>
                <label><input type="checkbox" checked> 包含子目录</label>
                <label>设置最大嵌套层级 <sup title="默认7级，这个是从笔记下的一级目录开始算1级"><strong>?</strong></sup></label>
                <input class="maxLevel" type="text" value="${maxLevel||7}" placeholder="默认7级，这个是从笔记下的一级目录开始算1级" />
            `, {title: ""},
            // 打开回调
            async (dialog)=> {
                // 获取上次保存的数据
                const store = await fetchSyncPost('/api/storage/getLocalStorage');
                //// 处理输入框 ////
                dialog.querySelectorAll("input[type=text]").forEach(async input => {
                    // 填入上次保存的数据
                    if(isRememberLastInput && store.code === 0) {
                        if(input.classList.contains("docBlockId")) {
                            if('docBlockId' in store.data) {
                                input.value = store.data.docBlockId;
                                dialog.querySelector(`.docBlockId`).dataset.id = store.data.docBlockId;
                            }
                        } else if(input.classList.contains("dbBlockId")){
                            if('dbBlockId' in store.data) {
                                input.value = store.data.dbBlockId;
                                dialog.querySelector(`.dbBlockId`).dataset.id = store.data.dbBlockId;
                            }
                        } else {
                            if('maxLevel' in store.data) {
                                input.value = store.data.maxLevel;
                            }
                        }
                    }
                    // 监听输入变化
                    let inputTimer;
                    const onChange = () => {
                        inputTimer = setTimeout(() => {
                            if(inputTimer) clearTimeout(inputTimer);
                            const span = input.nextElementSibling;
                            if(input.value) {
                                span.style.display = "inline-block";
                                span.dataset.id = input.value;
                                input.style.width = `calc(100% - 16px - 8px - ${span.offsetWidth}px - 6px)`;
                            } else {
                                span.style.display = "none";
                                span.dataset.id = "";
                                input.style.width = `calc(100% - 16px`;
                            }
                        }, 100);
                    };
                    if(!input.classList.contains("maxLevel")){
                        onChange();
                        input.removeEventListener('input', onChange);
                        input.addEventListener('input', onChange);
                    }
                });

                //// 处理checkbox ////
                if(isRememberLastInput && store.code === 0 && 'hasSubDocs' in store.data && store.data.hasSubDocs === false) {
                    dialog.querySelector("input[type=checkbox]").checked = false;
                }

                //设置提示
                dialog.querySelector("label sup").onclick = () => {
                    alert("默认7级，这个是从笔记下的一级目录开始算1级");
                };

                // 设置文本框聚焦
                setTimeout(() => {
                    dialog.querySelector("input[type=text]")?.focus();
                }, 100)
            },
            // 提交回调
            async (dialog) => {
                // 获取数据
                const input = dialog.querySelectorAll("input[type=text]");
                const hasSubDocs = dialog.querySelector("input[type=checkbox]").checked;
                const inputValues = {
                    docBlockId: input[0].value,
                    dbBlockId: input[1].value,
                    maxLevel: parseInt(input[2].value)||1,
                    hasSubDocs: hasSubDocs,
                };

                // 保存数据
                await fetchSyncPost('/api/storage/setLocalStorage', {app:siyuan.ws.app.appId, val: inputValues});
                return inputValues;
            },
            // 取消回调
            async (dialog) => {
                // 获取数据
                const input = dialog.querySelectorAll("input[type=text]");
                const hasSubDocs = dialog.querySelector("input[type=checkbox]").checked;
                const inputValues = {
                    docBlockId: input[0].value,
                    dbBlockId: input[1].value,
                    maxLevel: parseInt(input[2].value)||1,
                    hasSubDocs: hasSubDocs,
                };
                // 保存数据
                await fetchSyncPost('/api/storage/setLocalStorage', {app:siyuan.ws.app.appId, val: inputValues});
                return false;
            });
            if(!input) {
                return false;
            }
            docBlockId = input.docBlockId;
            dbBlockId = input.dbBlockId;
            maxLevel = parseInt(input.maxLevel)||1;
            if(input.hasSubDocs === false) {
                extendSql = `and id = '${docBlockId}'`;
            }
        }
        return true;
    }

    // 显示弹窗
    function showDialog(html, options, onOpen, onSubmit, onCancel) {
        return new Promise((resolve, reject) => {
            try {
                options = options || {};
                let dialog = document.querySelector(".b3-dialog__sql-js");
                window.siyuan.zIndex++;
                dialog.style.zIndex = window.siyuan.zIndex;
                dialog.querySelector(el(".title")).innerHTML = options.title || '';
                if(lastDialogHtml !== html) {
                    dialog.querySelector(el(".content")).innerHTML = html || '';
                    lastDialogHtml = html || '';
                }
                if(options.class !== lastDialogClass) {
                    if(lastDialogClass) dialog.classList.remove(lastDialogClass);
                    if(options.class) dialog.classList.add(options.class);
                    lastDialogClass = options.class || '';
                }
                dialog.querySelector(el(".confirm")).innerHTML = options.okBtn || "确定";
                dialog.querySelector(el(".cancel")).innerHTML = options.cancelBtn || "取消";
                dialog.style.width = options.with || "400px";
                dialog.style.height = options.height || "auto";
                dialog.classList.add(el('active', true));
                if(typeof onOpen === 'function') onOpen(dialog);
                dialog.querySelector(el(".confirm")).removeEventListener('click', confirmAction);
                dialog.querySelector(el(".confirm")).addEventListener('click', confirmAction);
                dialog.querySelector(el(".cancel")).removeEventListener('click', cancelAction);
                dialog.querySelector(el(".cancel")).addEventListener('click', cancelAction);
                moveableDialog(dialog, dialog.querySelector(el(".title")));
                function el(selector, force = false) {
                    const classPrefix = "b3-dialog__sql-js__";
                    selector = selector.replace("#", "#"+classPrefix);
                    selector = selector.replace(".", "."+classPrefix);
                    return force ? classPrefix + selector : selector;
                }
                function close() {
                    dialog.classList.remove(el('active', true));
                }
                async function confirmAction() {
                    if(typeof onSubmit === 'function'){
                        const result = await onSubmit(dialog);
                        if(result) {
                            close();
                            resolve(result);
                            clearUp();
                        }
                    } else {
                        close();
                        resolve(true);
                        clearUp();
                    }
                }
                async function cancelAction() {
                    if(typeof onCancel === 'function'){
                        const result = await onCancel(dialog)
                        close();
                        resolve(result);
                        clearUp();
                    } else {
                        close();
                        resolve(false);
                    }
                }
                function clearUp() {
                    newDialog();
                    lastDialogClass = '';
                    lastDialogHtml = '';
                }
            } catch(e) {
                reject(e);
            }
        });
    }

    // 使弹窗可移动
    function moveableDialog(dialog, dragEl) {
        let isDragging = false;
        let offsetX, offsetY;
        const dragHandler = (e) => {
            if (e.type === 'mousedown') {
                isDragging = true;
                document.removeEventListener('mousemove', dragHandler);
                document.removeEventListener('mouseup', dragHandler);
                document.addEventListener('mousemove', dragHandler);
                document.addEventListener('mouseup', dragHandler);
                offsetX = e.clientX - dialog.offsetLeft;
                offsetY = e.clientY - dialog.offsetTop;
            } else if (e.type === 'mousemove' && isDragging) {
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                dialog.style.left = x + 'px';
                dialog.style.top = y + 'px';
            } else if (e.type === 'mouseup') {
                isDragging = false;
                document.removeEventListener('mousemove', dragHandler);
                document.removeEventListener('mouseup', dragHandler);
            }
            e.preventDefault();
        };
        dragEl.removeEventListener('mousedown', dragHandler);
        dragEl.addEventListener('mousedown', dragHandler);
    }

    function initDialog() {
        // 注入css样式，样式可在这里或css片段中进行修
        if(!document.querySelector("#sqlJSDialogStyle")){
            const style = document.createElement('style');
            style.id = "sqlJSDialogStyle";
            style.textContent = `
                .b3-dialog__sql-js {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: white;
                    padding: 15px;
                    border: 1px solid var(--b3-theme-surface-lighter);
                    border-radius: var(--b3-border-radius-b);
                    box-shadow: var(--b3-dialog-shadow);
                    z-index: 1000;
                    width: 400px;
                    padding-top: 0px;
                    padding-bottom: 57px;
                    font-family: var(--b3-font-family);
                    color: var(--b3-theme-on-background);
                    background-color: var(--b3-theme-surface);
                }
                .b3-dialog__sql-js.b3-dialog__sql-js__active {
                    display: block;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__title {
                    text-align: center;
                    padding-top: 15px;
                    padding-bottom: 10px;
                    -webkit-app-region: no-drag;
                    cursor: default;
                    user-select: none;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__actions {
                    display: flex;
                    justify-content: flex-end;
                    position: absolute;
                    bottom: 15px;
                    right: 15px;
                }
                .b3-dialog__sql-js label {
                    margin-bottom: 10px;
                    display: block;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__actions button {
                    margin-left: 10px;
                    line-height: 20px;
                    padding: 4px 12px;
                    color: var(--b3-theme-primary);
                    box-shadow: inset 0 0 0 .6px var(--b3-theme-primary);
                    background-color: rgba(0, 0, 0, 0);
                    transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
                    border: 0;
                    border-radius: var(--b3-border-radius);
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__actions button:hover {
                    background-color: var(--b3-theme-primary-lightest);
                    box-shadow: inset 0 0 0 1px var(--b3-theme-primary);
                    text-decoration: none;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__actions button:first-child {
                    margin-left: 0;
                }
                .b3-dialog__sql-js input[type="text"] {
                    width: calc(100% - 16px); /* 输入框占满容器宽度 */
                    padding: 4px 8px;
                    line-height: 20px;
                    margin-bottom: 10px;
                    color: var(--b3-theme-on-background);
                    transition: box-shadow 120ms 0ms cubic-bezier(0, 0, 0.2, 1);
                    background-color: var(--b3-theme-background);
                    border: 0;
                    border-radius: var(--b3-border-radius);
                    box-shadow: inset 0 0 0 .6px var(--b3-theme-on-surface);
                }
                .b3-dialog__sql-js input[type="text"]:hover{
                    box-shadow: inset 0 0 0 .6px var(--b3-theme-on-background);
                }
                .b3-dialog__sql-js input[type="text"]:focus{
                    box-shadow: inset 0 0 0 1px var(--b3-theme-primary), 0 0 0 3px var(--b3-theme-primary-lightest);
                }
                .b3-dialog__sql-js input[type="text"]:last-child {
                    margin-bottom: 0;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__content{
                    max-height: 500px;
                    overflow-y: auto;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__preview{
                    color: var(--b3-protyle-inline-blockref-color);
                    opacity: .86;
                    cursor: pointer;
                    line-height: 1.6;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__preview:hover{
                    opacity: 1;
                }
                .b3-dialog__sql-js sapn.b3-dialog__sql-js__view {
                    margin-left: 8px;
                    font-size: 14px;
                    color: var(--b3-protyle-inline-blockref-color);
                    opacity: .86;
                    cursor: pointer;
                    position: relative;
                    top: -2px;
                    display: none;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__view:hover{
                    opacity: 1;
                }
                .b3-dialog__sql-js input[type="checkbox"] {
                    position: relative;
                    top: -2.5px;
                    width: 15px;
                    height: 15px;
                }
                .b3-dialog__sql-js .b3-dialog__sql-js__content label sup {
                    cursor: pointer;
                }
            `
            document.head.appendChild(style);
        }
        // 注入HTML
        newDialog();
    }

    // 添加新弹窗
    function newDialog() {
        if(document.querySelector(".b3-dialog__sql-js")){
            document.querySelector(".b3-dialog__sql-js").remove();
        }
        const dialog = document.createElement('div');
        dialog.className = 'b3-dialog__sql-js';
        dialog.innerHTML = `
            <div class="b3-dialog__sql-js__title"></div>
            <div class="b3-dialog__sql-js__content"></div>
            <div class="b3-dialog__sql-js__actions">
                <button class="b3-dialog__sql-js__cancel">取消</button>
                <button class="b3-dialog__sql-js__confirm">确定</button>
            </div>
        `;
        document.body.appendChild(dialog);
        return dialog;
    }

    // 判断是否正在加载
    function checkLoading() {
        const activeDoc = document.querySelector('div[data-type=wnd].layout__wnd--active .protyle:not(.fn__none)');
        if(activeDoc && activeDoc.dataset.loading === 'finished'){
            return false;
        }
        return true;
    }

    // 渲染html
    async function render(html) {
        whenElementExist(()=>item.querySelector('.b3-form__space--small')).then((spaceSmall) => {
            spaceSmall.style='color: var(--b3-card-info-color);';
            spaceSmall.innerHTML = `${shortName} ` + html;
        });
        return [];
    }

    // 返回错误信息
    function error(message){
        return render(`<span style="font-weight:bold;color:red;">${message}</span>${help()}`);
    }

    // 使用帮助
    function help() {
        return '<a style="margin-left:10px;" href="https://ld246.com/article/1725515886241">使用帮助</a>';
    }

    // 读取文件
    async function getFile(storagePath) {
        if(!storagePath) return {};
        const data = await fetchSyncPost('/api/file/getFile', {"path":`${storagePath}`});
        if(data.code && data.code !== 0) return {};
        return data;
    }

    // 判断文件是否存在
    async function isFileExist(storagePath) {
        if(!storagePath) return false;
        const data = await fetchSyncPost('/api/file/getFile', {"path":`${storagePath}`});
        if(data.code && data.code === 404) return false;
        return true;
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

    // 获取查询结果
    async function getDataBySql(sql) {
        const result = await fetchSyncPost('/api/query/sql', {"stmt": sql});
        if(result.code !== 0){
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }

    // 获取数据库数据
    async function getDbData(avId){
        const result = await fetchSyncPost('/api/av/renderAttributeView', {
            "id": avId,
            "viewID": "",
            "query": ""
        });
        if(result.code !== 0){
            console.error("获取数据库数据失败", result.msg);
            return {};
        }
        return result.data;
    }

    // 请求api
    // returnType json返回json格式，text返回文本格式
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

    // 写入文件内容
    async function putFileContent(path, content) {
        const formData = new FormData();
        formData.append("path", path);
        formData.append("file", new Blob([content]));
        return fetch("/api/file/putFile", {
            method: "POST",
            body: formData,
        }).then((response) => {
            if (response.ok) {
                //console.log("File saved successfully");
            } else {
                throw new Error("Failed to save file");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    // 显示通知
    function showMessage(message, delay) {
        fetchSyncPost("/api/notification/pushMsg", {
          "msg": message,
          "timeout": delay || 7000
        });
    }

    // 获取平台 返回 "windows" | "linux" | "darwin" | "docker" | "android" | "ios"
    function getPlatform() {
        if (["docker", "ios", "android"].includes(window.siyuan.config.system.container)) {
            return window.siyuan.config.system.container;
        } else {
            return window.siyuan.config.system.os;
        }
    }

    // 判断是否电脑版
    function isPc() {
        return getPlatform() === "windows" || getPlatform() === "darwin" || getPlatform() === "linux";
    }

    // sleep
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    // 格式化日期实现dayjs().format("YYYYMMDDHHmmss")相同功能
    // date 是 Date 对象
    function formatDate(date) {
        var yy = date.getFullYear().toString();
        var mm = (date.getMonth()+1).toString(); // 注意月份是从0开始的
        var dd = date.getDate().toString();
        var hh = date.getHours().toString();
        var ii = date.getMinutes().toString();
        var ss = date.getSeconds().toString();
        return yy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]) +
               (hh[1] ? hh : '0' + hh[0]) + (ii[1] ? ii : '0' + ii[0]) +
               (ss[1] ? ss : '0' + ss[0]);
    }

    // 把docIds按sortIds进行排序
    function sortDocIdsBySortIds(docIds, sortIds) {
        // 创建一个映射，用于存储每个元素的位置索引
        let indexMap = sortIds.reduce((acc, curr, idx) => {
            acc[curr] = idx; // 注意这里curr是字符串形式的数字
            return acc;
        }, {});

        // 使用映射来排序 docIds
        let sortedDocIds = docIds.sort((a, b) => {
            return indexMap[a] - indexMap[b]; // 比较两个字符串对应的索引
        });
        return sortedDocIds;
    }
})();