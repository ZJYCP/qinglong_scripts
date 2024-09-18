/**
 * 霸王茶姬 签到脚本 v1.0.240918
 * 作者：Glyn
 * 签到一个月兑换买一送一券
 * cron: 0 0 6,12,18 * * *
 * const $ = new Env('霸王茶姬');
 * 该脚本仅供学习交流使用，严禁用于商业用途，如有侵权，请联系删除
 */

axios = require("axios");
const crypto = require("crypto");

interface Environment {
  bwcjck?: string;
  bwcjuid?: string;
}

interface UserInfo {
  mobilePhone: string;
}

interface SignInResult {
  rewardDetailList: Array<{
    rewardName: string;
    sendNum: number;
  }>;
}

class BawangChajiSignIn {
  private readonly env: Environment;
  private readonly headers: Record<string, string>;
  private allPrintList: string[] = [];

  constructor(env: Environment) {
    this.env = env;
    this.headers = {
      'qm-user-token': '',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; 2201122C Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160065 MMWEBSDK/20231202 MMWEBID/2247 MicroMessenger/8.0.47.2560(0x28002F30) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64 MiniProgramEnv/android',
      'qm-from': 'wechat'
    };
  }

  private myprint(message: string): void {
    console.log(message);
    this.allPrintList.push(message);
  }

  private generateHash(activityId: string, timestamp: string, userId: string): string {
    const reversedActivityId = activityId.split('').reverse().join('');
    const storeId = 49006;

    const params = {
      activityId,
      sellerId: storeId.toString(),
      timestamp,
      userId
    };

    const sortedParams = Object.entries(params).sort();
    const queryString = sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
    const finalString = `${queryString}&key=${reversedActivityId}`;

    return crypto.createHash('md5').update(finalString).digest('hex').toUpperCase();
  }

  private async sendNotificationMessage(title: string): Promise<void> {
    try {
      const { send } = await import('./sendNotify');
      await send(title, this.allPrintList.join('\n'));
    } catch (error) {
      console.error('发送通知消息失败！', error);
    }
  }

  private async signIn(ck: string, uid: string): Promise<void> {
    this.headers['qm-user-token'] = ck;

    try {
      const { data } = await axios.get<{ message: string; data: UserInfo }>('https://webapi.qmai.cn/web/catering/crm/personal-info', { headers: this.headers });

      if (data.message === 'ok') {
        this.myprint(`账号：${data.data.mobilePhone}登录成功`);

        const timestamp = Date.now().toString();
        const signature = this.generateHash('947079313798000641', timestamp, uid);
        const postData = {
          activityId: '947079313798000641',
          appid: 'wxafec6f8422cb357b',
          timestamp,
          signature,
          storeId: 49006
        };

        const signInResponse = await axios.post<{ message: string; data: SignInResult }>('https://webapi.qmai.cn/web/cmk-center/sign/takePartInSign', postData, { headers: this.headers });

        if (signInResponse.data.message === 'ok') {
          const reward = signInResponse.data.data.rewardDetailList[0];
          this.myprint(`签到情况：获得${reward.rewardName}：${reward.sendNum}`);
        } else {
          this.myprint(`签到情况：${signInResponse.data.message}`);
        }
      } else {
        this.myprint('太久不打开小程序存在错误');
      }
    } catch (error) {
      console.error('签到过程中发生错误', error);
    }
  }

  public async run(): Promise<void> {
    const tokens = this.env.bwcjck?.split(/[@&]/) || [''];
    const userIds = this.env.bwcjuid?.split(/[@&]/) || [''];

    if (tokens.length !== userIds.length) {
      throw new Error('bwcjck 和 bwcjuid 的数量不匹配');
    }

    this.myprint(`查找到${tokens.length}个账号`);

    for (let i = 0; i < tokens.length; i++) {
      try {
        this.myprint(`登录第${i + 1}个账号`);
        this.myprint('----------------------');
        await this.signIn(tokens[i], userIds[i]);
        this.myprint('----------------------');
      } catch (error) {
        console.error(`处理第${i + 1}个账号时发生错误`, error);
      }
    }

    await this.sendNotificationMessage('霸王茶姬');
  }
}

// 使用示例
const env: Environment = {
  bwcjck: process.env.bwcjck,
  bwcjuid: process.env.bwcjuid
};

const signIn = new BawangChajiSignIn(env);
signIn.run().catch(console.error);
