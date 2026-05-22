import React from 'react';

export const RouteLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontSize: '14px',
    color: '#6b7280',
  }}>
    <div>Loading...</div>
  </div>
);
