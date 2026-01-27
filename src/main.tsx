import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// Инициализация миграции (доступна через консоль)
import "./services/MigrationService";

// Hide loading screen when app is ready
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Add small delay for smoother transition
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      // Remove from DOM after animation
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }, 800);
  }
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App onReady={hideLoadingScreen} />
  </React.StrictMode>
);
