import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SandboxApp } from './SandboxApp';
import '../App.css';
import './sandbox.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SandboxApp />
  </StrictMode>,
);
