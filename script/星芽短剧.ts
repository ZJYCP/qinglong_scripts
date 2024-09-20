/**
 * 星芽短剧
 * 该脚本仅供学习交流使用，严禁用于商业用途，如有侵权，请联系删除
 * 作者：Glyn
 * 近期修订历史
 * 2024-09-18 first release
 *
 * cron: 0 0 7,14,21 * * *
 * const $ = new Env('星芽短剧');
 */

import { randomInt } from "crypto";
import { request } from "../utils/request";
import configManager from "../config/configManager";
import { convertConfig, stringToNumber } from "../utils/tools";

interface Task {
  code: string;
  num: number;
  total: number | null;
}

interface UserConfig {
  name: string;
  authorization: string;
  device_id: string;
}

interface Account{
  earn_today: number
  current_coin: number
  current_cash: number
}

class XingYaShortPlay {
  private headers: any;
  private config: UserConfig;
  public account:Account = {
    earn_today: 0,
    current_coin: 0,
    current_cash: 0,
  };

  constructor(config: UserConfig) {
    this.config = config;
    this.headers = {
      "x-app-id": "7",
      authorization: config.authorization,
      platform: "1",
      manufacturer: "vivo",
      version_name: "3.5.0.2",
      user_agent:
        "Mozilla/5.0 (Linux; Android 14; V2309A Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36",
      dev_token:
        "BKstHSUfkySF6lTw52xLS1Mw7S0XgZJosDGGL6nNPLUCZMWHutdKO8gL7s_dhpOHx2v5ZOYGhIHcFAnG4FAZfkLuzyAOMisSeO2H8VVP35E6cxaKsutbdpiPW77uL5p-_TyYdHbruLohtE_PIZNaTxXZIiUf4jWx_MVy61wsWIaA*",
      app_version: "3.5.0.2",
      device_platform: "android",
      personalized_recommend_status: "1",
      device_type: "V2309A",
      device_brand: "vivo",
      os_version: "14",
      channel: "default",
      raw_channel: "default",
      oaid: "e841529c4a5fbeedc1f8770b2c13e685af59172f72e25351d589fbd43781015e",
      msa_oaid:
        "e841529c4a5fbeedc1f8770b2c13e685af59172f72e25351d589fbd43781015e",
      uuid: "randomUUID_0101de9a-9021-4252-8b3d-7c960cc5092f",
      device_id: config.device_id,
      ab_id: "",
      support_h265: "1",
      "accept-encoding": "gzip",
      "user-agent": "okhttp/4.10.0",
    };
  }

  private coin_earn(coin: number|string) {
    this.account.earn_today += Number(coin);
  }

  private async requestWithHeader(
    url: string,
    method: "GET" | "POST",
    data?: any
  ) {
    try {
      const response = await request<any>(url, this.headers, method, data);
      return response;
    } catch (error) {
      console.error(`Request failed: ${error}`);
      return null;
    }
  }

  async login() {
    const url = "https://app.whjzjx.cn/v1/account/detail";
    const data = await this.requestWithHeader(url, "GET");
    if (data?.msg === "成功") {
      console.log(`开始【星芽免费短剧账号】${data.data.nickname}`);
      console.log(`💰目前金币数量: ${data.data.species}`);
      console.log(`💰可提现: ${data.data.cash_remain}`);
      this.account.current_cash = data.data.cash_remain;
      this.account.current_coin = stringToNumber(data.data.species);
    } else {
      console.log("登录失败，请重新获取Authorization");
    }
  }

  async signIn() {
    const url = "https://speciesweb.whjzjx.cn/v1/sign/do";
    const data = await this.requestWithHeader(url, "POST");
    console.log("📅开始签到");
    if (data?.msg === "success") {
      console.log(`✅签到成功获取金币: ${data.data.coin_val}`);
      this.coin_earn(data.data.coin_val);
      await this.watchSignInAd();
    } else {
      console.log(`❌签到失败原因: ${data?.msg}`);
    }
  }

