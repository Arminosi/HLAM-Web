// ============================================================================
// StudioModel MDL File Parser
// Reads binary .mdl files (GoldSrc StudioModel V10) into editable model data
// Ported from StudioModelIO.cpp
// ============================================================================

import {
  STUDIO_MAGIC_IDST,
  STUDIO_VERSION,
  STUDIO_NUM_COORDINATE_AXES,
  type MdlHeader,
  type MdlBone,
  type MdlBoneController,
  type MdlHitbox,
  type MdlSequence,
  type MdlEvent,
  type MdlAttachment,
  type MdlBodypart,
  type MdlModel,
  type MdlMesh,
  type MdlTexture,
  type Vec3,
} from './StudioModelFileFormat';

import {
  type EditableStudioModel,
  type StudioBone,
  type StudioBoneController,
  type StudioHitbox,
  type StudioSequence,
  type StudioEvent,
  type StudioAttachment,
  type StudioBodypart,
  type StudioSubModel,
  type StudioMesh,
  type StudioTexture,
  type AnimationBlend,
  type AnimationAxisData,
  type TriangleCommand,
  type TriVertex,
  createEmptyModel,
  decodeTextureToRGBA,
} from './EditableStudioModel';

// ---- Binary Reader Helper ----

class BinaryReader {
  private view: DataView;
  private buffer: Uint8Array;
  public offset: number;

  constructor(data: ArrayBuffer | SharedArrayBuffer, offset = 0) {
    this.view = new DataView(data as ArrayBuffer);
    this.buffer = new Uint8Array(data as ArrayBuffer);
    this.offset = offset;
  }

  get length(): number {
    return this.buffer.length;
  }

  seek(pos: number): void {
    this.offset = pos;
  }

  skip(n: number): void {
    this.offset += n;
  }

  readInt8(): number {
    const v = this.view.getInt8(this.offset);
    this.offset += 1;
    return v;
  }

  readUint8(): number {
    const v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }

  readInt16(): number {
    const v = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return v;
  }

  readUint16(): number {
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }

  readInt32(): number {
    const v = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return v;
  }

  readUint32(): number {
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }

  readFloat32(): number {
    const v = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return v;
  }

  readVec3(): Vec3 {
    return {
      x: this.readFloat32(),
      y: this.readFloat32(),
      z: this.readFloat32(),
    };
  }

  readString(maxLen: number): string {
    const bytes: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      const b = this.buffer[this.offset + i]!;
      if (b === 0) break;
      bytes.push(b);
    }
    this.offset += maxLen;
    return String.fromCharCode(...bytes);
  }

  readBytes(n: number): Uint8Array {
    const slice = this.buffer.slice(this.offset, this.offset + n);
    this.offset += n;
    return slice;
  }

  readInt16Array(count: number): number[] {
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(this.readInt16());
    }
    return arr;
  }

  readFloat32Array(count: number): number[] {
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(this.readFloat32());
    }
    return arr;
  }

  readUint8Array(count: number): number[] {
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(this.readUint8());
    }
    return arr;
  }

  /** Create a sub-reader at a given absolute offset */
  subReaderAt(offset: number): BinaryReader {
    return new BinaryReader(this.view.buffer as ArrayBuffer, offset);
  }
}

// ---- Header Parsing ----

