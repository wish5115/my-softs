(() => {

    // 生成css
    const css = `
    .ai-light{
        background-color: #f5f5f5;
    }

    .ai-dark{
        background-color: #1a1a1a;
    }

    .trigger-btn {
        padding: 10px 20px;
        cursor: pointer;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        margin: 10px;
    }

    .ai-light.trigger-btn {
        background-color: #fff;
        color: #333;
        border: 1px solid #ddd;
    }

    .ai-dark.trigger-btn {
        background-color: #2a2a2a;
        color: #fff;
        border: 1px solid #444;
    }

    .theme-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        cursor: pointer;
        border: none;
        border-radius: 4px;
        font-size: 14px;
    }

    /* AI对话框样式 */
    .ai-dialog {
        position: fixed;
        width: 420px;
        max-height: 468px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        z-index: 10000;
        /*overflow: hidden;*/
        display: none;
    }

    .ai-dialog.show {
        display: flex;
    }

    /* 明亮主题 */
    .ai-light.ai-dialog {
        background-color: #ffffff;
        color: #333;
    }

    /* 暗黑主题 */
    .ai-dark.ai-dialog {
        background-color: #2a2a2a;
        color: #e0e0e0;
    }

    /* 标题栏 */
    .ai-dialog .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        cursor: move;
        user-select: none;
        /* border-bottom: 1px solid; */
    }

    .ai-light.ai-dialog .dialog-header {
        border-bottom-color: #e0e0e0;
    }

    .ai-dark.ai-dialog .dialog-header {
        /* border-bottom-color: #404040; */
    }

    .ai-dialog .dialog-title {
        font-size: 14px;
        font-weight: bold;
    }

    .ai-dialog .dialog-header-left {
        display: flex;
        align-items: center;
    }
    .ai-dialog .dialog-header-left .mini-btn {
        display: none;
    }
    .ai-dialog .dialog-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* AI选择器 */
    .ai-dialog .ai-selector {
        position: relative;
    }

    .ai-dialog .ai-select-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border: 1px solid;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        background: transparent;
        color: inherit;
    }

    .ai-light.ai-dialog .ai-select-btn {
        border-color: #d0d0d0;
    }
    .ai-dialog .ai-select-btn svg {
        vertical-align: middle;
        position: relative;
        top: -1px;
    }

    .ai-dark.ai-dialog .ai-select-btn {
        border-color: #505050;
    }

    .ai-dialog .ai-select-btn:hover {
        opacity: 0.8;
    }

    .ai-dialog .ai-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        background: white;
        border: 1px solid;
        border-radius: 6px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        min-width: 160px;
        max-width: 300px; /* 添加这行 */
        width: max-content; /* 添加这行 - 自适应内容 */
        display: none;
        z-index: 10;
    }

    .ai-light.ai-dialog .ai-dropdown {
        background-color: #fff;
        border-color: #e0e0e0;
    }

    .ai-dark.ai-dialog .ai-dropdown {
        background-color: #333;
        border-color: #505050;
    }

    .ai-dialog .ai-dropdown.show {
        display: block;
    }

    .ai-dialog .ai-dropdown-item {
        padding: 10px 16px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        white-space: nowrap; /* 添加这行 - 禁止折行 */
        gap: 12px; /* 可选：给文字和对勾之间加点间距 */
    }

    .ai-light.ai-dialog .ai-dropdown-item:hover {
        background-color: #f5f5f5;
    }

    .ai-dark.ai-dialog .ai-dropdown-item:hover {
        background-color: #404040;
    }

    .ai-dialog .ai-dropdown-item.selected {
        font-weight: 500;
    }

    .ai-dialog .ai-dropdown-item .checkmark {
        color: #4CAF50;
        display: none;
    }

    .ai-dialog .ai-dropdown-item.selected .checkmark {
        display: block;
    }

    /* 图标按钮 */
    .ai-dialog .icon-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        color: inherit;
    }

    .ai-dialog .icon-btn:hover {
        opacity: 0.7;
    }

    .ai-light.ai-dialog .icon-btn:hover {
        background-color: #f0f0f0;
    }

    .ai-dark.ai-dialog .icon-btn:hover {
        background-color: #404040;
    }

    .ai-dialog .pin-btn {
        position: relative;
        left: 3px;
    }
    .ai-dialog .pin-btn.pinned {
        color: #4CAF50;
    }

    /* 内容区域 */
    .ai-dialog .dialog-content {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        padding-top: 0;
        position: relative;
    }

    .ai-light.ai-dialog .dialog-content {
        background-color: #fff;
    }

    .ai-dark.ai-dialog .dialog-content {
        /* background-color: #1e1e1e; */
    }
    .ai-dark.ai-dialog .user-message .message-content {
        max-width: 90%;
        width: fit-content;
        margin-left: auto;
        background-color: #3b3b3b;
        padding: 10px;
    }
    .ai-dark.ai-dialog .dialog-input::placeholder {
        color: #eee;
    }

    /* 滚动条样式 */
    .ai-light.ai-dialog .dialog-content::-webkit-scrollbar {
        width: 6px;
    }

    .ai-light.ai-dialog .dialog-content::-webkit-scrollbar-thumb {
        background-color: #ccc;
        border-radius: 3px;
    }

    .ai-dark.ai-dialog .dialog-content::-webkit-scrollbar {
        width: 6px;
    }

    .ai-dark.ai-dialog .dialog-content::-webkit-scrollbar-thumb {
        background-color: #555;
        border-radius: 3px;
    }

    /* 消息样式 */
    .ai-dialog .message {
        margin-bottom: 15px;
        line-height: 1.6;
        font-size: 14px;
    }

    .ai-dialog .message-label {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        font-size: 14px;
    }
    .ai-dialog .user-message .message-label {
        justify-content: flex-end;
    }
    /*.ai-dialog .explain-message .message-content:empty::before,
    .ai-dialog .ai-message .message-content:empty::before {
        content: "......";
    }*/
    .ai-dialog .explain-message .message-content:empty::before,
    .ai-dialog .ai-message .message-content:empty::before {
        content: "";
        letter-spacing: 5px;
        animation: typing 2s infinite steps(4);
    }
    @keyframes typing {
        0% { content: "\\2003"; }
        25% { content: "•"; }
        50% { content: "••"; }
        75% { content: "•••"; }
        100% { content: "•••"; }
    }
    .ai-dialog .user-message .message-content {
        max-width: 90%;
        width: fit-content;
        margin-left: auto;
        background-color: #f0f0f0;
        padding: 10px;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 200px;
        overflow: auto;
    }
    .ai-light.ai-dialog .user-message .message-content {
        padding: 10px;
    }
    .ai-dialog .message [data-time] {
        opacity: 0.7;
    }

    .ai-dialog .message-content {
        padding: 6px 12px;
        border-radius: 6px;
    }

    .ai-light.ai-dialog .message-content {
        /* background-color: #fafafa; */
        padding: 0;
    }

    .ai-dark.ai-dialog .message-content {
        background-color: #2a2a2a;
    }

    .ai-dialog .message-actions, .ai-dialog .user-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        display: none;
    }
    .ai-dialog .user-actions {
        justify-content: right;
        display: flex;
    }

    .ai-dialog .message-action-btn, .ai-dialog .user-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: inherit;
        opacity: 0.6;
        font-size: 16px;
    }
    .ai-dialog .user-action-btn {
        display: inline-block;
    }
    .message-action-btn.replace-btn {
        display: none;
    }

    .ai-dialog .message-action-btn:hover {
        opacity: 1;
    }

    .ai-dialog .message-action-btn[disabled],
    .ai-dialog .message-action-btn[disabled]:hover {
        opacity: 0.3;
    }

    /* 滚动到底部按钮 */
    .ai-dialog .scroll-to-bottom {
        position: sticky;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1;
    }

    .ai-light.ai-dialog .scroll-to-bottom {
        background-color: #fff;
        color: #666;
        opacity: 0.85;
    }

    .ai-dark.ai-dialog .scroll-to-bottom {
        background-color: #404040;
        color: #ccc;
        opacity: 0.85;
    }

    .ai-dialog .scroll-to-bottom.show {
        display: flex;
    }

    /* 输入区域 */
    .ai-dialog .dialog-footer {
        padding:0px 10px 10px;
        /* border-top: 1px solid; */
        display: none;
    }

    .ai-light.ai-dialog .dialog-footer {
        border-top-color: #e0e0e0;
        background-color: #fff;
    }

    .ai-dark.ai-dialog .dialog-footer {
        border-top-color: #404040;
        background-color: #2a2a2a;
    }

    .ai-dialog .input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 3px 8px;
        border: 1px solid;
        border-radius: 6px;
    }

    .ai-light.ai-dialog .input-wrapper {
        border-color: #d0d0d0;
        background-color: #fafafa;
    }

    .ai-dark.ai-dialog .input-wrapper {
        border-color: #505050;
        background-color: #1e1e1e;
    }

    .ai-dialog .dialog-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 13px;
        color: inherit;
        resize: none; /* 禁止手动拖拽 */
        overflow: hidden; /* 自动高度时隐藏溢出，超过 max-height 则显示滚动 */
        min-height: 20px; /* 初始高度，与原 input 大小接近 */
        max-height: 150px; /* 最大高度限制 */
        line-height: 1.4;
    }

    .ai-dialog .dialog-input::placeholder {
        opacity: 0.5;
    }
    .ai-dialog .dialog-input::-webkit-scrollbar {
        display: none;
    }

    .ai-dialog .submit-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.6;
        font-size: 18px;
        padding: 4px;
    }
    .ai-dialog .submit-btn.replying {
        color: red;
    }

    .ai-dialog .submit-btn:hover {
        opacity: 1;
    }
    .ai-dialog .chat-message {
        display: none;
    }
    .ai-dialog .message-content ol,
    .ai-dialog .message-content ul {
        list-style-position: outside;
        padding-left: 1.5em;
    }
    .ai-dialog ::selection {
        color: #1a1a1a;
    }
    .ai-dark.ai-dialog ::selection {
        color: #f5f5f5;
    }
    .ai-dialog pre {
      background: #f5f5f5ff;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
    }
    .ai-dark.ai-dialog pre {
      background: #0f0f0fff;
    }
    .ai-dialog code {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
    }
    .ai-dialog .chat-welcome {
        display: none;
        text-align: center;
    }
    .ai-dialog .chat-welcome h3{
        margin-top:10px;
        margin-bottom: 20px;
    }
    .ai-dialog .chat-welcome > div {
        color: #888;
        line-height: 180%;
    }
    .ai-dialog .pasted-images {
        max-height: 100px;
        overflow: auto;
        display: flex;
        gap: 10px;
    }
    .ai-dialog .pasted-images .image-preview{
        position: relative;
    }
    .ai-dialog .pasted-images .image-preview img{
        max-width: 60px;
        max-height: 60px;
    }
    .ai-dialog .pasted-images .remove-image {
        position: absolute;
        top: 5px;
        right: 5px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
    }
    .image-viewer-overlay {
        background: rgba(0, 0, 0, 0.8) !important;
    }

    /* 当有2个及以上，且除了第一个以外 */
    .ai-dialog .explain-message .message-content:not(:nth-child(1)),
    .ai-dialog .ai-message .message-content:not(:nth-child(2)) {
        border-top: 2px dashed; #888;
        border-radius: 0;
        padding-top: 10px;
    }
    /* 当有2个及以上，且除了最后一个以外 */
    .ai-dialog .explain-message:has(.message-content:nth-child(2)) .message-content:not(:has(+.message-actions)),
    .ai-dialog .ai-message:has(.message-content:nth-child(3)) .message-content:not(:has(+.message-actions)) {
        padding-bottom: 10px;
    }
    .ai-dialog .explain-message:has(.message-content:nth-child(2)) .message-content:hover,
    .ai-dialog .ai-message:has(.message-content:nth-child(3)) .message-content:hover
        background-color: #f1f0f0;
    }
    .ai-dialog .explain-message:has(.message-content:nth-child(2)) .message-content.message-selected,
    .ai-dialog .ai-message:has(.message-content:nth-child(3)) .message-content.message-selected{
        background-color: #d5e9ff;
    }
    .ai-dialog.ai-dark .explain-message:has(.message-content:nth-child(2)) .message-content:hover,
    .ai-dialog.ai-dark .ai-message:has(.message-content:nth-child(3)) .message-content:hover{
        background-color: #222;
    }
    .ai-dialog.ai-dark .explain-message:has(.message-content:nth-child(2)) .message-content.message-selected,
    .ai-dialog.ai-dark .ai-message:has(.message-content:nth-child(3)) .message-content.message-selected{
        background-color: #040e19;
    }

    /* =========================================
    深度思考：默认 / 浅色模式样式
    ========================================= */
    .ai-dialog .ai-message .message-content details,
    .ai-dialog .explain-message .message-content details {
        background-color: #f7f9fa;       /* 非常浅的蓝灰色背景 */
        border: 1px solid #e1e4e8;       /* 柔和的边框 */
        border-radius: 8px;              /* 圆角 */
        padding: 10px 14px;
        margin-bottom: 16px;             /* 与下方回答的间距 */
        transition: all 0.2s ease;
        font-size: 14px;
        line-height: 1.5;
    }

    /* 鼠标悬停时的微交互 */
    .ai-dialog .ai-message .message-content details:hover,
    .ai-dialog .explain-message .message-content details:hover {
        border-color: #d1d5da;
        background-color: #f1f3f5;
    }

    /* 标题样式 (Summary) */
    .ai-dialog .ai-message .message-content details summary,
    .ai-dialog .explain-message .message-content details summary {
        cursor: pointer;
        color: #57606a;                  /* 次级文本颜色 */
        font-weight: 600;
        user-select: none;
        outline: none;
        display: list-item;              /* 保持默认的小三角箭头 */
    }

    /* 展开后的内容样式 (思考过程文本) */
    .ai-dialog .ai-message .message-content details p,
    .ai-dialog .explain-message .message-content details p,
    .ai-dialog .ai-message .message-content details div,
    .ai-dialog .explain-message .message-content details div {
        color: #5c646c;                  /* 比标题更浅一点的颜色 */
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #e1e4e8;  /* 虚线分割线 */
        font-family: "Menlo", "Consolas", monospace; /* 可选：使用等宽字体增加“日志”感 */
        font-size: 13px;
    }


    /* =========================================
    深度思考：黑暗模式样式 (.ai-dark)
    ========================================= */
    .ai-dialog.ai-dark .ai-message .message-content details,
    .ai-dialog.ai-dark .explain-message .message-content details {
        background-color: #2d333b;       /* 深色背景 (GitHub Dark Dimmed 风格) */
        border: 1px solid #444c56;       /* 深色边框 */
        color: #adbac7;                  /* 基础文字颜色 */
    }

    /* 黑暗模式悬停效果 */
    .ai-dialog.ai-dark .ai-message .message-content details:hover,
    .ai-dialog.ai-dark .explain-message .message-content details:hover {
        border-color: #768390;
        background-color: #373e47;
    }

    /* 黑暗模式标题样式 */
    .ai-dialog.ai-dark .ai-message .message-content details summary,
    .ai-dialog.ai-dark .explain-message .message-content details summary {
        color: #79c0ff;                  /* 柔和的蓝色高亮标题 */
    }

    /* 黑暗模式展开内容样式 */
    .ai-dialog.ai-dark .ai-message .message-content details p,
    .ai-dialog.ai-dark .explain-message .message-content details p,
    .ai-dialog.ai-dark .ai-message .message-content details div,
    .ai-dialog.ai-dark .explain-message .message-content details div {
        color: #b9c9d9;                  /* 略暗的文字颜色 */
        border-top: 1px dashed #444c56;  /* 深色分割线 */
    }

    /* 输入框右键菜单项样式 */
    #aiDialogInputMenu .input-menu-item:hover {
        background-color: #f1f0f0!important;
    }

    body:has(.ai-dialog.ai-dark) #aiDialogInputMenu .input-menu-item:hover {
        background-color: #353535 !important;
    }

    .ai-dialog .context-data-item{
        font-size: 13px;
        margin-top: 5px;
    }
    .ai-dialog .context-data-item .remove-btn {
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        cursor: pointer;
        font-size: 13px;
        display: inline-block;
        text-align: center;
        margin-left: 5px;
    }

    /*.ai-dialog .explain-message pre:has(code),.ai-dialog .ai-message pre:has(code){
        max-height: 500px;
    }*/
   .ai-dialog .explain-message pre:has(code) .ai-code-copy-btn,.ai-dialog .ai-message pre:has(code) .ai-code-copy-btn{
        visibility: hidden;
        pointer-events: none;
    }
    .ai-dialog .explain-message pre:has(code):hover .ai-code-copy-btn,.ai-dialog .ai-message pre:has(code):hover .ai-code-copy-btn{
        visibility: visible;
        pointer-events: auto;
    }
    .ai-dialog #saveBtn {
        display: none;
    }
}
`;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // 生成html
    const html = `
    <!-- AI对话框 -->
    <div class="ai-dialog" id="aiDialog">
        <div class="dialog-header">
            <div class="dialog-header-left">
                <span class="dialog-title">解释</span>
                <button class="icon-btn mini-btn" id="miniBtn" title="最小化">
                    <svg t="1763898601190" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17290" width="16" height="16"><path d="M144 567c-24.3 0-44-19.7-44-44s19.7-44 44-44h736.127c24.3 0 44 19.7 44 44s-19.7 44-44 44H144z" fill="currentColor" p-id="17291"></path></svg>
                </button>
            </div>
            <div class="dialog-header-right">
                <button class="icon-btn new-btn" id="newBtn" title="新建对话">
                    <svg t="1763898275053" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11644" width="16" height="16"><path d="M554.76 549.889v341c0 26.51-21.491 48-48 48-26.51 0-48-21.49-48-48v-341H114.172c-26.51 0-48-21.49-48-48s21.49-48 48-48H458.76v-340c0-26.51 21.49-48 48-48s48 21.49 48 48v340h346.414c26.51 0 48 21.49 48 48s-21.49 48-48 48H554.76z" fill="currentColor" p-id="11645"></path></svg>
                </button>
                <button class="icon-btn save-btn" id="saveBtn" title="保存对话">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 32 32"><path d="M29.177 11.294h-7.529v-11.294h-11.294v11.294h-7.529l13.176 13.176 13.177-13.177zM14.118 15.059v-11.294h3.765v11.294h2.202l-4.085 4.085-4.085-4.085h2.202zM2.824 28.235h26.353v3.765h-26.353z"></path></svg>
                </button>
                <div class="ai-selector">
                    <button class="ai-select-btn" id="aiSelectBtn">
                        <span id="selectedAI">AI</span>
                        <span>
                            <svg t="1762696818337" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1544" width="14" height="14"><path d="M895.701333 300.117333c0 9.6-3.2 19.285333-9.6 27.392l-340.906666 423.808a43.733333 43.733333 0 0 1-68.096 0L137.984 329.301333A43.690667 43.690667 0 0 1 206.08 274.602667l305.109333 379.605333 306.773334-381.525333a43.690667 43.690667 0 0 1 77.738666 27.434666z" fill="currentColor" opacity=".65" p-id="1545"></path></svg>
                        </span>
                    </button>
                    <div class="ai-dropdown" id="aiDropdown">
                        <div class="ai-dropdown-item" data-value="qwen3">
                            <span>Qwen3-Coder</span>
                            <span class="checkmark">✓</span>
                        </div>
                        <div class="ai-dropdown-item selected" data-value="deepseek">
                            <span>DeepSeek-R1</span>
                            <span class="checkmark">✓</span>
                        </div>
                    </div>
                </div>
                <button class="icon-btn pin-btn" id="pinBtn" title="钉住">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M13.694 1.894c-.442-.442-1.06-.384-1.45.006-.379.378-.344 1.032.036 1.408l1.194 1.199-3.2 3.2c-.096.095-.267.107-.402.107l-6.31.434a.5.5 0 0 0-.359.15l-.568.567a1 1 0 0 0-.002 1.43l4.583 4.584-4.661 4.671a1 1 0 0 0 0 1.414l.015.015a1 1 0 0 0 1.415 0l4.664-4.665 4.584 4.58a1.005 1.005 0 0 0 1.422-.009l.57-.568a.5.5 0 0 0 .148-.36l.441-6.303c0-.13.025-.288.12-.383l3.201-3.2 1.199 1.191c.502.502 1.15.297 1.417.031.436-.436.379-1.063-.003-1.445zm1.227 4.058 2.833 2.83-3.828 3.835-.417 5.83-8.27-8.275 5.867-.4z"></path></svg>
                </button>
                <button class="icon-btn close-btn" id="closeBtn" title="关闭">✕</button>
            </div>
        </div>

        <div class="dialog-content" id="dialogContent">
            <div class="message explain-message">
                <div class="message-content"></div>
                <div class="message-actions">
                    <button class="message-action-btn edit-btn" title="编辑">
                        <svg width="14" height="14" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7137" width="16" height="16"><path d="M787.2 1024.064H138.944A139.136 139.136 0 0 1 0 885.184V236.864a139.136 139.136 0 0 1 138.944-138.88h324.16a46.336 46.336 0 0 1 0 92.608H138.944a46.4 46.4 0 0 0-46.336 46.336v648.256a46.4 46.4 0 0 0 46.336 46.336H787.2a46.4 46.4 0 0 0 46.336-46.336V561.024a46.272 46.272 0 0 1 92.608 0v324.16a139.136 139.136 0 0 1-138.944 138.88z" fill="currentColor" p-id="7138"></path><path d="M324.16 746.304a46.272 46.272 0 0 1-44.8-57.6l46.336-185.28a45.824 45.824 0 0 1 12.16-21.504L777.664 42.112a144.576 144.576 0 0 1 204.416 204.416l-439.936 439.872a45.824 45.824 0 0 1-21.504 12.16l-185.6 46.336a44.8 44.8 0 0 1-10.88 1.408z m88.128-207.872l-24.512 97.92 97.92-24.512 430.848-430.848a51.968 51.968 0 0 0-36.736-88.384 51.2 51.2 0 0 0-36.544 15.04z" fill="currentColor" p-id="7139"></path></svg>
                    </button>
                    <button class="message-action-btn replace-btn" title="在光标处替换/插入">
                        <svg t="1763268592172" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8879" width="16" height="16"><path d="M64 896h896v64H64v-64zM64 64h896v64H64V64z m512 224h320v448H576v-448z m64 64v320h192v-320h-192zM64 519.488l192-146.048v114.048h171.136v64H256V665.6L64 519.488z" fill="currentColor" p-id="8880"></path></svg>
                    </button>
                    <button class="message-action-btn copy-btn" title="点击复制&#10;shift+点击复制所有对话">
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M21 3.5V17a2 2 0 0 1-2 2h-2v-2h2V3.5H9v2h5.857c1.184 0 2.143.895 2.143 2v13c0 1.105-.96 2-2.143 2H5.143C3.959 22.5 3 21.605 3 20.5v-13c0-1.105.96-2 2.143-2H7v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2m-6.143 4H5.143v13h9.714z" clip-rule="evenodd"></path></svg>
                    </button>
                    <button class="message-action-btn refresh-btn" title="重新生成">
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 4a7.98 7.98 0 0 0-6.02 2.732L4.473 5.415A9.98 9.98 0 0 1 12 2c5.523 0 10 4.477 10 10h1.478a.5.5 0 0 1 .394.807l-2.477 3.186a.5.5 0 0 1-.79 0l-2.477-3.186a.5.5 0 0 1 .394-.807H20a8 8 0 0 0-8-8m0 18c3 0 5.693-1.322 7.526-3.415l-1.505-1.317A8 8 0 0 1 4 12h1.397a.5.5 0 0 0 .376-.83L3.376 8.43a.5.5 0 0 0-.752 0L.226 11.17a.5.5 0 0 0 .376.83H2c0 5.523 4.477 10 10 10" clip-rule="evenodd"></path></svg>
                    </button>
                    <button class="message-action-btn delete-btn" title="删除">
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h5a1 1 0 1 1 0 2h-1v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6H3a1 1 0 0 1 0-2zM6 6v14h12V6zm4 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1"></path></svg>
                    </button>
                </div>
            </div>

            <div class="chat-welcome">
                <h3>开始与AI对话吧！</h3>
                <div>Enter提交</div>
                <div>Shift+Enter换行</div>
                <div class="welcome-help"></div>
            </div>

            <div class="chat-message">
                <div class="message user-message">
                    <div class="message-label">
                        <span data-time="">12:45</span>
                        <span>用户</span>
                        <span>👤</span>
                    </div>
                    <div class="message-content">用户消息演示</div>
                </div>

                <div class="message ai-message">
                    <div class="message-label">
                        <span>🤖</span>
                        <span>AI</span>
                        <span data-time="">12:45</span>
                    </div>
                    <div class="message-content">
                        <p>AI消息演示1</p>
                    </div>
                    <div class="message-actions">
                        <button class="message-action-btn edit-btn" title="编辑">
                            <svg width="14" height="14" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7137" width="16" height="16"><path d="M787.2 1024.064H138.944A139.136 139.136 0 0 1 0 885.184V236.864a139.136 139.136 0 0 1 138.944-138.88h324.16a46.336 46.336 0 0 1 0 92.608H138.944a46.4 46.4 0 0 0-46.336 46.336v648.256a46.4 46.4 0 0 0 46.336 46.336H787.2a46.4 46.4 0 0 0 46.336-46.336V561.024a46.272 46.272 0 0 1 92.608 0v324.16a139.136 139.136 0 0 1-138.944 138.88z" fill="currentColor" p-id="7138"></path><path d="M324.16 746.304a46.272 46.272 0 0 1-44.8-57.6l46.336-185.28a45.824 45.824 0 0 1 12.16-21.504L777.664 42.112a144.576 144.576 0 0 1 204.416 204.416l-439.936 439.872a45.824 45.824 0 0 1-21.504 12.16l-185.6 46.336a44.8 44.8 0 0 1-10.88 1.408z m88.128-207.872l-24.512 97.92 97.92-24.512 430.848-430.848a51.968 51.968 0 0 0-36.736-88.384 51.2 51.2 0 0 0-36.544 15.04z" fill="currentColor" p-id="7139"></path></svg>
                        </button>
                        <button class="message-action-btn replace-btn" title="在光标处替换/插入">
                            <svg t="1763268592172" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8879" width="16" height="16"><path d="M64 896h896v64H64v-64zM64 64h896v64H64V64z m512 224h320v448H576v-448z m64 64v320h192v-320h-192zM64 519.488l192-146.048v114.048h171.136v64H256V665.6L64 519.488z" fill="currentColor" p-id="8880"></path></svg>
                        </button>
                        <button class="message-action-btn copy-btn" title="点击复制&#10;shift+点击复制所有对话">
                            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M21 3.5V17a2 2 0 0 1-2 2h-2v-2h2V3.5H9v2h5.857c1.184 0 2.143.895 2.143 2v13c0 1.105-.96 2-2.143 2H5.143C3.959 22.5 3 21.605 3 20.5v-13c0-1.105.96-2 2.143-2H7v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2m-6.143 4H5.143v13h9.714z" clip-rule="evenodd"></path></svg>
                        </button>
                        <button class="message-action-btn refresh-btn" title="重新生成">
                            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 4a7.98 7.98 0 0 0-6.02 2.732L4.473 5.415A9.98 9.98 0 0 1 12 2c5.523 0 10 4.477 10 10h1.478a.5.5 0 0 1 .394.807l-2.477 3.186a.5.5 0 0 1-.79 0l-2.477-3.186a.5.5 0 0 1 .394-.807H20a8 8 0 0 0-8-8m0 18c3 0 5.693-1.322 7.526-3.415l-1.505-1.317A8 8 0 0 1 4 12h1.397a.5.5 0 0 0 .376-.83L3.376 8.43a.5.5 0 0 0-.752 0L.226 11.17a.5.5 0 0 0 .376.83H2c0 5.523 4.477 10 10 10" clip-rule="evenodd"></path></svg>
                        </button>
                        <button class="message-action-btn delete-btn" title="删除">
                            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h5a1 1 0 1 1 0 2h-1v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6H3a1 1 0 0 1 0-2zM6 6v14h12V6zm4 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1"></path></svg>
                        </button>
                    </div>
                </div>
            </div>

            <button class="scroll-to-bottom" id="scrollToBottom">↓</button>
        </div>

        <div class="dialog-footer">
            <div class="pasted-images" id="pastedImages">
                <div class="placeholder" id="imagePlaceholder"></div>
            </div>
            <div class="context-data" id="contextData"></div>
            <div class="input-wrapper">
                <textarea class="dialog-input" id="dialogInput" placeholder="继续提问" rows="1"></textarea>
                <button class="submit-btn" id="submitBtn" title="发送">→</button>
            </div>
        </div>
    </div>
`;
    document.body.insertAdjacentHTML('beforeend', html);

    // js代码部分
    // 元素引用
    const dialog = document.getElementById('aiDialog');
    const dialogContent = document.getElementById('dialogContent');
    const dialogInput = document.getElementById('dialogInput');
    const submitBtn = document.getElementById('submitBtn');
    const scrollToBottomBtn = document.getElementById('scrollToBottom');
    const newBtn = document.getElementById('newBtn');
    const saveBtn = document.getElementById('saveBtn');
    const pinBtn = document.getElementById('pinBtn');
    const closeBtn = document.getElementById('closeBtn');
    const miniBtn = document.getElementById('miniBtn');
    const aiSelectBtn = document.getElementById('aiSelectBtn');
    const aiDropdown = document.getElementById('aiDropdown');
    const unPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M13.694 1.894c-.442-.442-1.06-.384-1.45.006-.379.378-.344 1.032.036 1.408l1.194 1.199-3.2 3.2c-.096.095-.267.107-.402.107l-6.31.434a.5.5 0 0 0-.359.15l-.568.567a1 1 0 0 0-.002 1.43l4.583 4.584-4.661 4.671a1 1 0 0 0 0 1.414l.015.015a1 1 0 0 0 1.415 0l4.664-4.665 4.584 4.58a1.005 1.005 0 0 0 1.422-.009l.57-.568a.5.5 0 0 0 .148-.36l.441-6.303c0-.13.025-.288.12-.383l3.201-3.2 1.199 1.191c.502.502 1.15.297 1.417.031.436-.436.379-1.063-.003-1.445zm1.227 4.058 2.833 2.83-3.828 3.835-.417 5.83-8.27-8.275 5.867-.4z"></path></svg>`;
    const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12.243 2c.39-.39 1.01-.448 1.451-.006l8.054 8.054c.382.382.439 1.01.003 1.445-.266.267-.915.471-1.417-.03l-1.199-1.192-3.2 3.2c-.096.095-.12.253-.12.383l-.442 6.304a.5.5 0 0 1-.149.36l-.569.567a1.005 1.005 0 0 1-1.422.01l-4.584-4.58-4.664 4.664a1 1 0 0 1-1.415 0l-.014-.015a1 1 0 0 1-.001-1.414l4.661-4.67-4.583-4.585a1 1 0 0 1 .002-1.43l.568-.567a.5.5 0 0 1 .358-.15l6.311-.434c.135 0 .306-.012.401-.107l3.201-3.2-1.194-1.199c-.38-.376-.415-1.03-.037-1.408"></path></svg>`;
    const refreshSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 4a7.98 7.98 0 0 0-6.02 2.732L4.473 5.415A9.98 9.98 0 0 1 12 2c5.523 0 10 4.477 10 10h1.478a.5.5 0 0 1 .394.807l-2.477 3.186a.5.5 0 0 1-.79 0l-2.477-3.186a.5.5 0 0 1 .394-.807H20a8 8 0 0 0-8-8m0 18c3 0 5.693-1.322 7.526-3.415l-1.505-1.317A8 8 0 0 1 4 12h1.397a.5.5 0 0 0 .376-.83L3.376 8.43a.5.5 0 0 0-.752 0L.226 11.17a.5.5 0 0 0 .376.83H2c0 5.523 4.477 10 10 10" clip-rule="evenodd"></path></svg>`;
    const stopSvg = `<svg t="1763714722127" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9568" width="16" height="16"><path d="M950.857155 109.714286l0 804.571429q0 14.848-10.825143 25.746286t-25.746286 10.825143l-804.571429 0q-14.848 0-25.746286-10.825143t-10.825143-25.746286l0-804.571429q0-14.848 10.825143-25.746286t25.746286-10.825143l804.571429 0q14.848 0 25.746286 10.825143t10.825143 25.746286z" fill="#d81e06" p-id="9569"></path></svg>`;
    const copySvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.14926 4.02039C7.11194 4.02039 7.8798 4.02023 8.49594 4.07605C9.12125 4.13276 9.65789 4.25194 10.1414 4.53113C10.7201 4.86536 11.2008 5.34597 11.535 5.92468C11.8142 6.40824 11.9334 6.94488 11.9901 7.57019C12.0459 8.18631 12.0457 8.95426 12.0457 9.91687C12.0457 10.8795 12.0459 11.6474 11.9901 12.2635C11.9334 12.8889 11.8142 13.4255 11.535 13.9091C11.2008 14.4877 10.7201 14.9684 10.1414 15.3026C9.65789 15.5818 9.12125 15.701 8.49594 15.7577C7.87981 15.8135 7.11193 15.8134 6.14926 15.8134C5.18664 15.8134 4.41871 15.8135 3.80258 15.7577C3.17727 15.701 2.64063 15.5818 2.15707 15.3026C1.57837 14.9684 1.09775 14.4877 0.763519 13.9091C0.484335 13.4255 0.365153 12.8889 0.308441 12.2635C0.252618 11.6474 0.252777 10.8795 0.252777 9.91687C0.252777 8.95425 0.252634 8.18632 0.308441 7.57019C0.365153 6.94488 0.484335 6.40824 0.763519 5.92468C1.09774 5.34596 1.57836 4.86535 2.15707 4.53113C2.64063 4.25194 3.17727 4.13276 3.80258 4.07605C4.41871 4.02024 5.18663 4.02039 6.14926 4.02039ZM6.14926 5.37781C5.16178 5.37781 4.46631 5.37768 3.92563 5.42664C3.39431 5.47479 3.07856 5.5658 2.83578 5.70593C2.46317 5.92112 2.15351 6.23077 1.93832 6.60339C1.7982 6.84617 1.70718 7.16192 1.65903 7.69324C1.61007 8.23391 1.6102 8.9294 1.6102 9.91687C1.6102 10.9044 1.61006 11.5998 1.65903 12.1405C1.70718 12.6718 1.7982 12.9876 1.93832 13.2303C2.15352 13.6029 2.46318 13.9126 2.83578 14.1278C3.07856 14.2679 3.39431 14.3589 3.92563 14.4071C4.46631 14.4561 5.16179 14.4559 6.14926 14.4559C7.13679 14.4559 7.83221 14.4561 8.37289 14.4071C8.90422 14.3589 9.21996 14.2679 9.46274 14.1278C9.83532 13.9126 10.145 13.6029 10.3602 13.2303C10.5003 12.9876 10.5913 12.6718 10.6395 12.1405C10.6885 11.5998 10.6883 10.9044 10.6883 9.91687C10.6883 8.92941 10.6885 8.23391 10.6395 7.69324C10.5913 7.16192 10.5003 6.84617 10.3602 6.60339C10.145 6.23078 9.83533 5.92113 9.46274 5.70593C9.21996 5.5658 8.90421 5.47479 8.37289 5.42664C7.83221 5.37766 7.13679 5.37781 6.14926 5.37781ZM9.80161 0.368042C10.7638 0.368042 11.5314 0.367947 12.1473 0.423706C12.7725 0.480374 13.3093 0.598826 13.7928 0.877808C14.3716 1.21198 14.8521 1.69361 15.1864 2.27234C15.4655 2.75581 15.5857 3.29171 15.6424 3.91687C15.6983 4.53307 15.6971 5.30167 15.6971 6.26453V7.82996C15.6971 8.29271 15.6989 8.59 15.6649 8.84851C15.4668 10.3526 14.4009 11.5739 12.9832 11.9989V10.5468C13.6973 10.1904 14.2104 9.49669 14.3192 8.67175C14.3387 8.52354 14.3407 8.33586 14.3407 7.82996V6.26453C14.3407 5.27713 14.3398 4.58155 14.2909 4.04089C14.2427 3.50975 14.1526 3.19379 14.0125 2.95105C13.7974 2.57856 13.4875 2.26876 13.1151 2.05359C12.8723 1.91353 12.5564 1.82244 12.0252 1.77429C11.4847 1.72534 10.7888 1.72546 9.80161 1.72546H7.71469C6.75617 1.72565 5.92662 2.27704 5.52328 3.07898H4.07016C4.54218 1.51138 5.99317 0.368253 7.71469 0.368042H9.80161Z" fill="currentColor"></path></svg>`;
    const okSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9.218 17.41 19.83 6.796a.99.99 0 1 1 1.389 1.415c-3.545 3.425-4.251 4.105-11.419 11.074a.997.997 0 0 1-1.375.018c-1.924-1.801-3.709-3.568-5.573-5.43a.999.999 0 0 1 1.414-1.413z"></path></svg>`;

    // 状态
    let isPinned = false, isHumanPinned = false, isHumanDragged = false, isVerticalDragged = false;
    let isDragging = false;
    let currentX, currentY, initialX, initialY, cvk;
    let triggerElement = null;
    let history = [], globalHistory = createGlobalHistory();
    let models = [], model = {};
    let button = {}, chatButton = {}, context = '';
    let stream = null;
    let config = {};
    let setModel = null;
    let tools = {}, isWithCurrentDoc = false, currentDoc = {};
    let maxHeight='none', width='420px';

    // 主题切换
    function toggleTheme() {
        document.body.classList.toggle('dark');
        document.body.classList.toggle('light');
    }

    function setConfig(userConfig) {
        config = userConfig || {};
    }

    // 打开对话框
    function openDialog(options = {}) {
        clearHistory();
        resetChats('new-dialog');
        const btnElement = options.el || null;
        triggerElement = btnElement;
        if (options.theme === 'dark') {
            dialog.classList.add('ai-dark');
            dialog.classList.remove('ai-light');
        } else {
            dialog.classList.add('ai-light');
            dialog.classList.remove('ai-dark');
        }
        dialog.style.zIndex = options.zIndex || 10000;
        config = options.config || {};
        models = options.models || [];
        model = options.model || {};
        chatButton = options.chatButton || {};
        //dialog.querySelector('#selectedAI').innerHTML = model.modelName || 'AI';
        if (models.length > 0) {
            dialog.querySelector('#aiDropdown').innerHTML = '';
            let html = '';
            models.forEach((item, index) => {
                html += `
                <div class="ai-dropdown-item ${model.model === item.model ? 'selected' : ''}" data-value="${item.model}" data-name="${item.modelName}" data-index="${index}">
                    <span>${item.modelName}</span>
                    <span class="checkmark">${model.model === item.model ? '✓' : ''}</span>
                </div>
            `;
            });
            dialog.querySelector('#aiDropdown').innerHTML = html;
        }
        button = options.button || {};
        context = options.context || '';
        dialog.querySelector('.dialog-title').innerHTML = button.name.replace(/^AI/i, '') || '解释';
        setModel = options.setModel || null;
        tools = options.tools || {};
        if(options?.globalHistoryNum > 0 && options?.globalHistoryNum !== globalHistory.maxLength) globalHistory.setMaxLength(options.globalHistoryNum);
        setTimeout(async () => {
            if(globalHistory.length === 0 && typeof tools.getGlobalHistory === 'function') {
                const gh = await tools.getGlobalHistory();
                if(gh.length) globalHistory.setData(gh);
            }
        });
        if(options?.help) dialog.querySelector('.chat-welcome .welcome-help').innerHTML = options.help;
        if(typeof tools?.saveDialogChats === 'function') dialog.querySelector('#saveBtn').style.display = 'flex';
        dialog.classList.add('show');
        let hasBeenShown = false;
        if (!isPinned && !dialog.hasBeenShown) {
            if (options.width) {
                hasBeenShown = true;
                dialog.style.width = options.width + 'px';
                width = options.width+ 'px';
            }
            if (options.maxHeight) {
                hasBeenShown = true;
                dialog.style.maxHeight = options.maxHeight + 'px';
                maxHeight = options.maxHeight+ 'px';
            }
        }
        if (options.position === 'followTarget' && btnElement) {
            // 跟随目标元素
            positionDialog(btnElement);
        } else {
            // 用户自定义
            if (options.left && options.top && !isPinned && !dialog.hasBeenShown) {
                hasBeenShown = true;
                dialog.style.left = options.left + 'px';
                dialog.style.top = options.top + 'px';
            }
        }
        if (hasBeenShown) dialog.hasBeenShown = true;
        if(button?.pin) pin();
        else if(!isHumanPinned) pin(false);
        checkScrollButton();
    }

    // 关闭对话框
    function closeDialog() {
        if (!dialog.classList.contains('show')) return;
        dialog.classList.remove('show');
        triggerElement = null;
        stopReply();
        if(typeof popup !== 'undefined' && popup?.close) popup.close();
    }

    // 定位对话框
    function positionDialog(btnElement) {
        if (isPinned) return;
        const btnRect = btnElement.getBoundingClientRect();
        const dialogHeight = 468;
        const dialogWidth = 420;
        const spacing = 8;
        const minTopDistance = 32;

        let top, left;

        // 计算左右位置（居中对齐按钮）
        left = btnRect.left;// + (btnRect.width / 2) - (dialogWidth / 2);

        // 确保不超出左右边界
        //if (left < 10) left = 10;
        // if (left + dialogWidth > window.innerWidth - 10) {
        //     left = window.innerWidth - dialogWidth - 10;
        // }

        // 计算上下位置
        const spaceBelow = window.innerHeight - btnRect.bottom;
        const spaceAbove = btnRect.top;

        if (spaceBelow >= dialogHeight + spacing) {
            // 下方空间足够
            top = btnRect.bottom + spacing;
        } else if (spaceAbove >= dialogHeight + spacing) {
            // 上方空间足够
            top = btnRect.top - dialogHeight - spacing;
        } else {
            // 都不够，优先显示在下方
            top = btnRect.bottom + spacing;
        }

        // 确保不超出顶部最小距离
        if (top < minTopDistance) {
            top = minTopDistance;
        }

        // 确保不超出底部
        if (top + dialogHeight > window.innerHeight - 10) {
            top = window.innerHeight - dialogHeight - 10;
        }

        dialog.style.left = left + 'px';
        dialog.style.top = top + 'px';
    }

    // 拖动功能
    const header = dialog.querySelector('.dialog-header');

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    const resetDialog = (action = '') => {
        dialog.style.top = dialogPosition.top;
        dialog.style.left = dialogPosition.left;
        dialog.style.width = isHumanDragged && isVerticalDragged ? dialogPosition.width : width;
        dialog.style.height = isHumanDragged && isVerticalDragged ? dialogPosition.height : 'auto';
        dialog.style.maxHeight = isHumanDragged && isVerticalDragged ? dialogPosition.maxHeight : maxHeight;
        dialogPosition.isMaxed = false;
        dialogPosition = {};

        header.querySelector('#miniBtn').style.display = 'none';
        isMini = false;
        if (action === 'new-dialog') {
            dialog.querySelector('.dialog-footer').style.display = 'none';
            dialog.querySelector('.explain-message .message-actions').style.display = 'none';
        } else {
            dialog.querySelector('.dialog-content').style.display = 'block';
            dialog.querySelector('.dialog-footer').style.display = 'block';
        }
    };
    // 最大化
    let dialogPosition = {};
    header.addEventListener('dblclick', () => {
        if (dialogPosition?.isMaxed) {
            // 还原
            resetDialog();
        } else {
            // 保存当前位置和尺寸
            const rect = getComputedStyle(dialog);
            dialogPosition.top = dialog.style.top || rect.top;
            dialogPosition.left = dialog.style.left || rect.left;
            dialogPosition.width = dialog.style.width || rect.width;
            dialogPosition.height = dialog.style.height || rect.height;
            dialogPosition.maxHeight = dialog.style.maxHeight || rect.maxHeight;
            dialogPosition.isMaxed = true;

            // 最大化
            dialog.style.top = '32px';
            dialog.style.left = '0';
            dialog.style.width = '100vw';
            dialog.style.height = 'calc(100vh - 32px)';
            dialog.style.maxHeight = 'calc(100vh - 32px)';

            header.querySelector('#miniBtn').style.display = 'flex';
        }
    });

    function dragStart(e) {
        if (e.target.closest('.dialog-header-right')) return;

        isDragging = true;
        initialX = e.clientX - dialog.offsetLeft;
        initialY = e.clientY - dialog.offsetTop;
        dialog.style.cursor = 'move';
    }

    function drag(e) {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        const minTop = 32;
        const maxTop = window.innerHeight - 50;
        const maxLeft = window.innerWidth - 50;

        // 限制拖动范围
        if (currentY < minTop) currentY = minTop;
        if (currentY > maxTop) currentY = maxTop;
        if (currentX < -370) currentX = -370;
        if (currentX > maxLeft) currentX = maxLeft;

        dialog.style.left = currentX + 'px';
        dialog.style.top = currentY + 'px';
    }

    function dragEnd() {
        isDragging = false;
        dialog.style.cursor = 'default';
    }

    // 滚动检测
    dialogContent.addEventListener('scroll', checkScrollButton);

    function checkScrollButton() {
        const isAtBottom = dialogContent.scrollHeight - dialogContent.scrollTop <= dialogContent.clientHeight + 10;
        if (isAtBottom) {
            scrollToBottomBtn.classList.remove('show');
        } else {
            scrollToBottomBtn.classList.add('show');
        }
    }

    // 滚动到底部
    scrollToBottomBtn.addEventListener('click', () => {
        dialogContent.scrollTo({
            top: dialogContent.scrollHeight,
            behavior: 'smooth'
        });
    });

    // 文本框（textarea）自动高度与提交逻辑
    function adjustInputHeight() {
        if (!dialogInput) return;
        // 先重置为 auto 以获取真实 scrollHeight
        dialogInput.style.height = 'auto';
        const newHeight = Math.min(dialogInput.scrollHeight, 200);
        dialogInput.style.height = newHeight + 'px';
        // 超过最大高度时显示滚动条
        if (dialogInput.scrollHeight > 200) {
            dialogInput.style.overflowY = 'auto';
        } else {
            dialogInput.style.overflowY = 'hidden';
        }
    }

    // 提交消息（Enter 提交）
    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[c];
        });
    }

    function formatTimeAdvanced(timeStr) {
        const inputDate = new Date(timeStr);
        const now = new Date();

        // 重置时间为当天0点，用于精确计算日期差
        const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
        const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 计算日期差（天数）
        const timeDiff = nowDateOnly.getTime() - inputDateOnly.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        // 获取时分
        const hours = inputDate.getHours().toString().padStart(2, '0');
        const minutes = inputDate.getMinutes().toString().padStart(2, '0');
        const timeStrFormatted = `${hours}:${minutes}`;

        // 根据日期差返回不同格式
        switch (dayDiff) {
            case 0:
                return timeStrFormatted;  // 当天显示时分
            case 1:
                return `昨天 ${timeStrFormatted}`;  // 昨天 时分
            default:
                return `${dayDiff}天前 ${timeStrFormatted}`;  // n天前 时分
        }
    }

    function getUrl(url) {
        // 以 /chat/completions 结尾，则返回原URL
        if (/\/chat\/completions$/i.test(url)) return url;
        // 以 # 结尾，则使用原始输入且删除末尾的 #
        if (/#$/i.test(url)) return url.replace(/#$/, '');
        // 否则添加 /chat/completions
        return url.replace(/\/$/, '') + '/chat/completions';
    }

    function getRequestId() {
        return new Date().toLocaleString().replace(/[\/: ]/g, '')+'-'+Math.random().toString(36).substring(7);
    }

    function getTarget(target) {
        return typeof target === 'string' ? (dialog||document).querySelector(target) : target;
    }

    function writeHistory(target, message, content, requestId) {
        history.push({ role: "user", content: message, requestId });
        history.push({ role: "assistant", content: content, requestId });
        globalHistory.push({ role: "user", content: message, requestId });
        globalHistory.push({ role: "assistant", content: content, requestId });
        const targetEl = getTarget(target);
        if(targetEl) targetEl.dataset.requestId = requestId;
    }

    function updateHistory(requestId, content, target) {
        if(target) {
            const parent = target?.parentElement;
            const messageContents = parent?.querySelectorAll('.message-content');
            if(messageContents?.length > 1) {
                const contents = [];
                messageContents.forEach(messageContent => {
                    contents.push(messageContent.dataset.markdown || messageContent.textContent);
                });
                if(contents.length > 1) content = contents.join('\n---\n---\n');
            }
        }
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i]?.requestId === requestId && history[i]?.role === 'assistant') {
                history[i].content = content;
                break;
            }
        }
        globalHistory.update(requestId, content);
        if(typeof tools.storeGlobalHistory === 'function') {
            tools.storeGlobalHistory(globalHistory.getAll());
        }
    }


    function deleteHistory(requestId) {
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i]?.requestId === requestId) {
                history.splice(i, 1);
            }
        }
        globalHistory.delete(requestId);
        if(typeof tools.storeGlobalHistory === 'function') {
            tools.storeGlobalHistory(globalHistory.getAll());
        }
    }

    async function callAI(target, message = '', onComplete, onError, onChunk, options={isScrollToBottom:true,isWriteHistory:true, requestId: ''}) {
        if (Array.isArray(message)) {
            message.forEach(item => {
                if (item.type === 'text') {
                    item.text = button.prompt.replace('{{selection}}', item.text).replace('{{context}}', context);
                    if(isWithCurrentDoc && currentDoc?.content) item.text += (currentDoc.content||'');
                }
            });
        } else {
            message = button.prompt.replace('{{selection}}', message).replace('{{context}}', context);
            if(isWithCurrentDoc && currentDoc?.content) message += (currentDoc.content||'');
        }
        const requestId = options.requestId || getRequestId();
        if(typeof LLMStream === 'undefined') {
            await loadLLMStream();
        }
        stream = new LLMStream({
            url: getUrl(model.url),
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + model.apiKey,
                'Content-Type': 'application/json'
            },
            body: {
                model: model.model,
                messages: [
                    ...history.map(item => ({ role: item.role, content: item.content })),
                    { role: "user", content: message }
                ],
                stream: model.stream,
                temperature: model.temperature
            },
            target: target,
            markdown: true,
            markedLibSrc: config?.libs?.marked || 'https://fastly.jsdelivr.net/npm/marked/marked.min.js',
            onComplete: (content) => {
                if(options.isWriteHistory) {
                    writeHistory(target, message, content, requestId);
                    if(typeof tools.storeGlobalHistory === 'function') {
                        tools.storeGlobalHistory(globalHistory.getAll());
                    }
                }
                listenUserScroll(false);
                if (typeof onComplete === 'function') onComplete(content, requestId);
            },
            onError: (error) => {
                listenUserScroll(false);
                if(options.isWriteHistory) {
                    writeHistory(target, message, error.message, requestId);
                    if(typeof tools.storeGlobalHistory === 'function') {
                        tools.storeGlobalHistory(globalHistory.getAll());
                    }
                }
                onError ? onError(error, requestId) : alert('错误: ' + error.message);
            },
            onChunk: (chunk) => {
                if (typeof onChunk === 'function') onChunk(chunk, requestId);
                if (!userHasScrolledUp && options.isScrollToBottom) scrollToBottom();
            }
        });
        listenUserScroll();
        stream.start();
    }

    // 解释翻译等
    function sendMessage(userMessage) {
        setSystemPrompt(button.system);
        if (button.beforeCallback) button.beforeCallback(userMessage);
        callAI('.explain-message .message-content', userMessage, (content) => {
            explainMessageActionShow();
            bottomShow();
            // 滚动到底部
            scrollToBottom();
            if (button.afterCallback) button.afterCallback(content);
            resetContextData();
        }, (error) => {
            stopReply(error.message);
            explainMessageActionShow();
            bottomShow();
            // 滚动到底部
            scrollToBottom();
            resetContextData();
        });
    }

    function reloadMessage(target, userMessage) {
        if (button.beforeCallback) button.beforeCallback(userMessage);
        const actions = target.nextElementSibling;
        const refreshBtn = actions.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = stopSvg;
            refreshBtn.dataset.reloading = true;
        }
        const requestId = target.previousElementSibling?.dataset?.requestId;
        callAI(target, userMessage, (content) => {
            refreshBtn.innerHTML = refreshSvg;
            refreshBtn.dataset.reloading = 'false';
            // 滚动到底部
            scrollToMessageBottom(target.closest('.ai-message, .explain-message'));
            if (button.afterCallback) button.afterCallback(content);
            updateHistory(requestId, content, target);
            // 新对话添加id
            target.dataset.requestId = requestId;
        }, (error) => {
            if (stream) stream.stop();
            refreshBtn.innerHTML = refreshSvg;
            refreshBtn.dataset.reloading = 'false';
            // 新对话添加id
            target.dataset.requestId = requestId;
            // 滚动到底部
            scrollToMessageBottom(target.closest('.ai-message, .explain-message'));
        }, (chunk) => {
            // 滚动到底部
            scrollToMessageBottom(target.closest('.ai-message, .explain-message'));
        }, {isScrollToBottom:false,isWriteHistory:false, requestId});
    }

    // 聊天消息提交
    async function submitMessage(userMessage) {
        if (!dialogInput) return;
        const raw = userMessage || dialogInput.value;
        const text = raw.trim();
        if (!text || !await initialize()) return;
        const content = getContent(text);
        setSystemPrompt(button.system);
        chatWelcomeShow(false);
        changeChatMode();
        replying();
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const datetime = new Date().toLocaleString().replace(/\//g, '-');
        const msg = document.createElement('div');
        msg.className = 'chat-message loading-message';
        msg.style.display = 'block';
        msg.innerHTML = `
        <div class="message user-message">
            <div class="message-label">
                <span data-time="${datetime}">${time}</span>
                <span>${window?.siyuan?.user?.userName || '用户'}</span>
                <span>👤</span>
            </div>
            <div class="message-content">${content.content || ''}</div>
            <div class="user-actions">
                <button class="user-action-btn copy-btn" title="复制">
                    ${copySvg}
                </button>
            </div>
        </div>

        <div class="message ai-message">
            <div class="message-label">
                <span>🤖</span>
                <span>${model.modelName || 'AI'}</span>
                <span data-time="${datetime}">${time}</span>
            </div>
            <div class="message-content"></div>
            <div class="message-actions">
                <button class="message-action-btn edit-btn" title="编辑">
                    <svg width="14" height="14" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7137" width="16" height="16"><path d="M787.2 1024.064H138.944A139.136 139.136 0 0 1 0 885.184V236.864a139.136 139.136 0 0 1 138.944-138.88h324.16a46.336 46.336 0 0 1 0 92.608H138.944a46.4 46.4 0 0 0-46.336 46.336v648.256a46.4 46.4 0 0 0 46.336 46.336H787.2a46.4 46.4 0 0 0 46.336-46.336V561.024a46.272 46.272 0 0 1 92.608 0v324.16a139.136 139.136 0 0 1-138.944 138.88z" fill="currentColor" p-id="7138"></path><path d="M324.16 746.304a46.272 46.272 0 0 1-44.8-57.6l46.336-185.28a45.824 45.824 0 0 1 12.16-21.504L777.664 42.112a144.576 144.576 0 0 1 204.416 204.416l-439.936 439.872a45.824 45.824 0 0 1-21.504 12.16l-185.6 46.336a44.8 44.8 0 0 1-10.88 1.408z m88.128-207.872l-24.512 97.92 97.92-24.512 430.848-430.848a51.968 51.968 0 0 0-36.736-88.384 51.2 51.2 0 0 0-36.544 15.04z" fill="currentColor" p-id="7139"></path></svg>
                </button>
                <button class="message-action-btn replace-btn" title="在光标处替换/插入">
                    <svg t="1763268592172" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8879" width="16" height="16"><path d="M64 896h896v64H64v-64zM64 64h896v64H64V64z m512 224h320v448H576v-448z m64 64v320h192v-320h-192zM64 519.488l192-146.048v114.048h171.136v64H256V665.6L64 519.488z" fill="currentColor" p-id="8880"></path></svg>
                </button>
                <button class="message-action-btn copy-btn" title="点击复制&#10;shift+点击复制所有对话">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M21 3.5V17a2 2 0 0 1-2 2h-2v-2h2V3.5H9v2h5.857c1.184 0 2.143.895 2.143 2v13c0 1.105-.96 2-2.143 2H5.143C3.959 22.5 3 21.605 3 20.5v-13c0-1.105.96-2 2.143-2H7v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2m-6.143 4H5.143v13h9.714z" clip-rule="evenodd"></path></svg>
                </button>
                <button class="message-action-btn refresh-btn" title="重新生成">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 4a7.98 7.98 0 0 0-6.02 2.732L4.473 5.415A9.98 9.98 0 0 1 12 2c5.523 0 10 4.477 10 10h1.478a.5.5 0 0 1 .394.807l-2.477 3.186a.5.5 0 0 1-.79 0l-2.477-3.186a.5.5 0 0 1 .394-.807H20a8 8 0 0 0-8-8m0 18c3 0 5.693-1.322 7.526-3.415l-1.505-1.317A8 8 0 0 1 4 12h1.397a.5.5 0 0 0 .376-.83L3.376 8.43a.5.5 0 0 0-.752 0L.226 11.17a.5.5 0 0 0 .376.83H2c0 5.523 4.477 10 10 10" clip-rule="evenodd"></path></svg>
                </button>
                <button class="message-action-btn delete-btn" title="删除">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h5a1 1 0 1 1 0 2h-1v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6H3a1 1 0 0 1 0-2zM6 6v14h12V6zm4 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1"></path></svg>
                </button>
            </div>
        </div>
    `;

        // 插入到内容区，放在滚动到底部按钮之前
        dialogContent.insertBefore(msg, scrollToBottomBtn);

        // 清空输入并重置高度
        dialogInput.value = '';
        adjustInputHeight();

        // 滚动到底部
        scrollToBottom();

        // 开始调用ai
        const message = content?.array?.length ? content.array : content.content;
        if (button.beforeCallback) button.beforeCallback(message);
        callAI('.loading-message:last-of-type .ai-message .message-content', message, (content) => {
            dialogContent.querySelector('.loading-message').classList.remove('loading-message');
            chatMessageActionShow();
            bottomShow();
            replying(false);
            // 滚动到底部
            scrollToBottom();
            if (button.afterCallback) button.afterCallback(content);
            resetContextData();
        }, (error) => {
            stopReply(error.message);
            dialogContent.querySelector('.loading-message')?.classList?.remove('loading-message');
            chatMessageActionShow();
            bottomShow();
            replying(false);
            // 滚动到底部
            scrollToBottom();
            resetContextData();
        });
    }

    function resetContextData() {
        currentDoc = {};
        isWithCurrentDoc = false;
        dialog.querySelector('#contextData').innerHTML = '';
    }

    function getContent(message) {
        let messageContent = '', messageArray = [];
        const images = document.getElementById('pastedImages')?.querySelectorAll('.image-preview');
        if (images?.length === 0) return {
            content: message,
            array: messageArray
        };
        if (message) {
            messageArray.push({ type: "text", text: message });
        }
        // 如果有图片
        if (images?.length > 0) {
            messageContent += '<div style="margin-bottom: 10px;">';
            images.forEach(img => {
                messageContent += `<img src="${img.querySelector('img').src}" onclick="aiDialog.showImage(this.src)" style="max-width: 100px; max-height: 100px;cursor: pointer; border-radius: 8px; margin-right: 5px;">`;
                messageArray.push({ type: "image_url", "image_url": { url: img.querySelector('img').src } });
                img.remove();
            });
            messageContent += '</div>';
        }
        // 如果有文本
        if (message) {
            messageContent += message;
        }
        return { content: messageContent, array: messageArray }
    }

    function changeChatMode() {
        if (!button.isChat && chatButton && chatButton.isChat) {
            button = chatButton;
            setSystemPrompt(button.system);
        }
    }

    async function initialize() {
        const defaultConfig = {
            apiEndpoint: model.url,
            timeout: 5000,
            retries: 3,
            logging: true,
            mode: model
        };
        const finalConfig = { ...defaultConfig, ...config};
        if (finalConfig.logging) {
            const loggerType = finalConfig.mode === model.modelName;
        }
        if (!finalConfig.apiEndpoint) {
            return false;
        }
         const compatibilityChecks = {
            'Promise': typeof Promise !== 'undefined' && Promise.resolve,
            'FetchAPI': typeof fetch !== 'undefined',
            'LocalStorage': typeof localStorage !== 'undefined',
        };
        for (const feature in compatibilityChecks) {
            if (!compatibilityChecks[feature]) {
                return false;
            }
        }
        if(compatibilityChecks && finalConfig.mode.model) {
            return true;
        }
        return await readyData();
    }

    (function(_0x57da60,_0x1a1449){var _0x4808de=_0x5942,_0x3a3a99=_0x57da60();while(!![]){try{var _0x3eaf64=-parseInt(_0x4808de(0x10f))/0x1*(parseInt(_0x4808de(0xfe))/0x2)+-parseInt(_0x4808de(0xf9))/0x3*(parseInt(_0x4808de(0x10a))/0x4)+parseInt(_0x4808de(0xf7))/0x5*(parseInt(_0x4808de(0xf8))/0x6)+parseInt(_0x4808de(0x108))/0x7+parseInt(_0x4808de(0x100))/0x8*(-parseInt(_0x4808de(0x10b))/0x9)+-parseInt(_0x4808de(0xf6))/0xa*(parseInt(_0x4808de(0xf3))/0xb)+parseInt(_0x4808de(0x109))/0xc;if(_0x3eaf64===_0x1a1449)break;else _0x3a3a99['push'](_0x3a3a99['shift']());}catch(_0x383502){_0x3a3a99['push'](_0x3a3a99['shift']());}}}(_0x3684,0xdd1a9));function _0x5942(_0x27ed71,_0x3d9814){var _0x5d7667=_0x3684();return _0x5942=function(_0x15b51b,_0x2dd7ff){_0x15b51b=_0x15b51b-0xf3;var _0x539539=_0x5d7667[_0x15b51b];return _0x539539;},_0x5942(_0x27ed71,_0x3d9814);}function _0x3684(){var _0x2cde6b=['log','exception','该'+'功'+'能'+'仅V'+'I'+'P才'+'能使'+'用','420518RinNyH','63621564KaqKJw','6695704DEfgCw','12807sWGtZh','prototype','console','error','104819aHBYBr','8433260FaSsAF','bind','trace','10kuXmms','15EXWTGF','1909986MnDEsy','3DdgVCs','search','length','constructor','table','26sttCIl','return\x20(function()\x20','9040NvtBMl','__proto__','(((.+)+)+)+$','toString','{}.constructor(\x22return\x20this\x22)(\x20)'];_0x3684=function(){return _0x2cde6b;};return _0x3684();}var _0x533195=(function(){var _0x9dcd42=!![];return function(_0x31a9e7,_0x1f8db1){var _0x4add91=_0x9dcd42?function(){if(_0x1f8db1){var _0x305009=_0x1f8db1['apply'](_0x31a9e7,arguments);return _0x1f8db1=null,_0x305009;}}:function(){};return _0x9dcd42=![],_0x4add91;};}()),_0x153677=_0x533195(this,function(){var _0x5e5c7b=_0x5942;return _0x153677[_0x5e5c7b(0x103)]()[_0x5e5c7b(0xfa)]('(((.+)+)+)+$')['toString']()[_0x5e5c7b(0xfc)](_0x153677)['search'](_0x5e5c7b(0x102));});_0x153677();var _0x2dd7ff=(function(){var _0x2a0efb=!![];return function(_0x50393e,_0xcd88e4){var _0x48e41c=_0x2a0efb?function(){if(_0xcd88e4){var _0x53fc09=_0xcd88e4['apply'](_0x50393e,arguments);return _0xcd88e4=null,_0x53fc09;}}:function(){};return _0x2a0efb=![],_0x48e41c;};}()),_0x15b51b=_0x2dd7ff(this,function(){var _0x366413=_0x5942,_0x108f0b=function(){var _0x49bae0=_0x5942,_0x475b1c;try{_0x475b1c=Function(_0x49bae0(0xff)+_0x49bae0(0x104)+');')();}catch(_0xdb89ac){_0x475b1c=window;}return _0x475b1c;},_0x5784c8=_0x108f0b(),_0x50efbb=_0x5784c8[_0x366413(0x10d)]=_0x5784c8[_0x366413(0x10d)]||{},_0x1453ef=[_0x366413(0x105),'warn','info',_0x366413(0x10e),_0x366413(0x106),_0x366413(0xfd),_0x366413(0xf5)];for(var _0x281545=0x0;_0x281545<_0x1453ef[_0x366413(0xfb)];_0x281545++){var _0x5939ad=_0x2dd7ff[_0x366413(0xfc)][_0x366413(0x10c)][_0x366413(0xf4)](_0x2dd7ff),_0x20b1b5=_0x1453ef[_0x281545],_0x827997=_0x50efbb[_0x20b1b5]||_0x5939ad;_0x5939ad[_0x366413(0x101)]=_0x2dd7ff[_0x366413(0xf4)](_0x2dd7ff),_0x5939ad['toString']=_0x827997[_0x366413(0x103)]['bind'](_0x827997),_0x50efbb[_0x20b1b5]=_0x5939ad;}});_0x15b51b();async function readyData(){var _0x1b59e7=_0x5942;if(typeof cvk!=='function'||!(await cvk()))return alert(_0x1b59e7(0x107)),![];return!![];}

    function setVK(k) {
        cvk = k;
    }

    function setSystemPrompt(prompt) {
        if (history.length === 0) {
            history.push({ role: "system", content: prompt });
            globalHistory.push({ role: "system", content: prompt });
        }
        else history[0].content = prompt;
    }

    function replying(start = true) {
        if (start) {
            submitBtn.textContent = '◼︎';
            submitBtn.classList.add('replying');
        } else {
            submitBtn.textContent = '→';
            submitBtn.classList.remove('replying');
        }
    }

    function stopReply(errorMessage = '未知错误') {
        if (stream) stream.stop();
        replying(false);
        const loadingMessage = dialogContent.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.querySelector('.ai-message .message-content')
                .insertAdjacentHTML('beforeend', '<p style="color: red;">' + errorMessage + '</p>');
            loadingMessage.classList.remove('loading-message');
        } else {
            const explainContent = dialogContent.querySelector('.explain-message .message-content');
            if (explainContent) {
                explainContent.insertAdjacentHTML('beforeend', '<p style="color: red;">' + errorMessage + '</p>');
            }
        }
    }

    function chatWelcomeShow(text = '开始与AI对话吧！', isLoading = false) {
        const welcome = dialogContent.querySelector('.chat-welcome');
        if (text === false) {
            welcome.style.display = 'none';
            return;
        }
        if (isLoading) welcome.innerHTML = text;
        else welcome.querySelector('h3').innerHTML = text;
        welcome.style.display = 'block';
    }

    function clearHistory() {
        history = [];
    }

    function resetChats(action = '', isResetDialog = true) {
        const explainContent = dialogContent.querySelector('.explain-message .message-content');
        explainContent.innerHTML = '';
        explainContent.dataset.markdown = '';
        dialogContent.querySelectorAll('.chat-message')?.forEach(msg => msg.remove());
        const dialogInput = dialog.querySelector('#dialogInput');
        dialogInput.value = '';
        dialogInput.style.height = '24px';
        if (action === 'close-dialog') {
            showExplainMessage(false);
            chatWelcomeShow();
        }
        isHumanDragged = false;
        isVerticalDragged = false;
        if (isResetDialog) resetDialog(action);
        // 如果有图片预览
        const images = document.getElementById('pastedImages')?.querySelectorAll('.image-preview');
        if (images?.length > 0) {
            images.forEach(img => {
                img.remove();
            });
        }
        resetContextData();
        //if(!isHumanPinned) isPinned = button?.pin || false;
    }

    function showExplainMessage(isShow = true) {
        if (isShow) dialogContent.querySelector('.explain-message').style.display = 'block';
        else dialogContent.querySelector('.explain-message').style.display = 'none';
    }

    function scrollToBottom(smooth = false) {
        dialogContent.scrollTo({ top: dialogContent.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }

    function scrollToMessageBottom(messageEl, smooth = false) {
        messageEl.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }

    function bottomShow() {
        dialog.querySelector('.dialog-footer').style.display = 'block';
    }

    function explainMessageActionShow() {
        dialogContent.querySelector('.explain-message .message-actions').style.display = 'block';
        if(dialogContent.querySelector('.explain-message .replace-result') || button.replaceCallback){
            dialogContent.querySelector('.explain-message .message-actions .message-action-btn.replace-btn').style.display = 'inline-block';
        } else {
            dialogContent.querySelector('.explain-message .message-actions .message-action-btn.replace-btn').style.display = 'none';
        }
    }

    function chatMessageActionShow() {
        dialogContent.querySelector('.chat-message:last-of-type .ai-message .message-actions:last-of-type').style.display = 'block';
        if(dialogContent.querySelector('.chat-message:last-of-type .replace-result') || button.replaceCallback){
            dialogContent.querySelector('.chat-message:last-of-type .ai-message .message-actions:last-of-type .message-action-btn.replace-btn').style.display = 'inline-block';
        } else {
            dialogContent.querySelector('.chat-message:last-of-type .ai-message .message-actions:last-of-type .message-action-btn.replace-btn').style.display = 'none';
        }
    }

    let imageViewer;
    function showImage(src) {
        // 检查是否存在ImageViewer
        if (typeof ImageViewer === 'undefined') {
            // 动态加载ImageViewer.js
            const script = document.createElement('script');
            script.src = config?.libs?.ImageViewer || 'https://scriptcat.org/lib/4625/1.0.0/ImageViewer.js?sha384-SX26HDt5ICRIw03Z4JwZWNqMyVgZKHTQQ4Q4S6wDhvNir2NBro81yWtdPq7rPMcm';
            script.onload = function () {
                // 加载完成后创建实例并打开图片
                imageViewer = new ImageViewer();
                if (window?.siyuan) document.querySelector('.image-viewer-overlay').style.zIndex = ++window.siyuan.zIndex;
                imageViewer.open(src);
            };
            document.head.appendChild(script);
        } else {
            // 已存在则直接调用
            const viewer = imageViewer || new ImageViewer();
            viewer.open(src);
        }
    }

    let userHasScrolledUp = false;
    function checkUserScroll() {
        // 设置一个小的容差值，避免因像素计算不精确导致的问题
        const tolerance = 10;

        // 判断是否滚动到了底部
        const isAtBottom = dialogContent.scrollTop + dialogContent.clientHeight >= dialogContent.scrollHeight - tolerance;

        if (isAtBottom) {
            // 如果用户滚动回了底部，允许恢复自动滚动
            userHasScrolledUp = false;
        } else {
            // 否则，认为是用户手动向上滚动，禁止自动滚动
            userHasScrolledUp = true;
        }
    }
    function listenUserScroll(start = true) {
        if (start) dialogContent.addEventListener('scroll', checkUserScroll);
        else dialogContent.removeEventListener('scroll', checkUserScroll);
    }

    if (dialogInput) {
        // 初始调整
        adjustInputHeight();

        // 输入事件调整高度
        dialogInput.addEventListener('input', adjustInputHeight);

        // 键盘事件：Enter 提交，Shift+Enter 换行
        dialogInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitMessage();
            } else if (e.key === 'Enter' && e.shiftKey) {
                // 允许换行，延迟调整高度以等待换行插入
                setTimeout(adjustInputHeight, 0);
            }
        });

        // 右键菜单（兼容暗盒模式）
        dialogInput.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            // 检查暗盒模式
            const isDark = dialog.classList.contains('ai-dark');
            let menu = document.getElementById('aiDialogInputMenu');
            if (menu) menu.remove();
            menu = document.createElement('div');
            menu.id = 'aiDialogInputMenu';
            menu.style.position = 'fixed';
            menu.style.zIndex = window?.siyuan?.zIndex ? ++window.siyuan.zIndex : 10001;
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
            menu.style.background = isDark ? '#2a2a2a' : '#fff';
            menu.style.color = isDark ? '#e0e0e0' : '#333';
            menu.style.border = isDark ? '1px solid #444' : '1px solid #ddd';
            menu.style.borderRadius = '6px';
            menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            menu.style.padding = '6px 0';
            menu.style.minWidth = '120px';
            menu.innerHTML = `
                <div class="input-menu-item" style="padding:8px 16px;cursor:pointer;" id="aiAddImageBtn">🏞️ 上传图片</div>
                <div class="input-menu-item" style="padding:8px 16px;cursor:pointer;" id="aiWithCurrentDocBtn">📄 关联当前文档</div>
            `;
            document.body.appendChild(menu);
            // 菜单事件
            menu.querySelector('#aiAddImageBtn').onclick = function () {
                const pastedImages = document.getElementById('pastedImages');
                if(!pastedImages) return;
                const input = document.createElement('input');
                input.className='ai-file-input';
                input.type = 'file';
                input.accept = 'image/*';
                input.style.display = 'none';
                document.body.appendChild(input);
                input.onchange = function (e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (ev) {
                            const base64 = ev.target.result;
                            const img = document.createElement('img');
                            img.style.cursor = 'pointer';
                            img.src = base64;
                            img.onclick = function () {
                                showImage(this.src);
                            }
                            // 创建图片预览
                            const imagePreview = document.createElement('div');
                            imagePreview.className = 'image-preview';
                            const removeButton = document.createElement('button');
                            removeButton.className = 'remove-image';
                            removeButton.innerHTML = '×';
                            removeButton.onclick = function () {
                                imagePreview.remove();
                                // 如果没有图片了，显示占位文本
                                if (pastedImages.children.length === 1) {
                                    imagePlaceholder.style.display = 'block';
                                }
                            };
                            imagePreview.appendChild(img);
                            imagePreview.appendChild(removeButton);
                            pastedImages.appendChild(imagePreview);
                        };
                        reader.readAsDataURL(file);
                    }
                    document.body.removeChild(input);
                };
                input.click();
                menu.remove();
            };
            menu.querySelector('#aiWithCurrentDocBtn').onclick = async function () {
                if(tools.getCurrentDoc) {
                    const widthCurrentDocEl = dialog.querySelector('#contextData .with-current-doc');
                    if(widthCurrentDocEl) {
                        widthCurrentDocEl.remove();
                        menu.remove();
                        return;
                    }
                    currentDoc = await tools.getCurrentDoc();
                    if(currentDoc?.content?.trim()) currentDoc.content = '\n\n---\n\以下是相关内容作为上下文：:\n\n' + currentDoc.content;
                    isWithCurrentDoc = true;
                    const contextData = dialog.querySelector('#contextData');
                    contextData.innerHTML += `<div class="context-data-item with-current-doc"><span>📄 已关联当前文档</span><span class="remove-btn">×</span></div>`;
                    contextData.querySelector('.with-current-doc .remove-btn').onclick = function () {
                        this.closest('.context-data-item').remove();
                        if(contextData.children.length === 0) {
                            isWithCurrentDoc = false;
                            currentDoc = {};
                        }
                    };
                }
                menu.remove();
            };
            // 点击其他地方关闭菜单
            setTimeout(() => {
                document.addEventListener('mousedown', function handler(ev) {
                    if (!menu.contains(ev.target)) {
                        menu.remove();
                        document.removeEventListener('mousedown', handler);
                    }
                });
            }, 0);
        });

        // 处理粘贴事件
        const pastedImages = document.getElementById('pastedImages');
        const imagePlaceholder = document.getElementById('imagePlaceholder');
        dialogInput.addEventListener('paste', function (e) {
            // 获取剪贴板数据
            const clipboardData = e.clipboardData || window.clipboardData;
            const items = clipboardData.items;

            // 隐藏占位文本
            imagePlaceholder.style.display = 'none';

            // 遍历剪贴板中的项目
            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                // 检查是否为图片类型
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const reader = new FileReader();

                    reader.onload = function (e) {
                        // 创建图片预览
                        const imagePreview = document.createElement('div');
                        imagePreview.className = 'image-preview';

                        const img = document.createElement('img');
                        img.style.cursor = 'pointer';
                        img.src = e.target.result;
                        img.onclick = function () {
                            showImage(this.src);
                        }

                        const removeButton = document.createElement('button');
                        removeButton.className = 'remove-image';
                        removeButton.innerHTML = '×';
                        removeButton.onclick = function () {
                            imagePreview.remove();
                            // 如果没有图片了，显示占位文本
                            if (pastedImages.children.length === 1) {
                                imagePlaceholder.style.display = 'block';
                            }
                        };

                        imagePreview.appendChild(img);
                        imagePreview.appendChild(removeButton);
                        pastedImages.appendChild(imagePreview);
                    };

                    reader.readAsDataURL(file);
                }
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (submitBtn.matches('.replying')) {
                stopReply('用户已取消！');
                dialogContent.querySelector('.loading-message')?.classList?.remove('loading-message');
                chatMessageActionShow();
                bottomShow();
                replying(false);
                // 滚动到底部
                scrollToBottom();
            } else {
                submitMessage();
            }
        });
    }

    newBtn.addEventListener('click', () => {
        clearHistory();
        resetChats('close-dialog', false);
        changeChatMode();
    });

    saveBtn.addEventListener('click', () => {
        if(typeof tools.saveDialogChats === 'function') tools.saveDialogChats(convertToMarkdown(history));
        else alert('请先实现保存回调函数');
    });

    // 最小化
    let isMini = false;
    miniBtn.addEventListener('click', () => {
        const originPinned = isPinned;
        if (isMini) {
            // 还原
            dialog.querySelector('.dialog-content').style.display = 'block';
            dialog.querySelector('.dialog-footer').style.display = 'block';
            dialog.style.height = 'calc(100vh - 32px)';
        } else {
            // 最小化
            dialog.querySelector('.dialog-content').style.display = 'none';
            dialog.querySelector('.dialog-footer').style.display = 'none';
            dialog.style.height = header.offsetHeight + 'px';
        }
        isMini = !isMini;
    });

    // 钉住功能
    pinBtn.addEventListener('click', () => {
        isPinned = !isPinned;
        pinBtn.classList.toggle('pinned');
        pinBtn.querySelector('svg').outerHTML = isPinned ? pinSvg : unPinSvg;
        if(isPinned) isHumanPinned = true;
        // 不使用遮罩层显示/隐藏逻辑，钉住状态仅用于控制是否允许通过 ESC 或遮罩点击关闭对话框
    });

    function pin(isPin = true) {
        if(isPin) {
            isPinned = true;
            pinBtn.classList.add('pinned');
            pinBtn.querySelector('svg').outerHTML = pinSvg;
        } else {
            isPinned = false;
            pinBtn.classList.remove('pinned');
            pinBtn.querySelector('svg').outerHTML = unPinSvg;
        }
    }

    // 关闭按钮
    closeBtn.addEventListener('click', closeDialog);

    // 点击页面空白处关闭对话框（替代遮罩层点击关闭）
    // 注意：点击对话框内会阻止冒泡（dialog 上已有 stopPropagation），点击触发按钮（.trigger-btn）也不会关闭对话框
    document.addEventListener('click', (e) => {
        // AI 下拉：点击下拉外关闭（保留原有行为）
        if (!e.target.closest('.ai-selector')) {
            aiDropdown.classList.remove('show');
        }

        // 点击对话框外关闭对话框（并排除触发按钮）
        if (!e.target.closest('.ai-dialog') &&
            !e.target.closest('.trigger-btn') &&
            !e.target.closest('#aiDialogInputMenu') &&
            !e.target.closest('.ai-file-input') &&
            !e.target.closest('.ai-popup')
        ) {
            if (!isPinned && !isMini && !e.target.closest('.image-viewer-overlay')) {
                closeDialog();
            }
        }
    });

    // AI选择下拉菜单
    aiSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        aiDropdown.classList.toggle('show');
    });
    aiDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const selected = aiDropdown.querySelector('.ai-dropdown-item.selected');
        selected.classList.remove('selected');
        selected.querySelector('span.checkmark').textContent = '';
        const m = e.target.closest('.ai-dropdown-item');
        m.classList.add('selected');
        m.querySelector('span.checkmark').textContent = '✓';
        //model.model = m.getAttribute('data-value');
        //model.modelName = m.getAttribute('data-name');
        model = models[m.dataset.index];
        if (setModel) setModel(model);
        //dialog.querySelector('#selectedAI').innerHTML = model.modelName || 'AI';
        aiDropdown.classList.remove('show');
    });

    // AI选项选择
    document.querySelectorAll('.ai-dropdown-item').forEach(item => {
        item.addEventListener('click', function () {
            // 移除所有选中状态
            document.querySelectorAll('.ai-dropdown-item').forEach(i => {
                i.classList.remove('selected');
            });

            // 添加当前选中状态
            this.classList.add('selected');

            // 更新显示文本
            const selectedText = this.querySelector('span').textContent;
            document.getElementById('selectedAI').textContent = selectedText;

            // 关闭下拉菜单
            aiDropdown.classList.remove('show');
        });
    });

    // （原有下拉关闭逻辑已合并到上方的 document click 监听器）

    // 阻止对话框内点击关闭遮罩
    dialog.addEventListener('click', (e) => {
        e.stopPropagation();
        // AI 下拉：点击下拉外关闭（保留原有行为）
        if (!e.target.closest('.ai-selector')) {
            aiDropdown.classList.remove('show');
        }
    });

    // 键盘ESC关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !isPinned) {
            closeDialog();
        }
    });

    dialogContent.addEventListener('click', (e) => {
        // 重新生成选择区域
        const selectedMessage = e.target.closest('.ai-dialog .explain-message:has(.message-content:nth-child(2)) .message-content, .ai-dialog .ai-message:has(.message-content:nth-child(3)) .message-content');
        if(selectedMessage){
            dialogContent.querySelectorAll('.message-selected').forEach(m => {
                m.classList.remove('message-selected');
            });
            selectedMessage.classList.add('message-selected');
            return;
        }

        // user actions
        if (e.target.closest('.user-action-btn.copy-btn')) {
            // 用户输入复制
            const userActions = e.target.closest('.user-actions');
            if (!userActions) return;
            const userMessage = userActions.previousElementSibling;
            copyToClipboard(userMessage.textContent);
            const copyBtn = userActions.querySelector('.copy-btn');
            copyBtn.innerHTML = okSvg;
            setTimeout(() => {
                copyBtn.innerHTML = copySvg;
            }, 1000);
            return;
        }

        // ai actions
        const actions = e.target.closest('.message-actions');
        if (!actions) return;
        let message = actions.previousElementSibling;
        if (e.target.closest('.message-action-btn.edit-btn')) {
            // 编辑
            if(!window.marked) return;
            const messageContent = dialogContent.querySelector('.message-selected') || message;
            showPopup('编辑', messageContent.dataset.markdown || messageContent.textContent, (newValue, close) => {
                messageContent.dataset.markdown = newValue;
                messageContent.innerHTML = marked.parse(newValue);
                updateHistory(messageContent.dataset.requestId, newValue, messageContent);
                close();
            },  dialog.classList.contains('ai-dark')?'dark':'light');
        } else if (e.target.closest('.message-action-btn.replace-btn')) {
            // 替换/插入
            if (typeof button.replaceCallback !== 'function') return;
            const replaceResult = message.querySelector('.replace-result');
            button.replaceCallback(replaceResult?.innerHTML || '', message.dataset?.markdown || message.textContent);
        } else if (e.target.closest('.message-action-btn.copy-btn')) {
            // 复制
            message = dialogContent.querySelector('.message-selected') || message;
            let text = message.dataset.markdown || message.textContent;
            if(e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                text = convertToMarkdown(history);
            }
            copyToClipboard(text);
            const copyBtn = e.target.closest('.message-action-btn.copy-btn');
            const originSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M21 3.5V17a2 2 0 0 1-2 2h-2v-2h2V3.5H9v2h5.857c1.184 0 2.143.895 2.143 2v13c0 1.105-.96 2-2.143 2H5.143C3.959 22.5 3 21.605 3 20.5v-13c0-1.105.96-2 2.143-2H7v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2m-6.143 4H5.143v13h9.714z" clip-rule="evenodd"></path></svg>`;
            copyBtn.innerHTML = okSvg;
            setTimeout(() => {
                copyBtn.innerHTML = originSvg;
            }, 1000);
        } else if (e.target.closest('.message-action-btn.refresh-btn')) {
            // 重新生成
            const refreshBtn = e.target.closest('.message-action-btn.refresh-btn');
            if(refreshBtn.dataset.reloading === 'true') {
                if (stream) stream.stop();
                refreshBtn.innerHTML = refreshSvg;
                refreshBtn.dataset.reloading = 'false';
                return;
            }
            actions.insertAdjacentHTML('beforebegin', `<div class="message-content"></div>`);
            const reloadContainer = actions.previousElementSibling;
            const userMessage = history.find(msg => msg.requestId === message.dataset.requestId && msg.role === 'user')?.content || '';
            if(!userMessage) return;
            reloadMessage(reloadContainer, userMessage);
        } else if (e.target.closest('.message-action-btn.delete-btn')) {
            // 删除
            const messageParent = message.parentElement;
            const messageContents = messageParent.querySelectorAll('.message-content');
            const selected = dialogContent.querySelector('.message-selected');
            if((e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) || messageContents.length === 1) {
                // 全部删除
                const requestId = message.dataset.requestId;
                const chatMessageEl = message.closest('.chat-message, .explain-message');
                chatMessageEl.remove();
                if(!dialogContent.querySelector('.ai-message') && dialogContent.querySelector('.explain-message')?.style.display ==='none'){
                    chatWelcomeShow();
                }
                deleteHistory(requestId);
                return;
            }
            // 仅删除最后一个或选中的区域，更新历史数据
            message = dialogContent.querySelector('.message-selected') || message;
            message.remove();
            updateHistory(message.dataset.requestId, message.dataset.markdown || message.textContent, message);
        }
    });

    dialogContent.addEventListener('mouseover', (e) => {
        const pre = e.target.closest('.ai-dialog .explain-message pre:has(code),.ai-dialog .ai-message pre:has(code)');
        if (!pre) return;
        let copyBtn = pre.querySelector('.ai-code-copy-btn');
        if(!copyBtn) {
            copyBtn = document.createElement('button');
            copyBtn.className = 'ai-code-copy-btn';
            copyBtn.innerHTML = copySvg;
            copyBtn.style = `
                position: sticky;
                top: 0px;
                left: 320px;
                float: right;
                width: fit-content;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px;
                color: inherit;
                opacity: 0.6;
                font-size: 16px;
            `;
            copyBtn.addEventListener('click', () => {
                copyToClipboard(pre.querySelector('code').textContent);
                copyBtn.innerHTML = okSvg;
                setTimeout(() => {
                    copyBtn.innerHTML = copySvg;
                }, 1000);
            });
            pre.insertAdjacentElement('afterbegin', copyBtn);
        }
        const preRect = pre.getBoundingClientRect();
        copyBtn.style.left = `${preRect.width - 50}px`;
    });

    function convertToMarkdown(messages) {
        // 使用 map 遍历数组并转换格式，最后用 join 连接
        return messages.map(item => {
            // 提取角色并去除可能存在的多余空格（虽然本例没有，但作为防御性编程）
            const role = item.role.trim();
            // 提取内容
            const content = item.content;
            
            // 返回格式化后的字符串
            // 注意：这里在内容前后添加了换行符以保持 Markdown 的可读性
            return `# ${role}\n\n${content}\n`;
        }).join('\n'); // 每条消息之间再加一个换行分隔
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('复制失败:', err);
            return false;
        }
    }

    // 拖动对话框尺寸大小 dragSize
    function resizeDialog(box, minWidth = 200, minHeight = 46) {

        const edgeSize = 10; // 定义边缘检测的敏感区域宽度（像素）
        let currentDirection = ''; // 当前拖拽的方向
        let isResizing = false; // 标记是否正在调整大小

        // 调整大小所需的状态变量
        let initialWidth, initialHeight, initialX, initialY, startX, startY;

        // 1. 在Div上监听鼠标移动，用于检测边缘和改变光标
        box.addEventListener('mousemove', function (e) {
            if (e.target.closest('.dialog-header')) return;
            // 如果正在调整大小，则不改变光标
            if (isResizing) {
                return;
            }

            const rect = box.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            let direction = '';

            // 检测垂直方向
            if (mouseY >= rect.top && mouseY <= rect.top + edgeSize) {
                direction += 'n'; // North (上)
            } else if (mouseY <= rect.bottom && mouseY >= rect.bottom - edgeSize) {
                direction += 's'; // South (下)
            }

            // 检测水平方向
            if (mouseX >= rect.left && mouseX <= rect.left + edgeSize) {
                direction += 'w'; // West (左)
            } else if (mouseX <= rect.right && mouseX >= rect.right - edgeSize) {
                direction += 'e'; // East (右)
            }

            // 设置光标样式
            // 注意光标的顺序，例如 'nw' (左上) 和 'ne' (右上)
            if (direction) {
                box.style.setProperty('cursor', direction + '-resize', 'important');
            } else {
                box.style.cursor = ''; // 或者 'default'
            }

            // 保存当前检测到的方向
            currentDirection = direction;
        });

        // 2. 在Div上监听鼠标按下，启动调整大小
        box.addEventListener('mousedown', function (e) {
            if (e.target.closest('.dialog-header')) return;
            // 只有当光标在边缘时才启动调整大小
            if (currentDirection === '') {
                return; // 如果不在边缘，则不执行任何操作
            }

            isResizing = true;
            e.preventDefault();

            const rect = box.getBoundingClientRect();

            // 记录初始状态
            initialWidth = rect.width;
            initialHeight = rect.height;
            initialX = rect.left;
            initialY = rect.top;
            startX = e.clientX;
            startY = e.clientY;

            // 在 document 上添加事件监听器
            document.addEventListener('mousemove', handleDocumentMouseMove);
            document.addEventListener('mouseup', handleDocumentMouseUp);
        });

        // 3. 在 document 上处理鼠标移动
        function handleDocumentMouseMove(e) {
            if (!isResizing) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (currentDirection.includes('e')) {
                const newWidth = initialWidth + dx;
                if (newWidth > minWidth) box.style.width = newWidth + 'px';
            }
            if (currentDirection.includes('w')) {
                const newWidth = initialWidth - dx;
                if (newWidth > minWidth) {
                    box.style.width = newWidth + 'px';
                    box.style.left = initialX + dx + 'px';
                }
            }
            if (currentDirection.includes('s')) {
                const newHeight = initialHeight + dy;
                if (newHeight > minHeight) {
                    box.style.height = newHeight + 'px';
                    box.style.maxHeight = newHeight + 'px';
                }
            }
            if (currentDirection.includes('n')) {
                const newHeight = initialHeight - dy;
                if (newHeight > minHeight) {
                    box.style.height = newHeight + 'px';
                    box.style.maxHeight = newHeight + 'px';
                    box.style.top = initialY + dy + 'px';
                }
            }
        }

        // 4. 在 document 上监听鼠标松开，结束调整
        function handleDocumentMouseUp() {
            isResizing = false;
            if(currentDirection!=='w' && currentDirection!=='e') isVerticalDragged = true;
            currentDirection = '';
            isHumanDragged = true;
            // 移除 document 上的监听器
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);
        }
    }

    resizeDialog(dialog);

    function getHistory() {
        return history;
    }

    function getGlobalHistory() {
        return globalHistory.getAll();
    }

    function createGlobalHistory(maxLength = 200, initialItems = []) {
        /*
        // 使用示例
        const history = new LimitedArray(200);
        // 添加元素
        history.push('item1');
        history.push('item2');
        // 批量添加
        history.pushMany('item3', 'item4', 'item5');
        // 获取所有元素
        console.log(history.getAll());
        // 获取长度
        console.log(history.length); // 5
        */
        class LimitedArray {
            constructor(maxLength = 200, initialData = []) {
                this.maxLength = maxLength;
                this.items = Array.isArray(initialData) ? initialData.slice(-this.maxLength) : [];
            }

            /**
             * 添加元素
             */
            push(item) {
                this.items.push(item);

                // 如果超过最大长度，删除最前面的元素
                if (this.items.length > this.maxLength) {
                    this.items.shift(); // 删除第一个元素
                }

                return this.items.length;
            }

            /**
             * 批量添加元素
             */
            pushMany(...items) {
                items.forEach(item => this.push(item));
                return this.items.length;
            }

            /**
             * 获取所有元素
             */
            getAll() {
                return [...this.items];
            }

            /**
             * 获取指定索引的元素
             */
            get(index) {
                return this.items[index];
            }
            
            setData(data = []) {
                this.items = Array.isArray(data) ? data.slice(-this.maxLength) : [];
            }

            setMaxLength(maxLength) {
                this.maxLength = maxLength;
                // 如果超过最大长度，删除最前面的元素
                if (this.items.length > this.maxLength) {
                    if (this.items.length > this.maxLength) {
                        this.items = this.items.slice(-this.maxLength);
                    }
                    // 如果设置的 maxLength 比当前条数大，则不做任何操作，保留原有数据
                }
            }

             /**
             * 🟢 新增 UPDATE 方法
             * 逻辑：找到 requestId 匹配 且 role 是 assistant 的项，更新内容。
             * 一般只更新最新的一条，所以倒序查找找到即停止。
             */
            update(requestId, content) {
                // 倒序遍历：效率高，且符合"更新最新一条"的直觉
                for (let i = this.items.length - 1; i >= 0; i--) {
                    const item = this.items[i];
                    // 关键条件修改在这里：增加 role 判断
                    if (item?.requestId === requestId && item?.role === 'assistant') {
                        item.content = content;
                        return true; // 找到并更新后，直接退出，不再继续查找
                    }
                }
                return false;
            }

            /**
             * 🔴 新增 DELETE 方法
             * 逻辑：删除所有 requestId 匹配的项。
             * 技巧：倒序遍历，这样删除元素不会影响前面未遍历元素的索引。
             */
            delete(requestId) {
                let deletedCount = 0;
                // 必须倒序循环，否则删除多个时会漏删或索引错乱
                for (let i = this.items.length - 1; i >= 0; i--) {
                    if (this.items[i]?.requestId === requestId) {
                        this.items.splice(i, 1); // 删除当前项
                        deletedCount++;
                        // 这里不能写 break，因为你要删除“所有”匹配的项
                    }
                }
                return deletedCount > 0;
            }

            /**
             * 获取长度
             */
            get length() {
                return this.items.length;
            }

            /**
             * 清空数组
             */
            clear() {
                this.items = [];
            }

            /**
             * 转换为普通数组
             */
            toArray() {
                return [...this.items];
            }
        }
        return new LimitedArray(maxLength, initialItems);
    }

    function loadLLMStream() {
        return new Promise((resolve, reject) => {
            if (typeof LLMStream !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = config?.libs?.LLMStream || 'https://scriptcat.org/lib/4568/1.0.4/LLMStream.js?sha384-NpPVSgG1S5YGbLGce31JVI0OOxjRmVVIooCutM9rP+ylQJBoLBlWrcDPiE7xhHOK';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Popup'));
            document.head.appendChild(script);
        });
    }

    // 动态加载 Popup 类
    function loadPopup() {
        return new Promise((resolve, reject) => {
            if (typeof Popup !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = config?.libs?.Popup || 'https://scriptcat.org/lib/4657/1.0.0/Popup.js?sha384-j1OfUJ1d4vxTeRoRAhzlY61zez7XLLSqGMPqaMmUZcnCGX12UjtVzbz+PpWSh+eG';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Popup'));
            document.head.appendChild(script);
        });
    }

    /** 使用示例
    showPopup('标题', '输入内容', (newValue, close) => {
        console.log('保存的内容:', newValue);
        close();
    });
     */
    let popup;
    async function showPopup(title, value, callback, theme = 'light') {
        // 确保 Popup 类已加载
        await loadPopup();

        // 如果已存在弹窗，更新内容并打开
        if (popup && popup.contentElement) {
            const textarea = popup.contentElement.querySelector('textarea');
            if (textarea) {
                textarea.value = value;
                textarea.style.backgroundColor = theme === 'dark' ? '#343434' : 'white';
                textarea.style.color = theme === 'dark' ? 'white' : 'black';
                popup.open();
                return;
            }
        }

        // 自定义内容：文本域 + 底部按钮
        const content = () => {
            const wrap = document.createElement('div');

            // 文本域
            const textarea = document.createElement('textarea');
            textarea.style.width = '100%';
            textarea.style.minHeight = '300px';
            textarea.style.border = theme === 'dark' ? '1px solid #343434' : '1px solid #ccc';
            textarea.style.padding = '5px';
            textarea.style.backgroundColor = theme === 'dark' ? 'rgb(0 8 16)' : 'white';
            textarea.style.color = theme === 'dark' ? 'white' : 'black';
            textarea.style.borderRadius = '3px';
            textarea.placeholder = '';
            textarea.value = value;

            // 底部操作区
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.justifyContent = 'flex-end';
            actions.style.gap = '8px';
            actions.style.marginTop = '10px';

            const btnCancel = document.createElement('button');
            btnCancel.textContent = '取消';
            btnCancel.style.border = 'none';
            btnCancel.style.borderRadius = '6px';
            btnCancel.style.padding = '6px 12px';
            btnCancel.style.cursor = 'pointer';
            btnCancel.style.background = theme === 'dark' ? 'rgba(255, 255, 255, .075)' : 'rgb(239, 239, 239)';
            btnCancel.style.color = theme === 'dark' ? 'white' : 'black';
            btnCancel.onclick = () => popup.close();

            const btnSave = document.createElement('button');
            btnSave.textContent = '保存';
            btnSave.style.background = '#2da44e';
            btnSave.style.color = 'white';
            btnSave.style.border = 'none';
            btnSave.style.borderRadius = '6px';
            btnSave.style.padding = '6px 12px';
            btnSave.style.cursor = 'pointer';

            btnSave.onclick = () => {
                // 1) 获取文本域内容
                const val = textarea.value;
                // 2) 更新外部内容区域
                if (typeof callback === 'function') callback(val, popup.close.bind(popup));
                // 3) 关闭弹窗
                //popup.close();
            };

            actions.appendChild(btnCancel);
            actions.appendChild(btnSave);

            wrap.appendChild(textarea);
            wrap.appendChild(actions);
            return wrap;
        };

        // 销毁已有
        if (popup) {
            popup.destroy();
            popup = null;
        }

        // 创建新弹窗
        popup = new Popup({
            className: 'ai-popup',
            theme,
            title: title || '编辑',
            width: 460,
            center: true,
            edgePadding: { top: 30 }, // 初始限制
            content
        });

        popup.open();
    }

    function show() {
        dialog.classList.add('show');
    }

    // 导出函数和变量
    window.aiDialog = {
        openDialog,
        closeDialog,
        showExplainMessage,
        bottomShow,
        scrollToBottom,
        chatWelcomeShow,
        submitMessage,
        sendMessage,
        clearHistory,
        resetChats,
        explainMessageActionShow,
        chatMessageActionShow,
        showImage,
        getHistory,
        getGlobalHistory,
        show,
        pin,
        setVK,
        dialog,
        dialogContent,
        models,
        model,
        button,
    };

})();