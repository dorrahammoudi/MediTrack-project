import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

// Connexion au serveur Backend (Node.js) sur le port 3001
const socket = io('http://localhost:3001');

function App() {
  const [patient, setPatient] = useState({
    id: 'P001',
    name: 'John Doe',
    heart_rate: 0,
    spo2: 0,
    temperature: 0,
    status: 'NORMAL'
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Écoute des données envoyées par le Backend
    socket.on('vitals_update', (data) => {
      
      let newStatus = 'NORMAL';
      let alertMessage = '';

      // 1. Vérification des seuils critiques
      if (data.heart_rate > 120 || data.heart_rate < 50 || data.spo2 < 90 || data.temperature > 38.0) {
        newStatus = 'CRITICAL';
        alertMessage = `Critical Vitals! HR: ${data.heart_rate}, SpO2: ${data.spo2}%, Temp: ${data.temperature}°C`;
      } 
      // 2. Vérification des seuils d'avertissement
      else if (data.heart_rate > 100 || data.spo2 < 95 || data.temperature > 37.5) {
        newStatus = 'WARNING';
        alertMessage = `Abnormal Vitals. HR: ${data.heart_rate}, SpO2: ${data.spo2}%`;
      }

      // Mise à jour de la carte du patient
      setPatient(prev => ({
        ...prev,
        heart_rate: data.heart_rate,
        spo2: data.spo2,
        temperature: data.temperature,
        status: newStatus
      }));

      // 3. Ajout d'une alerte uniquement si le statut change (évite le spam)
      if (newStatus !== 'NORMAL') {
        setAlerts(prev => {
          if (prev.length > 0 && prev[0].status === newStatus) return prev; // Si on a déjà la même alerte, on ne fait rien
          
          return [{
            id: Date.now(),
            status: newStatus,
            message: alertMessage,
            time: new Date().toLocaleTimeString()
          }, ...prev];
        });
      }
    });

    // Nettoyage de l'écouteur quand le composant se ferme
    return () => socket.off('vitals_update');
  }, []);

  // Fonction quand le médecin clique sur Acknowledge
  const handleAcknowledge = (id) => {
    // 1. Supprime l'alerte de l'écran
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    
    // 2. Envoie l'ordre au Backend pour couper le buzzer de l'ESP32
    socket.emit('acknowledge_alert', { patient_id: patient.id });
  };

  // Détermine la classe CSS de la carte selon le statut
  const getStatusClass = () => {
    if (patient.status === 'CRITICAL') return 'status-critical';
    if (patient.status === 'WARNING') return 'status-warning';
    return 'status-normal';
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Patient Monitoring System</h1>
        <span>Dr. Shepperd </span>
      </header>

      <div className="dashboard-layout">
        
        {/* Carte du Patient */}
        <div className={`patient-card ${getStatusClass()}`}>
          <h2>Patient: {patient.name} ({patient.id})</h2>
          
          <div className="data-row">
            <div className="data-box">
              <p>Heart Rate</p>
              <h3>{patient.heart_rate} bpm</h3>
            </div>
            
            <div className="data-box">
              <p>Blood Oxygen (SpO2)</p>
              <h3>{patient.spo2} %</h3>
            </div>
            
            <div className="data-box">
              <p>Temperature</p>
              <h3>{patient.temperature} °C</h3>
            </div>
          </div>
          
          <p className="status-text">Status: {patient.status}</p>
        </div>

        {/* Panneau d'alertes */}
        <div className="alerts-section">
          <h2>Alert Log</h2>
          
          {alerts.length === 0 ? (
            <p className="no-alerts">No active alerts. Patient is stable.</p>
          ) : (
            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-box ${alert.status.toLowerCase()}`}>
                  <strong>{alert.status} - {alert.time}</strong>
                  <p>{alert.message}</p>
                  <button onClick={() => handleAcknowledge(alert.id)}>
                    Acknowledge Alarm
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;