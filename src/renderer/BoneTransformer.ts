// ============================================================================
// Bone Transformer
// Calculates bone transformation matrices from animation data
// Ported from BoneTransformer.cpp
// ============================================================================

import { mat4, quat } from 'gl-matrix';
import type { EditableStudioModel, StudioSequence, AnimationBlend } from '../formats/studiomodel';

/** Transform parameters for calculating bone matrices */
export interface BoneTransformInfo {
  sequenceIndex: number;
  frame: number;          // fractional frame (e.g. 3.5 between frame 3 and 4)
  blenders: [number, number]; // blend values [0..255]
  boneControllers: number[];  // controller values [0..255], length 5 (4 user + 1 mouth)
  scale: number;          // model scale (default 1.0)
}

/** Result of bone setup */
export interface BoneTransformResult {
  boneTransforms: mat4[];  // one 4x4 matrix per bone
}

/**
 * Calculate bone controller adjustment values.
 * Returns an array indexed by controller index (0-4),
 * with values converted to radians for rotation controllers.
 */
function calculateBoneAdjust(
  model: EditableStudioModel,
  controllers: number[]
): number[] {
  // adj indexed by bonecontroller array index (matches SDK)
  const adj = new Array(model.boneControllers.length).fill(0);

  for (let j = 0; j < model.boneControllers.length; j++) {
    const controller = model.boneControllers[j]!;
    const idx = controller.index;
    let value: number;

    if (idx === 4) {
      // Mouth controller
      value = (controllers[4] ?? 0) / 64.0;
      value = Math.max(0, Math.min(1, value));
      value = (1.0 - value) * controller.start + value * controller.end;
    } else {
      // User controller 0-3
      value = (controllers[idx] ?? 128) / 255.0;
      value = Math.max(0, Math.min(1, value));
      value = (1.0 - value) * controller.start + value * controller.end;
    }

    // SDK: rotation controllers convert to radians
    const type = controller.type;
    // STUDIO_XR=0x0008, STUDIO_YR=0x0010, STUDIO_ZR=0x0020
    if (type & (0x0008 | 0x0010 | 0x0020)) {
      adj[j] = value * (Math.PI / 180.0);
    } else {
      adj[j] = value;
    }
  }

  return adj;
}

/**
 * Calculate bone position for a specific frame
 */
function calcBonePosition(
  boneIndex: number,
  axis: number,
  frame: number,
  blend: AnimationBlend,
  boneValue: number,
  boneScale: number,
  boneAdj: number
): number {
  const axisData = blend.boneData[boneIndex]?.[axis];
  if (!axisData || axisData.values.length === 0) {
    return boneValue + boneAdj;
  }

  const frameInt = Math.floor(frame);
  const frameFrac = frame - frameInt;
  const val0 = axisData.values[frameInt] ?? 0;

  let result = boneValue + val0 * boneScale;

  // Interpolate between frames
  if (frameFrac > 0 && frameInt + 1 < axisData.values.length) {
    const val1 = axisData.values[frameInt + 1] ?? val0;
    result += (val1 - val0) * boneScale * frameFrac;
  }

  return result + boneAdj;
}

/**
 * GoldSrc AngleQuaternion: convert Euler angles (radians) to quaternion
 * Matches the original engine implementation exactly.
 * angles[0] = Roll(X), angles[1] = Pitch(Y), angles[2] = Yaw(Z)
 */
function angleQuaternion(angles: number[]): quat {
  // Half-angles
  const sr = Math.sin(angles[0]! * 0.5);
  const cr = Math.cos(angles[0]! * 0.5);
  const sp = Math.sin(angles[1]! * 0.5);
  const cp = Math.cos(angles[1]! * 0.5);
  const sy = Math.sin(angles[2]! * 0.5);
  const cy = Math.cos(angles[2]! * 0.5);

  const q = quat.create();
  q[0] = sr * cp * cy - cr * sp * sy; // X
  q[1] = cr * sp * cy + sr * cp * sy; // Y
  q[2] = cr * cp * sy - sr * sp * cy; // Z
  q[3] = cr * cp * cy + sr * sp * sy; // W
  return q;
}

