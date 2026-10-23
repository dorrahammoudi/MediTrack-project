# MediTrack

IoT vital signs monitor with local alerts (Edge Computing).

An ESP32 measures heart rate, SpO2 and temperature and sounds a buzzer and LED
locally when a value is abnormal. Data is sent over MQTT to a Node.js backend
(PostgreSQL storage) and shown live on a React dashboard. The doctor can
acknowledge an alarm from the dashboard, which switches the buzzer off remotely.

## Architecture

1. Perception: ESP32, MAX30102 (heart rate, SpO2), DS18B20 (temperature), buzzer, LED (simulated on Velxio)
2. Network: MQTT (HiveMQ), JSON messages
3. Processing: Node.js backend, PostgreSQL
4. Application: React dashboard, Socket.io for real time

## Project structure

- `model/` : Velxio simulation (`projet-iot.vlx`)
- `vitals-backend/` : Node.js server
- `vitals-frontend/` : React dashboard (Vite)

## How to run

1. Backend: `cd vitals-backend`, copy `.env.example` to `.env` and fill it in, then `npm install` and `node server.js`
2. Frontend: `cd vitals-frontend`, then `npm install` and `npm run dev`
3. Simulation: open `model/projet-iot.vlx` in Velxio and start it

## Author

Hammoudi Dorra
