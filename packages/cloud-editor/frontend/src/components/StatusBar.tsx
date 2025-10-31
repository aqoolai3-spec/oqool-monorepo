import React from 'react';

interface StatusItem {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
}

interface StatusBarProps {
  branch?: string;
  errors?: number;
  warnings?: number;
  encoding?: string;
  lineEnding?: string;
  language?: string;
  position?: { line: number; column: number };
  onStatusClick?: (statusId: string) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  branch = 'main',
  errors = 0,
  warnings = 0,
  encoding = 'UTF-8',
  lineEnding = 'LF',
  language = 'TypeScript',
  position,
  onStatusClick
}) => {
  const leftItems: StatusItem[] = [
    {
      id: 'branch',
      icon: '⚡',
      label: branch,
      onClick: () => onStatusClick?.('branch')
    },
    {
      id: 'errors-warnings',
      icon: errors > 0 ? '❌' : warnings > 0 ? '⚠️' : '✓',
      label: `${errors} ⚠ ${warnings}`,
      onClick: () => onStatusClick?.('problems')
    }
  ];

  const rightItems: StatusItem[] = [
    {
      id: 'position',
      label: position ? `Ln ${position.line}, Col ${position.column}` : '',
      onClick: () => onStatusClick?.('position')
    },
    {
      id: 'encoding',
      label: encoding,
      onClick: () => onStatusClick?.('encoding')
    },
    {
      id: 'line-ending',
      label: lineEnding,
      onClick: () => onStatusClick?.('lineEnding')
    },
    {
      id: 'language',
      label: language,
      onClick: () => onStatusClick?.('language')
    }
  ];

  const getStatusColor = () => {
    if (errors > 0) return '#f14c4c';
    if (warnings > 0) return '#ff9800';
    return '#007acc';
  };

  return (
    <div className="status-bar" style={{ backgroundColor: getStatusColor() }}>
      <div className="status-left">
        {leftItems.map(item => (
          <div 
            key={item.id}
            className="status-item"
            onClick={item.onClick}
            title={item.label}
          >
            {item.icon && <span className="status-icon">{item.icon}</span>}
            <span className="status-label">{item.label}</span>
          </div>
        ))}
      </div>
      
      <div className="status-center">
        {/* يمكن إضافة عناصر في الوسط هنا */}
      </div>
      
      <div className="status-right">
        {rightItems.map(item => (
          item.label && (
            <div 
              key={item.id}
              className="status-item"
              onClick={item.onClick}
              title={`Click to change ${item.id}`}
            >
              {item.icon && <span className="status-icon">{item.icon}</span>}
              <span className="status-label">{item.label}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default StatusBar;