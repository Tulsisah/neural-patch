import React from 'react';

export default function Alert({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-950 border-blue-900 text-blue-400',
    warning: 'bg-yellow-950 border-yellow-900 text-yellow-400',
    error: 'bg-red-950 border-red-900 text-red-400'
  };

  return (
    <div className={`p-4 border rounded-md text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
