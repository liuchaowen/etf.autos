# Gist 同步功能测试

本目录包含用于验证 Gist 同步功能的测试代码。

## 测试文件

### 1. `gist-sync.test.ts`
Node.js 环境下的单元测试，使用模拟的 localStorage。适合在终端中运行。

### 2. `gist-sync-browser.test.ts`
浏览器环境下的测试脚本，可以在浏览器控制台中运行。

### 3. `pages/test-sync.tsx`
可视化测试页面，提供友好的 UI 来运行测试并查看结果。

## 如何运行测试

### 方法 1: 浏览器测试页面（推荐）

访问测试页面：`http://localhost:3000/test-sync`

在页面上可以：
- 点击"运行全部测试"执行所有测试
- 点击单个测试旁边的"运行"按钮执行特定测试
- 查看测试结果和详细信息

### 方法 2: 浏览器控制台

1. 打开应用页面（如首页或策略页面）
2. 打开浏览器开发者工具（F12）
3. 在控制台中导入测试脚本：

```javascript
// 动态导入测试模块
import('/test/gist-sync-browser.test.ts').then(module => {
  module.runAllTests();
});
```

或者使用全局对象（如果已加载）：

```javascript
window.gistSyncTest.runAllTests();
```

### 方法 3: Node.js 环境

在终端中运行：

```bash
npx ts-node test/gist-sync.test.ts
```

注意：Node.js 测试使用模拟的 localStorage，不会反映真实的浏览器数据。

## 测试内容

### 测试 1: collectLocalData 数据收集
验证 `collectLocalData()` 函数是否正确从 localStorage 收集：
- 收藏列表（etf_favorites）
- 策略参数（strategy_params_*）
- 最后选中的代码（strategy_code_cache）

### 测试 2: 空数据检测
验证当 localStorage 为空时，数据收集是否返回正确的默认值。

### 测试 3: 数据合并逻辑
验证 `mergeData()` 函数在不同场景下的行为：
- 远程数据更新时，使用远程数据
- 本地数据更新时，使用本地数据

### 测试 4: applyDataToLocal 数据应用
验证 `applyDataToLocal()` 函数是否正确将数据应用到 localStorage。

### 测试 5: 收藏功能与同步集成
验证收藏功能（addFavorite、removeFavorite）是否正确触发同步相关的更新。

### 测试 6: localStorage 检查
检查当前 localStorage 中的实际数据状态，包括：
- 收藏数据
- 策略参数
- Gist ID
- 同步时间等

### 测试 7: 完整同步流程模拟
模拟完整的同步流程，验证本地数据是否完整，以及同步策略是否正确。

## 常见问题排查

### 问题：Gist 中没有用户数据

可能的原因：
1. **本地数据为空** - 用户还没有添加收藏或设置策略参数
2. **同步未触发** - 检查是否登录，以及同步上下文是否正确初始化
3. **数据收集失败** - 运行测试 1 和测试 6 检查数据收集是否正常
4. **上传失败** - 检查浏览器控制台是否有网络错误

### 排查步骤：

1. 运行测试 6（localStorage 检查）查看当前数据状态
2. 如果数据存在，检查是否已登录（Gist ID 是否存在）
3. 如果已登录，检查同步状态组件显示的状态
4. 查看浏览器控制台的日志，寻找同步相关的错误信息

## 测试数据说明

测试会修改 localStorage 中的数据，建议：
- 在测试前备份重要数据
- 测试完成后刷新页面恢复原始数据
- 不要在生产环境中运行测试