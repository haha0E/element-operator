// Popup 主逻辑

let numbers = [];
let currentConfig = null;
let flowACompleted = false;

// DOM 元素
const numberInput = document.getElementById('number-input');
const parseBtn = document.getElementById('parse-btn');
const configBtn = document.getElementById('config-btn');
const numberListSection = document.getElementById('number-list-section');
const numberList = document.getElementById('number-list');
const status = document.getElementById('status');
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  setupEventListeners();
});

// 设置事件监听
function setupEventListeners() {
  parseBtn.addEventListener('click', handleParse);
  configBtn.addEventListener('click', openConfigWindow);
  numberInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleParse();
    }
  });
}

// 加载配置
function loadConfig() {
  chrome.storage.local.get(['flowConfig'], (result) => {
    if (result.flowConfig) {
      currentConfig = result.flowConfig;
      showStatus('配置已加载', 'success');
    } else {
      showStatus('请先配置流程', 'error');
    }
  });
}

// 解析编号
function handleParse() {
  const input = numberInput.value.trim();
  if (!input) {
    showStatus('请输入业务编号', 'error');
    return;
  }

  // 解析编号（支持逗号、空格、换行分隔）
  numbers = input.split(/[,\s\n]+/).filter(n => n.trim());
  
  if (numbers.length === 0) {
    showStatus('未找到有效编号', 'error');
    return;
  }

  // 检查配置
  if (!currentConfig || !currentConfig.flowA || !currentConfig.flowB) {
    showStatus('请先配置流程A和流程B', 'error');
    return;
  }

  // 显示编号列表
  renderNumberList();
  numberListSection.style.display = 'block';
  
  // 重置状态
  flowACompleted = false;
  
  // 执行流程A
  executeFlowA();
}

// 渲染编号列表
function renderNumberList() {
  numberList.innerHTML = '';
  numbers.forEach((number, index) => {
    const btn = document.createElement('button');
    btn.className = 'number-btn';
    btn.textContent = number;
    btn.dataset.index = index;
    btn.addEventListener('click', () => handleNumberClick(number, index));
    numberList.appendChild(btn);
  });
}

// 执行流程A（输入编号后）
async function executeFlowA() {
  if (!currentConfig.flowA) {
    showStatus('流程A未配置', 'error');
    return;
  }

  showStatus('正在执行流程A...', 'loading');
  parseBtn.disabled = true;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('未找到活动标签页');
    }

    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'executeFlow',
      flow: currentConfig.flowA,
      flowType: 'flowA'
    });

    if (response.success) {
      flowACompleted = true;
      showStatus('流程A执行完成，可以点击编号执行流程B', 'success');
      // 启用所有编号按钮
      document.querySelectorAll('.number-btn').forEach(btn => {
        btn.disabled = false;
      });
    } else {
      throw new Error(response.error || '流程A执行失败');
    }
  } catch (error) {
    showStatus(`流程A执行失败: ${error.message}`, 'error');
    flowACompleted = false;
  } finally {
    parseBtn.disabled = false;
  }
}

// 处理编号点击（执行流程B）
async function handleNumberClick(number, index) {
  if (!flowACompleted) {
    showStatus('请先等待流程A执行完成', 'error');
    return;
  }

  if (!currentConfig.flowB) {
    showStatus('流程B未配置', 'error');
    return;
  }

  const btn = document.querySelector(`[data-index="${index}"]`);
  btn.disabled = true;
  btn.classList.add('executing');
  showStatus(`正在执行编号 ${number} 的流程B...`, 'loading');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('未找到活动标签页');
    }

    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'executeFlow',
      flow: currentConfig.flowB,
      flowType: 'flowB',
      number: number
    });

    if (response.success) {
      btn.classList.remove('executing');
      btn.classList.add('completed');
      showStatus(`编号 ${number} 的流程B执行完成`, 'success');
      
      // 记录历史
      recordHistory(number, response.result);
      
      // 启用按钮以便再次执行
      setTimeout(() => {
        btn.disabled = false;
      }, 1000);
    } else {
      throw new Error(response.error || '流程B执行失败');
    }
  } catch (error) {
    btn.classList.remove('executing');
    btn.classList.add('error');
    showStatus(`编号 ${number} 执行失败: ${error.message}`, 'error');
    btn.disabled = false;
  }
}

// 记录执行历史
function recordHistory(number, result) {
  const historyItem = {
    number: number,
    time: new Date().toLocaleString('zh-CN'),
    result: result || '执行成功'
  };

  chrome.storage.local.get(['history'], (data) => {
    const history = data.history || {};
    if (!history[number]) {
      history[number] = [];
    }
    history[number].push(historyItem);
    
    // 只保留最近50条记录
    if (history[number].length > 50) {
      history[number] = history[number].slice(-50);
    }

    chrome.storage.local.set({ history }, () => {
      // 可以在这里更新历史显示
    });
  });
}

// 显示状态
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type} show`;
  
  // 3秒后自动隐藏成功和错误消息
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      status.classList.remove('show');
    }, 3000);
  }
}

// 打开配置窗口
function openConfigWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL('config/config.html'),
    type: 'popup',
    width: 600,
    height: 700
  });
}

// 监听配置更新
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.flowConfig) {
    currentConfig = changes.flowConfig.newValue;
    showStatus('配置已更新', 'success');
  }
});
