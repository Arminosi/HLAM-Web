// ============================================================================
// English locale
// ============================================================================

import type { LocaleKeys } from './zh';

const en: Record<LocaleKeys, string> = {
  // -- Common --
  noModelLoaded: 'No model loaded',
  close: 'Close',
  reset: 'Reset',

  // -- Menu Bar --
  menuFile: 'File',
  menuView: 'View',
  menuHelp: 'Help',
  menuOpenMdl: 'Open MDL...',
  menuClose: 'Close',
  menuCloseAll: 'Close All',
  menuScreenshot: 'Take Screenshot',
  menuFirstPerson: 'First Person View',
  menuToggleMessages: 'Toggle Messages',
  menuAbout: 'About HLAM Web',
  menuGitHub: 'GitHub (Desktop)',
  menuLanguage: 'Language',
  openMdlButton: '+ Open MDL',

  // -- About dialog --
  aboutText: 'Half-Life Asset Manager - Web Edition\nReact + TypeScript + Three.js\nA web port of the desktop HLAM application.',

  // -- Welcome Screen --
  welcomeTitle: 'Half-Life Asset Manager',
  welcomeSubtitle: 'Web Edition',
  welcomeDropHint: 'Drop a',
  welcomeDropHint2: 'file here or use',
  welcomeDropHint3: 'File → Open',
  welcomeFormatNote: 'Supports GoldSrc StudioModel V10 format',

  // -- Messages Panel --
  messagesTitle: 'Messages',
  noMessages: 'No messages',

  // -- Panel Tabs --
  panelDisplay: 'Display',
  panelSequences: 'Sequences',
  panelBodyParts: 'Body Parts',
  panelBones: 'Bones',
  panelControllers: 'Controllers',
  panelTextures: 'Textures',
  panelHitboxes: 'Hitboxes',
  panelAttachments: 'Attachments',
  panelModelInfo: 'Model Info',

  // -- Model Display Panel --
  renderMode: 'Render Mode',
  renderTextured: 'Textured',
  renderWireframe: 'Wireframe',
  renderFlatShaded: 'Flat Shaded',
  renderSmoothShaded: 'Smooth Shaded',
  displayOptions: 'Display Options',
  backfaceCulling: 'Backface Culling',
  wireframeOverlay: 'Wireframe Overlay',
  showBones: 'Show Bones',
  showHitboxes: 'Show Hitboxes',
  showAttachments: 'Show Attachments',
  showNormals: 'Show Normals',
  boundingBox: 'Bounding Box',
  camera: 'Camera',
  firstPersonView: 'First Person View',
  scene: 'Scene',
  showGround: 'Show Ground',
  showGrid: 'Show Grid',
  showShadow: 'Show Shadow',
  showAxes: 'Show Axes',
  showCrosshair: 'Show Crosshair',
  backgroundColor: 'Background Color',
  resetDefault: 'Reset to default',

  // -- Sequences Panel --
  sequence: 'Sequence',
  playback: 'Playback',
  pause: 'Pause',
  play: 'Play',
  resetBtn: 'Reset',
  frame: 'Frame',
  speed: 'Speed',
  sequenceInfo: 'Sequence Info',
  fps: 'FPS',
  frames: 'Frames',
  flags: 'Flags',
  activity: 'Activity',
  weight: 'weight',
  blends: 'Blends',
  looping: 'Looping',
  loopAuto: 'Follow Sequence',
  loopOn: 'Force Loop',
  loopOff: 'No Loop',
  yes: 'Yes',
  no: 'No',
  blendControls: 'Blend Controls',
  events: 'Events',
  evtFrame: 'Frame',
  evtEvent: 'Event',
  evtOptions: 'Options',

  // -- Body Parts Panel --
  bodyParts: 'Body Parts',
  skin: 'Skin',
  skinFamilies: 'families',
  singleModel: 'Single model',
  bodyValue: 'Body Value',
  skinFamily: 'Skin Family',

  // -- Bones Panel --
  bones: 'Bones',
  boneDetails: 'Bone Details',
  name: 'Name',
  index: 'Index',
  parent: 'Parent',
  noneRoot: 'None (root)',
  axisValues: 'Axis Values:',
  hierarchy: 'Hierarchy',

  // -- Bone Controllers Panel --
  boneControllers: 'Bone Controllers',
  mouth: 'Mouth',
  controller: 'Controller',
  range: 'Range',

  // -- Textures Panel --
  textures: 'Textures',
  textureInfo: 'Texture Info',
  size: 'Size',
  exportPng: '📥 Export as PNG',

  // -- Hitboxes Panel --
  hitboxes: 'Hitboxes',
  hitboxDetails: 'Hitbox Details',
  bone: 'Bone',
  group: 'Group',

  // -- Hitgroup names --
  hitGroupGeneric: 'Generic',
  hitGroupHead: 'Head',
  hitGroupChest: 'Chest',
  hitGroupStomach: 'Stomach',
  hitGroupLeftArm: 'Left Arm',
  hitGroupRightArm: 'Right Arm',
  hitGroupLeftLeg: 'Left Leg',
  hitGroupRightLeg: 'Right Leg',

  // -- Attachments Panel --
  attachments: 'Attachments',
  attachmentDetails: 'Attachment Details',
  noAttachments: 'No attachments',
  type: 'Type',
  origin: 'Origin',

  // -- Model Data Panel --
  modelInfo: 'Model Info',
  eyePosition: 'Eye Position',
  boundingBoxMovement: 'Bounding Box (Movement)',
  clippingBox: 'Clipping Box',
  min: 'Min',
  max: 'Max',

  // -- Model Flag names --
  flagRocketTrail: 'Rocket Trail',
  flagGrenadeTrail: 'Grenade Trail',
  flagGibTrail: 'Gib Trail',
  flagRotate: 'Rotate',
  flagTracerGreen: 'Tracer (Green)',
  flagZombieGib: 'Zombie Gib',
  flagTracerOrange: 'Tracer (Orange)',
  flagTracerPurple: 'Tracer (Purple)',
  flagNoShadeLight: 'No Shade Light',
  flagHitboxCollisions: 'Hitbox Collisions',
  flagForceSkylight: 'Force Sky Light',

  // -- Viewport overlay --
  polygons: 'Polygons',

  // -- First-person overlay --
  fpTitle: '🎮 First Person View',
  fpHint: 'Right-click drag to look · Scroll to adjust FOV',
  fpReset: 'Reset View',
  fpExit: 'Exit First Person (Esc)',

  // -- Log messages --
  loadedModel: 'Loaded model',
  errorLoading: 'Error loading',
  skippedNonMdl: 'Skipped non-MDL file',
  failedToLoad: 'Failed to load',

  // -- History --
  historyTitle: 'Recent Files',
  historyEmpty: 'No history yet',
  historyLoading: 'Loading...',
  historyClearAll: 'Clear All',
  historyRemove: 'Remove',
  historyLoadFail: 'Failed to load from history',
  historyJustNow: 'just now',
  historyMinAgo: 'min ago',
  historyHourAgo: 'hours ago',
  historyButton: '📋 History',
  menuHistory: 'Recent Files',

  // -- Language --
  langZh: '中文',
  langEn: 'English',
};

export default en;
