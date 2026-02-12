// ============================================================================
// StudioModel Three.js Renderer
// Converts EditableStudioModel into Three.js geometry for WebGL rendering
// Ported from StudioModelRenderer.cpp
// ============================================================================

import * as THREE from 'three';
import { mat4 } from 'gl-matrix';
import type {
  EditableStudioModel,
  StudioSubModel,
  StudioTexture,
  StudioMesh,
} from '../formats/studiomodel';
import { TextureFlag, calculateBodypartModelIndex } from '../formats/studiomodel';
import { setupBones, type BoneTransformInfo } from './BoneTransformer';

/** Render mode options */
export enum RenderMode {
  TEXTURED = 'textured',
  WIREFRAME = 'wireframe',
  FLAT_SHADED = 'flat-shaded',
  SMOOTH_SHADED = 'smooth-shaded',
}

/** Display flags for visualization overlays */
export interface DisplayFlags {
  showBones: boolean;
  showHitboxes: boolean;
  showAttachments: boolean;
  showNormals: boolean;
  showWireframeOverlay: boolean;
  showBoundingBox: boolean;
  showGround: boolean;
  showShadow: boolean;
  showAxes: boolean;
  showCrosshair: boolean;
  showGrid: boolean;
  backfaceCulling: boolean;
  firstPerson: boolean;
}

export function defaultDisplayFlags(): DisplayFlags {
  return {
    showBones: false,
    showHitboxes: false,
    showAttachments: false,
    showNormals: false,
    showWireframeOverlay: false,
    showBoundingBox: false,
    showGround: false,
    showShadow: false,
    showAxes: false,
    showCrosshair: false,
    showGrid: false,
    backfaceCulling: false,
    firstPerson: false,
  };
}

/** Light configuration */
export interface LightConfig {
  direction: THREE.Vector3;
  color: THREE.Color;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  skyIntensity: number;
}

export function defaultLightConfig(): LightConfig {
  return {
    direction: new THREE.Vector3(0, 0, -1).normalize(),
    color: new THREE.Color(1, 1, 1),
    ambientColor: new THREE.Color(0.3, 0.3, 0.3),
    ambientIntensity: 0.4,
    skyIntensity: 0.8,
  };
}

// ---- Texture Management ----

/**
 * Create Three.js textures from model texture data
 */
