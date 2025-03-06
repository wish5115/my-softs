// 给笔记本添加文档数
(() => {
    whenElementExist('ul[data-url]').then(() => {
        const boxes = document.querySelectorAll('ul[data-url]');
        boxes.forEach(async box => {
            const response = await query(`SELECT count(*) as count FROM blocks where box = '${box.dataset.url}' and type = 'd';`);
            if(!response[0] || !response[0]['count']) return;
            const count = response[0]['count'];
            const li = box.querySelector('li[data-type="navigation-root"]');
            if(!li) return;
            const boxText = li.querySelector('span.b3-list-item__text');
            if(!boxText) return;
            boxText.textContent += ` (${count})`;
        });
    });
    
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }

    // 查询SQL函数
    async function query(sql) {
        const result = await fetchSyncPost('/api/query/sql', { "stmt": sql });
        if (result.code !== 0) {
            console.error("查询数据库出错", result.msg);
            return [];
        }
        return result.data;
    }

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

    // 等待元素出现（简版）
    function whenElementExist(selector, node) {
        return new Promise(resolve => {
            const check = () => {
                const el = typeof selector==='function'?selector():(node||document).querySelector(selector);
                if (el) resolve(el); else requestAnimationFrame(check);
            };
            check();
        });
    }
})();