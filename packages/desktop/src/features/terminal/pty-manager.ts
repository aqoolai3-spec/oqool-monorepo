const { ipcRenderer } = window.electron;

export interface Terminal {
  id: string;
  name: string;
  onData: (callback: (data: string) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  dispose: () => void;
}

class PTYManager {
  private terminals: Map<string, Terminal> = new Map();

  async createTerminal(name: string, cwd?: string): Promise<Terminal> {
    const result = await ipcRenderer.invoke('terminal:create', { cwd });

    if (!result.success) {
      throw new Error(result.error);
    }

    const terminalId = result.terminalId;

    const terminal: Terminal = {
      id: terminalId,
      name,

      onData(callback: (data: string) => void) {
        ipcRenderer.on(`terminal:data:${terminalId}`, (_event, data) => {
          callback(data);
        });
      },

      write(data: string) {
        ipcRenderer.invoke('terminal:write', { terminalId, data });
      },

      resize(cols: number, rows: number) {
        ipcRenderer.invoke('terminal:resize', { terminalId, cols, rows });
      },

      dispose() {
        ipcRenderer.invoke('terminal:destroy', { terminalId });
        ipcRenderer.removeAllListeners(`terminal:data:${terminalId}`);
      },
    };

    this.terminals.set(terminalId, terminal);

    // Listen for terminal exit
    ipcRenderer.on(`terminal:exit:${terminalId}`, () => {
      this.terminals.delete(terminalId);
    });

    return terminal;
  }

  getTerminal(id: string): Terminal | undefined {
    return this.terminals.get(id);
  }

  getAllTerminals(): Terminal[] {
    return Array.from(this.terminals.values());
  }

  disposeTerminal(id: string): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(id);
    }
  }

  disposeAll(): void {
    this.terminals.forEach((terminal) => {
      terminal.dispose();
    });
    this.terminals.clear();
  }
}

export const ptyManager = new PTYManager();
