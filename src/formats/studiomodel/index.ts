export { parseStudioModel } from './StudioModelIO';
export type {
  EditableStudioModel,
  StudioBone,
  StudioBoneController,
  StudioHitbox,
  StudioSequence,
  StudioEvent,
  StudioAttachment,
  StudioBodypart,
  StudioSubModel,
  StudioMesh,
  StudioTexture,
  AnimationBlend,
  TriangleCommand,
  TriVertex,
} from './EditableStudioModel';
export {
  decodeTextureToRGBA,
  calculateBodypartModelIndex,
} from './EditableStudioModel';
export {
  TextureFlag,
  ModelFlag,
  SequenceFlag,
  MotionFlag,
  HitGroup,
  MAXSTUDIOBONES,
} from './StudioModelFileFormat';
export type { Vec3 } from './StudioModelFileFormat';
export { vec3 } from './StudioModelFileFormat';
