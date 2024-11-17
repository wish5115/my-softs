// 功能：外部程序通过调用思源api运行js代码
// 主要用途：用于quicker等调用思源执行js
// 使用帮助和反馈：
// by wilsons 2014.11.18
// version 0.0.1
// 更新记录
// 0.0.1 实现了基本的运行js的功能。
(() => {
    // 默认渠道名，可以根据需要修改
    const channel = 'siyuan-runjs';

    // 创建socket客户端
    createSocketClient(channel);

    // 创建运行环境信息
    createEnvInfo();

    // 当收到消息时被调用
    function onReceivedMessage(event) {
        let request = parseJson(event.data);
        const resultPath = '/data/public/runjs_result_'+request.request_id+'.json';
        //运行js
        if(request.action === "runjs"){
            let result = '';
            try {
                result = (new Function(request.code))();
            } catch (e) {
                result = e.message || '';
                console.error(e);
            }
            putFile(resultPath, JSON.stringify({
                "request_id": request.request_id,
                "result": result
            }));
        }
        // 清除临时文件
        if(request.action === "clear"){
            fetchSyncPost('/api/file/removeFile', {path: resultPath});
        }
    }

    // 创建socket客户端
    function createSocketClient(channel) {
        // 连接 WebSocket 服务器
        const socket = new WebSocket('ws://'+location.host+'/ws/broadcast?channel='+channel);
        
        socket.onopen = function(e) {
            console.log('Channel '+channel+' connectioned!');
        };
        
        socket.onmessage = onReceivedMessage;
        
        socket.onclose = function(event) {
            console.log('Channel '+channel+' closed!');
        };
        
        socket.onerror = function(error) {
            console.error('WebSocket Error:', error);
        };

        return socket;
    }

    // 服务器向指定渠道广播消息
    async function postMessage(channel, message) {
        const result = await fetchSyncPost('/api/broadcast/postMessage', {
            channel: channel,
            message: message
        });
        if(result.code !== 0 || !result.data) {
            console.error('postMessage error', result);
        }
    }

    // 保存环境信息
    function createEnvInfo() {
        putFile('/data/public/env_info.json', JSON.stringify({
            ip: location.hostname,
            port: location.port,
            token: siyuan.config.api.token
        }));
    }

    // 解析json
    function parseJson(jsonString) {
        let json = {};
        try {
            json = JSON.parse(jsonString || '{}');
        } catch(e) {
            json = {};
            console.error('parseJson error', e);
        }
        return json;
    }

    // 存储文件
    function putFile(storagePath, data) {
          const formData = new FormData();
          formData.append("path", storagePath);
          formData.append("file", new Blob([data]));
          return fetch("/api/file/putFile", {
              method: "POST",
              body: formData,
          }).then((response) => {
              if (response.ok) {
                  //console.log("File saved successfully");
              }
              else {
                  throw new Error("Failed to save file");
              }
          }).catch((error) => {
              console.error(error);
          });
    }
    
    // 发送api请求
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
})()