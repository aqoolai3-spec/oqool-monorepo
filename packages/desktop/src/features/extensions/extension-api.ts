export interface ExtensionManifest {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  author?: string;
  main: string;
  activationEvents?: string[];
  contributes?: {
    commands?: CommandContribution[];
    languages?: LanguageContribution[];
    themes?: ThemeContribution[];
    keybindings?: KeybindingContribution[];
  };
  dependencies?: Record<string, string>;
}

export interface CommandContribution {
  command: string;
  title: string;
  category?: string;
  icon?: string;
}

export interface LanguageContribution {
  id: string;
  extensions: string[];
  aliases?: string[];
  configuration?: string;
}

export interface ThemeContribution {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark';
  path: string;
}

export interface KeybindingContribution {
  command: string;
  key: string;
  when?: string;
}

export interface ExtensionContext {
  extensionPath: string;
  storagePath: string;
  globalState: Map<string, any>;
  workspaceState: Map<string, any>;
}

export interface ExtensionAPI {
  commands: CommandsAPI;
  languages: LanguagesAPI;
  panels: PanelsAPI;
  themes: ThemesAPI;
  workspace: WorkspaceAPI;
}

export interface CommandsAPI {
  registerCommand(command: string, callback: (...args: any[]) => any): void;
  executeCommand(command: string, ...args: any[]): Promise<any>;
  getCommands(): string[];
  clear(): void;
}

export interface LanguagesAPI {
  registerLanguage(language: LanguageContribution): void;
  getLanguages(): LanguageContribution[];
}

export interface PanelsAPI {
  createPanel(id: string, title: string, content: string): void;
  showPanel(id: string): void;
  hidePanel(id: string): void;
  clear(): void;
}

export interface ThemesAPI {
  registerTheme(theme: ThemeContribution): void;
  getThemes(): ThemeContribution[];
}

export interface WorkspaceAPI {
  getWorkspacePath(): string | undefined;
  openFile(path: string): Promise<void>;
  saveFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
}
