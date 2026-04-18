const { grpc, loadProto } = require("../shared/protoLoader");
const { registerServiceWithRetry } = require("../shared/registryClient");

const batteryProto = loadProto("battery.proto", "battery");

// This code is used to calculate battery percentage and state.
function getBatteryStatus(call, callback) {
  const { capacity, currentCharge } = call.request;

  if (capacity <= 0 || currentCharge < 0 || currentCharge > capacity) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Battery values are invalid."
    });
    return;
  }

  const batteryPercentage = (currentCharge / capacity) * 100;

  let batteryState = "Normal";
  if (batteryPercentage >= 80) {
    batteryState = "High";
  } else if (batteryPercentage <= 20) {
    batteryState = "Low";
  }

  callback(null, {
    batteryPercentage,
    batteryState,
    status: "Battery status calculated successfully."
  });
}

// This code is used to process client streamed battery events.
function uploadBatteryEvents(call, callback) {
  let chargeEvents = 0;
  let dischargeEvents = 0;
  let finalLevel = 50;

  call.on("data", (event) => {
    const type = String(event.eventType || "").toUpperCase();
    const amount = Number(event.amount);

    if (amount <= 0) {
      return;
    }

    if (type === "CHARGE") {
      chargeEvents += 1;
      finalLevel += amount;
    } else if (type === "DISCHARGE") {
      dischargeEvents += 1;
      finalLevel -= amount;
    }
  });

  call.on("end", () => {
    if (finalLevel < 0) {
      finalLevel = 0;
    }
    if (finalLevel > 100) {
      finalLevel = 100;
    }

    callback(null, {
      chargeEvents,
      dischargeEvents,
      finalLevel,
      status: "Battery events processed successfully."
    });
  });

  call.on("error", (error) => {
    console.log("Battery streaming error:", error.message);
  });
}

// This code is used to start the battery service and register it in the naming service.
function startServer() {
  const server = new grpc.Server();

  server.addService(batteryProto.BatteryService.service, {
    GetBatteryStatus: getBatteryStatus,
    UploadBatteryEvents: uploadBatteryEvents
  });

  server.bindAsync(
    "0.0.0.0:50052",
    grpc.ServerCredentials.createInsecure(),
    async () => {
      console.log("BatteryService running on port 50052");
      server.start();

      await registerServiceWithRetry({
        name: "BatteryService",
        host: "127.0.0.1",
        port: 50052,
        description: "Provides battery status and event summary.",
        status: "ONLINE"
      });
    }
  );
}

startServer();
