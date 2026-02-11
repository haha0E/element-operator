// Content Script - 执行元素操作

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'executeFlow') {
    executeFlow(message.flow, message.number)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
});

// 执行流程
async function executeFlow(flow, number) {
  if (!flow || !flow.steps || flow.steps.length === 0) {
    throw new Error('流程配置无效');
  }

  const results = [];
  
  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    try {
      const result = await executeStep(step, number);
      results.push({
        stepIndex: i,
        stepType: step.type,
        success: true,
        result: result
      });

      // 步骤间延迟
      if (step.delay && step.delay > 0) {
        await delay(step.delay);
      }
    } catch (error) {
      // 遇到错误停止执行
      results.push({
        stepIndex: i,
        stepType: step.type,
        success: false,
        error: error.message
      });
      throw new Error(`步骤 ${i + 1} (${step.type}) 执行失败: ${error.message}`);
    }
  }

  return {
    completedSteps: results.length,
    totalSteps: flow.steps.length,
    results: results
  };
}

// 执行单个步骤
async function executeStep(step, number) {
  const element = findElement(step.selector, step.expression);
  
  if (!element && step.type !== 'wait') {
    throw new Error(`元素未找到: ${step.expression}`);
  }

  switch (step.type) {
    case 'wait':
      return await waitForElement(step.selector, step.expression, step.timeout || 5000);
    
    case 'click':
      if (element) {
        element.click();
        return { message: '点击成功', element: step.expression };
      }
      throw new Error('点击元素未找到');
    
    case 'input':
      if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
        // 替换占位符 {number} 为实际编号
        let value = step.value || '';
        if (number && value.includes('{number}')) {
          value = value.replace(/{number}/g, number);
        }
        
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return { message: '输入成功', value: value };
      }
      throw new Error('输入元素未找到或不是输入框');
    
    default:
      throw new Error(`不支持的操作类型: ${step.type}`);
  }
}

// 查找元素
function findElement(selectorType, expression) {
  if (selectorType === 'xpath') {
    return findByXPath(expression);
  } else if (selectorType === 'querySelector') {
    return document.querySelector(expression);
  } else {
    throw new Error(`不支持的选择器类型: ${selectorType}`);
  }
}

// XPath 查找元素
function findByXPath(xpath) {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  } catch (error) {
    throw new Error(`XPath 表达式错误: ${xpath}, ${error.message}`);
  }
}

// 等待元素出现
async function waitForElement(selectorType, expression, timeout = 5000) {
  const startTime = Date.now();
  const interval = 100; // 检查间隔100ms

  while (Date.now() - startTime < timeout) {
    const element = findElement(selectorType, expression);
    if (element && isElementVisible(element)) {
      return { message: '元素已出现', element: expression };
    }
    await delay(interval);
  }

  throw new Error(`等待元素超时: ${expression} (${timeout}ms)`);
}

// 检查元素是否可见
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
