// src/index.tsx (corrected import)
import React from 'react';
import ReactDOM from 'react-dom/client';
import RCCircuitAnalysis from './modular.tsx'; // Use the correct filename and extension

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <RCCircuitAnalysis />
  </React.StrictMode>
);