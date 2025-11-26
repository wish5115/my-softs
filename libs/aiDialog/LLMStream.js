/**
 * LLMStream - 大模型流式请求和Markdown实时渲染库
 * 支持SSE流式响应、Markdown渲染、错误处理等
 * version 1.0.4
 */
class LLMStream {
  constructor(options) {
    this.url = options.url;
    this.method = options.method || 'POST';
    this.headers = options.headers || {};
    this.body = options.body || {};
    this.target = options.target; // CSS选择器
    this.markdown = options.markdown !== undefined ? options.markdown : true;
    this.thinking = options.thinking !== undefined ? options.thinking : 'auto'; // 新增：true/false/auto
    this.onChunk = options.onChunk; // 自定义chunk处理回调
    this.onComplete = options.onComplete; // 完成回调
    this.onError = options.onError; // 错误回调
    this.markedLibSrc = options?.markedLibSrc || 'https://fastly.jsdelivr.net/npm/marked/marked.min.js';
    this.timeout = options.timeout || 60000; // 超时时间，默认60秒

    this.controller = null;
    this.content = '';
    this.reasoning = ''; // 存储深度思考内容
    this.targetElement = null;
    this.isRunning = false;
    this.timeoutId = null;

    // 初始化目标元素
    if (this.target) {
      this.targetElement = typeof this.target === 'string' ? document.querySelector(this.target) : this.target;
      if (!this.targetElement) {
        console.error(`目标元素 ${this.target} 未找到`);
      }
    }

    // 动态加载Markdown渲染库（如果需要）
    if (this.markdown && !window.marked) {
      this.loadMarkdownLibrary();
    }
  }

