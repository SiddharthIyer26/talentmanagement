import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Polyfill / Safety guard for Node.prototype.contains to prevent "r.contains is not a function" errors
if (typeof window !== 'undefined') {
  if (typeof Node !== 'undefined' && !Node.prototype.contains) {
    Node.prototype.contains = function (node: any) {
      if (!node) return false;
      let ancestor: any = node;
      while (ancestor) {
        if (ancestor === this) return true;
        ancestor = ancestor.parentNode;
      }
      return false;
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
