import yaml
import os

class ConfigManager:
    _instance = None

    def __init__(self, config_name=None):
        if not hasattr(self, 'config'):
            self.config = None
        
        if config_name:
            config_path = os.path.join(os.path.dirname(__file__), config_name)
            self.load_config(config_path)

    @classmethod
    def get_instance(cls, config_name=None):
        if cls._instance is None:
            cls._instance = ConfigManager(config_name)
        return cls._instance

    def load_config(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
            print('配置文件加载成功')
        except Exception as error:
            print('加载配置文件时出错:', error)
            self.config = None

    def get(self, key):
        if not self.config:
            print('配置未加载，请先调用 load_config 方法')
            return None

        keys = key.split('.')
        value = self.config

        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return None

        return value

# 导出单例
config_manager_instance = ConfigManager.get_instance("config.yaml")
