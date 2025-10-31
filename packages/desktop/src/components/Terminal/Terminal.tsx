import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ptyManager } from '../../features/terminal/pty-manager';
import 'xterm/css/xterm.css';
import './Terminal.css';

interface TerminalProps {
  terminalId: string;
  name: string;
  cwd?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ terminalId, name, cwd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create xterm instance
    const xterm = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#aeafad',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Create PTY terminal
    let ptyTerminal: any = null;

    ptyManager.createTerminal(name, cwd).then((terminal) => {
      ptyTerminal = terminal;

      // Handle data from PTY
      terminal.onData((data: string) => {
        xterm.write(data);
      });

      // Handle data from xterm
      xterm.onData((data: string) => {
        terminal.write(data);
      });
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (ptyTerminal) {
        ptyTerminal.resize(xterm.cols, xterm.rows);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      xterm.dispose();
      if (ptyTerminal) {
        ptyTerminal.dispose();
      }
    };
  }, [terminalId, name, cwd]);

  return <div ref={containerRef} className="terminal-container" />;
};
