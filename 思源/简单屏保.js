// 简单屏保
// 支持密码解锁、自适应大小、兼容手机
// see https://ld246.com/article/1754182872078
// 灵感来自@zxkmm大佬的帖子 https://ld246.com/article/1754143462043
(async () => {
  const enableTextMove = true; // 是否开启移动文本
  // 屏保显示的文本，每个单独一行，当textMode=1时有效
  const texts = `
     平等 • 自由 • 奔放
     思源笔记，重构你的思维
     会泽百家，至公天下
     思源，不只是笔记
     让思想自由流淌
     知识有源，思想无界
     从思源开始，重构认知
     思源重建你的第二大脑
     汇聚思想，连通智慧
     每条笔记，都是思维的种子
     在碎片中构建知识宇宙
     打破框架，释放灵感
     无拘无束，只写所思
     本地优先，终身留存
     数据掌控，安全无忧
     专注写作，远离喧嚣
     思接千载，源于一字一句
     笔记有源，思想不息
     是记录，更是思考
     溯源而上，见思之光
     思之有源，行之深远
  `;
  // 心灵毒鸡汤数据地址，当textMode=2时有效（建议下载到本地）
  const dujitangData = '/snippets/libs/xldjt.txt';
  //const dujitangData = 'https://jsd.onmicrosoft.cn/gh/wish5115/my-softs@main/%E6%95%B0%E6%8D%AE/%E5%BF%83%E7%81%B5%E6%AF%92%E9%B8%A1%E6%B1%A4.txt';
  const textMode = 1; // 文本模式，1 静态文本（即上文texts参数的值） 2 心灵毒鸡汤
  const idleTime = 10;   // 空闲多少分钟后启动屏保，默认10分钟
  const minFontSize = 20;   // 文本最小字号
  const maxFontSize = 60;   // 文本最大字号
  const padding = 0;       // 文本元素与边缘的最小距离
  const textMoveInterval = 7000; // 文本移动间隔，单位毫秒（间隔过小会较耗资源）
  
  const enablePassword = false; // 是否启用密码输入框
  const password = "   "; // 设置密码，默认密码3个空格，方便快速输入
  
  let screenSaverActive = false;
  let idleTimer = null;
  let moveInterval = null;
  let eventsBound = false;  // 标记事件是否已绑定
  let textArray = texts.split('\n').map(it=>it.trim()).filter(Boolean);
  let idleDelay = idleTime * 60000;

  // 获取毒鸡汤数据（建议下载到本地）
  if(textMode === 2) {
      let response = await fetch(dujitangData);
      response = await response.text();
      textArray = response.split('\n').map(it=>it.trim()).filter(Boolean);
  }
  
  // 创建屏保元素
  const saver = document.createElement('div');
  Object.assign(saver.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    padding: '12px 20px',
    pointerEvents: 'none',
    zIndex: '999999',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 添加透明背景
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: minFontSize + 'px',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    transition: 'all 0.8s ease',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    lineHeight: '1.4',
    opacity: '0',
    transform: 'translate(0, 0)',
    userSelect: 'none',
  });
  saver.textContent = getRandomText(textArray);
  document.body.appendChild(saver);

  // 创建密码输入框
  const passwordInput = document.createElement('div');
  passwordInput.style = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000000; display: none; background-color: rgba(0, 0, 0, 0.7); padding: 20px; border-radius: 8px; color: white; font-size: 18px;';
  passwordInput.innerHTML = `
    <div id="passwordTitile">请输入密码以退出屏保:</div>
    <div id="errorMessage" style="color: #ff8181; display: none;">密码错误，请重新输入！</div>
    <input type="password" id="screenSaverPassword" style="margin-top: 10px; padding: 8px; font-size: 16px;" />
    <button id="submitPassword" style="margin-top: 10px; padding: 5px 16px;background-color: #91c191;">提交</button>
    <button id="cancelPassword" style="margin-top: 10px; padding: 5px 16px; background-color: #e8b1b1;;">取消</button>
  `;
  document.body.appendChild(passwordInput);
  // 监听回车键提交密码
  passwordInput.querySelector('#screenSaverPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      validatePassword(); // 调用验证密码的函数
    }
  });

  function getRandomText(array) {
    if(typeof array === 'string') {
        array = array.split('\n').map(item=>item.trim()).filter(Boolean);
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  // 获取视口尺寸（兼容移动端）
  function getViewportSize() {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    };
  }

  // 自适应字体大小
  function updateFontSize() {
    const { width } = getViewportSize();
    const ratio = Math.max(0, Math.min(1, (width - 320) / (1920 - 320)));
    const fontSize = minFontSize + ratio * (maxFontSize - minFontSize);
    saver.style.fontSize = fontSize + 'px';
  }

  // 获取元素实际尺寸
  function getElementSize() {
    const rect = saver.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  // 生成随机位置（确保不超出屏幕）
  function randomPosition() {
    const { width: vw, height: vh } = getViewportSize();
    const { width: ew, height: eh } = getElementSize();
    const maxX = vw - ew - padding * 2;
    const maxY = vh - eh - padding * 2;
    const x = Math.random() * Math.max(0, maxX) + padding;
    const y = Math.random() * Math.max(0, maxY) + padding;
    return [x, y];
  }

  // 移动元素
  function moveElement() {
    if (!screenSaverActive) return;
    saver.textContent = getRandomText(textArray);
    const [x, y] = randomPosition();
    saver.style.transform = `translate(${x}px, ${y}px)`;
    saver.style.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
  }

  // 启动屏保
  let firstRun = true; // 防止第一次执行时获取文本宽度不准
  async function startScreenSaver() {
    if (screenSaverActive) return;
    screenSaverActive = true;

    if(enableTextMove) {
        updateFontSize();
        if(firstRun) await new Promise(resolve => setTimeout(resolve, 500));
        firstRun = false;
        const [x, y] = randomPosition();
        saver.style.opacity = '1';
        saver.style.transform = `translate(${x}px, ${y}px)`;
    
        moveElement();
        moveInterval = setInterval(moveElement, textMoveInterval);
    }
    passwordInput.style.display = 'none';
    passwordInput.querySelector('#screenSaverPassword').value = '';
  }

  // 退出屏保
  function exitScreenSaver() {
    if (!screenSaverActive) return;
    screenSaverActive = false;
    if(moveInterval) clearInterval(moveInterval);
    moveInterval = null;

    saver.style.opacity = '0';
    // 如果启用了密码输入框，显示密码输入框
    if (enablePassword) {
      passwordInput.style.display = 'block';
      document.body.style.pointerEvents = 'none'; // 禁止操作后面的元素
      passwordInput.style.pointerEvents = 'auto';  // 允许操作密码输入框
      setTimeout(()=>passwordInput.querySelector('#screenSaverPassword').focus(), 100);
    } else {
      // 否则直接结束屏保
      passwordInput.style.display = 'none';
      document.body.style.pointerEvents = 'auto';
    }
  }

  // 校验密码
  function validatePassword() {
    const enteredPassword = document.getElementById('screenSaverPassword').value;
    if (enteredPassword === password) {
      // 密码正确，退出屏保，解锁后面的元素
      passwordInput.style.display = 'none';
      saver.style.opacity = '0';
      document.body.style.pointerEvents = 'auto'; // 允许操作后面的元素
      document.getElementById('screenSaverPassword').value = ''; // 清空密码输入框
    } else {
      // 密码错误，显示错误提示
      const passwordTitile = passwordInput.querySelector('#passwordTitile');
      const errorMessage = passwordInput.querySelector('#errorMessage');
      passwordTitile.style.display = 'none';
      errorMessage.style.display = 'block';
      setTimeout(()=>passwordInput.querySelector('#screenSaverPassword').focus(), 100);
      setTimeout(()=>{
          errorMessage.style.display = 'none';
          passwordTitile.style.display = 'block';
      }, 2000);
    }
  }

  // 取消密码输入
  function cancelPassword(event) {
    if (event) event.stopPropagation();
    passwordInput.style.display = 'none';
    setTimeout(()=>{
        document.body.style.pointerEvents = 'auto'; // 允许操作后面的元素
        startScreenSaver(); // 继续屏保
    }, 1000);
  }

  // 设置空闲监听（可重复调用）
  function setupIdleListener() {
    clearTimeout(idleTimer);

    const reset = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startScreenSaver, idleDelay);
    };

    // 确保事件只绑定一次
    if (!eventsBound) {
      // 绑定空闲重置事件
      ['mousemove', 'touchstart', 'touchmove', 'keypress', 'scroll'].forEach(event => {
        document.addEventListener(event, reset, { passive: true });
      });

      // 绑定退出事件
      ['mousemove', 'touchstart', 'touchmove', 'keypress', 'click'].forEach(event => {
        document.addEventListener(event, exitScreenSaver, { passive: true });
      });
      
      eventsBound = true;
    }

    // 立即启动计时
    reset();
  }

  // 监听密码提交和取消按钮
  passwordInput.querySelector('#submitPassword').addEventListener('click', validatePassword);
  passwordInput.querySelector('#cancelPassword').addEventListener('click', cancelPassword);

  // 👉 首次启动空闲监听
  setupIdleListener();

  // 暴露接口，方便调试
  window.exitScreenSaver = exitScreenSaver;
  window.startScreenSaver = startScreenSaver;
})();