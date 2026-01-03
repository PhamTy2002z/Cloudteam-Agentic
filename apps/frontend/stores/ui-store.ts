import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modals
  activeModal: string | null;
  openModal: (modal: string) => void;
  closeModal: () => void;

  // Editor
  editorDirty: boolean;
  setEditorDirty: (dirty: boolean) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Modals
  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  // Editor
  editorDirty: false,
  setEditorDirty: (dirty) => set({ editorDirty: dirty }),

  // Theme
  theme: 'dark',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}));