function readHeader(reader: BinaryReader): MdlHeader {
  reader.seek(0);
  const id = reader.readInt32();
  const version = reader.readInt32();

  if (id !== STUDIO_MAGIC_IDST) {
    throw new Error(`Invalid MDL file: bad magic number 0x${id.toString(16)}`);
  }
  if (version !== STUDIO_VERSION) {
    throw new Error(`Unsupported MDL version: ${version} (expected ${STUDIO_VERSION})`);
  }

  const name = reader.readString(64);
  const length = reader.readInt32();

  const eyePosition = reader.readVec3();
  const min = reader.readVec3();
  const max = reader.readVec3();
  const bbmin = reader.readVec3();
  const bbmax = reader.readVec3();
  const flags = reader.readInt32();

  const numBones = reader.readInt32();
  const boneIndex = reader.readInt32();
  const numBoneControllers = reader.readInt32();
  const boneControllerIndex = reader.readInt32();
  const numHitboxes = reader.readInt32();
  const hitboxIndex = reader.readInt32();
  const numSeq = reader.readInt32();
  const seqIndex = reader.readInt32();
  const numSeqGroups = reader.readInt32();
  const seqGroupIndex = reader.readInt32();
  const numTextures = reader.readInt32();
  const textureIndex = reader.readInt32();
  const textureDataIndex = reader.readInt32();
  const numSkinRef = reader.readInt32();
  const numSkinFamilies = reader.readInt32();
  const skinIndex = reader.readInt32();
  const numBodyparts = reader.readInt32();
  const bodypartIndex = reader.readInt32();
  const numAttachments = reader.readInt32();
  const attachmentIndex = reader.readInt32();

  // Skip soundtable, soundindex, soundgroups, numtransitions
  reader.skip(4 * 2); // soundtable, soundindex
  reader.skip(4 * 2); // soundgroups, soundgroupindex
  const numTransitions = reader.readInt32();
  const transitionIndex = reader.readInt32();

  return {
    id, version, name, length,
    eyePosition, min, max, bbmin, bbmax, flags,
    numBones, boneIndex,
    numBoneControllers, boneControllerIndex,
    numHitboxes, hitboxIndex,
    numSeq, seqIndex,
    numSeqGroups, seqGroupIndex,
    numTextures, textureIndex, textureDataIndex,
    numSkinRef, numSkinFamilies, skinIndex,
    numBodyparts, bodypartIndex,
    numAttachments, attachmentIndex,
    numTransitions, transitionIndex,
  };
}

// ---- Sub-structure Parsing ----

function readBones(reader: BinaryReader, header: MdlHeader): MdlBone[] {
  const bones: MdlBone[] = [];
  reader.seek(header.boneIndex);
  for (let i = 0; i < header.numBones; i++) {
    const name = reader.readString(32);
    const parent = reader.readInt32();
    const flags = reader.readInt32();
    const boneController = [
      reader.readInt32(), reader.readInt32(), reader.readInt32(),
      reader.readInt32(), reader.readInt32(), reader.readInt32(),
    ];
    const value = reader.readFloat32Array(6);
    const scale = reader.readFloat32Array(6);
    bones.push({ name, parent, flags, boneController, value, scale });
  }
  return bones;
}

function readBoneControllers(reader: BinaryReader, header: MdlHeader): MdlBoneController[] {
  const controllers: MdlBoneController[] = [];
  reader.seek(header.boneControllerIndex);
  for (let i = 0; i < header.numBoneControllers; i++) {
    const bone = reader.readInt32();
    const type = reader.readInt32();
    const start = reader.readFloat32();
    const end = reader.readFloat32();
    const rest = reader.readInt32();
    const index = reader.readInt32();
    controllers.push({ bone, type, start, end, rest, index });
  }
  return controllers;
}

function readHitboxes(reader: BinaryReader, header: MdlHeader): MdlHitbox[] {
  const hitboxes: MdlHitbox[] = [];
  reader.seek(header.hitboxIndex);
  for (let i = 0; i < header.numHitboxes; i++) {
    const bone = reader.readInt32();
    const group = reader.readInt32();
    const bbmin = reader.readVec3();
    const bbmax = reader.readVec3();
    hitboxes.push({ bone, group, bbmin, bbmax });
  }
  return hitboxes;
}

