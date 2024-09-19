const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

class ConfigManager {
  private static instance: ConfigManager;
  private config: any;

  private constructor(config_name?: string) {
    if(config_name){
      const config_path = path.resolve(__dirname, config_name);
      this.loadConfig(config_path);
    }else{
      this.config = null;
    }
  }

  public static getInstance(config_name?: string): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(config_name);
    }
    return ConfigManager.instance;
  }

  /**
   * 加载 YAML 配置文件
   * @param filePath - YAML 文件的路径
   */
  public loadConfig(filePath: string): void {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      this.config = yaml.load(fileContents);
      console.log('配置文件加载成功');
    } catch (error) {
      console.error('加载配置文件时出错:', error);
      this.config = null;
    }
  }

  /**
   * 通过 key 获取配置值
   * @param key - 配置项的 key，支持点号分隔的嵌套 key
   * @returns 配置值，如果未找到则返回 undefined
   */
  public get<T = any>(key: string): T | undefined {
    if (!this.config) {
      console.error('配置未加载，请先调用 loadConfig 方法');
      return undefined;
    }

    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value as T;
  }
}

// 导出单例
const configManagerInstance = ConfigManager.getInstance("config.yaml");

export default configManagerInstance

