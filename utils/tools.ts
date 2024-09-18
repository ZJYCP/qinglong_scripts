/**
 * 转换一下config数据，主要是添加了一个name
 * @param config
 * @returns [{name: **, }]
 */
function convertConfig<T>(config: Record<string, T>) {
  return Object.entries(config).map(([name, config]) => {
    return {
      name: name,
      ...config,
    } as T;
  });
}
