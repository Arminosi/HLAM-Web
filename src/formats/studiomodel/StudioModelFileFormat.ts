// ============================================================================
// Half-Life StudioModel V10 (.mdl) File Format Types
// Ported from desktop C++ StudioModelFileFormat.hpp
// ============================================================================

/** MDL file magic identifiers */
export const STUDIO_MAGIC_IDST = 0x54534449; // "IDST" - main / texture header
export const STUDIO_MAGIC_IDSQ = 0x51534449; // "IDSQ" - sequence group header
export const STUDIO_VERSION = 10;

/** Maximum limits */
export const MAXSTUDIOBONES = 128;
export const MAXSTUDIOVERTS = 2048;
export const MAXSTUDIOSEQUENCES = 2048;
export const MAXSTUDIOMODELS = 32;
export const MAXSTUDIOBODYPARTS = 32;
export const MAXSTUDIOGROUPS = 16;
export const MAXSTUDIOTEXTURES = 100;
export const MAXSTUDIOCONTROLLERS = 8;
export const STUDIO_NUM_COORDINATE_AXES = 6;

/** Header flags (EF_*) */
export enum ModelFlag {
  ROCKET = 1,       // leave a trail
  GRENADE = 2,      // leave a trail
  GIB = 4,          // leave a trail
  ROTATE = 8,       // rotate
  TRACER = 16,      // green split trail
  ZOMGIB = 32,      // small blood trail
  TRACER2 = 64,     // orange split trail + rotate
  TRACER3 = 128,    // purple split trail
  NOSHADELIGHT = 256,
  HITBOXCOLLISIONS = 512,
  FORCESKYLIGHT = 1024,
}

/** Texture flags (STUDIO_NF_*) */
export enum TextureFlag {
  FLATSHADE = 0x0001,
  CHROME = 0x0002,
  FULLBRIGHT = 0x0004,
  MIPMAPS = 0x0008,    // not used in GoldSrc
  ADDITIVE = 0x0020,
  MASKED = 0x0040,
}

/** Sequence flags */
export enum SequenceFlag {
  LOOPING = 0x0001,
}

/** Bone controller types */
export enum MotionFlag {
  X = 0x0001,
  Y = 0x0002,
  Z = 0x0004,
  XR = 0x0008,
  YR = 0x0010,
  ZR = 0x0020,
  LX = 0x0040,
  LY = 0x0080,
  LZ = 0x0100,
  AX = 0x0200,
  AY = 0x0400,
  AZ = 0x0800,
  AXR = 0x1000,
  AYR = 0x2000,
  AZR = 0x4000,
}

/** Hitbox groups */
export enum HitGroup {
  GENERIC = 0,
  HEAD = 1,
  CHEST = 2,
  STOMACH = 3,
  LEFTARM = 4,
  RIGHTARM = 5,
  LEFTLEG = 6,
  RIGHTLEG = 7,
}

/** Vec3 type */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function vec3FromArray(arr: number[], offset = 0): Vec3 {
  return { x: arr[offset]!, y: arr[offset + 1]!, z: arr[offset + 2]! };
}

/** Raw MDL main header (disk format) */
export interface MdlHeader {
  id: number;
  version: number;
  name: string;
  length: number;

  eyePosition: Vec3;
  min: Vec3;
  max: Vec3;
  bbmin: Vec3;
  bbmax: Vec3;
  flags: number;

  numBones: number;
  boneIndex: number;
  numBoneControllers: number;
  boneControllerIndex: number;
  numHitboxes: number;
  hitboxIndex: number;
  numSeq: number;
  seqIndex: number;
  numSeqGroups: number;
  seqGroupIndex: number;
  numTextures: number;
  textureIndex: number;
  textureDataIndex: number;
  numSkinRef: number;
  numSkinFamilies: number;
  skinIndex: number;
  numBodyparts: number;
  bodypartIndex: number;
  numAttachments: number;
  attachmentIndex: number;

  // soundtable / soundindex / soundgroups (unused)
  numTransitions: number;
  transitionIndex: number;
}

/** Raw bone data */
export interface MdlBone {
  name: string;
  parent: number;
  flags: number;
  boneController: number[];  // [6]
  value: number[];            // [6]
  scale: number[];            // [6]
}

/** Raw bone controller data */
export interface MdlBoneController {
  bone: number;
  type: number;
  start: number;
  end: number;
  rest: number;
  index: number;
}

/** Raw hitbox data */
export interface MdlHitbox {
  bone: number;
  group: number;
  bbmin: Vec3;
  bbmax: Vec3;
}

/** Raw sequence descriptor */
export interface MdlSequence {
  label: string;
  fps: number;
  flags: number;
  activity: number;
  actWeight: number;
  numEvents: number;
  eventIndex: number;
  numFrames: number;
  numPivots: number;    // unused
  pivotIndex: number;   // unused
  motionType: number;
  motionBone: number;
  linearMovement: Vec3;
  autoMovePosIndex: number;
  autoMoveAngleIndex: number;
  bbmin: Vec3;
  bbmax: Vec3;
  numBlends: number;
  animIndex: number;
  blendType: number[];   // [2]
  blendStart: number[];  // [2]
  blendEnd: number[];    // [2]
  blendParent: number;   // unused
  seqGroup: number;
  entryNode: number;
  exitNode: number;
  nodeFlags: number;
  nextSeq: number;       // unused
}

/** Raw animation event */
export interface MdlEvent {
  frame: number;
  event: number;
  type: number;
  options: string;
}

/** Raw attachment point */
export interface MdlAttachment {
  name: string;
  type: number;
  bone: number;
  org: Vec3;
  vectors: [Vec3, Vec3, Vec3];
}

/** Raw bodypart */
export interface MdlBodypart {
  name: string;
  numModels: number;
  base: number;
  modelIndex: number;
}

/** Raw sub-model */
export interface MdlModel {
  name: string;
  type: number;
  boundingRadius: number;
  numMesh: number;
  meshIndex: number;
  numVerts: number;
  vertInfoIndex: number;
  vertIndex: number;
  numNorms: number;
  normInfoIndex: number;
  normIndex: number;
  numGroups: number;     // unused
  groupIndex: number;    // unused
}

/** Raw mesh */
export interface MdlMesh {
  numTris: number;
  triIndex: number;
  skinRef: number;
  numNorms: number;
  normIndex: number;    // unused
}

/** Raw texture info */
export interface MdlTexture {
  name: string;
  flags: number;
  width: number;
  height: number;
  index: number; // offset to pixel data
}

/** Raw sequence group */
export interface MdlSeqGroup {
  label: string;
  name: string;
  cachePtr: number;
  data: number;
}

/** RLE animation value union */
export interface AnimValue {
  valid: number;
  total: number;
  value: number;
}
