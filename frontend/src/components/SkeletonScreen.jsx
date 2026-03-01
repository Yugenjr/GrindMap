import React from 'react';
import './SkeletonScreen.css';

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton skeleton-circle"></div>
      <div className="skeleton skeleton-text skeleton-title"></div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text skeleton-text-short"></div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-list-item">
        <div className="skeleton skeleton-avatar"></div>
        <div className="skeleton-list-content">
          <div className="skeleton skeleton-text skeleton-text-medium"></div>
          <div className="skeleton skeleton-text skeleton-text-short"></div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }).map((_, index) => (
        <div key={index} className="skeleton skeleton-text skeleton-header-cell"></div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="skeleton skeleton-text"></div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

const SkeletonScreen = ({ type = 'card', count = 1, rows, columns }) => {
  switch (type) {
    case 'list':
      return <SkeletonList count={count} />;
    case 'table':
      return <SkeletonTable rows={rows} columns={columns} />;
    case 'grid':
      return <SkeletonGrid count={count} />;
    default:
      return <SkeletonCard />;
  }
};

export default SkeletonScreen;
