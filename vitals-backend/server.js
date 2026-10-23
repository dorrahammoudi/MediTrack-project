const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const mqtt = require('mqtt');
const { Pool } = require('pg');

// 1. Configuration du serveur WebSocket pour React
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

// 2. Connexion à PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// 3. Connexion au Broker MQTT
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

mqttClient.on('connect', () => {
    console.log('✅ Connecté au Broker MQTT');
    mqttClient.subscribe('patients/+/vitals');
});

// 4. Écouter les actions venant de React (le bouton Acknowledge)
io.on('connection', (socket) => {
    socket.on('acknowledge_alert', (data) => {
        console.log(`🔕 Acquittement reçu du Dashboard pour le patient ${data.patient_id}`);
        
        // On envoie l'ordre d'arrêt à l'ESP32 via MQTT
        const commandTopic = `patients/${data.patient_id}/commands`;
        const commandPayload = JSON.stringify({ action: 'stop_alarm' });
        
        mqttClient.publish(commandTopic, commandPayload);
        console.log(`📤 Ordre envoyé à l'ESP32 sur le topic : ${commandTopic}`);
    });
});

// 5. Traitement des données reçues de l'ESP32 (Velxio)
mqttClient.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        
        // Sauvegarde dans PostgreSQL
        const query = `INSERT INTO readings (patient_id, heart_rate, spo2, temperature) VALUES ($1, $2, $3, $4)`;
        await pool.query(query, [data.patient_id, data.heart_rate, data.spo2, data.temperature]);
        
        console.log(`📥 Reçu : ${data.heart_rate} bpm`);

        // Envoi instantané à React via WebSocket
        io.emit('vitals_update', data);

    } catch (error) {
        console.error('❌ Erreur :', error.message);
    }
});

// Démarrage du serveur sur le port 3001
httpServer.listen(3001, () => {
    console.log('🚀 Serveur WebSocket en écoute sur le port 3001');
});