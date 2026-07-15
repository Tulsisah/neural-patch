import React, { createContext, useState } from 'react';

export const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState({ repos: [], scans: [] });

  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  );
}
