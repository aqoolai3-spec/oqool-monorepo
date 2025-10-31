import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../../stores/editor-store';
import { configureMonaco, defaultEditorOptions } from '../../../config/monaco.config';
import { registerInlineSuggestionsProvider } from '../../features/ai/inline-suggestions';
import './Editor.css';

let monacoConfigured = false;
let inlineSuggestionsRegistered = false;

export const Editor: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { files, activeFile, updateFile, markDirty } = useEditorStore();

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Configure Monaco once
    if (!monacoConfigured) {
      configureMonaco();
      monacoConfigured = true;
    }

    // Register inline suggestions once
    if (!inlineSuggestionsRegistered) {
      registerInlineSuggestionsProvider();
      inlineSuggestionsRegistered = true;
    }

    // Create editor instance
    const editor = monaco.editor.create(containerRef.current, defaultEditorOptions);
    editorRef.current = editor;

    // Listen to content changes
    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      const model = editor.getModel();
      if (model) {
        const uri = model.uri.toString();
        updateFile(uri, content);
        markDirty(uri, true);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      editor.layout();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      editor.dispose();
    };
  }, [updateFile, markDirty]);

  // Update editor content when active file changes
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;

    const file = files.get(activeFile);
    if (!file) return;

    // Get or create model
    const uri = monaco.Uri.parse(file.path);
    let model = monaco.editor.getModel(uri);

    if (!model) {
      model = monaco.editor.createModel(file.content, file.language, uri);
    }

    editorRef.current.setModel(model);
  }, [activeFile, files]);

  return (
    <div className="editor-container">
      {activeFile ? (
        <div ref={containerRef} className="monaco-editor" />
      ) : (
        <div className="editor-empty">
          <div className="welcome-message">
            <h1>🎨 Oqool Desktop IDE</h1>
            <p>افتح ملفاً للبدء في التعديل</p>
            <div className="shortcuts">
              <div className="shortcut">
                <kbd>Ctrl+O</kbd>
                <span>فتح مجلد</span>
              </div>
              <div className="shortcut">
                <kbd>Ctrl+N</kbd>
                <span>ملف جديد</span>
              </div>
              <div className="shortcut">
                <kbd>Ctrl+P</kbd>
                <span>بحث سريع</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
