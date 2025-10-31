import {
  ExtensionAPI,
  CommandsAPI,
  LanguagesAPI,
  PanelsAPI,
  ThemesAPI,
  WorkspaceAPI,
  LanguageContribution,
  ThemeContribution,
} from './extension-api';

export function createExtensionHost(): ExtensionAPI {
  const commands = new Map<string, (...args: any[]) => any>();
  const languages: LanguageContribution[] = [];
  const panels = new Map<string, { title: string; content: string }>();
  const themes: ThemeContribution[] = [];

  const commandsAPI: CommandsAPI = {
    registerCommand(command: string, callback: (...args: any[]) => any): void {
      if (commands.has(command)) {
        console.warn(`Command ${command} is already registered`);
        return;
      }
      commands.set(command, callback);
      console.log(`Command registered: ${command}`);
    },

    async executeCommand(command: string, ...args: any[]): Promise<any> {
      const callback = commands.get(command);
      if (!callback) {
        throw new Error(`Command ${command} not found`);
      }
      return await callback(...args);
    },

    getCommands(): string[] {
      return Array.from(commands.keys());
    },

    clear(): void {
      commands.clear();
    },
  };

  const languagesAPI: LanguagesAPI = {
    registerLanguage(language: LanguageContribution): void {
      const existing = languages.find((l) => l.id === language.id);
      if (existing) {
        console.warn(`Language ${language.id} is already registered`);
        return;
      }
      languages.push(language);
      console.log(`Language registered: ${language.id}`);
    },

    getLanguages(): LanguageContribution[] {
      return [...languages];
    },
  };

  const panelsAPI: PanelsAPI = {
    createPanel(id: string, title: string, content: string): void {
      if (panels.has(id)) {
        console.warn(`Panel ${id} already exists`);
        return;
      }
      panels.set(id, { title, content });
      console.log(`Panel created: ${id}`);
    },

    showPanel(id: string): void {
      if (!panels.has(id)) {
        throw new Error(`Panel ${id} not found`);
      }
      // Emit event to show panel in UI
      console.log(`Showing panel: ${id}`);
    },

    hidePanel(id: string): void {
      if (!panels.has(id)) {
        throw new Error(`Panel ${id} not found`);
      }
      console.log(`Hiding panel: ${id}`);
    },

    clear(): void {
      panels.clear();
    },
  };

  const themesAPI: ThemesAPI = {
    registerTheme(theme: ThemeContribution): void {
      const existing = themes.find((t) => t.id === theme.id);
      if (existing) {
        console.warn(`Theme ${theme.id} is already registered`);
        return;
      }
      themes.push(theme);
      console.log(`Theme registered: ${theme.id}`);
    },

    getThemes(): ThemeContribution[] {
      return [...themes];
    },
  };

  const workspaceAPI: WorkspaceAPI = {
    getWorkspacePath(): string | undefined {
      // This should be implemented with actual workspace path
      return undefined;
    },

    async openFile(path: string): Promise<void> {
      console.log(`Opening file: ${path}`);
      // Emit event to open file in editor
    },

    async saveFile(path: string, content: string): Promise<void> {
      console.log(`Saving file: ${path}, content length: ${content.length}`);
      // Use IPC to save file
    },

    async readFile(path: string): Promise<string> {
      console.log(`Reading file: ${path}`);
      // Use IPC to read file
      return '';
    },
  };

  return {
    commands: commandsAPI,
    languages: languagesAPI,
    panels: panelsAPI,
    themes: themesAPI,
    workspace: workspaceAPI,
  };
}
