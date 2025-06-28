setTimeout(() => {
    if(typeof process === 'undefined') return;
    const counter = document.querySelector('#status .status__counter');
    const html = `<div class="status__resUsage" style="font-size:12px;cursor:pointer;"><span class="ft__on-surface">CPU</span>&nbsp;<span class="fn__cpu">2%</span><span class="fn__space"></span><span class="ft__on-surface">内存</span>&nbsp;<span class="fn__mem">126</span><span class="fn__space"></span></div>`;
    counter.insertAdjacentHTML('beforebegin', html);
    const usageBtn = counter.previousElementSibling;
    usageBtn.addEventListener('click',(event)=>{
        started ? stop() : start();
    });
    const cpu = usageBtn.querySelector('.fn__cpu');
    const mem = usageBtn.querySelector('.fn__mem');
    let intervalId, started = false;
    start();
    function start() {
        if(intervalId) clearInterval(intervalId);
        started = true;
        usageBtn.classList.remove('ft__secondary');
        intervalId = setInterval(() => {
            const cpuUsage = process.getCPUUsage();
            const memUsage = process.memoryUsage();
            // 获取系统总内存（以字节为单位）
            //const totalMemBytes = require('os').totalmem();
            // 内存占比（%）
            // const memPercent = ((memUsage.rss / totalMemBytes) * 100).toFixed(1);
            cpu.textContent = cpuUsage.percentCPUUsage.toFixed(1)+'%';
            mem.textContent = (memUsage.rss/1024/1204).toFixed(1)+'M';
        }, 3000);
    }
    function stop() {
        if(intervalId) clearInterval(intervalId);
        started = false;
        usageBtn.classList.add('ft__secondary');
    }
}, 2000);