/**
 * Calculate bone quaternion rotation for a specific frame
 */
function calcBoneQuaternion(
  boneIndex: number,
  frame: number,
  blend: AnimationBlend,
  bone: { axes: { value: number; scale: number; controllerId: number }[] },
  adj: number[]
): quat {
  const angle1 = [0, 0, 0];
  const angle2 = [0, 0, 0];
  const frameInt = Math.floor(frame);
  const frameFrac = frame - frameInt;

  // Rotation axes are indices 3, 4, 5
  for (let i = 0; i < 3; i++) {
    const axis = i + 3;
    const axisData = blend.boneData[boneIndex]?.[axis];
    const boneAxis = bone.axes[axis];
    if (!boneAxis) continue;

    if (!axisData || axisData.values.length === 0) {
      angle1[i] = angle2[i] = boneAxis.value;
    } else {
      const val0 = axisData.values[frameInt] ?? 0;
      angle1[i] = boneAxis.value + val0 * boneAxis.scale;

      if (frameInt + 1 < axisData.values.length) {
        const val1 = axisData.values[frameInt + 1] ?? val0;
        angle2[i] = boneAxis.value + val1 * boneAxis.scale;
      } else {
        angle2[i] = angle1[i]!;
      }
    }

    // Apply bone controller adjustment
    if (boneAxis.controllerId !== -1) {
      angle1[i]! += adj[boneAxis.controllerId] ?? 0;
      angle2[i]! += adj[boneAxis.controllerId] ?? 0;
    }
  }

  // Interpolate between frames using quaternion slerp
  if (frameFrac > 0) {
    const q1 = angleQuaternion(angle1);
    const q2 = angleQuaternion(angle2);
    const q = quat.create();
    quat.slerp(q, q1, q2, frameFrac);
    return q;
  }
  return angleQuaternion(angle1);
}

/**
 * Slerp blend between two sets of bone transforms
 */
function slerpBones(
  q1: quat[], pos1: Float32Array[],
  q2: quat[], pos2: Float32Array[],
  s: number,
  numBones: number
): void {
  for (let i = 0; i < numBones; i++) {
    const outQ = quat.create();
    quat.slerp(outQ, q1[i]!, q2[i]!, s);
    quat.copy(q1[i]!, outQ);

    pos1[i]![0] = pos1[i]![0]! * (1 - s) + pos2[i]![0]! * s;
    pos1[i]![1] = pos1[i]![1]! * (1 - s) + pos2[i]![1]! * s;
    pos1[i]![2] = pos1[i]![2]! * (1 - s) + pos2[i]![2]! * s;
  }
}

/**
 * Calculate all bone transformation matrices
 */
