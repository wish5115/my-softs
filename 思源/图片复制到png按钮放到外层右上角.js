// 图片复制到png按钮放到外层右上角
// see https://ld246.com/article/1747019320003
(()=>{
    let isOn = false;
    document.addEventListener('mouseover', (e)=>{
        const img = e.target.closest('[data-type="img"]');
        if(!img) return; if(isOn) return;
        isOn = true; setTimeout(()=>isOn=false, 100);
        if(img.querySelector('.cst-copy-png')) return;
        const action = img.querySelector('.protyle-action');
        if(!action) return;
        const actionIcon = img.querySelector('.protyle-action .protyle-icon');
        if(actionIcon) {
            actionIcon.style.borderTopLeftRadius = '0';
            actionIcon.style.borderBottomLeftRadius = '0';
        }
        const copyPngHtml = `<span class="protyle-icon protyle-icon--only protyle-custom cst-copy-png" style="border-top-right-radius:0;border-bottom-right-radius:0"><svg class="svg"><use xlink:href="#iconImage"></use></svg></span>`;
        action.insertAdjacentHTML('afterbegin', copyPngHtml);
        const copyPngBtn = img.querySelector('.cst-copy-png');
        copyPngBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyPNGByLink(img.querySelector('img')?.src||'');
        });
    });
    // see https://github.com/siyuan-note/siyuan/blob/e47b8efc2f2611163beca9fad4ee5424001515ff/app/src/menus/util.ts#L175
    function copyPNGByLink(link) {
        if(!link) return;
        if (isInAndroid()) {
            window.JSAndroid.writeImageClipboard(link);
            return;
        } else {
            const canvas = document.createElement("canvas");
            const tempElement = document.createElement("img");
            tempElement.onload = (e) => {
                canvas.width = e.target.width;
                canvas.height = e.target.height;
                canvas.getContext("2d").drawImage(e.target, 0, 0, e.target.width, e.target.height);
                canvas.toBlob((blob) => {
                    navigator.clipboard.write([
                        new ClipboardItem({
                            // @ts-ignore
                            ["image/png"]: blob
                        })
                    ]);
                }, "image/png", 1);
            };
            tempElement.src = link;
        }
    }
    function isInAndroid() {
        return window.siyuan.config.system.container === "android" && window.JSAndroid;
    }
})();