function readEvents(reader: BinaryReader, seq: MdlSequence, _seqOffset: number): MdlEvent[] {
  const events: MdlEvent[] = [];
  if (seq.numEvents === 0) return events;
  // eventIndex is absolute (file-relative), same as animIndex
  reader.seek(seq.eventIndex);
  for (let i = 0; i < seq.numEvents; i++) {
    const frame = reader.readInt32();
    const event = reader.readInt32();
    const type = reader.readInt32();
    const options = reader.readString(64);
    events.push({ frame, event, type, options });
  }
  return events;
}

function readSequences(reader: BinaryReader, header: MdlHeader): MdlSequence[] {
  const sequences: MdlSequence[] = [];
  reader.seek(header.seqIndex);

  for (let i = 0; i < header.numSeq; i++) {
    const offset = reader.offset;
    const label = reader.readString(32);
    const fps = reader.readFloat32();
    const flags = reader.readInt32();
    const activity = reader.readInt32();
    const actWeight = reader.readInt32();
    const numEvents = reader.readInt32();
    const eventIndex = reader.readInt32();
    const numFrames = reader.readInt32();
    const numPivots = reader.readInt32();
    const pivotIndex = reader.readInt32();
    const motionType = reader.readInt32();
    const motionBone = reader.readInt32();
    const linearMovement = reader.readVec3();
    const autoMovePosIndex = reader.readInt32();
    const autoMoveAngleIndex = reader.readInt32();
    const bbmin = reader.readVec3();
    const bbmax = reader.readVec3();
    const numBlends = reader.readInt32();
    const animIndex = reader.readInt32();
    const blendType = [reader.readInt32(), reader.readInt32()];
    const blendStart = [reader.readFloat32(), reader.readFloat32()];
    const blendEnd = [reader.readFloat32(), reader.readFloat32()];
    const blendParent = reader.readInt32();
    const seqGroup = reader.readInt32();
    const entryNode = reader.readInt32();
    const exitNode = reader.readInt32();
    const nodeFlags = reader.readInt32();
    const nextSeq = reader.readInt32();

    const seq: MdlSequence = {
      label, fps, flags, activity, actWeight,
      numEvents, eventIndex, numFrames,
      numPivots, pivotIndex,
      motionType, motionBone, linearMovement,
      autoMovePosIndex, autoMoveAngleIndex,
      bbmin, bbmax, numBlends, animIndex,
      blendType, blendStart, blendEnd, blendParent,
      seqGroup, entryNode, exitNode, nodeFlags, nextSeq,
    };

    // Save position, read events, then restore
    const nextOffset = reader.offset;
    seq._events = readEvents(reader, seq, offset);
    seq._seqOffset = offset;
    reader.seek(nextOffset);

    sequences.push(seq);
  }
  return sequences;
}

// Extend MdlSequence with internal fields
declare module './StudioModelFileFormat' {
  interface MdlSequence {
    _events?: MdlEvent[];
    _seqOffset?: number;
  }
}

function readAttachments(reader: BinaryReader, header: MdlHeader): MdlAttachment[] {
  const attachments: MdlAttachment[] = [];
  reader.seek(header.attachmentIndex);
  for (let i = 0; i < header.numAttachments; i++) {
    const name = reader.readString(32);
    const type = reader.readInt32();
    const bone = reader.readInt32();
    const org = reader.readVec3();
    const vectors: [Vec3, Vec3, Vec3] = [
      reader.readVec3(),
      reader.readVec3(),
      reader.readVec3(),
    ];
    attachments.push({ name, type, bone, org, vectors });
  }
  return attachments;
}

function readBodyparts(reader: BinaryReader, header: MdlHeader): MdlBodypart[] {
  const bodyparts: MdlBodypart[] = [];
  reader.seek(header.bodypartIndex);
  for (let i = 0; i < header.numBodyparts; i++) {
    const name = reader.readString(64);
    const numModels = reader.readInt32();
    const base = reader.readInt32();
    const modelIndex = reader.readInt32();
    bodyparts.push({ name, numModels, base, modelIndex });
  }
  return bodyparts;
}