  async watchSignInAd() {
    const url = "https://speciesweb.whjzjx.cn/v1/task_ad/claim";
    const data = await this.requestWithHeader(url, "POST", { ad_type: 4 });
    if (data?.code === "ok") {
      console.log(`💱看签到广告成功获取金币: ${data.data.coin_val}`);
      this.coin_earn(data.data.coin_val);
    } else {
      console.log(`❌再看广告失败，原因: ${data?.msg}`);
    }
  }

  async watchAd() {
    const url = "https://speciesweb.whjzjx.cn/v1/sign";
    const data = await this.requestWithHeader(url, "POST", {
      type: 4,
      mark: 2,
    });
    if (data?.msg === "签到成功") {
      console.log(`💱看广告成功获取金币: ${data.data.species}`);
      this.coin_earn(data.data.species);
    } else {
      console.log(`❌看广告失败原因: ${data?.msg}`);
    }
  }

  async watchAdAgain() {
    const url = "https://speciesweb.whjzjx.cn/v1/task_ad/claim";
    const data = await this.requestWithHeader(url, "POST", { ad_type: 2 });
    if (data?.code === "ok") {
      console.log(`💱再看广告成功获取金币: ${data.data.coin_val}`);
      this.coin_earn(data.data.coin_val);
    } else {
      console.log(`❌再看广告失败，原因: ${data?.msg}`);
    }
  }

  async collect() {
    const url = "https://app.whjzjx.cn/v1/theater/doing_look_v2";
    const sjs = randomInt(1, 2000);
    const data = await this.requestWithHeader(url, "POST", {
      kind: 2,
      target_id: sjs,
      category: 1,
      is_auto_collect: false,
    });
    if (data?.msg === "成功") {
      console.log("✅收藏成功");
    } else {
      console.log("❌收藏失败");
    }
  }

  async like() {
    const url = "https://speciesweb.whjzjx.cn/v1/task/like";
    const sjs = randomInt(1, 116161);
    const data = await this.requestWithHeader(url, "POST", { theater_id: sjs });
    if (data?.msg === "success") {
      console.log(`💱点赞成功获取金币: ${data.data.info.coin_val}`);
      this.coin_earn(data.data.info.coin_val);
    } else {
      console.log(`❌点赞失败，原因: ${data?.msg}`);
    }
  }

