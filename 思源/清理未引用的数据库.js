// 清理未引用的数据库
// 默认会移动到/data/trash/av目录中
// 使用方法：在控制台执行 delNotRefAvs() 即可
(()=>{
    // 定义未引用的数据库移动到哪
    let trashPath = '/data/trash/av/';

    window.delNotRefAvs = main;

    async function main() {
         // 查询在用数据库
        const avs = await querySql(`select * from blocks where type = 'av' limit 999999;`);
        const avIds = avs.map(av => getAvIdFromHtml(av.markdown));
    
        // 获取待删除数据库文件
        const fileRes = await requestApi('/api/file/readDir', {path: '/data/storage/av/'});
        if(!fileRes || fileRes.code !== 0) return;
        const delFiles = fileRes.data.filter(file => !file.isDir && file.name.endsWith('.json') && !avIds.includes(file.name.replace('.json', '')));
        if(delFiles.length === 0) {
            console.log('没有找到未引用的数据库');
            return;
        }
    
        // 创建文件夹
        trashPath = trashPath.replace(/\/$/, '') + '/';
        const ret = await putFile(trashPath, '', true);
        if(!ret || ret.code !== 0) {
            console.log('创建文件夹'+trashPath+'失败');
            return;
        }
        
        //移动数据库文件
        const dels = [];
        await Promise.all(delFiles.map(async (file) => {
            const ret = await moveFile(file);
            if (ret) {
                dels.push('已删除数据库 ' + file.name);
            }
        }));
        console.log(`已成功删除${dels.length}个未引用的数据库`, dels);
    }

    async function moveFile(file, tries = 0) {
        const res = await requestApi('/api/file/renameFile', {
            path: '/data/storage/av/'+file.name,
            newPath: trashPath+file.name,
        });
        if(res && res.code === 409) {
            if(tries > 3) return false;
            await requestApi('/api/file/removeFile', {
                path: trashPath+file.name,
            });
            return moveFile(file, ++tries);
        }
        if(res && res.code === 0) {
            return true;
        }
        console.log(`移动文件${file}失败`, JSON.stringify(res));
        return false;
    }
    
    // 获取avid
    function getAvIdFromHtml(htmlString) {
        // 使用正则表达式匹配data-av-id的值
        const match = htmlString.match(/data-av-id="([^"]+)"/);
        if (match && match[1]) {
        return match[1];  // 返回匹配的值
        }
        return "";  // 如果没有找到匹配项，则返回空
    }
    async function querySql(sql) {
        try {
            const result = await requestApi('/api/query/sql', { "stmt": sql });
            if (result.code !== 0) {
                console.error("查询数据库出错", result.msg);
                return [];
            }
            return result.data;
        } catch(e) {
            console.error("查询数据库出错", e.message);
            return [];
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
    // 调用 await requestApi('/api/block/getChildBlocks', {id: '20241208033813-onlvfmp'});
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
})();