function readModel(reader: BinaryReader, offset: number): MdlModel {
  reader.seek(offset);
  const name = reader.readString(64);
  const type = reader.readInt32();
  const boundingRadius = reader.readFloat32();
  const numMesh = reader.readInt32();
  const meshIndex = reader.readInt32();
  const numVerts = reader.readInt32();
  const vertInfoIndex = reader.readInt32();
  const vertIndex = reader.readInt32();
  const numNorms = reader.readInt32();
  const normInfoIndex = reader.readInt32();
  const normIndex = reader.readInt32();
  const numGroups = reader.readInt32();
  const groupIndex = reader.readInt32();

  return {
    name, type, boundingRadius,
    numMesh, meshIndex,
    numVerts, vertInfoIndex, vertIndex,
    numNorms, normInfoIndex, normIndex,
    numGroups, groupIndex,
  };
}

function readMeshes(reader: BinaryReader, model: MdlModel): MdlMesh[] {
  const meshes: MdlMesh[] = [];
  reader.seek(model.meshIndex);
  for (let i = 0; i < model.numMesh; i++) {
    const numTris = reader.readInt32();
    const triIndex = reader.readInt32();
    const skinRef = reader.readInt32();
    const numNorms = reader.readInt32();
    const normIndex = reader.readInt32();
    meshes.push({ numTris, triIndex, skinRef, numNorms, normIndex });
  }
  return meshes;
}

function readTextures(reader: BinaryReader, header: MdlHeader): MdlTexture[] {
  const textures: MdlTexture[] = [];
  if (header.numTextures === 0) return textures;

  reader.seek(header.textureIndex);
  for (let i = 0; i < header.numTextures; i++) {
    const name = reader.readString(64);
    const flags = reader.readInt32();
    const width = reader.readInt32();
    const height = reader.readInt32();
    const index = reader.readInt32();
    textures.push({ name, flags, width, height, index });
  }
  return textures;
}

function readTriangleCommands(reader: BinaryReader, offset: number): TriangleCommand[] {
  const commands: TriangleCommand[] = [];
  reader.seek(offset);

  while (true) {
    let cmd = reader.readInt16();
    if (cmd === 0) break;

    const isFan = cmd < 0;
    const count = Math.abs(cmd);
    const vertices: TriVertex[] = [];

    for (let i = 0; i < count; i++) {
      const vertIndex = reader.readInt16();
      const normIndex = reader.readInt16();
      const s = reader.readInt16();
      const t = reader.readInt16();
      vertices.push({ vertIndex, normIndex, s, t });
    }

    commands.push({ isFan, vertices });
  }

  return commands;
}

// ---- RLE Animation Decompression ----

/**
 * Decompress RLE-encoded animation values for a single bone axis
 */
function decompressAnimValues(
  reader: BinaryReader,
  baseOffset: number,
  animValueOffset: number,
  numFrames: number
): number[] {
  if (animValueOffset === 0) {
    return new Array(numFrames).fill(0);
  }

  const values: number[] = [];
  const dataStart = baseOffset + animValueOffset;
  reader.seek(dataStart);

  let remaining = numFrames;
  while (remaining > 0) {
    // Read RLE header: {valid, total} packed as two bytes
    const valid = reader.readUint8();
    const total = reader.readUint8();

    if (total === 0) break;

    // Read 'valid' explicit values
    const explicitValues: number[] = [];
    for (let i = 0; i < valid; i++) {
      explicitValues.push(reader.readInt16());
    }

    // Output values
    const count = Math.min(total, remaining);
    for (let i = 0; i < count; i++) {
      if (i < valid) {
        values.push(explicitValues[i]!);
      } else {
        // Repeat last valid value
        values.push(explicitValues[valid - 1] ?? 0);
      }
    }
    remaining -= count;
  }

  // Pad if necessary
  while (values.length < numFrames) {
    values.push(0);
  }

  return values;
}

