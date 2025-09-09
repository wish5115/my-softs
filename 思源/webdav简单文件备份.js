// webdav简单文件备份
// 比如可以备份配置文件等，防止密钥丢失
// 灵感来自：https://ld246.com/article/1757335387239
// 6E44AC906C9061D198E1C096B8201A0A 👈 代码片段的唯一标识，请勿删除！！！
(async ()=>{
    // webdav配置
    // 【注意】：请勿开启发布服务，发布服务下，webdav账号可能会泄漏（开启发布服务时，可先禁用该代码）
    // 这里WebDav推荐https://infini-cloud.net，注册成功即得20G永久空间，然后在My Page页面输入 QEU7Z 这个推荐码后再额外赠送5G永久空间
    const webdav = {
        url: 'https://jike.teracloud.jp/dav/',
        username: '',
        password: ''
    };
    
    // 要同步的文件列表
    // 仅支持文件，不支持文件夹（文件夹请把文件全部列出即可）
    const syncFiles = [
        '/conf/conf.json',
    ];

    // webdav js代码地址，这里建议把webdav@5.8.0/+esm下载到本地使用，性能更好
    // const webdavJs = '/snippets/libs/webdav@5.8.0+esm.js'; // 加载本地webdavjs
    const webdavJs = 'https://jsd.onmicrosoft.cn/npm/webdav@5.8.0/+esm'; // 加载在线webdavjs

    // 发布服务不显示
    if(window.siyuan.config.readonly) {
        const script = xpathSelector("//script[contains(., '6E44AC906C9061D198E1C096B8201A0A')]");
        if(script) {
            script.remove();
            return;
        }
    }

    let client;
    setTimeout(async () => {
        // 获取webdav客户端
        let createClient;
        try {
            // 这里建议把webdav@5.8.0/+esm下载到本地
            const webdav = await import(webdavJs);
            createClient = webdav.createClient;
        } catch (error) {
            console.error("加载 webdav 库失败！", error);
            return;
        }
        client = createClient(webdav.url, {
            username: webdav.username,
            password: webdav.password
        });
        // 开始备份
        syncFiles.forEach(file => {
            syncFile(file);
        });
    }, 3000);
    
    async function syncFile(path) {
      if(!client) return;
      const remotePath = '/siyuan/' + path.replace(/^\//, '');
      const localContent = await getFile(path);

      try {
        // 检查并创建目录（如果不存在）
        const remotePathArr = remotePath.split('/').filter(Boolean);
        remotePathArr.pop();
        let remoteDir = '/';
        for(const dir of remotePathArr) {
            remoteDir += dir + '/';
            const dirExists = await client.exists(remoteDir);
            if (!dirExists) {
              console.log('目录不存在，正在创建:', remoteDir);
              await client.createDirectory(remoteDir);
              console.log('目录创建成功');
            }
        }
        const exists = await client.exists(remotePath);
        if (exists) {
          const remoteContent = await client.getFileContents(remotePath, { format: "text" });
          if (remoteContent !== localContent) {
            console.log('文件已变更，正在同步...');
            await client.putFileContents(remotePath, localContent, { overwrite: true });
            console.log('同步完成');
          } else {
            console.log('文件无变化，无需同步');
          }
        } else {
          console.log('文件不存在，正在创建...');
          await client.putFileContents(remotePath, localContent);
          console.log('文件创建成功');
        }
      } catch (error) {
        console.error('同步失败:', error);
      }
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

    function xpathSelector(xpath, context = document) {
      const result = document.evaluate(
        xpath, context, null,
        XPathResult.FIRST_ORDERED_NODE_TYPE, // 只取第一个匹配节点
        null
      );
      return result.singleNodeValue;
    }
})();