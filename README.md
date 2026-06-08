# Roomie - 家庭协同小程序

## 项目简介

Roomie 是一个专为家庭和同住成员设计的协同生活小程序，提供一个共享的生活协同空间。成员加入同一个"同屋"后，可以一起记录家庭清单、安排日程、查看动态，让家庭事务不再分散在聊天工具中。

## 核心功能

### 1. 家庭清单协作
- 创建家庭清单（购物清单、待办事项、任务分配）
- 任务分配给成员
- 任务状态更新（待完成、进行中、已完成）
- 清单分类和标签

### 2. 家庭日程管理
- 共享家庭日程
- 个人日程与家庭日程区分
- 日程提醒功能
- 重复日程设置

### 3. 主题系统 ✨
- **10种预设主题**：经典蓝、优雅紫、活力橙、清新绿等
- **自定义主题创建**：支持颜色自定义
- **实时切换**：无闪烁切换效果
- **全局应用**：颜色和图片即时生效

### 4. 个人中心
- 个人信息管理
- 主题设置（换肤功能）
- 通知设置
- 偏好设置

## 技术架构

- **框架**: uni-app x (Vue 3 + TypeScript)
- **状态管理**: Pinia
- **网络请求**: 自定义HTTP封装
- **主题系统**: 自定义主题管理器
- **UI组件**: 自定义组件库

## 项目结构

```
Roomie/
├── common/              # 公共模块
│   ├── api/            # API接口封装
│   ├── config/         # 配置文件
│   ├── themes/         # 主题系统
│   └── utils/          # 工具函数
├── components/         # UI组件
├── pages/             # 页面文件
├── store/             # 状态管理
├── types/             # 类型定义
└── static/            # 静态资源
```

## 快速开始

### 环境要求
- Node.js >= 16
- uni-app CLI
- 微信开发者工具

### 安装依赖
```bash
npm install
```

### 开发运行

#### 微信小程序
```bash
npm run dev:mp-weixin
```

#### H5版本
```bash
npm run dev:h5
```

### 构建发布

#### 微信小程序构建
```bash
npm run build:mp-weixin
```

## 使用指南

### 1. 启动应用
- 运行开发命令后，在微信开发者工具中导入项目
- 项目根目录为 `Roomie/`
- AppID 已配置为 ``

### 2. 体验功能
1. **启动页**: 应用初始化和Logo展示
2. **登录页**: 点击"快速体验"进入应用
3. **同屋选择**: 创建或加入家庭空间
4. **首页**: 查看概览信息和快捷操作
5. **我的页面**: 访问主题设置和其他功能

### 3. 主题切换
在"我的"页面中：
1. 点击"切换主题"
2. 选择预设主题或创建自定义主题
3. 主题会实时应用到整个应用

## 开发进度

### 已完成 ✅
- [x] UI框架封装（基础组件和样式系统）
- [x] 首页tab切换（首页 + 我的页面）
- [x] 主题系统（全局颜色和图片切换）
- [x] 网络框架（API封装和请求处理）
- [x] 用户认证流程
- [x] 基础页面框架

### 待开发 🔄
- [ ] 任务管理功能
- [ ] 日程管理功能
- [ ] 动态功能
- [ ] 成员管理功能
- [ ] 数据持久化
- [ ] 后端API对接

## 主题系统使用

### 切换预设主题
```typescript
import { switchTheme } from '@/common/themes'

// 切换到深色主题
switchTheme('dark')
```

### 创建自定义主题
```typescript
import { themeManager } from '@/common/themes'

const customTheme = {
  name: '我的主题',
  primaryColor: '#FF6B35',
  secondaryColor: '#FF8C42',
  backgroundColor: '#FFF8F3',
  textColor: '#2D3748',
  cardBackground: '#FFFFFF',
  borderColor: '#FED7CC'
}

themeManager.createCustomTheme(customTheme)
```

## 注意事项

1. **图标文件**: tabBar图标需要在 `static/icons/` 目录下准备
2. **主题图片**: 主题背景图和Logo需要在相应目录下准备
3. **API接口**: 当前使用模拟数据，后续需要对接真实后端
4. **数据存储**: 目前使用本地存储，生产环境建议使用云存储

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系我们

如有问题或建议，请通过以下方式联系：
- 需要完整代码和服务器代码，联系作者
- 邮箱: 903531306@qq.com
- 项目地址: [GitHub Repository]
