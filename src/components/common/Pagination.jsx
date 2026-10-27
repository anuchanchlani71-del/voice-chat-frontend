import React from 'react';
import { IconChevronLeft, IconChevronRight } from './Icons';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {}
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination-bar">
      <div>
        Showing <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>{startItem}</span> to{' '}
        <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>{endItem}</span> of{' '}
        <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>{totalItems}</span> entries
      </div>
      <div className="page-numbers">
        <button
          className="page-num-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
          title="Previous Page"
        >
          <IconChevronLeft size={16} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            className={`page-num-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          className="page-num-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
          title="Next Page"
        >
          <IconChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
