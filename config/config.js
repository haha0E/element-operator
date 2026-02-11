// 配置页面逻辑

let currentConfig = {
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

let currentTab = 'flowA';

// DOM 元素
const flowAPanel = document.getElementById('flowA-panel');
const flowBPanel = document.getElementById('flowB-panel');
const flowASteps = document.getElementById('flowA-steps');
const flowBSteps = document.getElementById('flowB-steps');
const addStepFlowA = document.getElementById('add-step-flowA');
const addStepFlowB = document.getElementById('add-step-flowB');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const fileInput = document.getElementById('file-input');
const tabButtons = document.querySelectorAll('.tab-btn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  setupEventListeners();
});

// 设置事件监听
function setupEventListeners() {
  // 标签页切换
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // 添加步骤
  addStepFlowA.addEventListener('click', () => addStep('flowA'));
  addStepFlowB.addEventListener('click', () => addStep('flowB'));

  // 保存和取消
  saveBtn.addEventListener('click', saveConfig);
  cancelBtn.addEventListener('click', () => window.close());

  // 导入导出
  importBtn.addEventListener('click', () => fileInput.click());
  exportBtn.addEventListener('click', exportConfig);
  fileInput.addEventListener('change', handleFileImport);
}

// 加载配置
function loadConfig() {
  chrome.storage.local.get(['flowConfig'], (result) => {
    if (result.flowConfig) {
      currentConfig = result.flowConfig;
      renderSteps('flowA');
      renderSteps('flowB');
    }
  });
}

// 切换标签页
function switchTab(tab) {
  currentTab = tab;
  
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (tab === 'flowA') {
    flowAPanel.classList.add('active');
    flowBPanel.classList.remove('active');
  } else {
    flowAPanel.classList.remove('active');
    flowBPanel.classList.add('active');
  }
}

// 添加步骤
function addStep(flowType) {
  const step = {
    type: 'click',
    selector: 'querySelector',
    expression: '',
    value: '',
    timeout: 5000,
    delay: 0
  };
  
  currentConfig[flowType].steps.push(step);
  renderSteps(flowType);
}

// 删除步骤
function deleteStep(flowType, index) {
  currentConfig[flowType].steps.splice(index, 1);
  renderSteps(flowType);
}

// 渲染步骤列表
function renderSteps(flowType) {
  const container = flowType === 'flowA' ? flowASteps : flowBSteps;
  const steps = currentConfig[flowType].steps;
  
  container.innerHTML = '';
  
  if (steps.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无步骤，点击"添加步骤"开始配置</p>';
    return;
  }
  
  steps.forEach((step, index) => {
    const stepElement = createStepElement(flowType, step, index);
    container.appendChild(stepElement);
  });
}

// 创建步骤元素
function createStepElement(flowType, step, index) {
  const div = document.createElement('div');
  div.className = 'step-item';
  
  div.innerHTML = `
    <div class="step-header">
      <span class="step-title">步骤 ${index + 1}: ${getStepTypeName(step.type)}</span>
      <button class="btn-delete" onclick="deleteStep('${flowType}', ${index})">删除</button>
    </div>
    <div class="step-form">
      <div class="form-row">
        <div class="form-group">
          <label>操作类型</label>
          <select class="step-type" data-flow="${flowType}" data-index="${index}">
            <option value="wait" ${step.type === 'wait' ? 'selected' : ''}>等待元素</option>
            <option value="click" ${step.type === 'click' ? 'selected' : ''}>点击</option>
            <option value="input" ${step.type === 'input' ? 'selected' : ''}>输入文字</option>
          </select>
        </div>
        <div class="form-group">
          <label>选择器类型</label>
          <select class="step-selector" data-flow="${flowType}" data-index="${index}">
            <option value="xpath" ${step.selector === 'xpath' ? 'selected' : ''}>XPath</option>
            <option value="querySelector" ${step.selector === 'querySelector' ? 'selected' : ''}>Query Selector</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>选择器表达式</label>
        <textarea class="step-expression" data-flow="${flowType}" data-index="${index}" placeholder="例如：//input[@id='username'] 或 #username">${step.expression || ''}</textarea>
      </div>
      <div class="form-row" id="step-params-${flowType}-${index}">
        ${getStepParamsHTML(step, flowType, index)}
      </div>
    </div>
  `;
  
  // 绑定事件
  const stepTypeSelect = div.querySelector('.step-type');
  stepTypeSelect.addEventListener('change', (e) => {
    updateStepType(flowType, index, e.target.value);
  });
  
  const stepSelector = div.querySelector('.step-selector');
  stepSelector.addEventListener('change', (e) => {
    currentConfig[flowType].steps[index].selector = e.target.value;
  });
  
  const stepExpression = div.querySelector('.step-expression');
  stepExpression.addEventListener('input', (e) => {
    currentConfig[flowType].steps[index].expression = e.target.value;
  });
  
  // 绑定参数输入事件
  bindStepParamsEvents(flowType, index, div);
  
  return div;
}

