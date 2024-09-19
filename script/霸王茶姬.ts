/**
 * 霸王茶姬 签到脚本 v1.0.240918
 * 作者：Glyn
 * 签到一个月兑换买一送一券
 * cron: 0 0 6,18 * * *
 * const $ = new Env('霸王茶姬');
 * 该脚本仅供学习交流使用，严禁用于商业用途，如有侵权，请联系删除
 */

import * as crypto from "crypto"
import configManager from "../config/configManager"
import { request } from "../utils/request";
import { convertConfig } from "../utils/tools"
interface UserConfig {
  name: string
  cookie: string;
  uid: string;
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
  private readonly headers: Record<string, string>;
  private allPrintList: string[] = [];
  private configs: UserConfig[] = [];

  constructor(configs: UserConfig[]) {
    this.configs = configs;
    this.headers = {
      "qm-user-token": "",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 14; 2201122C Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160065 MMWEBSDK/20231202 MMWEBID/2247 MicroMessenger/8.0.47.2560(0x28002F30) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64 MiniProgramEnv/android",
      "qm-from": "wechat",
    };
  }

  private myprint(message: string): void {
    console.log(message);
    this.allPrintList.push(message);
  }

  private generateHash(
    activityId: string,
    timestamp: string,
    userId: string
  ): string {
    const reversedActivityId = activityId.split("").reverse().join("");
    const storeId = 49006;

    const params = {
      activityId,
      sellerId: storeId.toString(),
      timestamp,
      userId,
    };

    const sortedParams = Object.entries(params).sort();
    const queryString = sortedParams
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const finalString = `${queryString}&key=${reversedActivityId}`;

    return crypto
      .createHash("md5")
      .update(finalString)
      .digest("hex")
      .toUpperCase();
  }

  private async sendNotificationMessage(title: string): Promise<void> {
    try {
      const { sendMessage } = await import("../utils/tools");
      await sendMessage(title, this.allPrintList.join("\n"));
    } catch (error) {
      console.error("发送通知消息失败！", error);
    }
  }

  private async signIn(ck: string, uid: string): Promise<void> {
    this.headers["qm-user-token"] = ck;

    try {
      const url = "https://webapi.qmai.cn/web/catering/crm/personal-info";

      const login_info = await request<{
        message: string;
        data: UserInfo;
      }>(url, this.headers, "GET");
      if(!login_info){
        this.myprint("登入验证失败");
        return
      }

      if (login_info.message === "ok") {
        this.myprint(`账号：${login_info.data.mobilePhone}登录成功`);

        const timestamp = Date.now().toString();
        const signature = this.generateHash(
          "947079313798000641",
          timestamp,
          uid
        );
        const postData = {
          activityId: "947079313798000641",
          appid: "wxafec6f8422cb357b",
          timestamp,
          signature,
          storeId: 49006,
        };

        const checkin_info = await request<{
          message: string;
          data: SignInResult;
        }>(
          "https://webapi.qmai.cn/web/cmk-center/sign/takePartInSign",
          this.headers,
          "POST",
          postData
        );
        if(!checkin_info){
          this.myprint("签到失败");
          return
        }

        if (checkin_info.message === "ok") {
          const reward = checkin_info.data.rewardDetailList[0];
          this.myprint(`签到情况：获得${reward.rewardName}：${reward.sendNum}`);
        } else {
          this.myprint(`签到情况：${checkin_info.message}`);
        }
      } else {
        this.myprint("太久不打开小程序存在错误");
      }
    } catch (error) {
      console.error("签到过程中发生错误", error);
    }
  }

  public async run(): Promise<void> {
    this.myprint(`查找到${this.configs.length}个账号`);

    for (let i = 0; i < this.configs.length; i++) {
      const { cookie, uid, name } = this.configs[i];
      try {
        this.myprint(`\n开始执行账号 ${name}`);
        this.myprint("----------------------");
        await this.signIn(cookie, uid);
        this.myprint("----------------------");
      } catch (error) {
        console.error(`处理第${name}账号时发生错误`, error);
      }
    }

    await this.sendNotificationMessage("霸王茶姬");
  }
}

const configs = convertConfig<UserConfig>(configManager.get("bwcj"));

const signIn = new BawangChajiSignIn(configs);
signIn.run().catch(console.error);
