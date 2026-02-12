// ============================================================================
// Chinese (Simplified) locale
// ============================================================================

const zh = {
  // -- Common --
  noModelLoaded: '未加载模型',
  close: '关闭',
  reset: '重置',

  // -- Menu Bar --
  menuFile: '文件',
  menuView: '视图',
  menuHelp: '帮助',
  menuOpenMdl: '打开 MDL...',
  menuClose: '关闭',
  menuCloseAll: '全部关闭',
  menuScreenshot: '截图',
  menuFirstPerson: '第一人称视角',
  menuToggleMessages: '切换消息面板',
  menuAbout: '关于 HLAM Web',
  menuGitHub: 'GitHub (桌面版)',
  menuLanguage: '语言',
  openMdlButton: '+ 打开 MDL',

  // -- About dialog --
  aboutText: 'Half-Life Asset Manager - 网页版\nReact + TypeScript + Three.js\n桌面版 HLAM 应用的网页移植。',

  // -- Welcome Screen --
  welcomeTitle: 'Half-Life Asset Manager',
  welcomeSubtitle: '网页版',
  welcomeDropHint: '拖拽',
  welcomeDropHint2: '文件到此处或使用',
  welcomeDropHint3: '文件 → 打开',
  welcomeFormatNote: '支持 GoldSrc StudioModel V10 格式',

  // -- Messages Panel --
  messagesTitle: '消息',
  noMessages: '暂无消息',

  // -- Panel Tabs --
  panelDisplay: '显示',
  panelSequences: '序列',
  panelBodyParts: '部件',
  panelBones: '骨骼',
  panelControllers: '控制器',
  panelTextures: '贴图',
  panelHitboxes: '碰撞箱',
  panelAttachments: '附着点',
  panelModelInfo: '模型信息',

  // -- Model Display Panel --
  renderMode: '渲染模式',
  renderTextured: '贴图渲染',
  renderWireframe: '线框渲染',
  renderFlatShaded: '平面着色',
  renderSmoothShaded: '平滑着色',
  displayOptions: '显示选项',
  backfaceCulling: '背面剔除',
  wireframeOverlay: '线框叠加',
  showBones: '显示骨骼',
  showHitboxes: '显示碰撞箱',
  showAttachments: '显示附着点',
  showNormals: '显示法线',
  boundingBox: '包围盒',
  camera: '相机',
  firstPersonView: '第一人称视角',
  scene: '场景',
  showGround: '显示地面',
  showGrid: '显示网格',
  showShadow: '显示阴影',
  showAxes: '显示坐标轴',
  showCrosshair: '显示准星',
  backgroundColor: '背景颜色',
  resetDefault: '重置为默认值',

  // -- Sequences Panel --
  sequence: '序列',
  playback: '播放控制',
  pause: '暂停',
  play: '播放',
  resetBtn: '重置',
  frame: '帧',
  speed: '速度',
  sequenceInfo: '序列信息',
  fps: '帧率',
  frames: '帧数',
  flags: '标志',
  activity: '活动',
  weight: '权重',
  blends: '混合',
  looping: '循环',
  loopAuto: '跟随序列',
  loopOn: '强制循环',
  loopOff: '不循环',
  yes: '是',
  no: '否',
  blendControls: '混合控制',
  events: '事件',
  evtFrame: '帧',
  evtEvent: '事件',
  evtOptions: '选项',

  // -- Body Parts Panel --
  bodyParts: '部件',
  skin: '皮肤',
  skinFamilies: '皮肤族',
  singleModel: '单一模型',
  bodyValue: '部件值',
  skinFamily: '皮肤族',

  // -- Bones Panel --
  bones: '骨骼',
  boneDetails: '骨骼详情',
  name: '名称',
  index: '索引',
  parent: '父级',
  noneRoot: '无 (根)',
  axisValues: '轴参数:',
  hierarchy: '层级结构',

  // -- Bone Controllers Panel --
  boneControllers: '骨骼控制器',
  mouth: '嘴部',
  controller: '控制器',
  range: '范围',

  // -- Textures Panel --
  textures: '贴图',
  textureInfo: '贴图信息',
  size: '尺寸',
  exportPng: '📥 导出为 PNG',

  // -- Hitboxes Panel --
  hitboxes: '碰撞箱',
  hitboxDetails: '碰撞箱详情',
  bone: '骨骼',
  group: '组',

  // -- Hitgroup names --
  hitGroupGeneric: '通用',
  hitGroupHead: '头部',
  hitGroupChest: '胸部',
  hitGroupStomach: '腹部',
  hitGroupLeftArm: '左臂',
  hitGroupRightArm: '右臂',
  hitGroupLeftLeg: '左腿',
  hitGroupRightLeg: '右腿',

  // -- Attachments Panel --
  attachments: '附着点',
  attachmentDetails: '附着点详情',
  noAttachments: '无附着点',
  type: '类型',
  origin: '原点',

  // -- Model Data Panel --
  modelInfo: '模型信息',
  eyePosition: '眼睛位置',
  boundingBoxMovement: '包围盒 (移动)',
  clippingBox: '裁剪盒',
  min: '最小',
  max: '最大',

  // -- Model Flag names --
  flagRocketTrail: '火箭尾迹',
  flagGrenadeTrail: '手雷尾迹',
  flagGibTrail: '碎片尾迹',
  flagRotate: '旋转',
  flagTracerGreen: '示踪 (绿)',
  flagZombieGib: '僵尸碎片',
  flagTracerOrange: '示踪 (橙)',
  flagTracerPurple: '示踪 (紫)',
  flagNoShadeLight: '无阴影光照',
  flagHitboxCollisions: '碰撞箱碰撞',
  flagForceSkylight: '强制天光',

  // -- Viewport overlay --
  polygons: '多边形',

  // -- First-person overlay --
  fpTitle: '🎮 第一人称视角',
  fpHint: '右键拖动环顾 · 滚轮调整 FOV',
  fpReset: '归位',
  fpExit: '退出第一人称 (Esc)',

  // -- Log messages --
  loadedModel: '已加载模型',
  errorLoading: '加载失败',
  skippedNonMdl: '跳过非 MDL 文件',
  failedToLoad: '加载失败',

  // -- History --
  historyTitle: '打开历史',
  historyEmpty: '暂无历史记录',
  historyLoading: '加载中...',
  historyClearAll: '清空全部',
  historyRemove: '移除',
  historyLoadFail: '无法从历史加载',
  historyJustNow: '刚刚',
  historyMinAgo: '分钟前',
  historyHourAgo: '小时前',
  historyButton: '📋 历史',
  menuHistory: '打开历史',

  // -- Language --
  langZh: '中文',
  langEn: 'English',
} as const;

export default zh;
export type LocaleKeys = keyof typeof zh;
