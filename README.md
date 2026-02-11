# 元素操作器 Chrome 扩展

一个用于自动化操作网页元素的 Chrome 浏览器扩展，支持配置化的操作流程管理。

## 功能特性

- ✅ 支持 XPath 和 Query Selector 两种元素选择器
- ✅ 支持点击、输入文字、等待元素等操作
- ✅ 双流程模式：输入编号后执行流程A，点击编号后执行流程B
- ✅ 配置化流程管理，支持 JSON 导入导出
- ✅ 执行历史记录功能
- ✅ 简洁的 popup 界面

## 项目结构

```
element-operator/
├── manifest.json          # 扩展配置文件
├── popup/                # Popup 界面
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/              # 内容脚本
│   └── content.js
├── background/           # 后台脚本
│   └── background.js
├── config/               # 配置界面
│   ├── config.html
│   ├── config.css
│   └── config.js
└── icons/                # 扩展图标（需要自行添加）
```

## 安装步骤

1. 克隆或下载项目到本地
2. 打开 Chrome 浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录

## 使用说明

### 1. 配置流程

点击 popup 中的配置按钮（⚙️），打开配置界面：

- **流程A**：输入编号列表并解析后自动执行的流程（用于准备、初始化）
- **流程B**：点击单个编号后执行的流程（具体的业务操作）

每个流程可以配置多个步骤，每个步骤包括：
- 操作类型：等待元素、点击、输入文字
- 选择器类型：XPath 或 Query Selector
- 选择器表达式
- 操作参数（如输入内容、超时时间、延迟时间）

### 2. 执行流程

1. 在 popup 中输入业务编号（用逗号、空格或换行分隔）
2. 点击"解析编号"按钮
3. 系统自动执行流程A
4. 流程A完成后，点击编号列表中的任意编号执行流程B
5. 查看执行结果后，可以继续点击下一个编号

### 3. 导入导出配置

在配置界面中：
- 点击"导出JSON"可以导出当前配置
- 点击"导入JSON"可以导入之前保存的配置

## 配置示例

```json
{
  "flowA": {
    "id": "flowA",
    "name": "流程A（输入编号后）",
    "steps": [
      {
        "type": "wait",
        "selector": "xpath",
        "expression": "//input[@id='search-input']",
        "timeout": 5000
      }
    ]
  },
  "flowB": {
    "id": "flowB",
    "name": "流程B（点击编号后）",
    "steps": [
      {
        "type": "input",
        "selector": "xpath",
        "expression": "//input[@id='number-input']",
        "value": "{number}",
        "delay": 500
      },
      {
        "type": "click",
        "selector": "querySelector",
        "expression": "#submit-btn",
        "delay": 1000
      }
    ]
  }
}
```

## 注意事项

- 流程B中的输入操作可以使用 `{number}` 占位符，会被替换为实际编号
- 元素找不到时会停止执行并显示错误信息
- 执行历史会保存在本地存储中
- 建议使用 XPath 选择器，稳定性更好

## 开发说明

本项目使用原生 JavaScript 开发，无需构建工具，直接加载即可使用。

## 许可证

MIT License
