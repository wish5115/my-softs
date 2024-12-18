// 链滴自动签到puppeteer脚本
// see https://ld246.com/article/1724548513173

// 用户名和密码，必须
const username = "";
const password = "";
// 二次验证秘钥，选填，未开启保持为空即可（可在链滴官网用户设置->安全设置->两步验证中获取，如果已绑定的需先解绑才能看到）
// 使用前先安装otplib库 npm install otplib
const twoFactorAuthKey = "";

// 设置浏览器安装路径，必须，如果填空，则使用puppeteer模式而不是puppeteer-core
// Windows用户可能是 "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"，注意这里的路径要用\转义
//const chromePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"; // Edge浏览器
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// 通知脚本路径，可选，如果没有，填空即可，空则不通知
const notifyShellPath = "";

// 警告脚本路径，可选，如果没有，填空即可，空则不警告
//（和通知的区别是，警告只会在发生错误时弹出，而通知则是普通的异常，比如签到失败）
const alertShellPath = "";

// 用户代理，必须，否则无头模式下被反爬虫阻止访问，请使用真实浏览器代理，如果你不清楚就使用默认的即可
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

/////////////////////// 以下代码通常不需要修改 //////////////////////////////////

// 是否调试模式，true为调试模式，正式环境别忘了设置为false
const DEBUG = process.argv.includes("--debug") || false;

// 登录的URL
const loginUrl = "https://ld246.com/login";
// 签到URL
const signInUrl = "https://ld246.com/activity/checkin";
// 二次验证URL
const twoFactorAuthUrl = "https://ld246.com/login/2fa";

// 登录按钮选择器
const usernameFieldSelector = "#nameOrEmail";
const passwordFieldSelector = "#loginPassword";
const loginButtonSelector = "#loginBtn";
const logoutButtonSelector = "#signOut";
const loginErrorTipSelector = "#loginTip.error";
const twoFactorAuthCheckSelector = "#verify2faBtn";
const twoFactorAuthInputSelector = "#verify2faInput";
const twoFactorAuthErrorSelector = ".dialog__content";

// 签到按钮选择器
const signInSelector = "a.btn.green";
const hasSignInSelector = "a.btn[href$='points']";

// 引入文件系统模块
const fs = require('fs');
const puppeteer = require(chromePath?'puppeteer-core':'puppeteer');

// 创建一个写入流对象，用于向日志文件写入数据
const logStream = fs.createWriteStream('log.txt', { flags: 'a' });