export function createTextures(model: EditableStudioModel): THREE.Texture[] {
  return model.textures.map((tex) => {
    const rgba = tex.rgba ?? decodeTextureRGBA(tex);
    // Copy to ensure we have a plain ArrayBuffer (not SharedArrayBuffer)
    const data = new Uint8Array(rgba.length);
    data.set(rgba);
    const texture = new THREE.DataTexture(
      data,
      tex.width,
      tex.height,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = false;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  });
}

function decodeTextureRGBA(tex: StudioTexture): Uint8Array {
  const { width, height, pixels, palette, flags } = tex;
  const rgba = new Uint8Array(width * height * 4);
  const isMasked = (flags & TextureFlag.MASKED) !== 0;

  for (let i = 0; i < width * height; i++) {
    const idx = pixels[i]!;
    const pi = idx * 3;
    const ri = i * 4;
    rgba[ri] = palette[pi]!;
    rgba[ri + 1] = palette[pi + 1]!;
    rgba[ri + 2] = palette[pi + 2]!;
    rgba[ri + 3] = (isMasked && idx === 255) ? 0 : 255;
  }

  return rgba;
}

// ---- Geometry Building ----

/**
 * Convert triangle commands into indexed Three.js geometry
 */
function buildMeshGeometry(
  mesh: StudioMesh,
  subModel: StudioSubModel,
  boneTransforms: mat4[],
  texture: StudioTexture | undefined,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let vertexIndex = 0;

  const texWidth = texture?.width ?? 1;
  const texHeight = texture?.height ?? 1;

  for (const cmd of mesh.triangleCommands) {
    const verts = cmd.vertices;
    if (verts.length < 3) continue;

    // Convert all vertices first
    const startVert = vertexIndex;
    for (const v of verts) {
      const vert = subModel.vertices[v.vertIndex];
      const norm = subModel.normals[v.normIndex];
      const boneIdx = subModel.vertexBoneIndices[v.vertIndex] ?? 0;
      const normBoneIdx = subModel.normalBoneIndices[v.normIndex] ?? 0;

      if (!vert || !norm) continue;

      // Transform vertex by bone matrix
      const boneMat = boneTransforms[boneIdx];
      if (boneMat) {
        const tx = boneMat[0]! * vert.x + boneMat[4]! * vert.y + boneMat[8]! * vert.z + boneMat[12]!;
        const ty = boneMat[1]! * vert.x + boneMat[5]! * vert.y + boneMat[9]! * vert.z + boneMat[13]!;
        const tz = boneMat[2]! * vert.x + boneMat[6]! * vert.y + boneMat[10]! * vert.z + boneMat[14]!;
        positions.push(tx, ty, tz);
      } else {
        positions.push(vert.x, vert.y, vert.z);
      }

      // Transform normal
      const normMat = boneTransforms[normBoneIdx];
      if (normMat) {
        const nx = normMat[0]! * norm.x + normMat[4]! * norm.y + normMat[8]! * norm.z;
        const ny = normMat[1]! * norm.x + normMat[5]! * norm.y + normMat[9]! * norm.z;
        const nz = normMat[2]! * norm.x + normMat[6]! * norm.y + normMat[10]! * norm.z;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        normals.push(nx / len, ny / len, nz / len);
      } else {
        normals.push(norm.x, norm.y, norm.z);
      }

      // UV coordinates
      uvs.push(v.s / texWidth, v.t / texHeight);
      vertexIndex++;
    }

    // Generate triangle indices
    if (cmd.isFan) {
      // Triangle fan: (0, 1, 2), (0, 2, 3), (0, 3, 4), ...
      for (let i = 2; i < verts.length; i++) {
        indices.push(startVert, startVert + i - 1, startVert + i);
      }
    } else {
      // Triangle strip: alternating winding
      for (let i = 2; i < verts.length; i++) {
        if (i % 2 === 0) {
          indices.push(startVert + i - 2, startVert + i - 1, startVert + i);
        } else {
          indices.push(startVert + i - 1, startVert + i - 2, startVert + i);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

// ---- Main Renderer Class ----

/**
 * StudioModelRenderer manages the Three.js scene objects for a studio model
 */
export class StudioModelRenderer {
  private model: EditableStudioModel;
  private textures: THREE.Texture[] = [];
  private meshGroup: THREE.Group;
  private bonesHelper: THREE.Group;
  private hitboxHelper: THREE.Group;
  private attachmentHelper: THREE.Group;
  private boundingBoxHelper: THREE.LineSegments | null = null;
  private groundPlane: THREE.Mesh | null = null;
  private shadowGroup: THREE.Group;
  private axesHelper: THREE.AxesHelper;
  private _coordRoot: THREE.Group | null = null;

  // Animation state
  private bodyValue = 0;
  private skinFamily = 0;

  constructor(model: EditableStudioModel) {
    this.model = model;
    this.meshGroup = new THREE.Group();
    this.meshGroup.name = 'ModelMeshes';
    this.bonesHelper = new THREE.Group();
    this.bonesHelper.name = 'BonesHelper';
    this.hitboxHelper = new THREE.Group();
    this.hitboxHelper.name = 'HitboxHelper';
    this.attachmentHelper = new THREE.Group();
    this.attachmentHelper.name = 'AttachmentHelper';
    this.shadowGroup = new THREE.Group();
    this.shadowGroup.name = 'ShadowGroup';
    this.axesHelper = new THREE.AxesHelper(10);
    this.axesHelper.name = 'AxesHelper';
  }

  /** Initialize textures and add to scene */
  initialize(scene: THREE.Scene): void {
    this.textures = createTextures(this.model);

    // GoldSrc uses right-hand Z-up coordinate system (X-forward, Y-left, Z-up)
    // Three.js uses right-hand Y-up coordinate system (X-right, Y-up, Z-forward)
    // Rotate -90° around X axis to convert
    const coordRoot = new THREE.Group();
    coordRoot.name = 'CoordSystemRoot';
    coordRoot.rotation.x = -Math.PI / 2;
    coordRoot.add(this.meshGroup);
    coordRoot.add(this.bonesHelper);
    coordRoot.add(this.hitboxHelper);
    coordRoot.add(this.attachmentHelper);
    coordRoot.add(this.shadowGroup);
    scene.add(coordRoot);
    this._coordRoot = coordRoot;
    scene.add(this.axesHelper);

    // Create ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x444444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0;
    this.groundPlane.name = 'GroundPlane';
    scene.add(this.groundPlane);
  }

  /** Clean up resources */
  dispose(): void {
    this.textures.forEach((t) => t.dispose());
    this.disposeGroup(this.meshGroup);
    this.disposeGroup(this.bonesHelper);
    this.disposeGroup(this.hitboxHelper);
    this.disposeGroup(this.attachmentHelper);
    this.disposeGroup(this.shadowGroup);
    if (this._coordRoot) {
      this._coordRoot.removeFromParent();
      this._coordRoot = null;
    }
    if (this.groundPlane) {
      (this.groundPlane.material as THREE.Material).dispose();
      this.groundPlane.geometry.dispose();
    }
    this.axesHelper.dispose();
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      } else if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    group.clear();
  }

  /** Set body value (for bodypart/submodel selection) */
  setBodyValue(value: number): void {
    this.bodyValue = value;
  }

  /** Set skin family index */
  setSkinFamily(family: number): void {
    this.skinFamily = family;
  }

  /** Update the rendered model with current animation state */
  update(
    transformInfo: BoneTransformInfo,
    displayFlags: DisplayFlags,
    renderMode: RenderMode,
  ): void {
    // Calculate bone transforms
    const { boneTransforms } = setupBones(this.model, transformInfo);

    // Rebuild mesh geometry
    this.rebuildMeshes(boneTransforms, displayFlags, renderMode);

    // In first-person mode, hide scene helpers
    const fp = displayFlags.firstPerson;

    // Update helpers
    this.updateBones(boneTransforms, !fp && displayFlags.showBones);
    this.updateHitboxes(boneTransforms, !fp && displayFlags.showHitboxes);
    this.updateAttachments(boneTransforms, !fp && displayFlags.showAttachments);
    this.updateBoundingBox(!fp && displayFlags.showBoundingBox);
    this.updateGround(!fp && displayFlags.showGround);
    this.updateShadow(boneTransforms, !fp && displayFlags.showShadow);
    this.axesHelper.visible = !fp && displayFlags.showAxes;
  }

  private rebuildMeshes(
    boneTransforms: mat4[],
    displayFlags: DisplayFlags,
    renderMode: RenderMode,
  ): void {
    this.disposeGroup(this.meshGroup);

    for (const bodypart of this.model.bodyparts) {
      const modelIndex = calculateBodypartModelIndex(bodypart, this.bodyValue);
      const subModel = bodypart.models[modelIndex];
      if (!subModel) continue;

      for (const mesh of subModel.meshes) {
        // Resolve texture index through skin families
        const skinRef = mesh.skinRef;
        const texIndex = this.model.skinFamilies[this.skinFamily]?.[skinRef] ?? skinRef;
        const texture = this.model.textures[texIndex];

        // Build geometry
        const geometry = buildMeshGeometry(mesh, subModel, boneTransforms, texture);

        // Create material based on render mode
        let material: THREE.Material;

        switch (renderMode) {
          case RenderMode.WIREFRAME:
            material = new THREE.MeshBasicMaterial({
              wireframe: true,
              color: 0xffffff,
            });
            break;

          case RenderMode.FLAT_SHADED:
            material = new THREE.MeshLambertMaterial({
              color: 0xcccccc,
              flatShading: true,
              side: displayFlags.backfaceCulling ? THREE.FrontSide : THREE.DoubleSide,
            });
            break;

          case RenderMode.SMOOTH_SHADED:
            material = new THREE.MeshPhongMaterial({
              color: 0xcccccc,
              side: displayFlags.backfaceCulling ? THREE.FrontSide : THREE.DoubleSide,
            });
            break;

          case RenderMode.TEXTURED:
          default: {
            const tex3 = texture ? this.textures[texIndex] : undefined;
            const flags = texture?.flags ?? 0;
            const isAdditive = (flags & TextureFlag.ADDITIVE) !== 0;
            const isMasked = (flags & TextureFlag.MASKED) !== 0;
            const isChrome = (flags & TextureFlag.CHROME) !== 0;
            const isFullbright = (flags & TextureFlag.FULLBRIGHT) !== 0;

            if (isChrome) {
              material = new THREE.MeshPhongMaterial({
                envMap: null, // could add environment map
                color: 0xcccccc,
                shininess: 100,
                side: displayFlags.backfaceCulling ? THREE.FrontSide : THREE.DoubleSide,
                map: tex3 ?? null,
              });
            } else if (isFullbright) {
              material = new THREE.MeshBasicMaterial({
                map: tex3 ?? null,
                side: displayFlags.backfaceCulling ? THREE.FrontSide : THREE.DoubleSide,
              });
            } else {
              material = new THREE.MeshLambertMaterial({
                map: tex3 ?? null,
                side: displayFlags.backfaceCulling ? THREE.FrontSide : THREE.DoubleSide,
              });
            }

            if (isAdditive) {
              material.blending = THREE.AdditiveBlending;
              material.transparent = true;
              material.depthWrite = false;
            }

            if (isMasked) {
              material.transparent = true;
              material.alphaTest = 0.5;
            }
            break;
          }
        }

        const meshObj = new THREE.Mesh(geometry, material);
        meshObj.name = `mesh_${bodypart.name}`;
        this.meshGroup.add(meshObj);

        // Wireframe overlay
        if (displayFlags.showWireframeOverlay && renderMode !== RenderMode.WIREFRAME) {
          const wireMat = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
          });
          const wireObj = new THREE.Mesh(geometry.clone(), wireMat);
          this.meshGroup.add(wireObj);
        }
      }
    }
  }

  private updateBones(boneTransforms: mat4[], visible: boolean): void {
    this.disposeGroup(this.bonesHelper);
    this.bonesHelper.visible = visible;
    if (!visible) return;

    const sphereGeo = new THREE.SphereGeometry(0.5, 6, 6);
    const boneMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    for (let i = 0; i < this.model.bones.length; i++) {
      const bone = this.model.bones[i]!;
      const transform = boneTransforms[i]!;

      // Bone point
      const sphere = new THREE.Mesh(sphereGeo, boneMat);
      sphere.position.set(transform[12]!, transform[13]!, transform[14]!);
      this.bonesHelper.add(sphere);

      // Line to parent
      if (bone.parentIndex >= 0) {
        const parentTransform = boneTransforms[bone.parentIndex]!;
        const points = [
          new THREE.Vector3(transform[12]!, transform[13]!, transform[14]!),
          new THREE.Vector3(parentTransform[12]!, parentTransform[13]!, parentTransform[14]!),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff8800 });
        const line = new THREE.Line(lineGeo, lineMat);
        this.bonesHelper.add(line);
      }
    }
  }

  private updateHitboxes(boneTransforms: mat4[], visible: boolean): void {
    this.disposeGroup(this.hitboxHelper);
    this.hitboxHelper.visible = visible;
    if (!visible) return;

    const hitboxColors = [
      0xff0000, 0x00ff00, 0x0000ff, 0xffff00,
      0xff00ff, 0x00ffff, 0xff8800, 0x88ff00,
    ];

    for (const hitbox of this.model.hitboxes) {
      const transform = boneTransforms[hitbox.boneIndex];
      if (!transform) continue;

      const size = new THREE.Vector3(
        hitbox.bbmax.x - hitbox.bbmin.x,
        hitbox.bbmax.y - hitbox.bbmin.y,
        hitbox.bbmax.z - hitbox.bbmin.z,
      );
      const center = new THREE.Vector3(
        (hitbox.bbmin.x + hitbox.bbmax.x) / 2,
        (hitbox.bbmin.y + hitbox.bbmax.y) / 2,
        (hitbox.bbmin.z + hitbox.bbmax.z) / 2,
      );

      // Translate box geometry to hitbox center in bone-local space
      const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
      boxGeo.translate(center.x, center.y, center.z);
      const edges = new THREE.EdgesGeometry(boxGeo);
      const color = hitboxColors[hitbox.group % hitboxColors.length]!;
      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
      const lineSegments = new THREE.LineSegments(edges, lineMat);

      // Apply bone transform (only once)
      const m = new THREE.Matrix4();
      m.set(
        transform[0]!, transform[4]!, transform[8]!, transform[12]!,
        transform[1]!, transform[5]!, transform[9]!, transform[13]!,
        transform[2]!, transform[6]!, transform[10]!, transform[14]!,
        transform[3]!, transform[7]!, transform[11]!, transform[15]!,
      );
      lineSegments.applyMatrix4(m);

      this.hitboxHelper.add(lineSegments);
      boxGeo.dispose();
    }
  }

  private updateAttachments(boneTransforms: mat4[], visible: boolean): void {
    this.disposeGroup(this.attachmentHelper);
    this.attachmentHelper.visible = visible;
    if (!visible) return;

    for (const att of this.model.attachments) {
      const transform = boneTransforms[att.boneIndex];
      if (!transform) continue;

      // Transform attachment origin by bone matrix
      const ox = transform[0]! * att.origin.x + transform[4]! * att.origin.y + transform[8]! * att.origin.z + transform[12]!;
      const oy = transform[1]! * att.origin.x + transform[5]! * att.origin.y + transform[9]! * att.origin.z + transform[13]!;
      const oz = transform[2]! * att.origin.x + transform[6]! * att.origin.y + transform[10]! * att.origin.z + transform[14]!;

      const sphereGeo = new THREE.SphereGeometry(1, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const sphere = new THREE.Mesh(sphereGeo, mat);
      sphere.position.set(ox, oy, oz);
      this.attachmentHelper.add(sphere);

      // Small axes
      const axesHelper = new THREE.AxesHelper(3);
      axesHelper.position.set(ox, oy, oz);
      this.attachmentHelper.add(axesHelper);
    }
  }

  private updateBoundingBox(visible: boolean): void {
    if (this.boundingBoxHelper) {
      this.boundingBoxHelper.removeFromParent();
      this.boundingBoxHelper.geometry.dispose();
      (this.boundingBoxHelper.material as THREE.Material).dispose();
      this.boundingBoxHelper = null;
    }

    if (!visible) return;

    const min = this.model.clippingMin;
    const max = this.model.clippingMax;
    const box = new THREE.Box3(
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z),
    );
    const helper = new THREE.Box3Helper(box, new THREE.Color(0xffff00));
    this.boundingBoxHelper = helper;
    this.meshGroup.parent?.add(helper);
  }

  private updateGround(visible: boolean): void {
    if (this.groundPlane) {
      this.groundPlane.visible = visible;
    }
  }

  private updateShadow(boneTransforms: mat4[], visible: boolean): void {
    this.disposeGroup(this.shadowGroup);
    this.shadowGroup.visible = visible;
    if (!visible) return;

    // Simple planar shadow: project all vertices to Z=0 (GoldSrc ground plane)
    // The coordRoot will rotate this to Y=0 in Three.js space
    for (const bodypart of this.model.bodyparts) {
      const modelIndex = calculateBodypartModelIndex(bodypart, this.bodyValue);
      const subModel = bodypart.models[modelIndex];
      if (!subModel) continue;

      for (const mesh of subModel.meshes) {
        const positions: number[] = [];
        const indices: number[] = [];
        let vertIdx = 0;

        for (const cmd of mesh.triangleCommands) {
          const startVert = vertIdx;
          for (const v of cmd.vertices) {
            const vert = subModel.vertices[v.vertIndex];
            const boneIdx = subModel.vertexBoneIndices[v.vertIndex] ?? 0;
            if (!vert) continue;

            const boneMat = boneTransforms[boneIdx];
            if (boneMat) {
              const tx = boneMat[0]! * vert.x + boneMat[4]! * vert.y + boneMat[8]! * vert.z + boneMat[12]!;
              const ty = boneMat[1]! * vert.x + boneMat[5]! * vert.y + boneMat[9]! * vert.z + boneMat[13]!;
              positions.push(tx, ty, 0.05);
            } else {
              positions.push(vert.x, vert.y, 0.05);
            }
            vertIdx++;
          }

          if (cmd.isFan) {
            for (let i = 2; i < cmd.vertices.length; i++) {
              indices.push(startVert, startVert + i - 1, startVert + i);
            }
          } else {
            for (let i = 2; i < cmd.vertices.length; i++) {
              if (i % 2 === 0) {
                indices.push(startVert + i - 2, startVert + i - 1, startVert + i);
              } else {
                indices.push(startVert + i - 1, startVert + i - 2, startVert + i);
              }
            }
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        const mat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        this.shadowGroup.add(new THREE.Mesh(geo, mat));
      }
    }
  }

  /** Get the Three.js group containing all model meshes */
  getMeshGroup(): THREE.Group {
    return this.meshGroup;
  }

  /** Get the model data */
  getModel(): EditableStudioModel {
    return this.model;
  }
}
