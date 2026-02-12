// ============================================================================
// Editable StudioModel Data Structures
// High-level data model for editing, ported from EditableStudioModel.hpp
// ============================================================================

import type { Vec3 } from './StudioModelFileFormat';
import { vec3 } from './StudioModelFileFormat';

/** RGB palette (256 colors × 3 bytes) */
export type RGBPalette = Uint8Array; // length = 768

/** A single bone axis data */
export interface BoneAxis {
  controllerId: number; // -1 if none
  value: number;
  scale: number;
}

/** Editable bone */
export interface StudioBone {
  name: string;
  parentIndex: number;  // -1 for root
  flags: number;
  axes: BoneAxis[];     // [6] - X,Y,Z,XR,YR,ZR
}

/** Editable bone controller */
export interface StudioBoneController {
  boneIndex: number;
  type: number;         // MotionFlag
  start: number;
  end: number;
  rest: number;
  index: number;        // 0-3: user controller, 4: mouth
}

/** Editable hitbox */
export interface StudioHitbox {
  boneIndex: number;
  group: number;
  bbmin: Vec3;
  bbmax: Vec3;
}

/** Editable animation event */
export interface StudioEvent {
  frame: number;
  eventId: number;
  type: number;
  options: string;
}

/** Per-bone per-axis animation data (decompressed from RLE) */
export interface AnimationAxisData {
  values: number[];  // one value per frame
}

/** Animation blend data: one frame set for all bones */
export interface AnimationBlend {
  /** boneData[boneIndex][axis] = values per frame */
  boneData: AnimationAxisData[][];
}

/** Editable sequence */
export interface StudioSequence {
  label: string;
  fps: number;
  flags: number;
  activity: number;
  actWeight: number;
  events: StudioEvent[];
  numFrames: number;
  blends: AnimationBlend[];   // numBlends elements
  blendType: [number, number];
  blendStart: [number, number];
  blendEnd: [number, number];
  motionType: number;
  motionBone: number;
  linearMovement: Vec3;
  bbmin: Vec3;
  bbmax: Vec3;
  entryNode: number;
  exitNode: number;
  nodeFlags: number;
  seqGroup: number;
}

/** Editable attachment */
export interface StudioAttachment {
  name: string;
  type: number;
  boneIndex: number;
  origin: Vec3;
  vectors: [Vec3, Vec3, Vec3];
}

/** Triangle vertex (command stream decoded) */
export interface TriVertex {
  vertIndex: number;
  normIndex: number;
  s: number;
  t: number;
}

/** Triangle primitive */
export interface TriangleCommand {
  isFan: boolean;       // true = fan, false = strip
  vertices: TriVertex[];
}

/** Editable mesh */
export interface StudioMesh {
  triangleCommands: TriangleCommand[];
  skinRef: number;
}

/** Editable sub-model */
export interface StudioSubModel {
  name: string;
  vertices: Vec3[];        // in bone space
  vertexBoneIndices: number[];
  normals: Vec3[];
  normalBoneIndices: number[];
  meshes: StudioMesh[];
}

/** Editable bodypart */
export interface StudioBodypart {
  name: string;
  base: number;
  models: StudioSubModel[];
}

/** Editable texture */
export interface StudioTexture {
  name: string;
  flags: number;
  width: number;
  height: number;
  /** Indexed pixel data (8-bit indices into palette) */
  pixels: Uint8Array;
  /** 256-color RGB palette */
  palette: RGBPalette;
  /** Decoded RGBA data (for rendering) */
  rgba?: Uint8Array;
}

/** The complete editable studio model */
export interface EditableStudioModel {
  name: string;
  flags: number;
  eyePosition: Vec3;
  boundingMin: Vec3;
  boundingMax: Vec3;
  clippingMin: Vec3;
  clippingMax: Vec3;

  bones: StudioBone[];
  boneControllers: StudioBoneController[];
  hitboxes: StudioHitbox[];
  sequences: StudioSequence[];
  attachments: StudioAttachment[];
  bodyparts: StudioBodypart[];
  textures: StudioTexture[];
  skinFamilies: number[][];   // [familyIndex][skinRef] → textureIndex

  /** Transition graph (node flags) */
  transitions: number[];
}

/** Create a default empty model */
export function createEmptyModel(): EditableStudioModel {
  return {
    name: '',
    flags: 0,
    eyePosition: vec3(),
    boundingMin: vec3(),
    boundingMax: vec3(),
    clippingMin: vec3(),
    clippingMax: vec3(),
    bones: [],
    boneControllers: [],
    hitboxes: [],
    sequences: [],
    attachments: [],
    bodyparts: [],
    textures: [],
    skinFamilies: [],
    transitions: [],
  };
}

/** Decode indexed texture pixels to RGBA */
export function decodeTextureToRGBA(texture: StudioTexture): Uint8Array {
  const { width, height, pixels, palette, flags } = texture;
  const rgba = new Uint8Array(width * height * 4);

  const isMasked = (flags & 0x0040) !== 0; // STUDIO_NF_MASKED
  // Last palette index is transparent for masked textures
  const transparentIndex = 255;

  for (let i = 0; i < width * height; i++) {
    const idx = pixels[i]!;
    const pi = idx * 3;
    const ri = i * 4;
    rgba[ri] = palette[pi]!;
    rgba[ri + 1] = palette[pi + 1]!;
    rgba[ri + 2] = palette[pi + 2]!;
    rgba[ri + 3] = (isMasked && idx === transparentIndex) ? 0 : 255;
  }

  return rgba;
}

/** Calculate the selected sub-model index for a bodypart given a body value */
export function calculateBodypartModelIndex(
  bodypart: StudioBodypart,
  bodyValue: number
): number {
  if (bodypart.models.length <= 1) return 0;
  return Math.floor(bodyValue / bodypart.base) % bodypart.models.length;
}
