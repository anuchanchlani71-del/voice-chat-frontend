import React from 'react';

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs-container">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tab-counter">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
