import { create } from 'zustand';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  expanded?: boolean;
}

interface FileState {
  rootPath: string | null;
  fileTree: FileNode[];
  expandedDirs: Set<string>;
  selectedFile: string | null;
  setRootPath: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  toggleDirectory: (path: string) => void;
  expandDirectory: (path: string) => void;
  collapseDirectory: (path: string) => void;
  selectFile: (path: string) => void;
  updateNode: (path: string, updates: Partial<FileNode>) => void;
  addNode: (parentPath: string, node: FileNode) => void;
  removeNode: (path: string) => void;
  isExpanded: (path: string) => boolean;
}

export const useFileStore = create<FileState>((set, get) => ({
  rootPath: null,
  fileTree: [],
  expandedDirs: new Set(),
  selectedFile: null,

  setRootPath: (path: string) => {
    set({ rootPath: path });
  },

  setFileTree: (tree: FileNode[]) => {
    set({ fileTree: tree });
  },

  toggleDirectory: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedDirs);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedDirs: newExpanded };
    });
  },

  expandDirectory: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedDirs);
      newExpanded.add(path);
      return { expandedDirs: newExpanded };
    });
  },

  collapseDirectory: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedDirs);
      newExpanded.delete(path);
      return { expandedDirs: newExpanded };
    });
  },

  selectFile: (path: string) => {
    set({ selectedFile: path });
  },

  updateNode: (path: string, updates: Partial<FileNode>) => {
    set((state) => {
      const updateNodeRecursive = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            return { ...node, ...updates };
          }
          if (node.children) {
            return {
              ...node,
              children: updateNodeRecursive(node.children),
            };
          }
          return node;
        });
      };

      return {
        fileTree: updateNodeRecursive(state.fileTree),
      };
    });
  },

  addNode: (parentPath: string, node: FileNode) => {
    set((state) => {
      const addNodeRecursive = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((n) => {
          if (n.path === parentPath && n.type === 'directory') {
            return {
              ...n,
              children: [...(n.children || []), node],
            };
          }
          if (n.children) {
            return {
              ...n,
              children: addNodeRecursive(n.children),
            };
          }
          return n;
        });
      };

      return {
        fileTree: addNodeRecursive(state.fileTree),
      };
    });
  },

  removeNode: (path: string) => {
    set((state) => {
      const removeNodeRecursive = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter((node) => node.path !== path)
          .map((node) => {
            if (node.children) {
              return {
                ...node,
                children: removeNodeRecursive(node.children),
              };
            }
            return node;
          });
      };

      return {
        fileTree: removeNodeRecursive(state.fileTree),
      };
    });
  },

  isExpanded: (path: string) => {
    return get().expandedDirs.has(path);
  },
}));
