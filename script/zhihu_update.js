const { connect } = require('puppeteer-real-browser');
const path = require('path');
const fs = require('fs');

// 判断是否在服务器环境（无 GUI）
const isServer = !process.env.DISPLAY && process.platform === 'linux';

// 指定一个固定的目录存放用户数据
const USER_DATA_DIR = path.join(__dirname, '../resource/zhihu-user-data');
const QR_CODE_PATH = path.join(__dirname, '../resource/zhihu-qrcode.png');

// 确保 resource 目录存在
const resourceDir = path.join(__dirname, '../resource');
if (!fs.existsSync(resourceDir)) {
  fs.mkdirSync(resourceDir, { recursive: true });
}

/**
 * 检测是否已登录
 */
async function checkLoginStatus(page) {
  try {
    // 检查是否存在登录按钮（未登录状态）
    const loginButton = await page.$('button.Button--primary.Button--blue');
    const buttonText = loginButton ? await page.evaluate(el => el.textContent, loginButton) : '';

    if (buttonText.includes('登录')) {
      return false;
    }

    // 检查是否有用户头像（已登录状态）
    const userAvatar = await page.$('.AppHeader-profileAvatar');
    return !!userAvatar;
  } catch (err) {
    console.error('检测登录状态失败:', err.message);
    return false;
  }
}

/**
 * 点击登录按钮，打开登录弹窗
 */
async function openLoginModal(page) {
  try {
    // 点击顶部导航栏的登录按钮
    const loginButton = await page.waitForSelector('button.Button--primary.Button--blue', { timeout: 10000 });
    const buttonText = await page.evaluate(el => el.textContent, loginButton);

    if (buttonText.includes('登录')) {
      await page.evaluate(el => el.click(), loginButton);
      console.log('>>> 已点击登录按钮');

      // 等待登录弹窗出现
      await page.waitForSelector('.signFlowModal-container', { timeout: 10000 });
      console.log('>>> 登录弹窗已打开');
      return true;
    }
    return false;
  } catch (err) {
    console.error('打开登录弹窗失败:', err.message);
    return false;
  }
}

/**
 * 获取二维码并保存
 */
async function captureQRCode(page) {
  try {
    // 等待二维码元素出现
    const qrElement = await page.waitForSelector('.Qrcode-qrcode', { timeout: 10000 });

    if (qrElement) {
      // 使用元素截图替代 canvas.toDataURL（避免跨域污染的 SecurityError）
      await qrElement.screenshot({ path: QR_CODE_PATH });
      console.log('>>> 二维码已保存到:', QR_CODE_PATH);

      console.log('\n========== 知乎登录二维码 ==========');
      console.log('请用知乎 App 扫描以下二维码登录：');
      console.log('二维码文件路径:', QR_CODE_PATH);
      console.log('=====================================\n');

      return true;
    }
    return false;
  } catch (err) {
    console.error('获取二维码失败:', err.message);
    return false;
  }
}

/**
 * 轮询等待登录成功
 */
async function waitForLogin(page, maxWaitTime = 120000) {
  const startTime = Date.now();
  const checkInterval = 2000;

  console.log('>>> 等待扫码登录... (最长等待 2 分钟)');

  while (Date.now() - startTime < maxWaitTime) {
    // 检查弹窗是否关闭（登录成功的标志之一）
    const modal = await page.$('.signFlowModal-container');
    if (!modal) {
      console.log('>>> 登录弹窗已关闭，检测登录状态...');
      await new Promise(r => setTimeout(r, 2000));

      // 再次确认登录状态
      const isLoggedIn = await checkLoginStatus(page);
      if (isLoggedIn) {
        return true;
      }
    }

    // 检查页面上是否出现用户信息
    const userInfo = await page.$('.AppHeader-userInfo, .AppHeader-profile, [class*="ProfileAvatar"]');
    if (userInfo) {
      console.log('>>> 检测到用户信息，登录成功！');
      return true;
    }

    await new Promise(r => setTimeout(r, checkInterval));
    process.stdout.write('.');
  }

  console.log('\n>>> 等待超时，未检测到登录成功');
  return false;
}

/**
 * 获取并输出 cookies
 */
async function outputCookies(page) {
  // 通过 CDP 获取浏览器中所有 cookies（包括 api.zhihu.com 等子域名）
  const client = await page.createCDPSession();
  const { cookies: allCookies } = await client.send('Network.getAllCookies');
  await client.detach();

  // 只保留 zhihu 相关的 cookies
  const zhihuCookies = allCookies.filter(c => c.domain.includes('zhihu.com'));
  // 去重（同名 cookie 可能出现在多个子域名，优先取 .zhihu.com 的）
  const cookieMap = new Map();
  for (const c of zhihuCookies) {
    if (!cookieMap.has(c.name) || c.domain === '.zhihu.com') {
      cookieMap.set(c.name, c.value);
    }
  }
  const cookieString = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');

  console.log('\n========== Cookies ==========');
  console.log(cookieString);
    // 触发主站的配置修改接口 https://zhihu.artimind.top/api/admin/config
  await fetch('https://zhihu.artimind.top/api/admin/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: 'zhihu_cookie',
      value: cookieString
    }),
  }).then(res => {
    console.log("修改成功")
  });
  console.log('==============================\n');

  return cookieString;
}

(async () => {
  const { browser, page } = await connect({
    headless: isServer ? 'new' : false,
    ignoreAllFlags: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-background-networking',
    ],
    customConfig: {
      userDataDir: USER_DATA_DIR,
    },
    turnstile: false,
    disableXvfb: !isServer,
  });

  try {
    console.log('>>> 正在打开知乎页面...');
    await page.goto('https://www.zhihu.com/knowledge-plan/hot-question/hot/0/day', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('>>> 页面加载完成');
  } catch (err) {
    console.error('页面加载失败:', err.message);
    await browser.close();
    process.exit(1);
  }

  // 等待页面稳定
  await new Promise(r => setTimeout(r, 3000));

  // 检测登录状态
  const isLoggedIn = await checkLoginStatus(page);

  if (isLoggedIn) {
    console.log('>>> 已处于登录状态，直接获取 cookies');
    await outputCookies(page);
  } else {
    console.log('>>> 未登录，准备进行扫码登录...');

    // 打开登录弹窗
    const modalOpened = await openLoginModal(page);

    if (modalOpened) {
      // 获取并保存二维码
      const qrCaptured = await captureQRCode(page);

      if (qrCaptured) {
        // 等待用户扫码登录
        const loginSuccess = await waitForLogin(page);

        if (loginSuccess) {
          console.log('>>> 登录成功！');
          await outputCookies(page);
        } else {
          console.log('>>> 登录失败或超时');
        }
      }
    }
  }

  // 关闭浏览器
  // await browser.close();
  // console.log('>>> 浏览器已关闭');
  // process.exit(0);
})();