export function setupBones(
  model: EditableStudioModel,
  info: BoneTransformInfo
): BoneTransformResult {
  const numBones = model.bones.length;
  const seq = model.sequences[info.sequenceIndex];

  if (!seq || numBones === 0) {
    return { boneTransforms: model.bones.map(() => mat4.create()) };
  }

  // Frame clamping
  let frame = info.frame;
  if (frame >= seq.numFrames) {
    frame = seq.numFrames - 1;
  }
  if (frame < 0) frame = 0;

  // Calculate bone controller adjustments
  const adj = calculateBoneAdjust(model, info.boneControllers);

  // Build per-controller-index adj lookup: maps controllerId -> adj value
  const adjByControllerId: number[] = [];
  for (let j = 0; j < model.boneControllers.length; j++) {
    const ctrl = model.boneControllers[j]!;
    adjByControllerId[ctrl.index] = adj[j]!;
  }

  // Calculate rotations/positions for each blend
  const allQuats: quat[][] = [];
  const allPos: Float32Array[][] = [];

  for (let blendIdx = 0; blendIdx < seq.blends.length; blendIdx++) {
    const blend = seq.blends[blendIdx]!;
    const quats: quat[] = [];
    const positions: Float32Array[] = [];

    for (let boneIdx = 0; boneIdx < numBones; boneIdx++) {
      const bone = model.bones[boneIdx]!;

      // Calculate position (axes 0-2)
      const pos = new Float32Array(3);
      for (let axis = 0; axis < 3; axis++) {
        const boneAdj = bone.axes[axis]!.controllerId !== -1
          ? (adjByControllerId[bone.axes[axis]!.controllerId] ?? 0)
          : 0;
        pos[axis] = calcBonePosition(
          boneIdx, axis, frame, blend,
          bone.axes[axis]!.value,
          bone.axes[axis]!.scale,
          boneAdj
        );
      }
      positions.push(pos);

      // Calculate rotation quaternion (axes 3-5) with adj
      const q = calcBoneQuaternion(boneIdx, frame, blend, bone, adjByControllerId);
      quats.push(q);
    }

    allQuats.push(quats);
    allPos.push(positions);
  }

  // Blend between blend sets if needed
  let finalQuats = allQuats[0]!;
  let finalPos = allPos[0]!;

  if (seq.blends.length > 1 && allQuats.length > 1) {
    const s = (info.blenders[0] ?? 0) / 255.0;
    slerpBones(finalQuats, finalPos, allQuats[1]!, allPos[1]!, s, numBones);
  }

  // Build final bone transformation matrices
  const boneTransforms: mat4[] = [];

  for (let i = 0; i < numBones; i++) {
    const boneMat = mat4.create();
    const q = finalQuats[i]!;
    const pos = finalPos[i]!;

    // Build rotation matrix from quaternion
    const rotMat = mat4.create();
    mat4.fromQuat(rotMat, q);

    // Set translation
    rotMat[12] = pos[0]!;
    rotMat[13] = pos[1]!;
    rotMat[14] = pos[2]!;

    const parentIndex = model.bones[i]!.parentIndex;
    if (parentIndex === -1) {
      // Root bone: apply model scale
      const scaleMat = mat4.create();
      mat4.scale(scaleMat, scaleMat, [info.scale, info.scale, info.scale]);
      mat4.multiply(boneMat, scaleMat, rotMat);
    } else {
      // Child bone: multiply by parent
      const parentMat = boneTransforms[parentIndex];
      if (parentMat) {
        mat4.multiply(boneMat, parentMat, rotMat);
      } else {
        mat4.copy(boneMat, rotMat);
      }
    }

    boneTransforms.push(boneMat);
  }

  return { boneTransforms };
}

/** Get sequence duration in seconds */
export function getSequenceDuration(seq: StudioSequence): number {
  if (seq.fps <= 0 || seq.numFrames <= 1) return 0;
  return (seq.numFrames - 1) / seq.fps;
}

/**
 * Advance frame by delta time.
 * @param loop - If provided, overrides the sequence's loop flag.
 *               null means use seq.flags.
 * @returns [newFrame, reachedEnd] - reachedEnd is true when non-looping
 *          sequence hit the last frame.
 */
export function advanceFrame(
  seq: StudioSequence,
  currentFrame: number,
  deltaTime: number,
  loop: boolean | null = null
): { frame: number; ended: boolean } {
  if (seq.numFrames <= 1) return { frame: 0, ended: true };

  let frame = currentFrame + deltaTime * seq.fps;
  const shouldLoop = loop !== null ? loop : !!(seq.flags & 0x0001);

  if (shouldLoop) {
    while (frame >= seq.numFrames) {
      frame -= seq.numFrames;
    }
    while (frame < 0) {
      frame += seq.numFrames;
    }
    return { frame, ended: false };
  } else {
    const ended = frame >= seq.numFrames - 1;
    frame = Math.max(0, Math.min(seq.numFrames - 1, frame));
    return { frame, ended };
  }
}
