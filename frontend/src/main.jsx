// Ponto de entrada do React
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { EstoqueProvider } from './contexts/EstoqueContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <EstoqueProvider>
        <App />
      </EstoqueProvider>
    </BrowserRouter>
  </React.StrictMode>
);
