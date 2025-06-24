// 自动添加指定文档下的子文档任务到数据库
(async ()=>{
    // 配置数据库所在块id
    const avBlockId = '20250614104613-0qa055i';

    // 配置数据库所在文档id
    const avDocId = '20250613063011-x7t4zyq';

    // 数据库id，注意这里是数据库id，不是数据库所在块id
    // 当为空时则自动获取
    let avId = '';

    // 文档编辑后添加任务延迟，单位秒，默认30秒
    const timeout = 5;

    // 不更新已在数据库中的任务 true 不更新 false 更新
    const notUpdateHasInAvBlocks = true;

    // 给选中块添加自定义属性，可以按key:value形式添加多组
    // 注意，自定义属性需要添加custom-前缀
    const customAttrs = {
        "custom-st-event": "今天"
    };
    
    // 其他扩展字段（需要时把注释打开后配置即可）
    // getColValue回调函数可动态计算字段值返回
    const otherCols = [
        {
            colName: '状态',
            // 对于绑定块，块/文档id === rowID
            getColValue: (keyID, rowID, cellID, avID) => {
                return {"mSelect": [{"content":"今天"}]};
            },
        }
    ];

    if(!avBlockId || !avDocId) {
        showMessage('请先配置数据库块id和数据库所在文档id', true);
        return;
    }

     // 获取数据库id
     if(!avId) avId = await getAvIdByAvBlockId(avBlockId);
    
    //main 定时添加任务到数据库
    async function main() {
        const ids = new Set();
        let postTimer, storeTimer, trace={errs: []};
        // 监听块被更新
        window.siyuan.ws.ws.addEventListener('message', async (e) => {
            const msg = JSON.parse(e.data);
            if(msg.cmd === "transactions") {
                const block = msg?.data
                    ?.flatMap(item => item?.doOperations || [])
                    ?.find(it => it?.action === 'update');
                // 判断是否正常块
                if(!hasKeys(block, ['nextID', 'data', 'id', 'avID', 'blockID', 'isDetached'])) return;
                const blockInfo = (await fetchSyncPost('/api/block/getBlockInfo', {id:block?.id}))?.data;
                if(!blockInfo || !blockInfo.path || !blockInfo.path.includes('/'+avDocId) || blockInfo.rootID === avDocId) return;
                ids.add(blockInfo.rootID);
                // 定时发布
                if(postTimer) clearTimeout(postTimer);
                postTimer = setTimeout(async ()=>{
                    for (const id of ids) {
                        await addTasksToAv(id, trace);
                    }
                    ids.clear();
                    setStorageVal('add_task_ids', [...ids]);
                    if(trace.errs.length > 0){
                        showMessage(trace.errs.join("<br>"));
                    }
                }, 1000 * timeout);
                // 定时保存
                if(storeTimer) clearTimeout(storeTimer);
                storeTimer = setTimeout(async ()=>{
                    setStorageVal('add_task_ids', [...ids]);
                }, 1000);
            }
        });
        
        // 加载时检查是否有未同步的更新
        const lastIds = await getStorageVal('add_task_ids');
        setStorageVal('add_task_ids', []);
        setTimeout(async ()=>{
            for(const id of lastIds) {
                await addTasksToAv(id, trace);
            }
            if(trace.errs.length > 0){
                showMessage(trace.errs.join("<br>"));
            }
        }, 2000);
    }
    main();

    // 添加任务到数据库
    async function addTasksToAv(docId, trace) {
        // 获取所有主任务
        const tasks = await querySql(`
            SELECT * FROM blocks b1
            WHERE root_id = '${docId}'
              AND type = 'i'
              AND subtype = 't'
              -- 不更新已在数据库中的任务
              ${notUpdateHasInAvBlocks?`AND ial not like '%custom-avs="${avId}"%'`:''}
              AND EXISTS (
                -- 查找当前记录的父记录
                SELECT 1 FROM blocks b2
                WHERE b2.id = b1.parent_id
                  AND EXISTS (
                    -- 查找父记录的父记录（即祖父记录）
                    SELECT 1 FROM blocks b3
                    WHERE b3.id = b2.parent_id
                      AND b3.subtype != 't'
                  )
              );
      `);

        if(tasks.length === 0) return;

        // 获取块ids
        const blockIds = tasks.map(block => block.id);
        // 获取块父ids
        const parentIds = tasks.map(block => block.parent_id);
        
        // 绑定块（要用await等待插入完成，否则后面的读取操作可能读不到数据）
        await addBlocksToAv(blockIds, avId, avBlockId);
        // 添加数据库其他属性
        if(otherCols && otherCols.length > 0) {
            // 通过字段名获取keyID
            const keys = await fetchSyncPost("/api/av/getAttributeViewKeysByAvID", {avID:avId});
            otherCols.forEach(col => {
                if(!col.colName) return;
                const keyID = keys?.data?.find(item=>item.name === col.colName.trim())?.id;
                if(!keyID) return;
                col.keyID = keyID;
            });
            // 添加属性到数据库
            await addColsToAv(blockIds, otherCols, avId);
        }
        // 给选中块添加自定义属性
        await setBlocksAttrs([...blockIds, ...parentIds], customAttrs);
    }

    async function getAvViews(avId) {
        const result = await fetchSyncPost('/api/av/getAttributeView', {id:avId});
        if(!result || result.code !== 0) console.error(result);
        return result.data;
    }

    async function addBlocksToAv(blockIds, avId, avBlockID) {
        blockIds = typeof blockIds === 'string' ? [blockIds] : blockIds;
        const srcs = blockIds.map(blockId => ({
            "id": blockId,
            "isDetached": false,
        }));
        const input = {
          "avID": avId,
          "blockID": avBlockID,
          'srcs': srcs
        }
        const result = await fetchSyncPost('/api/av/addAttributeViewBlocks', input);
        if(!result || result.code !== 0) console.error(result);
    }

    async function addColsToAv(blockIds, cols, avID) {
        blockIds = typeof blockIds === 'string' ? [blockIds] : blockIds;
        const views = await getAvViews(avID);
        for(const blockId of blockIds) {
            for(const col of cols) {
                try{
                    if(!col.keyID) continue;
                    const cellID = await getCellIdByRowIdAndKeyId(blockId, col.keyID, avID);
                    if(!cellID) continue;
                    let colData = {avID: avID, keyID: col.keyID, rowID: blockId, cellID};
                    if(typeof col.getColValue !== 'function') continue;
                    const colValue = await col.getColValue(col.keyID, blockId, cellID, avID);
                    if(typeof colValue !== 'object') continue;
                    const colKey = Object.keys(colValue)[0];
                    if(!colKey) continue;
                    // 判断值是否已存在，已存在不添加
                    const colAttrs = views.av.keyValues.find(item => item.key.name.includes(col.colName));
                    if(colAttrs) {
                        const colAttr = colAttrs.values?.find(item=>item.blockID === blockId);
                        if(colAttr && colAttr[colKey]) continue;
                    }
                    colData.value = colValue;
                    const result = await fetchSyncPost("/api/av/setAttributeViewBlockAttr", colData);
                    if(!result || result.code !== 0) console.error(result);
                } catch (e) {
                    console.log(e);
                    continue;
                }
            }
        }
    }

    async function getCellIdByRowIdAndKeyId(rowID, keyID, avID) {
        try {
            let res = await fetchSyncPost("/api/av/getAttributeViewKeys", {id: rowID });
            const foundItem = res.data.find(item => item.avID === avID); //avid
            if (foundItem && foundItem.keyValues) {
                // 步骤2：在 keyValues 中查找特定 key.id 的项
                const specificKey = foundItem.keyValues.find(kv => kv.key.id === keyID); // keyid
                // 步骤3：获取 values 数组的第一个元素的 id
                if (specificKey && specificKey.values && specificKey.values.length > 0) {
                    //console.log(specificKey.values[0].id)
                    return specificKey.values[0].id;
                }
            }
        } catch (e) {
            console.error(e);
            return '';
        }
    }

    // 给块添加自定义属性
    async function setBlocksAttrs(blockIds, attrs) {
        if(typeof attrs !== 'object') return;
        for(const blockId of blockIds) {
            if(!blockId) continue;
            // 不更新已存在的自定义属性
            const newAttrs = deepClone(attrs);
            const attrsData = await fetchSyncPost('/api/attr/getBlockAttrs', {"id": blockId});
            if(attrsData && attrsData.data) {
                const attrsKeys = Object.keys(newAttrs);
                attrsKeys.forEach(key => {
                    if(attrsData.data[key]) delete newAttrs[key];
                });
            }
            if(Object.keys(newAttrs).length === 0) continue;
            const result = await fetchSyncPost('/api/attr/setBlockAttrs', {
                "id": blockId,
                "attrs": newAttrs
            });
            if(!result || result.code !== 0) console.error(result);
        }
    }

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function hasKeys(obj, keys) {
      if (typeof obj !== 'object' || obj === null) {
        return false; // 非对象，肯定不满足
      }
      return keys.every(key => key in obj);
    }
    async function fetchSyncPost(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    // see https://github.com/siyuan-note/siyuan/blob/1317020c1791edf440da7f836d366567e03dd843/app/src/protyle/util/compatibility.ts#L409
    async function setStorageVal(key, val, cb) {
        if (window.siyuan.config.readonly) return;
        const result = await fetchSyncPost("/api/storage/setLocalStorageVal", {
            app: window.siyuan.ws.app.appId, key, val,
        });
        if(result && result.code === 0) {
            if (cb) cb();
            return result;
        }
    }
    // see https://github.com/siyuan-note/siyuan/blob/e47b8efc2f2611163beca9fad4ee5424001515ff/app/src/protyle/util/compatibility.ts#L258
    async function getStorageVal(key) {
        const result = await fetchSyncPost("/api/storage/getLocalStorage");
        if(result && result.code === 0 && result.data) {
            return result.data[key];
        }
    }
    async function putFile(path, content = '', isDir = false) {
        const formData = new FormData();
        formData.append("path", path);
        formData.append("isDir", isDir)
        formData.append("file", new Blob([content]));
        const result = await fetch("/api/file/putFile", { // 写入js到本地
            method: "POST",
            body: formData,
        });
        const json = await result.json();
        return json;
    }
    async function getFile(path, type = 'text') {
        return fetch("/api/file/getFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
        }).then((response) => {
            if (response.ok) {
                if(type==='json') return response.json();
                else if(type==='blob') return response.blob();
                else return response.text();
            } else {
                throw new Error("Failed to get file content");
            }
        }).catch((error) => {
            console.error(error);
        });
    }
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
    // 通过块id获取数据库id
    async function getAvIdByAvBlockId(blockId) {
        const av = await getAvBySql(`SELECT * FROM blocks where type ='av' and id='${blockId}'`);
        if(av.length === 0) return '';
        const avId = av.map(av => getDataAvIdFromHtml(av.markdown))[0];
        return avId || '';
    }
    // 从数据库HTML代码中获取数据库id
    function getDataAvIdFromHtml(htmlString) {
        // 使用正则表达式匹配data-av-id的值
        const match = htmlString.match(/data-av-id="([^"]+)"/);
        if (match && match[1]) {
        return match[1];  // 返回匹配的值
        }
        return "";  // 如果没有找到匹配项，则返回空
    }
    async function getAvBySql(sql) {
        const result = await fetchSyncPost('/api/query/sql', {"stmt": sql});
        if(result.code !== 0){
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
    async function querySql(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }
})();