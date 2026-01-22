
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error crítico al renderizar la aplicación:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error al cargar la aplicación. Revisa la consola.</div>`;
  }
} else {
  console.error("No se encontró el elemento raíz 'root'.");
}
