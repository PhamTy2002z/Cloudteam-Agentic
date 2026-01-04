import { create } from 'zustand';

interface UIState {
  // Editor state
  editorDirty: boolean;
  setEditorDirty: (dirty: boolean) => void;

  // Create project dialog
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Editor state
  editorDirty: false,
  setEditorDirty: (dirty) => set({ editorDirty: dirty }),

  // Create project dialog
  createDialogOpen: false,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
}));
