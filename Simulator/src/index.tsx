import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import the Tailwind CSS
import RCCircuitAnalysis from './RCCircuitAnalysis'; // No need for .tsx extension with tsconfig

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <RCCircuitAnalysis />
  </React.StrictMode>
);