// 获取临时文件夹路径
//const os = require('os');
//const tempDir = os.tmpdir();
const path = require('path');
const tempDir = path.join(__dirname, "tmp");
if(!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
const lockFilePath = path.join(tempDir, '~~ld246'+ username + new Date().toLocaleDateString().replace(/\//g, '') + '~~signin.lock');
if(DEBUG) console.log("lockFilePath: ", lockFilePath);
const cookieFilePath = path.join(tempDir, `~~ld246${username}~~cookies.json`);
if(DEBUG) console.log("cookieFilePath: ", cookieFilePath);
let yesterday = new Date(new Date());
yesterday.setDate(yesterday.getDate() - 1);
yesterday = yesterday.toLocaleDateString().replace(/\//g, '');
const lastLockFilePath = path.join(tempDir, '~~ld246'+ username + yesterday + '~~signin.lock');
if(DEBUG) console.log("lastLockFilePath: ", lastLockFilePath);

// 检测用户名和密码是否正确
if (!username || !password) {
  console.error('用户名和密码必填');
  logStream.end();
  process.exit(1);
}
// 检测chromePath是否正确
if(chromePath){
  if(!fs.existsSync(chromePath)){
    console.error('chromePath错误，请检查chromePath是否正确');
    logStream.end();
    process.exit(1);
  }
}

// 如果已签到则退出
if (fs.existsSync(lockFilePath)) {
    if(!DEBUG && !process.argv.includes('--force')){
        console.log("今日已签到");
        //console.log(lockFilePath);
        logStream.end();
        process.exit(0);
    }
}

// 清除昨日的锁文件
if (fs.existsSync(lastLockFilePath)) {
  try {
    fs.unlinkSync(lastLockFilePath);
  } catch (e) {
    console.log("clear lastLockFilePath failed");
  }
}

(async () => {
  // 启动浏览器
  const options = {
    headless: process.argv.includes('--headless') || !DEBUG,
  };
  if(chromePath) options.executablePath = chromePath;
  const browser = await puppeteer.launch(options);
  // 创建一个新页面
  const page = await browser.newPage();
  await page.setUserAgent(userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
  try {
    // 获取cookie信息
    let cookies = getCookies();
    if (cookies) {
      // 添加 cookies 到 page
      console.log('setCookies success');
      await page.setCookie(...cookies);
    }

    // 跳转签到页面
    console.log("打开签到页面", signInUrl);
    await page.goto(signInUrl, { timeout: 60000 });

    // 判断是否已登录
    const hasLogin = await page.$(logoutButtonSelector);
    if(!hasLogin) {
      // 模拟登录
      console.log("检测到未登录，正在打开登录页面", loginUrl);
      await page.goto(loginUrl, { timeout: 60000 });
      await page.locator(usernameFieldSelector).fill(username);
      await page.locator(passwordFieldSelector).fill(password);
      await page.locator(loginButtonSelector).click();
      // 等待登录完成
      try {
        await page.waitForNavigation({ timeout: 60000 });
      } catch (e) {
        // 登录发生错误时，获取页面错误信息
        try {
          // 获取网站返回错误信息
          await page.waitForSelector(loginErrorTipSelector, { timeout: 5000 });
          const errorMessage = await page.$eval(loginErrorTipSelector, el => el.textContent.trim());
          console.log('登录失败，网站返回错误信息：', errorMessage);
          logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 登录失败，网站返回错误信息：" + errorMessage + "\n");
          alert(username + " 登录失败，网站返回错误信息：" + errorMessage);
          await exit(1);
        } catch(e) {
          // 获取网站错误信息失败
          console.log('登录失败，错误信息：' + e.message);
          logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 登录失败，错误信息：" + e.message + "\n");
          alert(username + " 登录失败，错误信息：" + e.message);
          await exit(1);
        }
      }
      // 判断是否进入二次验证页面
      try {
        const is2faPage = await page.$(twoFactorAuthInputSelector);
        if(is2faPage) {
          const token = generateSecretKey(twoFactorAuthKey);
          await page.locator(twoFactorAuthInputSelector).fill(token);
          await page.locator(twoFactorAuthCheckSelector).click();
          try {
            await page.waitForNavigation({ timeout: 60000 });
          } catch (e) {
            // 二次验证发生错误时，获取页面错误信息
            try {
              // 获取网站返回错误信息
              await page.waitForSelector(twoFactorAuthErrorSelector, { timeout: 5000 });
              const errorMessage = await page.$eval(twoFactorAuthErrorSelector, el => el.textContent.trim());
              console.log('二次验证失败，网站返回错误信息：', errorMessage);
              logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 二次验证失败，网站返回错误信息：" + errorMessage + "\n");
              alert(username + " 二次验证失败，网站返回错误信息：" + errorMessage);
              await exit(1);
            } catch(e) {
              // 获取网站错误信息失败
              console.log('二次验证失败，错误信息：' + e.message);
              logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 二次验证失败，错误信息：" + e.message + "\n");
              alert(username + " 二次验证失败，错误信息：" + e.message);
              await exit(1);
            }
          }
          // 二次验证已完成
          console.log("二次验证已完成");
        }
      } catch (e) {
        console.log("二次验证败");
        logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 二次验证败\n");
        alert("二次验证败");
        await exit(1);
      }

      // 登录完成后，尝试获取登录信息
      const hasLogin = await page.$(logoutButtonSelector);
      if(!hasLogin) {
        // 未获取到登录信息
        console.log("登录失败，无法获取登录信息");
        logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 登录失败，无法获取登录信息\n");
        alert("登录失败，无法获取登录信息");
        await exit(1);
      }
      // 登录成功
      console.log("登录已完成");
      // 保存 cookies
      cookies = await page.cookies();
      fs.writeFileSync(cookieFilePath, JSON.stringify(cookies, null, 2), 'utf8');
      console.log("已保存cookies");

      // 检查当前页面是否签到页面，不是则跳转到签到页面
      if(page.url() !== signInUrl) {
        // 跳转到签到页面
        console.log("检测到当前不在签到页，正跳转到签到页面");
        await page.goto(signInUrl, { timeout: 60000 });
      }
    }

    // 检查是否有已签到元素
    const hasSignInElement = await page.$(hasSignInSelector);
    if (hasSignInElement) {
      console.log('今日已签到');
      fs.writeFileSync(lockFilePath, '');
    } else {
      // 模拟签到
      await page.locator(signInSelector).click();

      // 等待签到完成
      await page.waitForNavigation({ timeout: 60000 });
      const hasSingIn = await page.$(hasSignInSelector);
      if(!hasSingIn){
        // 签到失败退出
        console.log("签到失败，未获取到已签信息");
        logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 签到失败，未获取到已签信息\n");
        notice("签到失败，未获取到已签信息");
        await exit(1);
      }
      // 签到完成锁定签到
      console.log("签到已完成");
      fs.writeFileSync(lockFilePath, '');

      // 获取积分
      console.log("获取积分中...");
      const scoreElement = await page.$("code");
      if (scoreElement) {
        // 获取积分成功
        const score = await page.evaluate((el) => el.textContent, scoreElement);
        console.log("积分:", parseInt(score));
        logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 签到成功，积分: " + parseInt(score) + "\n");
      } else {
        // 获取积分失败
        console.log("未找到积分元素");
        logStream.write("[" + (new Date().toLocaleString()) + "] " + username + " 签到成功，但未找到积分元素\n");
      }
    }
  } catch (error) {
    // 发生错误处理
    console.error("发生错误:", error.message);
    logStream.write("[" + (new Date().toLocaleString()) + "] 发生错误: " + error.message + "\n");
    alert("发生错误:" + error.message);
    exit(1);
  } finally {
    exit(0);
  }

  // 退出进程
  async function exit(code, delay) {
    // 退出码
    code = code || 0;
    // 延迟关闭
    if(delay && typeof delay === 'number') await sleep(delay);
    // 关闭写入流
    logStream.end();
    // 关闭浏览器
    if(!DEBUG) {
      console.log("已关闭浏览器");
      await browser.close();
      process.exit(code);
    }
  }
})();

// 生成二次验证token
// 使用前先安装otplib库 npm install otplib
function generateSecretKey(twoFactorAuthKey) {
  // see https://www.npmjs.com/package/otplib
  const OTPLib = require('otplib');
  const token = OTPLib.authenticator.generate(twoFactorAuthKey);
  return token;

  // 备用方案
  // see https://www.npmjs.com/package/otpauth/v/8.0.1
  // const OTPAuth = require('otpauth');
  // const totp = new OTPAuth.TOTP({
  //   secret: twoFactorAuthKey // or "OTPAuth.Secret.fromBase32('')"
  // });
  // const token = totp.generate();
  // return token;
}

// 获取已保存的cookies
function getCookies() {
  // 尝试加载 cookies
  let cookies;
  if(!fs.existsSync(cookieFilePath)){
    return cookies;
  }
  try {
    cookies = JSON.parse(fs.readFileSync(cookieFilePath, 'utf8'));
    console.log("加载cookies成功");
  } catch (error) {
    console.log("没有找到cookies文件，将重新登录");
  }
  return cookies;
}

// 显示通知
function notice(message, title) {
    if(!notifyShellPath) return;
    if (fs.existsSync(notifyShellPath)) {
        console.log("发送通知", message, title);
        const { exec } = require('child_process');
        // 假设我们要执行 `ls` 命令，‌并传递 `-l` 和 `-a` 作为参数
        const command = `${notifyShellPath} "${message || "未知错误"}" "${title || "签到异常"}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
        });
    }
}

// 显示警告弹窗
function alert(message) {
    if(!alertShellPath) return;
    if (fs.existsSync(alertShellPath)) {
        console.log("发送警告", message);
        const { exec } = require('child_process');
        // 假设我们要执行 `ls` 命令，‌并传递 `-l` 和 `-a` 作为参数
        const command = `${alertShellPath} "${message || "未知错误"}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
        });
    }
}

// 延迟执行
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}