// 获取步骤类型名称
function getStepTypeName(type) {
  const names = {
    'wait': '等待元素',
    'click': '点击',
    'input': '输入文字'
  };
  return names[type] || type;
}

// 获取步骤参数HTML
function getStepParamsHTML(step, flowType, index) {
  let html = '';
  
  if (step.type === 'wait') {
    html = `
      <div class="form-group">
        <label>超时时间（毫秒）</label>
        <input type="number" class="step-timeout" data-flow="${flowType}" data-index="${index}" value="${step.timeout || 5000}" min="0">
      </div>
    `;
  } else if (step.type === 'input') {
    html = `
      <div class="form-group">
        <label>输入内容（流程B可使用 {number} 占位符）</label>
        <input type="text" class="step-value" data-flow="${flowType}" data-index="${index}" value="${step.value || ''}" placeholder="例如：test@example.com 或 {number}">
      </div>
    `;
  }
  
  if (step.type !== 'wait') {
    html += `
      <div class="form-group">
        <label>延迟时间（毫秒，执行后等待）</label>
        <input type="number" class="step-delay" data-flow="${flowType}" data-index="${index}" value="${step.delay || 0}" min="0">
      </div>
    `;
  }
  
  return html;
}

// 更新步骤类型
function updateStepType(flowType, index, newType) {
  currentConfig[flowType].steps[index].type = newType;
  // 初始化默认值
  const step = currentConfig[flowType].steps[index];
  if (newType === 'wait' && !step.timeout) {
    step.timeout = 5000;
  }
  if (newType === 'input' && step.value === undefined) {
    step.value = '';
  }
  if (newType !== 'wait' && step.delay === undefined) {
    step.delay = 0;
  }
  renderSteps(flowType);
}

// 绑定步骤参数事件
function bindStepParamsEvents(flowType, index, container) {
  const step = currentConfig[flowType].steps[index];
  if (!step) return;
  
  if (step.type === 'wait') {
    const timeoutInput = container.querySelector(`.step-timeout[data-flow="${flowType}"][data-index="${index}"]`);
    if (timeoutInput) {
      timeoutInput.addEventListener('input', (e) => {
        step.timeout = parseInt(e.target.value) || 5000;
      });
    }
  } else if (step.type === 'input') {
    const valueInput = container.querySelector(`.step-value[data-flow="${flowType}"][data-index="${index}"]`);
    if (valueInput) {
      valueInput.addEventListener('input', (e) => {
        step.value = e.target.value;
      });
    }
  }
  
  if (step.type !== 'wait') {
    const delayInput = container.querySelector(`.step-delay[data-flow="${flowType}"][data-index="${index}"]`);
    if (delayInput) {
      delayInput.addEventListener('input', (e) => {
        step.delay = parseInt(e.target.value) || 0;
      });
    }
  }
}

// 保存配置
function saveConfig() {
  // 验证配置
  if (!validateConfig()) {
    return;
  }
  
  chrome.storage.local.set({ flowConfig: currentConfig }, () => {
    alert('配置已保存！');
    window.close();
  });
}

// 验证配置
function validateConfig() {
  // 检查流程A和流程B是否都有步骤
  if (!currentConfig.flowA.steps || currentConfig.flowA.steps.length === 0) {
    alert('流程A至少需要一个步骤');
    switchTab('flowA');
    return false;
  }
  
  if (!currentConfig.flowB.steps || currentConfig.flowB.steps.length === 0) {
    alert('流程B至少需要一个步骤');
    switchTab('flowB');
    return false;
  }
  
  // 检查每个步骤的必要字段
  for (const flowType of ['flowA', 'flowB']) {
    for (let i = 0; i < currentConfig[flowType].steps.length; i++) {
      const step = currentConfig[flowType].steps[i];
      if (!step.type || !step.selector || !step.expression) {
        alert(`${flowType === 'flowA' ? '流程A' : '流程B'} 步骤 ${i + 1} 配置不完整`);
        switchTab(flowType);
        return false;
      }
    }
  }
  
  return true;
}

// 导出配置
function exportConfig() {
  const dataStr = JSON.stringify(currentConfig, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'flow-config.json';
  link.click();
  URL.revokeObjectURL(url);
}

// 导入配置
function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      
      // 验证导入的配置结构
      if (imported.flowA && imported.flowB) {
        currentConfig = imported;
        renderSteps('flowA');
        renderSteps('flowB');
        alert('配置导入成功！');
      } else {
        alert('配置文件格式不正确，必须包含 flowA 和 flowB');
      }
    } catch (error) {
      alert('配置文件解析失败: ' + error.message);
    }
  };
  reader.readAsText(file);
  
  // 重置文件输入
  event.target.value = '';
}

// 全局函数（用于内联事件）
window.deleteStep = deleteStep;
