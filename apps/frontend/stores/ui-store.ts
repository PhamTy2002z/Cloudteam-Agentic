import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Editor state
  editorDirty: boolean;
  setEditorDirty: (dirty: boolean) => void;

  // Create project dialog
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Editor state
  editorDirty: false,
  setEditorDirty: (dirty) => set({ editorDirty: dirty }),

  // Create project dialog
  createDialogOpen: false,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
}));
