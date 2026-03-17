import React from 'react';

interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface StatusTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
  tabs: TabItem[];
}

const StatusTabs: React.FC<StatusTabsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {tabs.map(tab => (
        <div
          key={tab.key}
          style={{
            padding: '4px 8px',
            cursor: 'pointer',
            border: activeTab === tab.key ? '1px solid #1677ff' : '1px solid transparent',
            borderRadius: 4,
            background: activeTab === tab.key ? '#e6f7ff' : 'transparent',
            color: activeTab === tab.key ? '#1677ff' : '#666',
            fontWeight: activeTab === tab.key ? 500 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span>({tab.count})</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatusTabs;
