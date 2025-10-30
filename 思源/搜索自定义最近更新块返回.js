// 搜索自定义最近更新块返回
// see https://ld246.com/article/1760428929368
//see https://github.com/siyuan-note/siyuan/blob/779c6ede2855aee91f7f54b0b65b7ce3add40c2c/kernel/model/block.go#L348
(()=>{
    // 自定义返回条数
    const num = 32;
    
    interceptRecentUpdatedBlocks();
    function interceptRecentUpdatedBlocks() {
        let originalFetch = window.fetch;
        window.fetch = async function(url, init) {
            // 只处理目标接口
            if (url.toString().endsWith('/api/block/getRecentUpdatedBlocks')) {
                // 1. 获取原始 SQL 数据
                const sqlBlocks = await recentUpdatedBlocks(num);
        
                // 2. 转为前端 Block 对象
                const data = sqlBlocks.map(fromSQLBlock).filter(Boolean);
        
                // 3. 返回与原生 API 完全一致的结构
                const bodyJson = { code: 0, msg: "", data };
                
                // 直接构造一个成功的 Response，无需原始 response
                return new Response(JSON.stringify(bodyJson), {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });
            }
            return originalFetch(url, init);
        };
    }
    // 主函数：模拟 RecentUpdatedBlocks()
    async function recentUpdatedBlocks(num = 16) {
      // 1. 判断是否为移动端
      const container = window.siyuan?.config?.system?.container || '';
      const isMobile = ['ios', 'android', 'harmony'].includes(container);
    
      // 2. 构建基础 SQL
      let sqlStmt;
      if (isMobile) {
        sqlStmt = "SELECT * FROM blocks WHERE type = 'd'";
      } else {
        sqlStmt = "SELECT * FROM blocks WHERE type = 'p' AND length > 1";
      }
    
      // 3. 获取忽略规则并拼接
      const ignoreLines = await getSearchIgnoreLines();
      if (ignoreLines.length > 0) {
        const andConditions = ignoreLines.map(line => ` AND ${line}`).join('');
        sqlStmt += andConditions;
      }
    
      // 4. 排序
      sqlStmt += " ORDER BY updated DESC LIMIT " + num;
    
      // 5. 执行 SQL
      try {
        const result = await querySql(sqlStmt); // 假设返回 block 数组
        return result || [];
      } catch (e) {
        console.error('SQL query failed:', e);
        return [];
      }
    }
    // 工具函数：读取 .siyuan/searchignore 文件内容并解析为 SQL 条件行
    async function getSearchIgnoreLines() {
      const searchIgnorePath = '/data/.siyuan/searchignore';
      let content = '';
      try {
        content = await getFile(searchIgnorePath); // 假设 getFile 返回字符串
      } catch (e) {
        // 文件不存在或读取失败，视为无忽略规则
        return [];
      }
    
      // 标准化换行符并按行分割
      const lines = content.replace(/\r\n/g, '\n').split('\n');
    
      // 去重 + 过滤空行（更安全）
      const seen = new Set();
      const filtered = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !seen.has(trimmed)) {
          seen.add(trimmed);
          filtered.push(trimmed);
        }
      }
    
      return filtered;
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
            throw error;
        });
    }
    function fromSQLBlock(sqlBlock) {
      if (!sqlBlock) return null;
    
      // IAL 转换（你已实现 ialToObj）
      const ial = typeof sqlBlock.ial === 'string'
        ? ialToObj(sqlBlock.ial)
        : (sqlBlock.ial || {});
    
      // 类型简写转前端类型
      const typeMap = { p: 'NodeParagraph', d: 'NodeDocument', h: 'NodeHeading' };
      const type = typeMap[sqlBlock.type] || 'NodeUnknown';
    
      // 确保 hPath 以 / 开头
      let hPath = sqlBlock.hpath || '';
      if (!hPath.startsWith('/')) hPath = '/' + hPath;
    
      return {
        box: sqlBlock.box,
        path: sqlBlock.path,
        hPath: hPath,
        id: sqlBlock.id,
        rootID: sqlBlock.root_id,
        parentID: sqlBlock.parent_id,
        name: sqlBlock.name || '',
        alias: sqlBlock.alias || '',
        memo: sqlBlock.memo || '',
        tag: sqlBlock.tag || '',
        content: sqlBlock.content || '',
        fcontent: sqlBlock.fcontent || '',
        markdown: (sqlBlock.markdown || '').substring(0, 5120), // maxContent
        folded: false,
        type: type,
        subType: sqlBlock.subtype || '',
        refText: '',
        refs: null,
        defID: '',
        defPath: '',
        ial: ial,
        children: null,
        depth: 0,
        count: 0,
        refCount: 0,
        sort: sqlBlock.sort || 0,
        created: '',
        updated: '',
        riffCardID: '',
        riffCard: null
      };
    }
    function ialToObj(ialStr) {
      // 输入: '{: id="xxx" updated="yyy"}'
      if (!ialStr || !ialStr.startsWith('{:')) return {};
    
      // 去掉 {: 和 }
      let inner = ialStr.slice(2, -1).trim();
    
      const obj = {};
      // 正则匹配 key="value"
      const regex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
      let match;
      while ((match = regex.exec(inner)) !== null) {
        obj[match[1]] = match[2];
      }
      return obj;
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