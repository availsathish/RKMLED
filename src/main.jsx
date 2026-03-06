import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("React is starting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("FATAL: Root element not found");
} else {
  console.log("Root element found. Mounting React...");
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("React mount requested.");
  } catch (e) {
    console.error("React mount FAILED:", e);
  }
}
