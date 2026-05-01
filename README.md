This project is part of the Distributed Systems module.

It simulates a smart environment where energy is produced, stored and managed using multiple services.

## Technologies

- Node.js
- gRPC
- Protocol Buffers
- Express
- HTML, CSS, JavaScript

## Services

The system contains four services:

- SolarService – calculates solar energy and supports streaming
- BatteryService – handles battery storage and events
- EnergyService – makes decisions based on energy usage
- RegistryService – used for service discovery

## How the system works

1. User enters values in the GUI
2. GUI sends request to Express backend
3. Backend asks RegistryService for service location
4. Backend sends gRPC request to service
5. Response is returned to GUI

## Ports

- RegistryService: 50050
- SolarService: 50051
- BatteryService: 50052
- EnergyService: 50053
- Client (GUI): 3000

## Install dependencies

Run:

```bash
npm install

