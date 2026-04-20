const express = require("express");
const cors = require("cors");
const path = require("path");
const { grpc, loadProto } = require("../shared/protoLoader");
const { discoverServices, discoverServiceByName } = require("../shared/registryClient");

const app = express();
const PORT = 3000;

const solarProto = loadProto("solar.proto", "solar");
const batteryProto = loadProto("battery.proto", "battery");
const energyProto = loadProto("energy.proto", "energy");

// This code is used to configure the Express application.
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// This code is used to create a discovered gRPC client dynamically.
async function createDiscoveredClient(serviceName, ServiceConstructor) {
  const serviceInfo = await discoverServiceByName(serviceName);

  if (!serviceInfo) {
    throw new Error(`${serviceName} is not available in registry.`);
  }

  return new ServiceConstructor(
    `${serviceInfo.host}:${serviceInfo.port}`,
    grpc.credentials.createInsecure()
  );
}

// This code is used to return discovered services to the GUI.
app.get("/api/services", async (req, res) => {
  try {
    const services = await discoverServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This code is used to call the solar unary RPC with metadata and deadline.
app.post("/api/solar/output", async (req, res) => {
  try {
    const client = await createDiscoveredClient("SolarService", solarProto.SolarService);

    const metadata = new grpc.Metadata();
    metadata.set("x-auth-token", "NCI2026");
    metadata.set("x-client-name", "Main GUI");

    client.GetSolarOutput(
      req.body,
      metadata,
      { deadline: new Date(Date.now() + 3000) },
      (error, response) => {
        if (error) {
          res.status(400).json({ error: error.details });
          return;
        }

        res.json(response);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This code is used to call the solar server streaming RPC and collect results for the GUI.
app.post("/api/solar/stream", async (req, res) => {
  try {
    const client = await createDiscoveredClient("SolarService", solarProto.SolarService);
    const call = client.StreamSolarReadings(req.body);

    const readings = [];

    call.on("data", (reading) => {
      readings.push(reading);
    });

    call.on("end", () => {
      res.json(readings);
    });

    call.on("error", (error) => {
      res.status(400).json({ error: error.details || error.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This code is used to call the battery unary RPC.
app.post("/api/battery/status", async (req, res) => {
  try {
    const client = await createDiscoveredClient("BatteryService", batteryProto.BatteryService);

    client.GetBatteryStatus(req.body, (error, response) => {
      if (error) {
        res.status(400).json({ error: error.details });
        return;
      }

      res.json(response);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This code is used to call the battery client streaming RPC.
app.post("/api/battery/events", async (req, res) => {
  try {
    const client = await createDiscoveredClient("BatteryService", batteryProto.BatteryService);
    const events = Array.isArray(req.body.events) ? req.body.events : [];

    const call = client.UploadBatteryEvents((error, response) => {
      if (error) {
        res.status(400).json({ error: error.details || error.message });
        return;
      }

      res.json(response);
    });

    events.forEach((event) => {
      call.write(event);
    });

    call.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This code is used to call the energy unary RPC.
app.post("/api/energy/balance", async (req, res) => {
  try {
    const client = await createDiscoveredClient("EnergyService", energyProto.EnergyService);

    client.CalculateEnergyBalance(req.body, (error, response) => {
      if (error) {
        res.status(400).json({ error: error.details });
        return;
      }

      res.json(response);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This code is used to call the energy bidirectional streaming RPC.
app.post("/api/energy/flow", async (req, res) => {
  try {
    const client = await createDiscoveredClient("EnergyService", energyProto.EnergyService);
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];

    const call = client.ManageEnergyFlow();
    const decisions = [];

    call.on("data", (decision) => {
      decisions.push(decision);
    });

    call.on("end", () => {
      res.json(decisions);
    });

    call.on("error", (error) => {
      res.status(400).json({ error: error.details || error.message });
    });

    messages.forEach((message) => {
      call.write(message);
    });

    call.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This code is used to start the GUI controller server.
app.listen(PORT, () => {
  console.log(`GUI controller running on http://localhost:${PORT}`);
});
