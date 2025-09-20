// 让状态栏自动隐藏，鼠标靠近底边显示，当状态栏有信息时临时显示
// statusWidth 状态栏宽度，0为屏幕宽度，默认330（即鼠标移动范围，在这个范围内显示状态栏）
// statusHeight 状态栏高度，0自动计算高度，默认26（即鼠标移动范围，在这个范围内显示状态栏）
// statusMsgShow 当状态栏有信息时是否临时显示，默认true
// statusBgTaskShow 当后台任务有信息时是否临时显示，默认false
autoHideStatus();
function autoHideStatus(statusWidth = 330, statusHeight = 26, statusMsgShow = true, statusBgTaskShow = false) {
    let status = document.getElementById('status');
    if(!status) return;
    status.style.display = 'none';
    let statusRight = 0,
        mousedown = false,
        moved = false;
    setTimeout(() => {
        // 获取状态栏宽高等信息
        status.style.display = 'flex';
        const statusStyle = window.getComputedStyle(status, null);
        const statusMsg = status.querySelector('.status__msg');
        const statusBgTask = status.querySelector('.status__backgroundtask');
        const customStatus = status.querySelector('.my_status__msg');
        const statusMsgWidth = statusMsg?.offsetWidth || 0;
        const statusBgTaskWidth = statusBgTask?.offsetWidth || 0;
        const customStatusWidth = customStatus?.offsetWidth || 0;
        statusHeight = statusHeight || parseFloat(statusStyle?.height) || 0;
        //statusWidth = parseFloat(statusStyle?.width) || 0;
        statusRight = parseFloat(statusStyle?.right) || 0;
        //statusWidth = statusWidth - statusMsgWidth - statusBgTaskWidth - customStatusWidth;
        statusWidth = statusWidth || window.innerWidth;
        status.style.display = 'none';

        // 监控被写入和清空
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const currentText = mutation.target.textContent.trim();
                    if (currentText === '') {
                        // 元素内容被清空
                        status.style.display = 'none';
                    } else {
                      // 元素内容被写入
                      status.style.display = 'flex';
                    }
                }
            });
        });
        const options = {
            childList: true,   // 子节点增删
            subtree: true,     // 监听所有后代
            characterData: true, // 文本内容变化
            attributes: false
        };
        if(statusMsg) observer.observe(statusMsg, options);
        if(statusBgTaskShow && statusBgTask) observer.observe(statusBgTask, options);
        if(customStatus) observer.observe(customStatus, options);
    }, 3000);

    // 恢复拖动
    status.addEventListener('mousedown', () => mousedown = true);
    status.addEventListener('mouseup', () => mousedown = false);
    status.addEventListener('dblclick', () => moved = false);
    
    let timeoutId;
    document.addEventListener('mousemove', (e) => {
        if(timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            const mouseY = e.clientY;
            const mouseX = e.clientX;
            if (mouseY > windowHeight - statusHeight && mouseX > (windowWidth - statusWidth - statusRight)) {
                status.style.display = 'flex';
            } else {
                const moveEl = document.elementFromPoint(mouseX, mouseY);
                if(moveEl?.nodeType!==1) return;
                // status在只身移动或拖动时和被拖动后不隐藏，否则隐藏
                if(moveEl?.closest('#status') || moved){
                    // 拖动后设置被拖动标识
                    if(mousedown) moved = true;
                } else {
                    status.style.display = 'none';
                }
            }
        }, 100);
    });
}