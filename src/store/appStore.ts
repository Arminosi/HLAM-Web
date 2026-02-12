// ============================================================================
// Application State Management (Zustand)
// Central store for the entire application
// ============================================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EditableStudioModel } from '../formats/studiomodel';
import { RenderMode, defaultDisplayFlags, type DisplayFlags } from '../renderer';

/** A single opened asset */
export interface AssetEntry {
  id: string;
  fileName: string;
  model: EditableStudioModel;
  /** Has unsaved modifications */
  dirty: boolean;
}

/** Animation playback state */
export interface AnimationState {
  sequenceIndex: number;
  frame: number;
  playing: boolean;
  playbackRate: number;
  /** null = follow sequence flag, true/false = user override */
  loopOverride: boolean | null;
  blenders: [number, number];
  boneControllers: number[]; // length 5
}

/** Viewport camera state */
export interface CameraState {
  mode: 'arc-ball' | 'free-look' | 'first-person';
  distance: number;
  rotationX: number;
  rotationY: number;
  panX: number;
  panY: number;
  fov: number;
}

/** Color settings */
export interface ColorSettings {
  background: string;
  ground: string;
  wireframe: string;
  crosshair: string;
  skyLight: string;
  hitboxColors: string[];
}

/** Main application store state */
export interface AppState {
  // -- Assets --
  assets: AssetEntry[];
  activeAssetId: string | null;

  // -- Animation --
  animation: AnimationState;

  // -- Display --
  displayFlags: DisplayFlags;
  renderMode: RenderMode;

  // -- Camera --
  camera: CameraState;

  // -- UI --
  activePanel: string;
  bodyValue: number;
  skinFamily: number;
  showMessages: boolean;
  messageLog: string[];

  // -- Colors --
  colors: ColorSettings;

  // -- Actions --
  addAsset: (entry: AssetEntry) => void;
  removeAsset: (id: string) => void;
  setActiveAsset: (id: string | null) => void;
  setSequenceIndex: (index: number) => void;
  setFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setLoopOverride: (value: boolean | null) => void;
  setBlender: (index: 0 | 1, value: number) => void;
  setBoneController: (index: number, value: number) => void;
  setDisplayFlag: <K extends keyof DisplayFlags>(key: K, value: DisplayFlags[K]) => void;
  setRenderMode: (mode: RenderMode) => void;
  setCameraMode: (mode: CameraState['mode']) => void;
  setCameraState: (state: Partial<CameraState>) => void;
  setActivePanel: (panel: string) => void;
  setBodyValue: (value: number) => void;
  setSkinFamily: (family: number) => void;
  toggleMessages: () => void;
  addMessage: (msg: string) => void;
  setColor: <K extends keyof ColorSettings>(key: K, value: ColorSettings[K]) => void;
}

const defaultAnimation: AnimationState = {
  sequenceIndex: 0,
  frame: 0,
  playing: true,
  playbackRate: 1.0,
  loopOverride: null,
  blenders: [0, 0],
  boneControllers: [128, 128, 128, 128, 0],
};

const defaultCamera: CameraState = {
  mode: 'arc-ball',
  distance: 100,
  rotationX: -20,
  rotationY: 135,
  panX: 0,
  panY: 0,
  fov: 65,
};

const defaultColors: ColorSettings = {
  background: '#1e1e2e',
  ground: '#444444',
  wireframe: '#00ff00',
  crosshair: '#00ff00',
  skyLight: '#ffffff',
  hitboxColors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'],
};

export const useAppStore = create<AppState>()(
  immer((set) => ({
    // Initial state
    assets: [],
    activeAssetId: null,
    animation: { ...defaultAnimation },
    displayFlags: defaultDisplayFlags(),
    renderMode: RenderMode.TEXTURED,
    camera: { ...defaultCamera },
    activePanel: 'model-display',
    bodyValue: 0,
    skinFamily: 0,
    showMessages: false,
    messageLog: [],
    colors: { ...defaultColors },

    // Actions
    addAsset: (entry) =>
      set((state) => {
        state.assets.push(entry);
        state.activeAssetId = entry.id;
        state.animation = { ...defaultAnimation };
        state.bodyValue = 0;
        state.skinFamily = 0;
        // Auto-enable first-person view for viewmodel files (v_ prefix)
        const baseName = entry.fileName.split(/[/\\]/).pop() ?? '';
        state.displayFlags.firstPerson = /^v_/i.test(baseName);
        state.addMessage(`Loaded: ${entry.fileName}`);
      }),

    removeAsset: (id) =>
      set((state) => {
        const idx = state.assets.findIndex((a) => a.id === id);
        if (idx >= 0) {
          state.assets.splice(idx, 1);
        }
        if (state.activeAssetId === id) {
          state.activeAssetId = state.assets[0]?.id ?? null;
        }
      }),

    setActiveAsset: (id) =>
      set((state) => {
        state.activeAssetId = id;
        state.animation = { ...defaultAnimation };
      }),

    setSequenceIndex: (index) =>
      set((state) => {
        state.animation.sequenceIndex = index;
        state.animation.frame = 0;
      }),

    setFrame: (frame) =>
      set((state) => {
        state.animation.frame = frame;
      }),

    setPlaying: (playing) =>
      set((state) => {
        state.animation.playing = playing;
      }),

    setPlaybackRate: (rate) =>
      set((state) => {
        state.animation.playbackRate = rate;
      }),

    setLoopOverride: (value) =>
      set((state) => {
        state.animation.loopOverride = value;
      }),

    setBlender: (index, value) =>
      set((state) => {
        state.animation.blenders[index] = value;
      }),

    setBoneController: (index, value) =>
      set((state) => {
        state.animation.boneControllers[index] = value;
      }),

    setDisplayFlag: (key, value) =>
      set((state) => {
        (state.displayFlags as Record<string, unknown>)[key] = value;
      }),

    setRenderMode: (mode) =>
      set((state) => {
        state.renderMode = mode;
      }),

    setCameraMode: (mode) =>
      set((state) => {
        state.camera.mode = mode;
      }),

    setCameraState: (partial) =>
      set((state) => {
        Object.assign(state.camera, partial);
      }),

    setActivePanel: (panel) =>
      set((state) => {
        state.activePanel = panel;
      }),

    setBodyValue: (value) =>
      set((state) => {
        state.bodyValue = value;
      }),

    setSkinFamily: (family) =>
      set((state) => {
        state.skinFamily = family;
      }),

    toggleMessages: () =>
      set((state) => {
        state.showMessages = !state.showMessages;
      }),

    addMessage: (msg) =>
      set((state) => {
        const timestamp = new Date().toLocaleTimeString();
        state.messageLog.push(`[${timestamp}] ${msg}`);
        // Keep last 200 messages
        if (state.messageLog.length > 200) {
          state.messageLog.splice(0, state.messageLog.length - 200);
        }
      }),

    setColor: (key, value) =>
      set((state) => {
        (state.colors as Record<string, unknown>)[key] = value;
      }),
  }))
);

/** Get the currently active asset (convenience selector) */
export function useActiveAsset(): AssetEntry | undefined {
  return useAppStore((s) => s.assets.find((a) => a.id === s.activeAssetId));
}

/** Get the currently active model (convenience selector) */
export function useActiveModel(): EditableStudioModel | undefined {
  return useAppStore((s) => {
    const asset = s.assets.find((a) => a.id === s.activeAssetId);
    return asset?.model;
  });
}
