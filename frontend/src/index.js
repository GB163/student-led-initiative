import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';

// ------------------------------
// Suppress React Router future flag warnings in development
// ------------------------------
if (process.env.NODE_ENV === "development") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("React Router Future Flag Warning")
    ) {
      return; // ignore this warning
    }
    originalWarn(...args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: performance logging
// import reportWebVitals from './reportWebVitals';
// reportWebVitals(console.log);
