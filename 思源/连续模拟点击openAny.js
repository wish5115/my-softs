// 连续模拟点击 openAny
// see 
// version 0.0.1
// 支持多个选择符的链式点击或文本输入
// 不会自动滚动加载

// 调用方式：
// 或 openAny(["selector1", "selector2"]);
// 或 openAny(["selector1", "selector2{sdfdsf}", "selector3"]);
/* 或
    try {
        openAny(["selector1", "selector2"]);
    } catch(e) {
        console.log(e);
    }
*/
// 极个别情况有问题时可在回调函数中使用await sleep;
/*
比如：
openAny(["selector1", "selector2"], async ({index,step,sleep})=> {
    if(index === 1) await sleep(200);
});
*/
// 也可以多个分别分开调用，比如：
/*
await openAny(["selector1", "selector2"]);
await openAny(["selector3", "selector4"]);
*/

// 注意：
// 选择符必须全局唯一
// 选择符最后面加{}代表是输入框选择符
// 比如 "selector2{hello}"代表selector2元素是输入框选择符，hello代表输入框要输入的文本
// 如果选择符最后面本身有{},通过\\{\\}转义即可，前面或中间的没影响
// 举例：
// 通过命令打开设置窗口，这里的选择符最好的{设置}代表是输入框选择符，并在输入框中输入“设置”二字
// openAny(['#barCommand', '[data-key="dialog-commandpanel"] .search__header input{设置}', '#commands [data-command="config"]']);

// 实际示例：
// 打开设置
// openAny(['#barWorkspace', '[data-id="config"]']);
// 切换到导出预览
// openAny(['[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) [data-type="more"]', '[data-id="preview"]']);
// 切换会所见即所得
// openAny(['[data-type="wnd"].layout__wnd--active .protyle:not(.fn__none) [data-type="more"]', '[data-id="wysiwyg"]']);
// 打开代码片段窗口
// openAny(['#barWorkspace', '[data-id="config"]', '[data-name="appearance"]', '#codeSnippet']);
// 通过命令打开设置窗口
// openAny(['#barCommand', '[data-key="dialog-commandpanel"] .search__header input{设置}', '#commands [data-command="config"]']);

(async ()=>{
    window.openAny = openAny;
    async function openAny(stepSelectors = [], stepBeforeCallback, stepAferCallback) {
        for (let [index, stepSelector] of stepSelectors.entries()) {
            stepSelector = stepSelector.trim();
            if(!stepSelector) throw new Error('第'+index+'步，缺少选择符');
            let step;
            if(isInput(stepSelector)) {
                // 输入文本
                stepSelector = getInputSelector(stepSelector);
                step = document.querySelector(stepSelector);
                if(!step) throw new Error('没找到元素'+stepSelector);
                step.value = getInputText(stepSelector);
                step.dispatchEvent(new Event('input'));
            } else {
                // 模拟点击
                step = document.querySelector(stepSelector);
                if(!step) throw new Error('没找到元素'+stepSelector);
                step.click();
            }
            // setp回调
            if(typeof stepBeforeCallback === 'function') await stepBeforeCallback({index,step,stepSelector,stepSelectors,sleep,isInput,getInputSelector,getInputText});
            let nextSelector = stepSelectors[index+1];
            nextSelector = getInputSelector(nextSelector);
            let next;
            if(nextSelector) {
                nextSelector = nextSelector.trim();
                try {
                    next = await whenElementExist(nextSelector);
                } catch(e) {
                    throw new Error('元素'+nextSelector+'等待超时，'+e.message);
                }
            }
            if(typeof stepAferCallback === 'function') await stepAferCallback({index,step,next,stepSelector,nextSelector,stepSelectors,sleep,isInput,getInputSelector,getInputText});
        }
    }
    
    /**
     * 判断选择器是否是输入框选择符（以 {text} 结尾）
     * @param {string} selector - 输入的选择器字符串
     * @returns {boolean} - 是否是输入框选择符
     */
    function isInput(selector) {
        if(selector?.endsWith('\\}')) return false;
        return /{([^}]*)}$/.test(selector?.trim());
    }
    
    /**
     * 获取去掉 {} 及其内容后的真正选择器部分
     * @param {string} selector - 输入的选择器字符串
     * @returns {string|null} - 真正的选择器部分，如果不符合格式则返回 null
     */
    function getInputSelector(selector) {
        if (!isInput(selector)) return selector; // 如果不是输入框选择符，直接返回seselector
        return selector?.replace(/{[^}]*}$/, '')?.trim();
    }
    
    /**
     * 获取 {} 中的内容（输入框要输入的文本）
     * @param {string} selector - 输入的选择器字符串
     * @returns {string|null} - {} 中的内容，如果不符合格式则返回 null
     */
    function getInputText(selector) {
        if (!isInput(selector)) return ''; // 如果不是输入框选择符，直接返回空值
        const match = selector?.match(/{([^}]*)}$/);
        const text = match ? match[1] : '';
        return text?.trim() || '';
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function whenElementExist(selector, node, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let isResolved = false;
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) {isResolved = true; resolve(el);} else if(!isResolved) requestAnimationFrame(check);
            };
            check();
            setTimeout(() => {
                if (!isResolved) {
                    reject(new Error(`Timeout: Element not found for selector "${selector}" within ${timeout}ms`));
                }
            }, timeout);
        });
    }
})();