function readAnimationData(
  reader: BinaryReader,
  _header: MdlHeader,
  seq: MdlSequence,
  numBones: number
): AnimationBlend[] {
  const blends: AnimationBlend[] = [];

  for (let blendIdx = 0; blendIdx < seq.numBlends; blendIdx++) {
    // Animation offset: animIndex is relative to file start (header) for seqgroup 0
    // SDK: (mstudioanim_t *)((byte *)m_pStudioHeader + pseqdesc->animindex)
    // Each blend advances by numBones anim structs (6 shorts per bone)
    const animBase = seq.animIndex +
      blendIdx * numBones * STUDIO_NUM_COORDINATE_AXES * 2;

    const boneData: AnimationAxisData[][] = [];

    for (let boneIdx = 0; boneIdx < numBones; boneIdx++) {
      const boneAnimOffset = animBase + boneIdx * STUDIO_NUM_COORDINATE_AXES * 2;
      reader.seek(boneAnimOffset);

      // Read 6 offsets (one per axis)
      const axisOffsets: number[] = [];
      for (let axis = 0; axis < STUDIO_NUM_COORDINATE_AXES; axis++) {
        axisOffsets.push(reader.readUint16());
      }

      const axes: AnimationAxisData[] = [];
      for (let axis = 0; axis < STUDIO_NUM_COORDINATE_AXES; axis++) {
        const values = decompressAnimValues(
          reader,
          boneAnimOffset,
          axisOffsets[axis]!,
          seq.numFrames
        );
        axes.push({ values });
      }
      boneData.push(axes);
    }

    blends.push({ boneData });
  }

  return blends;
}

// ---- Main Parse Function ----

