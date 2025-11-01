import React from 'react';
import { FileNode } from '../../../types';
import { FileItem } from './FileItem';
import './FileTree.css';

interface FileTreeProps {
  nodes: FileNode[];
  onFileClick: (node: FileNode) => void;
  onContextMenu?: (node: FileNode, e: React.MouseEvent) => void;
  level?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  onFileClick,
  onContextMenu,
  level = 0,
}) => {
  return (
    <div className="file-tree">
      {nodes.map((node) => (
        <FileItem
          key={node.path}
          node={node}
          level={level}
          onClick={onFileClick}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
};