  /**
   * 动态加载marked.js库
   */
  async loadMarkdownLibrary() {
    return new Promise((resolve, reject) => {
      if (window.marked) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.markedLibSrc;
      script.onload = () => {
        console.log('Marked.js 加载成功');
        // 配置marked选项
        if (window.marked) {
          marked.setOptions({
            breaks: true,
            gfm: true,
            highlight: function(code, lang) {
              // 如果有highlight.js，使用它
              if (window.hljs && lang) {
                try {
                  return hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                  return code;
                }
              }
              return code;
            }
          });
        }
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * 开始流式请求
   */
  async start() {
    try {
      // 确保Markdown库已加载
      if (this.markdown && !window.marked) {
        await this.loadMarkdownLibrary();
      }

      // 清空内容
      this.content = '';
      this.reasoning = ''; // 清空思考内容
      if (this.targetElement) {
        this.targetElement.innerHTML = '';
      }

      // 创建AbortController用于取消请求
      this.controller = new AbortController();
      this.isRunning = true;

      // 设置超时
      this.timeoutId = setTimeout(() => {
        this.controller.abort();
        const timeoutError = new Error('请求超时');
        timeoutError.name = 'TimeoutError';
        if (this.onError) {
          this.onError(timeoutError);
        }
      }, this.timeout);

      // 发起fetch请求
      const response = await fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body: JSON.stringify(this.body),
        signal: this.controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      // 处理流式响应
      await this.handleStream(response);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已取消');
      } else {
        console.error('请求错误:', error);
        if (this.onError) {
          this.onError(error);
        }
      }
    } finally {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.isRunning = false;
    }
  }

  /**
   * 处理SSE流式响应
   */
  async handleStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let hasSSEData = false;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('流式传输完成');
          if (buffer.trim() && !hasSSEData) {
            try {
              const json = JSON.parse(buffer);
              // 检查是否包含错误
              if (json?.error) {
                throw new Error(json?.error?.message || json?.error || '未知错误');
              }
              const content = json.choices?.[0]?.message?.content || json.content || '';
              const reasoning = json.choices?.[0]?.message?.reasoning_content || ''; // 兼容非流式思考字段

              if (reasoning) {
                this.reasoning += reasoning;
              }

              if (content || reasoning) {
                this.content += content;
                this.render();
                if (this.onChunk) {
                  this.onChunk(content, this.content, this.reasoning);
                }
              }
            } catch (e) {
              if (buffer.trim()) {
                this.content += buffer;
                this.render();
                if (this.onChunk) {
                  this.onChunk(buffer, this.content, this.reasoning);
                }
              }
            }
          }
          if (this.onComplete) {
            this.onComplete(this.content, this.reasoning);
          }
          break;
        }

        // 解码数据
        buffer += decoder.decode(value, { stream: true });

        // 处理SSE格式的数据（data: {...}\n\n）
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data:')) {
            hasSSEData = true;
            const data = line.slice(5).trim();

            // 检查是否是结束标记
            if (data === '[DONE]') {
              continue;
            }

            try {
              const json = JSON.parse(data);
              // 检查是否包含错误
              if (json?.error) {
                throw new Error(json?.error?.message || json?.error || '未知错误');
              }

              // 获取内容和思考过程
              const delta = json.choices?.[0]?.delta?.content || '';
              // 兼容 DeepSeek R1 等模型的 reasoning_content 字段
              const reasoningDelta = json.choices?.[0]?.delta?.reasoning_content || '';

              let hasUpdate = false;

              if (reasoningDelta) {
                this.reasoning += reasoningDelta;
                hasUpdate = true;
              }

              if (delta) {
                this.content += delta;
                hasUpdate = true;
              }

              if (hasUpdate) {
                this.render();

                // 调用自定义chunk回调，增加 reasoning 参数
                if (this.onChunk) {
                  this.onChunk(delta || reasoningDelta, this.content, this.reasoning);
                }
              }
            } catch (e) {
              // 如果是错误对象，向上抛出
              if (e.message && !e.message.includes('JSON')) {
                throw e;
              }
              // 忽略JSON解析错误
              console.warn('JSON解析错误:', e, data);
            }
          } else if (line.trim() && !hasSSEData) {
            try {
              const json = JSON.parse(line);
              // 检查是否包含错误
              if (json?.error) {
                throw new Error(json?.error?.message || json?.error || '未知错误');
              }
              const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || json.content || '';
              const reasoningDelta = json.choices?.[0]?.delta?.reasoning_content || json.choices?.[0]?.message?.reasoning_content || '';

              let hasUpdate = false;
              if (reasoningDelta) {
                 this.reasoning += reasoningDelta;
                 hasUpdate = true;
              }
              if (delta) {
                this.content += delta;
                hasUpdate = true;
              }

              if (hasUpdate) {
                this.render();
                if (this.onChunk) {
                  this.onChunk(delta || reasoningDelta, this.content, this.reasoning);
                }
              }
            } catch (e) {
              // 如果是错误对象，向上抛出
              if (e.message && !e.message.includes('JSON')) {
                throw e;
              }
              // 忽略JSON解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 渲染内容到目标元素
   */
  render() {
    if (!this.targetElement) return;

    // 构建完整的显示内容
    let finalContent = this.content;
    let showThinking = false;

    // 根据配置决定是否显示思考过程
    if (this.thinking === true || this.thinking === 'true') {
      showThinking = true; // 强制显示，哪怕 reasoning 为空（会显示一个空的 details）
    } else if (this.thinking === 'auto') {
      showThinking = !!this.reasoning; // 只有 reasoning 不为空时才显示
    } else {
      showThinking = false; // false 情况，永远不显示
    }

    // 如果需要显示深度思考内容
    if (showThinking) {
      // 防止 null/undefined 出现在 UI 上
      const reasoningText = this.reasoning || '';

      if (this.markdown) {
        // Markdown 模式下，使用 HTML 标签包裹思考过程
        finalContent = `<details open>
<summary>深度思考 (Thinking Process)</summary>

${reasoningText}

</details>

${this.content}`;
      } else {
        // 纯文本模式
        finalContent = `[深度思考]\n${reasoningText}\n\n[回答]\n${this.content}`;
      }
    }

    if (this.markdown && window.marked) {
      // Markdown渲染
      this.targetElement.innerHTML = marked.parse(finalContent);
    } else {
      // 纯文本渲染（保留换行）
      this.targetElement.textContent = finalContent;
    }

    // 保存原始数据
    this.targetElement.dataset.markdown = this.content;
    this.targetElement.dataset.reasoning = this.reasoning;

    // 自动滚动到底部
    this.targetElement.scrollTop = this.targetElement.scrollHeight;
  }

  /**
   * 停止流式请求
   */
  stop() {
    if (this.controller) {
      this.controller.abort();
      console.log('已停止流式请求');
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isRunning = false;
  }

  /**
   * 判断是否正在运行
   */
  getIsRunning() {
    return this.isRunning;
  }

  /**
   * 获取当前内容
   */
  getContent() {
    return this.content;
  }

  /**
   * 获取思考内容
   */
  getReasoning() {
    return this.reasoning;
  }

  /**
   * 清空内容
   */
  clear() {
    this.content = '';
    this.reasoning = '';
    if (this.targetElement) {
      this.targetElement.innerHTML = '';
    }
  }
}

// 导出（支持ES6模块和全局变量）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LLMStream;
}
if (typeof window !== 'undefined') {
  window.LLMStream = LLMStream;
}