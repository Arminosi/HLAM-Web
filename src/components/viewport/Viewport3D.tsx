// ============================================================================
// Three.js 3D Viewport Component
// Renders the StudioModel in a WebGL canvas using React Three Fiber
// ============================================================================

import { useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, useActiveModel } from '../../store';
import { useT } from '../../i18n';
import {
  StudioModelRenderer,
  advanceFrame,
  type BoneTransformInfo,
} from '../../renderer';
import type { EditableStudioModel } from '../../formats/studiomodel';

// ---- First-Person Camera Controller ----

/**
 * GoldSrc first-person viewmodel camera.
 * Camera is at origin looking forward (+X in GoldSrc = -Z in Three.js after coord transform).
 * The viewmodel is rendered at the model origin; the coordRoot -90° X rotation handles
 * the GoldSrc Z-up → Three.js Y-up conversion.
 *
 * Supports mouse-look (hold right mouse button) for looking around.
 */
/** Default first-person yaw: look along +X (GoldSrc forward) */
const FP_DEFAULT_YAW = -Math.PI / 2;
const FP_DEFAULT_PITCH = 0;
const FP_DEFAULT_FOV = 90;

function FirstPersonCamera() {
  const { camera, gl } = useThree();
  const yawRef = useRef(FP_DEFAULT_YAW);
  const pitchRef = useRef(FP_DEFAULT_PITCH);
  const isDraggingRef = useRef(false);
  const fovRef = useRef(FP_DEFAULT_FOV);

  const applyRotation = useCallback(() => {
    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  }, [camera]);

  const resetView = useCallback(() => {
    yawRef.current = FP_DEFAULT_YAW;
    pitchRef.current = FP_DEFAULT_PITCH;
    fovRef.current = FP_DEFAULT_FOV;
    camera.position.set(0, 0, 0);
    (camera as THREE.PerspectiveCamera).fov = FP_DEFAULT_FOV;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    applyRotation();
  }, [camera, applyRotation]);

  useEffect(() => {
    // Set up first-person camera
    camera.position.set(0, 0, 0);
    (camera as THREE.PerspectiveCamera).fov = FP_DEFAULT_FOV;
    (camera as THREE.PerspectiveCamera).near = 0.1;
    (camera as THREE.PerspectiveCamera).far = 10000;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    yawRef.current = FP_DEFAULT_YAW;
    pitchRef.current = FP_DEFAULT_PITCH;
    applyRotation();
  }, [camera, applyRotation]);

  // Listen for reset event from overlay button
  useEffect(() => {
    const handler = () => resetView();
    window.addEventListener('hlam-fp-reset', handler);
    return () => window.removeEventListener('hlam-fp-reset', handler);
  }, [resetView]);

  useEffect(() => {
    const canvas = gl.domElement;

    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isDraggingRef.current = true;
        canvas.requestPointerLock?.();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isDraggingRef.current = false;
        document.exitPointerLock?.();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const sensitivity = 0.003;
      yawRef.current -= e.movementX * sensitivity;
      pitchRef.current -= e.movementY * sensitivity;
      pitchRef.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitchRef.current));
      applyRotation();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      fovRef.current += e.deltaY * 0.05;
      fovRef.current = Math.max(20, Math.min(120, fovRef.current));
      (camera as THREE.PerspectiveCamera).fov = fovRef.current;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    };

    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
      document.exitPointerLock?.();
    };
  }, [gl, camera, applyRotation]);

  // Keep camera at origin every frame
  useFrame(() => {
    camera.position.set(0, 0, 0);
  });

  return null;
}

// ---- Model Scene (runs inside Canvas) ----

function ModelScene() {
  const { scene } = useThree();
  const model = useActiveModel();
  const animation = useAppStore((s) => s.animation);
  const displayFlags = useAppStore((s) => s.displayFlags);
  const renderMode = useAppStore((s) => s.renderMode);
  const bodyValue = useAppStore((s) => s.bodyValue);
  const skinFamily = useAppStore((s) => s.skinFamily);
  const setFrame = useAppStore((s) => s.setFrame);

  const rendererRef = useRef<StudioModelRenderer | null>(null);
  const prevModelRef = useRef<EditableStudioModel | null>(null);

  // Create/update renderer when model changes
  useEffect(() => {
    if (model && model !== prevModelRef.current) {
      // Dispose old renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      // Create new renderer
      const renderer = new StudioModelRenderer(model);
      renderer.initialize(scene);
      rendererRef.current = renderer;
      prevModelRef.current = model;
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
        prevModelRef.current = null;
      }
    };
  }, [model, scene]);

  // Update renderer on every frame
  useFrame((_, delta) => {
    const renderer = rendererRef.current;
    if (!renderer || !model) return;

    renderer.setBodyValue(bodyValue);
    renderer.setSkinFamily(skinFamily);

    // Advance animation
    const seq = model.sequences[animation.sequenceIndex];
    let frame = animation.frame;
    if (seq && animation.playing) {
      const result = advanceFrame(seq, frame, delta * animation.playbackRate, animation.loopOverride);
      frame = result.frame;
      setFrame(frame);
      // Auto-pause when non-looping sequence reaches the end
      if (result.ended) {
        useAppStore.getState().setPlaying(false);
      }
    }

    // Build transform info
    const transformInfo: BoneTransformInfo = {
      sequenceIndex: animation.sequenceIndex,
      frame,
      blenders: animation.blenders,
      boneControllers: animation.boneControllers,
      scale: 1.0,
    };

    renderer.update(transformInfo, displayFlags, renderMode);
  });

  return null;
}

// ---- Camera Controller Switcher ----

