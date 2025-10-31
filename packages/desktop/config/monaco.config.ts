import * as monaco from 'monaco-editor';

export function configureMonaco(): void {
  // Define custom theme
  monaco.editor.defineTheme('oqool-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'operator', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2A2A2A',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorCursor.foreground': '#AEAFAD',
      'editorWhitespace.foreground': '#404040',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
    },
  });

  // Default editor options
  monaco.editor.setTheme('oqool-dark');
}

export const defaultEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'oqool-dark',
  fontSize: 14,
  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', monospace",
  fontLigatures: true,
  lineNumbers: 'on',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  cursorStyle: 'line',
  automaticLayout: true,
  minimap: {
    enabled: true,
    scale: 1,
    showSlider: 'mouseover',
  },
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    useShadows: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  snippetSuggestions: 'top',
  bracketPairColorization: {
    enabled: true,
  },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
  formatOnPaste: true,
  formatOnType: true,
  autoIndent: 'full',
  padding: {
    top: 10,
    bottom: 10,
  },
};
