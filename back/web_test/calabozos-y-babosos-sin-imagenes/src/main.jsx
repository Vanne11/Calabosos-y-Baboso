import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/terminal.css';

/**
 * Punto de entrada que:
 * - Inicializa la aplicación
 * - Carga datos iniciales
 * - Configura providers (si se usan)
 * - Monta la aplicación en el DOM
 */

// Función para inicializar la aplicación
const initializeApp = () => {
  console.log('Inicializando Calabozos y Babosos...');
  
  // Aquí se podrían realizar configuraciones adicionales antes de montar la aplicación
  
  // Montar la aplicación en el DOM
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Iniciar la aplicación
initializeApp();
