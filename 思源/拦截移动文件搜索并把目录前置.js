// 功能拦截文档搜索并把目录前置
/*
算法如下：
1 获取sql查询所有path和子文档的映射，格式化成 {"<box>": {"<path>": <num>}} 格式
2 将api结果中的path和映射对比，如果path子文档数>0则是目录，前置
示例SQL如下：
SELECT
    SUM(CASE WHEN path LIKE '/JAVA基础%' THEN 1 ELSE 0 END) AS '/JAVA基础.sy',
    SUM(CASE WHEN path LIKE '/技术文章/js%' THEN 1 ELSE 0 END) AS '/技术文章/js.sy',
    box
FROM blocks
WHERE type = 'd'
  AND (path <> '/JAVA基础.sy' AND path <> '/技术文章/js.sy')
  AND (path LIKE '/JAVA基础%' OR path LIKE '/技术文章/js%')
GROUP BY box;
*/
(()=>{
    sortSearchDocs();
    function sortSearchDocs() {
        const originalFetch = window.fetch;
        window.fetch = async function (url, init) {
            // 真正发请求
            const response = await originalFetch(url, init);
    
            // 只处理目标接口
            if (url.toString().endsWith('/api/filetree/searchDocs')) {
                // 克隆一份 response，用来读 body
                const cloned = response.clone();
                let bodyJson;
                try {
                    bodyJson = await cloned.json();
                } catch (e) {
                    // 如果不是 JSON，直接返回原始 response
                    return response;
                }
    
                // 排序返回结果
                if (Array.isArray(bodyJson?.data)) {
                    // 获取请求参数
                    // let keyword = '';
                    // if (init?.body && typeof init.body === 'string') {
                    //     try {
                    //         const reqBody = JSON.parse(init.body);
                    //         keyword = reqBody.k || '';
                    //     } catch (e) {
                    //         // 忽略解析错误
                    //     }
                    // }
                    bodyJson.data = await sortSearchResults(bodyJson.data);
                    
                    // 把修改后的数据串回去，构造一个新的 Response
                    const newBody = JSON.stringify(bodyJson);
                    const { status, statusText, headers } = response;
                    return new Response(newBody, { status, statusText, headers });
                }
            }
    
            // 默认返回原始 response
            return response;
        };
    }

    // 重新排序，前置目录
    async function sortSearchResults(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return data;
        }
        // 获取所有文档path
        const paths = data.map(item => item.path.replace('.sy', ''));
        // 获取path子文档数映射
        const pathMap = await getSubDocNumsByPaths(paths);
        // 前置所有匹配到的目录
        const front = [];  // 存放前置目录
        const rest = [];   // 其他保留原序
        for (const item of data) {
            const path = item.path.trim();
            if ((pathMap[item?.box]?.[path]||0) > 0) {
                front.push(item);
            } else {
                rest.push(item);
            }
        }
        // 合并：前置项 + 剩余项，均保持原始顺序
        return front.concat(rest);
    }

    async function getSubDocNumsByPaths(paths) {
        const normalizedPaths = paths.map(p => p.startsWith('/') ? p : '/' + p);
    
        const caseFields = normalizedPaths.map(p => 
            `SUM(CASE WHEN path LIKE '${p.replace(/'/g, "''")}%' THEN 1 ELSE 0 END) AS '${p}.sy'`
        ).join(', ');
    
        const likeConditions = normalizedPaths.map(p => 
            `path LIKE '${p.replace(/'/g, "''")}%'`
        ).join(' OR ');
    
        const excludeConditions = normalizedPaths.map(p => 
            `path <> '${p.replace(/'/g, "''")}.sy'`
        ).join(' AND ');
    
        // 拼成单行 SQL，避免模板字符串换行问题
        const sql = 'SELECT ' + caseFields + ', box FROM blocks WHERE type = \'d\' AND (' + excludeConditions + ') AND (' + likeConditions + ') GROUP BY box;';
    
        const res = await querySql(sql);
    
        const result = {};
        for (const row of res) {
            const { box, ...counts } = row;
            result[box] = counts;
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
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
})();