export function parseStudioModel(data: ArrayBuffer): EditableStudioModel {
  const reader = new BinaryReader(data);
  const header = readHeader(reader);

  // Read raw structures
  const rawBones = readBones(reader, header);
  const rawControllers = readBoneControllers(reader, header);
  const rawHitboxes = readHitboxes(reader, header);
  const rawSequences = readSequences(reader, header);
  const rawAttachments = readAttachments(reader, header);
  const rawBodyparts = readBodyparts(reader, header);
  const rawTextures = readTextures(reader, header);

  // Build editable model
  const model = createEmptyModel();
  model.name = header.name;
  model.flags = header.flags;
  model.eyePosition = header.eyePosition;
  model.boundingMin = header.min;
  model.boundingMax = header.max;
  model.clippingMin = header.bbmin;
  model.clippingMax = header.bbmax;

  // Convert bones
  model.bones = rawBones.map((rb): StudioBone => ({
    name: rb.name,
    parentIndex: rb.parent,
    flags: rb.flags,
    axes: Array.from({ length: 6 }, (_, i) => ({
      controllerId: rb.boneController[i]!,
      value: rb.value[i]!,
      scale: rb.scale[i]!,
    })),
  }));

  // Convert bone controllers
  model.boneControllers = rawControllers.map((rc): StudioBoneController => ({
    boneIndex: rc.bone,
    type: rc.type,
    start: rc.start,
    end: rc.end,
    rest: rc.rest,
    index: rc.index,
  }));

  // Convert hitboxes
  model.hitboxes = rawHitboxes.map((rh): StudioHitbox => ({
    boneIndex: rh.bone,
    group: rh.group,
    bbmin: rh.bbmin,
    bbmax: rh.bbmax,
  }));

  // Convert sequences
  model.sequences = rawSequences.map((rs): StudioSequence => {
    const blends = readAnimationData(reader, header, rs, header.numBones);
    const events: StudioEvent[] = (rs._events ?? []).map((re) => ({
      frame: re.frame,
      eventId: re.event,
      type: re.type,
      options: re.options,
    }));

    return {
      label: rs.label,
      fps: rs.fps,
      flags: rs.flags,
      activity: rs.activity,
      actWeight: rs.actWeight,
      events,
      numFrames: rs.numFrames,
      blends,
      blendType: [rs.blendType[0]!, rs.blendType[1]!],
      blendStart: [rs.blendStart[0]!, rs.blendStart[1]!],
      blendEnd: [rs.blendEnd[0]!, rs.blendEnd[1]!],
      motionType: rs.motionType,
      motionBone: rs.motionBone,
      linearMovement: rs.linearMovement,
      bbmin: rs.bbmin,
      bbmax: rs.bbmax,
      entryNode: rs.entryNode,
      exitNode: rs.exitNode,
      nodeFlags: rs.nodeFlags,
      seqGroup: rs.seqGroup,
    };
  });

  // Convert attachments
  model.attachments = rawAttachments.map((ra): StudioAttachment => ({
    name: ra.name,
    type: ra.type,
    boneIndex: ra.bone,
    origin: ra.org,
    vectors: ra.vectors,
  }));

  // Convert bodyparts and sub-models
  model.bodyparts = rawBodyparts.map((rbp): StudioBodypart => {
    const models: StudioSubModel[] = [];

    for (let mi = 0; mi < rbp.numModels; mi++) {
      // Each MdlModel is 112 bytes
      const modelOffset = rbp.modelIndex + mi * 112;
      const rm = readModel(reader, modelOffset);

      // Read vertices (offsets in MdlModel are absolute file offsets)
      reader.seek(rm.vertIndex);
      const vertices: Vec3[] = [];
      for (let vi = 0; vi < rm.numVerts; vi++) {
        vertices.push(reader.readVec3());
      }

      // Read vertex bone indices
      reader.seek(rm.vertInfoIndex);
      const vertexBoneIndices = reader.readUint8Array(rm.numVerts);

      // Read normals
      reader.seek(rm.normIndex);
      const normals: Vec3[] = [];
      for (let ni = 0; ni < rm.numNorms; ni++) {
        normals.push(reader.readVec3());
      }

      // Read normal bone indices
      reader.seek(rm.normInfoIndex);
      const normalBoneIndices = reader.readUint8Array(rm.numNorms);

      // Read meshes (offsets are absolute file offsets)
      const rawMeshes = readMeshes(reader, rm);
      const meshes: StudioMesh[] = rawMeshes.map((mesh): StudioMesh => {
        const triangleCommands = readTriangleCommands(
          reader,
          mesh.triIndex
        );
        return {
          triangleCommands,
          skinRef: mesh.skinRef,
        };
      });

      models.push({
        name: rm.name,
        vertices,
        vertexBoneIndices,
        normals,
        normalBoneIndices,
        meshes,
      });
    }

    return {
      name: rbp.name,
      base: rbp.base,
      models,
    };
  });

  // Read textures with pixel data
  model.textures = rawTextures.map((rt): StudioTexture => {
    reader.seek(rt.index);
    const pixels = reader.readBytes(rt.width * rt.height);
    const palette = reader.readBytes(256 * 3) as unknown as Uint8Array;

    const texture: StudioTexture = {
      name: rt.name,
      flags: rt.flags,
      width: rt.width,
      height: rt.height,
      pixels,
      palette,
    };
    texture.rgba = decodeTextureToRGBA(texture);
    return texture;
  });

  // Read skin families
  if (header.numSkinRef > 0 && header.numSkinFamilies > 0) {
    reader.seek(header.skinIndex);
    for (let fi = 0; fi < header.numSkinFamilies; fi++) {
      const family: number[] = [];
      for (let si = 0; si < header.numSkinRef; si++) {
        family.push(reader.readInt16());
      }
      model.skinFamilies.push(family);
    }
  }

  // Read transitions
  if (header.numTransitions > 0) {
    reader.seek(header.transitionIndex);
    for (let i = 0; i < header.numTransitions * header.numTransitions; i++) {
      model.transitions.push(reader.readUint8());
    }
  }

  return model;
}
