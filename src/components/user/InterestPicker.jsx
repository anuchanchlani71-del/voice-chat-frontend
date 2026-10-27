import React, { useState } from 'react';
import { MOCK_INTEREST_CATEGORIES } from '../../data/userMockData';
import { IconSearch, IconCheck, IconTag } from '../common/Icons';

export default function InterestPicker({
  selectedTagIds = [],
  onToggleTag,
  minRequired = 3
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = MOCK_INTEREST_CATEGORIES.map(category => {
    if (!searchTerm.trim()) return category;

    const matchedTags = category.tags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    return {
      ...category,
      tags: matchedTags
    };
  }).filter(cat => cat.tags.length > 0);

  const selectedCount = selectedTagIds.length;
  const isSatisfied = selectedCount >= minRequired;

  return (
    <div className="interest-picker-component">
      {/* Search & Selection Summary Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--user-text-muted)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            className="input-control"
            placeholder="Search topics (e.g. Gaming, Lo-Fi, Anime)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: 38,
              fontSize: '0.88rem',
              background: 'var(--user-bg-secondary)',
              borderColor: 'var(--user-border)',
              color: 'var(--user-text)'
            }}
          />
        </div>

        {/* Counter Badge */}
        <div style={{
          padding: '8px 14px',
          borderRadius: 12,
          background: isSatisfied ? 'rgba(74, 222, 128, 0.12)' : 'rgba(255, 107, 107, 0.12)',
          border: `1px solid ${isSatisfied ? 'rgba(74, 222, 128, 0.35)' : 'rgba(255, 107, 107, 0.3)'}`,
          color: isSatisfied ? '#4ADE80' : 'var(--user-primary)',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {isSatisfied ? <IconCheck size={14} /> : <IconTag size={14} />}
          <span>
            {selectedCount} Selected {minRequired > 0 && `(Min ${minRequired})`}
          </span>
        </div>
      </div>

      {/* Category List */}
      <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
        {filteredCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--user-text-muted)',
            fontSize: '0.9rem'
          }}>
            No matching interest topics found for &ldquo;{searchTerm}&rdquo;
          </div>
        ) : (
          filteredCategories.map(category => (
            <div key={category.id} className="interest-category-section">
              <div className="interest-category-header">
                <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
                <span>{category.name}</span>
                <span style={{
                  fontSize: '0.74rem',
                  color: 'var(--user-text-muted)',
                  fontWeight: 500,
                  marginLeft: 'auto'
                }}>
                  {category.tags.length} topics
                </span>
              </div>

              <div className="interest-chips-cloud">
                {category.tags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggleTag(tag.id)}
                      className={`interest-chip-btn ${isSelected ? 'selected' : ''}`}
                    >
                      {isSelected && <IconCheck size={14} />}
                      <span>{tag.name}</span>
                      <span className="interest-chip-count">{tag.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
