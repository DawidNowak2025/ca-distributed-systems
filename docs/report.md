# Smart Clean Energy Management System

This project is part of the Distributed Systems module.

It simulates a smart environment where energy is produced, stored and managed using multiple services.

## Technologies used

* Node.js
* gRPC
* Protocol Buffers
* Express
* HTML, CSS and JavaScript

## Services

The system contains four main services:

* SolarService – calculates solar energy and provides streaming data
* BatteryService – handles energy storage and battery status
* EnergyService – makes decisions based on energy production and consumption
* RegistryService – works as a naming service for service discovery

## How the system works

The GUI acts as the main controller.

The flow is:

1. User enters values in the GUI
2. GUI sends HTTP request to Express backend
3. Express backend asks RegistryService where the needed service is
4. Express backend sends gRPC request to the correct service
5. Service returns response
6. Result is displayed back in the GUI

## gRPC communication used

This project demonstrates different gRPC communication types:

* Unary RPC
* Server Streaming RPC
* Client Streaming RPC
* Bidirectional Streaming RPC

## Ports

* RegistryService: 50050
* SolarService: 50051
* BatteryService: 50052
* EnergyService: 50053
* GUI / Express client: 3000

## Install dependencies

Run this command in the project folder:

npm install
Run:
npm run start:all

This starts:
RegistryService
SolarService
BatteryService
EnergyService
GUI client
Open GUI
After starting the system, open:
http://localhost:3000

Project structure
ca-distributed-systems/
├── battery/
├── client/
│   └── public/
├── docs/
│   └── screenshots/
├── energy/
├── protos/
├── registry/
├── solar/
├── package.json
└── README.md
Notes
This is a student project and simulation only. It is not connected to real solar panels or real battery hardware. its doc to be updated when project progressing 

