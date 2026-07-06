// =====================================================================
// main.jsx — Point d'entrée de l'application React
// =====================================================================
// Vite charge ce fichier depuis index.html (<script src="/src/main.jsx">).
// On monte React dans le <div id="root"> et on emballe l'App de 3 providers :
//   • StrictMode    : aide React à détecter les bugs en dev
//   • BrowserRouter : active la navigation par URL (react-router)
//   • AuthProvider  : rend useAuth() disponible partout
// =====================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (10 secondes) :
// ---------------------------------------------------------------------
// L'ordre des providers est important : BrowserRouter doit envelopper
// AuthProvider (qui utilise des hooks de routing), qui doit envelopper
// App (qui utilise useAuth). StrictMode n'est actif qu'en dev — il
// double les renders pour détecter les effets de bord, sans impact en
// production.
// =====================================================================
