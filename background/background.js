// Background Service Worker

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('元素操作器已安装');
  
  // 可以在这里设置默认配置
  chrome.storage.local.get(['flowConfig'], (result) => {
    if (!result.flowConfig) {
      // 设置默认配置示例
      const defaultConfig = {
        flowA: {
          id: 'flowA',
          name: '流程A（输入编号后）',
          steps: []
        },
        flowB: {
          id: 'flowB',
          name: '流程B（点击编号后）',
          steps: []
        }
      };
      chrome.storage.local.set({ flowConfig: defaultConfig });
    }
  });
});
