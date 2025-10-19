// 免费兼容openai的大模型代理服务器
// see https://ld246.com/article/1760849900683
// version 0.0.2
// 0.0.2 增加代码健壮性；动态获取大模型，支持多大22中大模型
(async () => {
    /////////////// 参数配置 ///////////////
    // 启动端口
    const port = 3000;

    // api 秘钥
    const apiKey = 'sk-your-secret-key-here';

    // 使用说明
    // 访问地址：http://localhost:3000/v1 这里的3000是端口，根据你的配置不同而不同
    // 同时支持直接请求和sse两种模式

    /////////////// 以下是服务主体，非必须要勿动 /////////////////

    // 不支持手机版
    if(typeof window !== 'undefined' && window.siyuan.mobile) return;

    const http = require('http');
    const https = require('https');
    const url = require('url');

    class OpenAIProxyServer {
        constructor() {
            this.apiKeyStore = new Map();
            this.targetApiUrl = this.getUKey();
            this.port = process.env.PORT || port;
        
            // 支持的模型列表
            this.supportedModels = new Set([
                'glm-4.5-flash',
                'z-ai/glm-4.5-air:free',
                'moonshotai/kimi-k2-instruct-0905',
                'DeepSeek-V3.1-Terminus',
                'gpt-oss-120b',
                'qwen-3-coder-480b',
                'qwen-3-235b-a22b-thinking-2507',
                'qwen-3-235b-a22b-instruct-2507',
                'meta-llama/llama-4-maverick-17b-128e-instruct',
                'llama-3.3-70b',
                'deepseek/deepseek-chat-v3.1:free',
                'gemma-3-27b-it',
                'gemini-2.5-flash-lite',
                'gemini-2.0-flash-thinking-exp',
                'yi-lightning',
                'THUDM/GLM-4-9B-0414',
                'Mistral-medium-2505',
                'Mistral-large-2411',
                'azure:gpt-5-mini',
                'azure:gpt-4.1-mini',
                'Cohere-command-a',
                'Phi-4'
            ]);
        
            //this.initializeDefaultKeys();
        }

        initializeDefaultKeys() {
            this.addApiKey(apiKey, {
                model: 'qwen-3-coder-480b',
                maxTokens: 2048,
                temperature: 0.7
            });
        }

        addApiKey(key, config = {}) {
            this.apiKeyStore.set(key, {
                model: config.model || 'qwen-3-coder-480b',
                maxTokens: config.maxTokens || 2048,
                temperature: config.temperature || 0.7
            });
            console.log(`API key added: ${key.substring(0, 8)}...`);
        }

        validateApiKey(authHeader) {
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return null;
            }
            const apiKey = authHeader.substring(7);
            return this.apiKeyStore.has(apiKey) ? apiKey : null;
        }

        // 优化消息处理，保留完整历史
        transformOpenAIToTarget(openAIRequest) {
            const messages = openAIRequest.messages || [];
        
            // 直接传递所有消息，保持完整对话历史
            const transformedMessages = messages.map(msg => ({
                role: this.normalizeRole(msg.role),
                content: String(msg.content || '')
            }));

            // 验证模型是否支持
            const requestedModel = openAIRequest.model || 'qwen-3-coder-480b';
            const finalModel = this.supportedModels.has(requestedModel) ? requestedModel : 'qwen-3-coder-480b';

            if (requestedModel !== finalModel) {
                console.log(`Model ${requestedModel} not supported, using ${finalModel} instead`);
            }

            return {
                messages: transformedMessages,
                model: finalModel
            };
        }

        normalizeRole(role) {
            const roleMap = {
                'system': 'system',
                'user': 'user',
                'assistant': 'assistant',
                'function': 'user',
                'tool': 'user'
            };
            return roleMap[role] || 'user';
        }
        
        // 获取模型列表
        async initDatas() {
            try {
                this.supportedModels = await fetchAndParseModels(this.getUKey('origin'));
                console.log('New Models', this.supportedModels);
            } catch(e) {
                console.log('Get new models failed', e);
            }
            this.initializeDefaultKeys();
            
            async function fetchAndParseModels(url = '') {
              if(!url) throw new Error('url can not empty');
              console.log('Getting models...');
              // --- fetch HTML (browser fetch or node https fallback) ---
              const html = await (async () => {
                if (typeof fetch === 'function') {
                  const res = await fetch(url, { method: 'GET' });
                  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
                  return await res.text();
                }
                // Node fallback without third-party libs
                if (typeof require === 'function') {
                  return await new Promise((resolve, reject) => {
                    const { request } = require('https');
                    const u = new URL(url);
                    const opts = {
                      hostname: u.hostname,
                      path: u.pathname + (u.search || ''),
                      method: 'GET',
                      headers: {
                        'User-Agent': 'node.js',
                        Accept: 'text/html,application/xhtml+xml'
                      }
                    };
                    const req = request(opts, (res) => {
                      let raw = '';
                      res.setEncoding('utf8');
                      res.on('data', (chunk) => raw += chunk);
                      res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 400) resolve(raw);
                        else reject(new Error(`http ${res.statusCode}`));
                      });
                    });
                    req.on('error', reject);
                    req.end();
                  });
                }
                throw new Error('No fetch available in this environment');
              })();

              // --- locate the target <div class="... grid ..."> under the data-lenis-prevent section ---
              function findGridDivHtml(sourceHtml) {
                const lower = sourceHtml; // keep original case for accurate substring indexes
                // 1) find the data-lenis-prevent container
                const lenisIdx = lower.search(/<div[^>]*\bdata-lenis-prevent\b[^>]*>/i);
                const searchStart = lenisIdx >= 0 ? lenisIdx : 0;

                // 2) find the first <div ... class="... grid ..."> after searchStart
                const sub = lower.slice(searchStart);
                const gridOpenRegex = /<div\b[^>]*\bclass=(['"])([^'"]*\bgrid\b[^'"]*)\1[^>]*>/i;
                const m = sub.match(gridOpenRegex);
                if (!m) return null;
                const openTagRelIndex = m.index;
                const openTag = m[0];
                const openPos = searchStart + openTagRelIndex;
                const openEndPos = openPos + openTag.length;

                // 3) find matching closing </div> by counting nested <div> ... </div>
                const rest = lower.slice(openEndPos);
                const tagRegex = /<div\b|<\/div>/gi;
                let depth = 1;
                let match;
                let relativeEndIndex = -1;
                while ((match = tagRegex.exec(rest)) !== null) {
                  if (match[0].toLowerCase().startsWith('</')) {
                    depth -= 1;
                  } else {
                    depth += 1;
                  }
                  if (depth === 0) {
                    // match.index is relative to rest
                    relativeEndIndex = match.index + match[0].length;
                    break;
                  }
                }
                if (relativeEndIndex < 0) return null;
                const endPos = openEndPos + relativeEndIndex;
                const fullHtml = lower.slice(openPos, endPos);
                return { fullHtml, openPos, endPos };
              }

              const gridResult = findGridDivHtml(html);
              const rawGridHtml = gridResult ? gridResult.fullHtml : null;

              // --- extract model ids from inputs inside that grid html ---
              const supportedModels = new Set();
              if (rawGridHtml) {
                const inputRegex = /<input\b[^>]*\bname=(["'])model\1[^>]*\bid=(["'])([^"']+)\2[^>]*>/gi;
                let im;
                while ((im = inputRegex.exec(rawGridHtml)) !== null) {
                  const id = im[3].trim();
                  if (id) supportedModels.add(id);
                }
                // Some variants might omit name="model" but we still want ids of inputs with id + type radio + name attr missing.
                if (supportedModels.size === 0) {
                  // fallback: any input with id and type=radio within grid
                  const inputFallback = /<input\b[^>]*\btype=(['"])radio\1[^>]*\bid=(['"])([^"']+)\2[^>]*>/gi;
                  while ((im = inputFallback.exec(rawGridHtml)) !== null) {
                    const id = im[3].trim();
                    if (id) supportedModels.add(id);
                  }
                }
              }

              // 仅返回模型集合（Set<string>）
              return supportedModels;
            }
        }

        // 处理非流式响应
        transformTargetToOpenAI(targetResponse, openAIRequest) {
            console.log('Raw target API response:', targetResponse);
        
            let content = '';
        
            // 处理纯文本响应
            if (typeof targetResponse === 'string') {
                content = targetResponse;
            } else if (targetResponse && typeof targetResponse === 'object') {
                // 如果是对象且有content字段
                content = targetResponse.content || targetResponse.message || targetResponse.response || '';
            
                // 尝试从常见字段中提取内容
                if (!content) {
                    for (const key in targetResponse) {
                        if (typeof targetResponse[key] === 'string' && targetResponse[key].trim().length > 0) {
                            content = targetResponse[key];
                            break;
                        }
                    }
                }
            }

            // 清理内容
            if (!content || content.trim().length === 0) {
                content = '抱歉，我无法生成回复。请检查API配置。';
            }

            const responseId = 'chatcmpl-' + Math.random().toString(36).substring(2, 18);
        
            return {
                id: responseId,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: openAIRequest.model || 'qwen-3-coder-480b',
                choices: [
                    {
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: content.trim()
                        },
                        finish_reason: 'stop'
                    }
                ],
                usage: {
                    prompt_tokens: this.estimateTokens(openAIRequest.messages),
                    completion_tokens: this.estimateTokens([{content: content}]),
                    total_tokens: this.estimateTokens(openAIRequest.messages) + this.estimateTokens([{content: content}])
                }
            };
        }

        // 处理流式响应
        transformTargetToOpenAIStream(targetResponse, openAIRequest) {
            let content = '';
        
            if (typeof targetResponse === 'string') {
                content = targetResponse;
            } else if (targetResponse && typeof targetResponse === 'object') {
                content = targetResponse.content || targetResponse.message || targetResponse.response || '';
            }

            if (!content || content.trim().length === 0) {
                content = '抱歉，我无法生成回复。';
            }

            const responseId = 'chatcmpl-' + Math.random().toString(36).substring(2, 18);
            const created = Math.floor(Date.now() / 1000);
            const model = openAIRequest.model || 'qwen-3-coder-480b';

            // 流式响应格式 - 模拟逐字输出效果
            const chunks = this.createStreamChunks(content, responseId, created, model);
            return chunks;
        }

        // 创建流式chunks，模拟逐字输出
        createStreamChunks(content, responseId, created, model) {
            const chunks = [];
        
            // 第一个chunk：角色信息
            chunks.push({
                id: responseId,
                object: 'chat.completion.chunk',
                created: created,
                model: model,
                choices: [
                    {
                        index: 0,
                        delta: { role: 'assistant' },
                        finish_reason: null
                    }
                ]
            });

            // 将内容分成多个chunk模拟流式输出
            const words = content.split('');
            let currentContent = '';
        
            for (const word of words) {
                currentContent += word;
                chunks.push({
                    id: responseId,
                    object: 'chat.completion.chunk',
                    created: created,
                    model: model,
                    choices: [
                        {
                            index: 0,
                            delta: { content: word },
                            finish_reason: null
                        }
                    ]
                });
            }

            // 最后一个chunk：结束标记
            chunks.push({
                id: responseId,
                object: 'chat.completion.chunk',
                created: created,
                model: model,
                choices: [
                    {
                        index: 0,
                        delta: {},
                        finish_reason: 'stop'
                    }
                ]
            });

            return chunks;
        }

        estimateTokens(messages) {
            if (!messages) return 0;
            const text = messages.map(m => m.content).join(' ');
            return Math.ceil(text.length / 4);
        }
    
        getUKey(type = 'api') {
            const map = {
                origin: 'aHR0cHM6Ly9lMTAuZnJlZS1jaGF0LmFzaWE=',
                referer: 'aHR0cHM6Ly9lMTAuZnJlZS1jaGF0LmFzaWEv',
                api: 'aHR0cHM6Ly9wcm9tcGxhdGUtYXBpLmZyZWUtY2hhdC5hc2lhL3BsZWFzZS1kby1ub3QtaGFjay10aGlzL3NpbmdsZS9jaGF0X21lc3NhZ2Vz'
            };
            return Buffer.from(map[type], 'base64').toString('utf8').trim();
        }

        async sendToTargetAPI(requestData, apiKey) {
            return new Promise((resolve, reject) => {
                const apiConfig = this.apiKeyStore.get(apiKey);
                const data = JSON.stringify({
                    ...requestData,
                    model: requestData.model || apiConfig.model
                });

                const parsedUrl = new URL(this.targetApiUrl);
            
                console.log('Sending to target API with model:', requestData.model);
                console.log('Message count:', requestData.messages.length);

                const options = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port || 443,
                    path: parsedUrl.pathname,
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data),
                        'Accept': '*/*',
                        'User-Agent': 'OpenAI-Proxy-Server/1.0',
                        'Origin': this.getUKey('origin'),
                        'Referer': this.getUKey('referer')+'/',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                    },
                    timeout: 30000
                };

                const req = https.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        console.log(`Target API response status: ${res.statusCode}`);
                        console.log(`Content-Type: ${res.headers['content-type']}`);
                    
                        // 直接返回纯文本，不尝试解析JSON
                        if (res.headers['content-type'] && res.headers['content-type'].includes('text/plain')) {
                            console.log('Target API returned plain text, returning as string');
                            resolve(responseData);
                        } else {
                            // 尝试解析JSON，如果失败则返回原始文本
                            try {
                                const parsedData = JSON.parse(responseData);
                                resolve(parsedData);
                            } catch (error) {
                                console.log('Response is not JSON, returning as string');
                                resolve(responseData);
                            }
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('Request error:', error);
                    reject(new Error(`Target API request failed: ${error.message}`));
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Target API request timeout'));
                });

                req.write(data);
                req.end();
            });
        }

        async handleRequest(req, res) {
            // 设置CORS头
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

            // 处理预检请求
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // 只处理POST请求
            if (req.method !== 'POST') {
                this.sendError(res, 405, 'Method not allowed');
                return;
            }

            try {
                // 验证API密钥
                const apiKey = this.validateApiKey(req.headers.authorization);
                if (!apiKey) {
                    this.sendError(res, 401, 'Invalid API key');
                    return;
                }

                // 解析请求体
                const body = await this.parseRequestBody(req);
                let openAIRequest;
            
                try {
                    openAIRequest = JSON.parse(body);
                } catch (parseError) {
                    this.sendError(res, 400, 'Invalid JSON in request body');
                    return;
                }

                console.log('Received OpenAI request, stream:', openAIRequest.stream);
                console.log('Requested model:', openAIRequest.model);
                console.log('Message count:', openAIRequest.messages?.length || 0);

                // 验证必需字段
                if (!openAIRequest.messages || !Array.isArray(openAIRequest.messages)) {
                    this.sendError(res, 400, 'Missing or invalid messages array');
                    return;
                }

                // 转换请求格式
                const targetRequest = this.transformOpenAIToTarget(openAIRequest);

                // 发送到目标API
                const targetResponse = await this.sendToTargetAPI(targetRequest, apiKey);

                // 根据stream标志返回不同格式的响应
                if (openAIRequest.stream) {
                    const streamData = this.transformTargetToOpenAIStream(targetResponse, openAIRequest);
                    this.sendStreamResponse(res, streamData);
                } else {
                    const openAIResponse = this.transformTargetToOpenAI(targetResponse, openAIRequest);
                    this.sendSuccess(res, openAIResponse);
                }

            } catch (error) {
                console.error('Request processing error:', error);
                this.sendError(res, 500, `Internal server error: ${error.message}`);
            }
        }

        parseRequestBody(req) {
            return new Promise((resolve, reject) => {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    resolve(body);
                });
                req.on('error', reject);
            });
        }

        sendSuccess(res, data) {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'OpenAI-Organization': 'user',
                'OpenAI-Processing-Ms': '100'
            });
            res.end(JSON.stringify(data));
        }

        // 发送流式响应
        sendStreamResponse(res, streamData) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true'
            });

            // 发送每个chunk，添加小延迟模拟真实流式效果
            const sendChunk = (index) => {
                if (index >= streamData.length) {
                    // 结束流
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                }

                const chunk = streamData[index];
                const data = `data: ${JSON.stringify(chunk)}\n\n`;
                res.write(data);

                // 添加延迟模拟真实流式输出（仅对内容chunk）
                const isContentChunk = chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content;
                const delay = isContentChunk ? 10 : 0; // 10ms延迟用于内容chunk

                setTimeout(() => {
                    sendChunk(index + 1);
                }, delay);
            };

            sendChunk(0);
        }

        sendError(res, code, message) {
            const errorResponse = {
                error: {
                    message: message,
                    type: this.getErrorType(code),
                    code: code.toString()
                }
            };

            res.writeHead(code, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify(errorResponse));
        }

        getErrorType(code) {
            const errorTypes = {
                400: 'invalid_request_error',
                401: 'authentication_error',
                403: 'permission_error',
                404: 'not_found_error',
                500: 'api_error'
            };
            return errorTypes[code] || 'api_error';
        }

        start() {
            const server = http.createServer((req, res) => {
                const parsedUrl = url.parse(req.url, true);

                console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

                // 处理健康检查
                if (parsedUrl.pathname === '/health') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'ok', 
                        timestamp: new Date().toISOString(),
                        supported_models: Array.from(this.supportedModels),
                        keys: Array.from(this.apiKeyStore.keys()).map(k => k.substring(0, 8) + '...')
                    }));
                    return;
                }

                // 处理模型列表端点
                if (parsedUrl.pathname === '/v1/models') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                
                    const models = Array.from(this.supportedModels).map(modelId => ({
                        id: modelId,
                        object: 'model',
                        created: 1677610602,
                        owned_by: this.getModelOwner(modelId)
                    }));

                    res.end(JSON.stringify({
                        object: 'list',
                        data: models
                    }));
                    return;
                }

                // 处理聊天完成端点
                if (parsedUrl.pathname === '/v1/chat/completions') {
                    this.handleRequest(req, res);
                } else {
                    this.sendError(res, 404, 'Endpoint not found. Available: /v1/chat/completions, /v1/models, /health');
                }
            });

            server.listen(this.port, () => {
                console.log(`🚀 OpenAI proxy server running on http://localhost:${this.port}`);
                console.log(`📝 Available endpoints:`);
                console.log(`   POST /v1/chat/completions (supports streaming)`);
                console.log(`   GET  /v1/models`);
                console.log(`   GET  /health`);
                console.log(`🔑 Test API key: ${apiKey}`);
                console.log(`🎯 Target API: ${this.targetApiUrl}`);
                console.log(`🤖 Supported models: ${Array.from(this.supportedModels).join(', ')}`);
            });

            return server;
        }

        getModelOwner(modelId) {
            const owners = {
                'qwen': 'Alibaba',
                'gpt': 'OpenAI',
                'meta': 'Meta',
                'llama': 'Meta',
                'gemini': 'Google',
                'deepseek': 'DeepSeek',
                'gemma': 'Google',
                'glm': 'Zhipu AI',
                'moonshot': 'Moonshot AI',
                'mistral': 'Mistral AI',
                'cohere': 'Cohere',
                'phi': 'Microsoft',
                'yi': '01.ai'
            };

            for (const [prefix, owner] of Object.entries(owners)) {
                if (modelId.toLowerCase().includes(prefix.toLowerCase())) {
                    return owner;
                }
            }
            return 'unknown';
        }
    }

    // 创建并启动服务器
    const server = new OpenAIProxyServer();
    await server.initDatas();
    server.start();

    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down server...');
        process.exit(0);
    });
})();