interface SavedOrbitState {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

function CameraController({ firstPerson }: { firstPerson: boolean }) {
  const { camera } = useThree();
  const savedStateRef = useRef<SavedOrbitState | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera;
    if (firstPerson) {
      // Save current orbit camera state (position + target from controls)
      const target = controlsRef.current?.target?.clone() ?? new THREE.Vector3(0, 0, 0);
      savedStateRef.current = {
        pos: camera.position.clone(),
        target,
        fov: perspCam.fov,
      };
    } else if (savedStateRef.current) {
      // Restore orbit camera state
      camera.position.copy(savedStateRef.current.pos);
      perspCam.fov = savedStateRef.current.fov;
      perspCam.near = 0.1;
      perspCam.far = 10000;
      perspCam.updateProjectionMatrix();
      // Target will be restored once OrbitControls mounts (see ref callback below)
    }
  }, [firstPerson, camera]);

  // When OrbitControls mounts after leaving first-person, restore its target
  const handleControlsRef = useCallback((controls: any) => {
    controlsRef.current = controls;
    if (controls && savedStateRef.current) {
      controls.target.copy(savedStateRef.current.target);
      controls.update();
      savedStateRef.current = null;
    }
  }, []);

  if (firstPerson) {
    return <FirstPersonCamera />;
  }

  return (
    <OrbitControls
      ref={handleControlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.8}
      panSpeed={0.5}
      zoomSpeed={1.2}
      minDistance={1}
      maxDistance={2000}
    />
  );
}

// ---- Main Viewport Component ----

export function Viewport3D() {
  const bgColor = useAppStore((s) => s.colors.background);
  const displayFlags = useAppStore((s) => s.displayFlags);
  const firstPerson = displayFlags.firstPerson;

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{
          position: [80, 60, 80],
          fov: 65,
          near: 0.1,
          far: 10000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
      >
        {/* Background color */}
        <color attach="background" args={[bgColor]} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow={false}
        />
        <directionalLight
          position={[-10, -5, -10]}
          intensity={0.3}
        />

        {/* Grid - hidden in first person or when toggled off */}
        {!firstPerson && displayFlags.showGrid && (
          <Grid
            args={[200, 200]}
            cellSize={5}
            cellThickness={0.5}
            cellColor="#45455a"
            sectionSize={25}
            sectionThickness={1}
            sectionColor="#6c7086"
            fadeDistance={300}
            fadeStrength={1}
            position={[0, 0, 0]}
          />
        )}

        {/* Camera controls - switch between orbit and first-person */}
        <CameraController firstPerson={firstPerson} />

        {/* Gizmo - hidden in first person */}
        {!firstPerson && (
          <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
            <GizmoViewport
              axisColors={['#f38ba8', '#a6e3a1', '#89b4fa']}
              labelColor="white"
            />
          </GizmoHelper>
        )}

        {/* Model rendering */}
        <ModelScene />
      </Canvas>

      {/* First-person mode indicator */}
      {firstPerson && <FirstPersonOverlay />}

      {/* Viewport overlay info */}
      <ViewportOverlay />
    </div>
  );
}

function FirstPersonOverlay() {
  const setDisplayFlag = useAppStore((s) => s.setDisplayFlag);
  const t = useT();

  return (
    <>
      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-60">
          <line x1="12" y1="4" x2="12" y2="10" stroke="#a6e3a1" strokeWidth="1.5" />
          <line x1="12" y1="14" x2="12" y2="20" stroke="#a6e3a1" strokeWidth="1.5" />
          <line x1="4" y1="12" x2="10" y2="12" stroke="#a6e3a1" strokeWidth="1.5" />
          <line x1="14" y1="12" x2="20" y2="12" stroke="#a6e3a1" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Instructions */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-hlam-text-dim bg-hlam-bg/80 px-3 py-1.5 rounded pointer-events-none select-none flex items-center gap-3">
        <span>{t('fpTitle')}</span>
        <span className="text-hlam-text-muted">{t('fpHint')}</span>
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <button
          className="text-xs bg-hlam-surface/90 border border-hlam-border text-hlam-text px-2.5 py-1 rounded hover:bg-hlam-accent/20 hover:text-hlam-accent transition-colors"
          onClick={() => window.dispatchEvent(new Event('hlam-fp-reset'))}
        >
          ⟲ {t('fpReset')}
        </button>
        <button
          className="text-xs bg-hlam-surface/90 border border-hlam-border text-hlam-text px-2.5 py-1 rounded hover:bg-hlam-accent/20 hover:text-hlam-accent transition-colors"
          onClick={() => setDisplayFlag('firstPerson', false)}
        >
          {t('fpExit')}
        </button>
      </div>
    </>
  );
}

function ViewportOverlay() {
  const model = useActiveModel();
  const animation = useAppStore((s) => s.animation);
  const seq = model?.sequences[animation.sequenceIndex];
  const t = useT();

  if (!model) return null;

  // Count total polygons
  let polyCount = 0;
  for (const bp of model.bodyparts) {
    for (const sm of bp.models) {
      for (const mesh of sm.meshes) {
        for (const cmd of mesh.triangleCommands) {
          polyCount += Math.max(0, cmd.vertices.length - 2);
        }
      }
    }
  }

  return (
    <div className="absolute bottom-2 left-2 text-xs text-hlam-text-dim font-mono bg-hlam-bg/70 px-2 py-1 rounded pointer-events-none select-none">
      <div>{t('bones')}: {model.bones.length} | {t('polygons')}: {polyCount}</div>
      {seq && (
        <div>
          {t('frame')}: {Math.floor(animation.frame)}/{seq.numFrames - 1} |
          {t('fps')}: {seq.fps.toFixed(1)}
        </div>
      )}
    </div>
  );
}