  async increaseWatchTime() {
    console.log("🆙观看加时长运行");
    const url = "https://speciesweb.whjzjx.cn/v1/sign/escalation";
    for (let i = 0; i < 10; i++) {
      const data = await this.requestWithHeader(url, "POST", { type: 3 });
      if (data?.msg === "上报成功") {
        console.log("📈增加时长成功");
      } else {
        console.log(`❌增加失败，原因: ${data?.msg}`);
        await this.claimWatchTimeReward();
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async claimWatchTimeReward() {
    const url = "https://speciesweb.whjzjx.cn/v1/sign/sign_multi_stage";
    const data = await this.requestWithHeader(url, "POST", {
      type: 3,
      makes: [1, 2, 3, 4, 5, 6, 7],
      device_id: "87387123-7A4D-4B6A-912A-30CABD9CD4B3",
    });
    if (data?.msg === "签到成功") {
      console.log(`💱领取观看时长金币成功: ${data.data.coin_value}`);
      this.coin_earn(data.data.coin_value);
    } else {
      console.log(`❌领取观看时长金币失败，原因: ${data?.msg}`);
    }
  }

  async watchBoxAd(adNum: number) {
    const url = "https://speciesweb.whjzjx.cn/v1/box/view_ad";
    console.log(`📺观看宝箱广告${adNum}`);
    const data = await this.requestWithHeader(url, "POST", {
      config_id: 3,
      coin_val: 72,
      ad_num: adNum,
    });
    if (data?.msg === "success") {
      console.log(`💰宝箱广告观看成功获得金币: ${data.data.coin_val}`);
      this.coin_earn(data.data.coin_val);
    } else {
      console.log(`❌开宝箱失败，原因: ${data?.msg}`);
    }
  }

  async openBox() {
    console.log("🆙观看加时长运行");
    const url = "https://speciesweb.whjzjx.cn/v1/box/open";
    for (let i = 0; i < 10; i++) {
      const data = await this.requestWithHeader(url, "POST", { config_id: 3 });
      if (data?.msg === "success") {
        console.log(`🗳️开宝箱成功获得金币: ${data.data.coin_val}`);
        this.coin_earn(data.data.coin_val);
        await this.watchBoxAd(2);
        await this.watchBoxAd(1);
      } else {
        console.log(`❌开宝箱失败，原因: ${data?.msg}`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async run() {
    try {
      await this.login();
      await this.signIn();
      await this.increaseWatchTime();
      await this.openBox();
      await this.checkTasks();
    } catch (error) {
      console.error(`⚠️⚠️⚠️账号 ${this.config.name}... 脚本报错⚠️⚠️⚠️`, error);
    }
  }

  private async checkTasks() {
    console.log("📊查看任务列表");
    const url = `https://speciesweb.whjzjx.cn/v1/task/list?device_id=${this.config.device_id}`;
    const data = await this.requestWithHeader(url, "GET");
    if (!data) return;

    const tasks: Task[] = data.data.task_list.map((task: any) => ({
      code: task.code,
      num: task.ext?.num || 0,
      total: task.ext?.total || null,
    }));

    for (const task of tasks) {
      await this.processTask(task);
    }
  }

  private async processTask(task: Task) {
    const isCompleted = task.total !== null && task.num >= task.total;
    const taskName = this.getTaskName(task.code);

    if (isCompleted) {
      console.log(`🆗${taskName}任务已完成！(${task.num}/${task.total})`);
    } else {
      console.log(`${taskName}(${task.num}/${task.total})`);
      console.log(`🔛任务没完成开始${taskName}`);
      await this.executeTask(task);
    }
  }

  private getTaskName(code: string): string {
    const taskNames: { [key: string]: string } = {
      "1030": "收藏新剧",
      "1060": "看视频金币",
      "1080": "点赞剧集",
      "1070": "分享短剧",
    };
    return taskNames[code] || "未知任务";
  }

  private async executeTask(task: Task) {
    if (task.total === null) return;

    const remainingTasks = task.total - task.num;
    for (let i = 0; i < remainingTasks; i++) {
      switch (task.code) {
        case "1030":
          await this.collect();
          break;
        case "1060":
          await this.watchAd();
          await this.watchAdAgain();
          break;
        case "1080":
          await this.like();
          break;
        // 分享任务 (1070) 不需要实际执行
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function sendNotificationMessage(title: string, info: Map<string, Account>): Promise<void> {
  const content = [...info].map(([key,value])=>{
    return `账号 ${key}：\n 本次获取金币 ${value.earn_today}, 当前金币数量为 ${Number(value.current_coin) + Number(value.earn_today)}, 当前可提现 ${value.current_cash}。\n`
  }).join("\n")
  console.log(content)
  try {
    const { sendMessage } = await import("../utils/tools");
    await sendMessage(title, content);
  } catch (error) {
    console.error("发送通知消息失败！", error);
  }
}

async function runMultipleAccounts(configs: UserConfig[]) {
  const all_count_message = new Map<string, Account>()
  for (let i = 0; i < configs.length; i++) {
    console.log(`\n开始执行账号 ${configs[i].name}`);
    const xingYa = new XingYaShortPlay(configs[i]);
    await xingYa.run();
    all_count_message.set(configs[i].name, xingYa.account)
    console.log(`账号 ${configs[i].name} 执行完毕\n`);
    // 在账号之间添加一些延迟，避免请求过于频繁
    if (i < configs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  sendNotificationMessage("星芽短剧", all_count_message)
}

const configs = convertConfig<UserConfig>(configManager.get("xydj"));

runMultipleAccounts(configs).catch(console.error);
