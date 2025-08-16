//  查找并修复丢失资源（仅限同名资源）
// see https://ld246.com/article/1755320264420
// version 0.0.3
// 0.0.3 改进当资源未丢失时不显示查找按钮
// 0.0.2 改进非资源文件链接不再显示查找按钮
// 支持图片资源，zip，pdf等资源（仅限本地资源）
// 注意：并不通用，仅适用于特定需求，比如扩展名不一致的情况
// 注意：当包含多个同名文件时（不包括扩展名），默认取第一个匹配的文件
setTimeout(()=>{
    // 指定查找资源的扩展名，如果未指定，则取第一个文件名（不包括扩展名）相同的资源
    const findAssetExt = '';

    const wrapper = document.querySelector('.layout__center, #editor');
    const commonMenu = document.querySelector('#commonMenu');
    if(!wrapper || !commonMenu) return;
    const main = async (event) => {
        // 右键，非图片和资源链接返回
        if(event.type === 'contextmenu' && (!event.target.matches('img') && !event.target.matches('[data-type="a"]'))) return;
        // 点击，非图片菜单返回
        if(event.type === 'click' && !event.target.closest('span[data-type="img"] .protyle-icons')) return;
        const copyBtn = await whenElementExist('[data-id="copy"]', commonMenu);
        if(!copyBtn) return;
        // 已添加返回
        if(commonMenu.querySelector('[data-id="findAsset"]')) return;
        // 非本地资源返回
        const assetSrcInput = commonMenu.querySelector(':is([data-id="imageUrlAndTitleAndTooltipText"], [data-id="linkAndAnchorAndTitle"]) textarea');
        const src = assetSrcInput.value;
        if(!src.toLowerCase().startsWith('assets')) return;
        // 资源未丢失返回
        const results = await requestApi('/api/search/searchAsset', {"k": src});
        if(results?.data?.length) return;
        // 添加查找按钮
        const html = `<button data-id="findAsset" class="b3-menu__item"><svg class="b3-menu__icon " style=""><use xlink:href="#iconSearch"></use></svg><span class="b3-menu__label">查找并修复丢失资源</span></button>`;
        copyBtn.insertAdjacentHTML('beforebegin', html);
        const findAssetBtn = commonMenu.querySelector('[data-id="findAsset"]');
        // 查找按钮点击事件
        findAssetBtn.addEventListener('click', async ()=>{
            let assetName = getAssetName(src);
            assetName = assetName + (findAssetExt?'.'+findAssetExt:'');
            const results = await requestApi('/api/search/searchAsset', {"k": assetName});
            const assets = results?.data?.filter(item=>item.path.includes(assetName));
            const newAssetSrc = assets[0]?.path;
            if(!newAssetSrc) {showMessage('未找到可用的资源'); return;}
            if(newAssetSrc !== src) {
                assetSrcInput.value = newAssetSrc;
                assetSrcInput.dispatchEvent(new Event('input'));
                showMessage('更新资源成功');
            }
        });
    };
    wrapper.addEventListener('click', main, true);
    wrapper.addEventListener('contextmenu', main, true);

    function whenElementExist(selector, node = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                let el;
                try {
                    el = typeof selector === 'function' ? selector() : node.querySelector(selector);
                } catch (err) { return resolve(null); }
                if (el) resolve(el);
                else if (Date.now() - start >= timeout) resolve(null);
                else requestAnimationFrame(check);
            }
            check();
        });
    }
    async function requestApi(url, data, method = 'POST') {
        return await (await fetch(url, {method: method, body: JSON.stringify(data||{})})).json();
    }
    function showMessage(message, isError = false, delay = 7000) {
        return fetch('/api/notification/' + (isError ? 'pushErrMsg' : 'pushMsg'), {
            "method": "POST",
            "body": JSON.stringify({"msg": message, "timeout": delay})
        });
    }
    // 获取资源文件名（不不包括扩展名）
    function getAssetName(filepath) {
        filepath = filepath.split('?')[0];
        const lastDotIndex = filepath.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex < filepath.lastIndexOf('/')) {
          // 没有扩展名，或最后一个 . 在路径分隔符之后（不合理），返回原路径
          //return filepath?.split('/').pop();
        } else {
            filepath = filepath.slice(0, lastDotIndex);
        }
        return filepath?.split('/').pop();
    }
}, 2000);