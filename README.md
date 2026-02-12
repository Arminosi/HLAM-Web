# Half-Life Asset Manager - Web Edition

基于 React + TypeScript + Three.js 的 [Half-Life Asset Manager](https://github.com/SamVanheer/HalfLifeAssetManager) Web 版本，用于在浏览器中查看和检查 GoldSrc 引擎 (Half-Life 1) 的 StudioModel (.mdl) 文件。

## 功能特性

### 核心功能
- **MDL 文件加载** — 完整解析 GoldSrc StudioModel V10 (.mdl) 二进制格式
- **3D 模型渲染** — 基于 Three.js / WebGL 的实时渲染
- **骨骼动画系统** — RLE 动画数据解压、骨骼变换矩阵计算、序列播放
- **多种渲染模式** — 纹理、线框、平面着色、光滑着色
- **纹理查看** — 256 色索引纹理解码与预览、PNG 导出

### 查看功能
- **动画序列** — 选择/播放/暂停、帧滑块、速度控制、循环播放
- **Blend 控制** — 动画混合参数调节
- **Body Parts** — 体型部件/子模型切换
- **Skin 切换** — 多套贴图皮肤切换
- **骨骼控制器** — 实时调节骨骼控制器参数
- **显示开关** — 骨骼/碰撞盒/附着点/法线/线框覆盖/包围盒/地面/阴影/坐标轴

### 检查功能
- **骨骼层级** — 树形结构展示骨骼父子关系、查看每根骨骼的详细数据
- **碰撞盒 (Hitbox)** — 查看碰撞组、包围盒范围
- **附着点 (Attachment)** — 查看附着点位置与关联骨骼
- **动画事件** — 查看每个序列中的动画事件列表
- **模型信息** — 全局属性（眼位、包围盒、模型标志）

### 界面功能
- **多模型标签页** — 同时打开多个模型
- **拖放加载** — 直接拖入 .mdl 文件
- **截图** — 捕获 3D 视口截图
- **消息日志** — 操作日志输出
- **深色主题** — Catppuccin 风格暗色 UI

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript 5 | 类型安全 |
| Three.js + R3F | WebGL 3D 渲染 |
| Zustand + Immer | 状态管理 |
| Tailwind CSS 3 | 样式 |
| Vite 6 | 构建工具 |
| gl-matrix | 数学运算 (矩阵/四元数) |

## 项目结构

```
web/
├── src/
│   ├── main.tsx                        # 应用入口
│   ├── App.tsx                         # 根组件（布局）
│   ├── index.css                       # 全局样式
│   ├── formats/studiomodel/            # MDL 格式定义与解析
│   │   ├── StudioModelFileFormat.ts    #   文件格式类型定义
│   │   ├── EditableStudioModel.ts      #   可编辑数据模型
│   │   ├── StudioModelIO.ts            #   二进制解析器
│   │   └── index.ts
│   ├── renderer/                       # 3D 渲染引擎
│   │   ├── BoneTransformer.ts          #   骨骼变换计算
│   │   ├── StudioModelRenderer.ts      #   Three.js 渲染器
│   │   └── index.ts
│   ├── store/                          # 状态管理
│   │   ├── appStore.ts                 #   Zustand store
│   │   └── index.ts
│   └── components/                     # React UI 组件
│       ├── layout/                     #   布局组件
│       │   ├── MenuBar.tsx             #     菜单栏
│       │   ├── AssetTabBar.tsx         #     资产标签栏
│       │   ├── PanelContainer.tsx      #     面板容器
│       │   ├── MessagesPanel.tsx       #     消息面板
│       │   └── WelcomeScreen.tsx       #     欢迎/拖放页
│       ├── viewport/                   #   3D 视口
│       │   └── Viewport3D.tsx
│       └── panels/                     #   编辑面板
│           ├── ModelDisplayPanel.tsx    #     渲染模式/显示控制
│           ├── SequencesPanel.tsx       #     序列/动画控制
│           ├── BodyPartsPanel.tsx       #     体型部件
│           ├── BonesPanel.tsx           #     骨骼
│           ├── BoneControllersPanel.tsx #     骨骼控制器
│           ├── TexturesPanel.tsx        #     纹理
│           ├── HitboxesPanel.tsx        #     碰撞盒
│           ├── AttachmentsPanel.tsx     #     附着点
│           └── ModelDataPanel.tsx       #     模型信息
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 从桌面版到 Web 版的架构映射

| 桌面版 (C++ / Qt / OpenGL) | Web 版 (TS / React / WebGL) |
|---|---|
| `StudioModelFileFormat.hpp` (C 结构体) | `StudioModelFileFormat.ts` (TS interfaces) |
| `StudioModelIO.cpp` (fopen + fread) | `StudioModelIO.ts` (ArrayBuffer + DataView) |
| `EditableStudioModel.hpp` (C++ 对象) | `EditableStudioModel.ts` (TS interfaces) |
| `BoneTransformer.cpp` (GLM) | `BoneTransformer.ts` (gl-matrix) |
| `StudioModelRenderer.cpp` (OpenGL 1.x) | `StudioModelRenderer.ts` (Three.js) |
| `AssetManager` + `AssetList` (Qt) | `appStore.ts` (Zustand) |
| `MainWindow` + `SceneWidget` (Qt) | `App.tsx` + `Viewport3D.tsx` (React) |
| `QDockWidget` 停靠面板 | `PanelContainer.tsx` 侧面板标签页 |
| `QTabBar` 资产标签 | `AssetTabBar.tsx` |
| `QOpenGLWindow` | `<Canvas>` (React Three Fiber) |
| Qt 信号/槽 | Zustand 订阅 |

## 快速开始

```bash
cd web
npm install
npm run dev
```

然后在浏览器打开 `http://localhost:3000`，拖入一个 `.mdl` 文件即可查看。

## 开发

```bash
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run preview    # 预览生产构建
```

## 许可证

本项目为桌面版 Half-Life Asset Manager 的非官方 Web 移植版。
