/**
 * 转换一下config数据，主要是添加了一个name
 * @param config
 * @returns [{name: **, }]
 */
export function convertConfig<T>(config?: Record<string, T>) {
  if(!config) return []
  return Object.entries(config).map(([name, config]) => {
    return {
      name: name,
      ...config,
    } as T;
  });
}

/**
 * 发送通知
 * @param title 
 * @param message 
 */
export async function sendMessage(title: string, message: string, ...args: string[]) {
  try{
    const { sendNotify } = await import("../sendNotify");
    sendNotify(title, message, ...args)
  }catch{
    console.error("发送通知消息失败！");
  }
}

export function stringToNumber(str) {
  // 移除所有逗号
  const cleanStr = str.replace(/,/g, '');
  
  // 将字符串转换为数字
  const number = parseFloat(cleanStr);
  
  // 检查是否成功转换为数字
  if (isNaN(number)) {
    throw new Error('无效的数字格式');
  }
  
  return number;
}