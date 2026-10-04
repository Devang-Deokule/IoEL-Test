import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { seedFirebaseDatabase } from "./services/firebaseSeed.js";
import { seedHistoryToFirebase } from "./services/historyService.js";
import { seedAlertsToFirebase } from "./services/alertService.js";

seedFirebaseDatabase();
seedHistoryToFirebase();
seedAlertsToFirebase();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
