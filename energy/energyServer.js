const { grpc, loadProto } = require("../shared/protoLoader");
const { registerServiceWithRetry } = require("../shared/registryClient");

const energyProto = loadProto("energy.proto", "energy");

// This code is used to create one recommendation based on energy values.
function buildRecommendation(production, consumption, batteryLevel) {
  const balance = production - consumption;

  if (balance > 0) {
    if (batteryLevel < 80) {
      return {
        balance,
        recommendation: "Store extra energy in battery"
      };
    }

    return {
      balance,
      recommendation: "Export extra energy to grid"
    };
  }

  if (balance < 0) {
    if (batteryLevel > 20) {
      return {
        balance,
        recommendation: "Use battery to cover deficit"
      };
    }

    return {
      balance,
      recommendation: "Import energy from grid"
    };
  }

  return {
    balance,
    recommendation: "Energy is balanced"
  };
}

// This code is used to validate energy request values.
function validateEnergyRequest(production, consumption, batteryLevel) {
  return production >= 0 && consumption >= 0 && batteryLevel >= 0 && batteryLevel <= 100;
}

// This code is used to implement the unary energy balance RPC method.
function calculateEnergyBalance(call, callback) {
  const { production, consumption, batteryLevel } = call.request;

  if (!validateEnergyRequest(production, consumption, batteryLevel)) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Energy values are invalid."
    });
    return;
  }

  const result = buildRecommendation(production, consumption, batteryLevel);

  callback(null, {
    balance: result.balance,
    recommendation: result.recommendation,
    status: "Energy balance calculated successfully."
  });
}

// This code is used to implement the bidirectional streaming RPC method.
function manageEnergyFlow(call) {
  call.on("data", (message) => {
    const { production, consumption, batteryLevel } = message;

    if (!validateEnergyRequest(production, consumption, batteryLevel)) {
      call.write({
        action: "REJECT",
        reason: "One or more values are invalid."
      });
      return;
    }

    const result = buildRecommendation(production, consumption, batteryLevel);

    call.write({
      action: result.recommendation,
      reason: `Balance value is ${result.balance.toFixed(2)}`
    });
  });

  call.on("end", () => {
    call.end();
  });

  call.on("error", (error) => {
    console.log("Energy bidirectional streaming error:", error.message);
  });
}

// This code is used to start the energy service and register it in the naming service.
function startServer() {
  const server = new grpc.Server();

  server.addService(energyProto.EnergyService.service, {
    CalculateEnergyBalance: calculateEnergyBalance,
    ManageEnergyFlow: manageEnergyFlow
  });

  server.bindAsync(
    "0.0.0.0:50053",
    grpc.ServerCredentials.createInsecure(),
    async () => {
      console.log("EnergyService running on port 50053");
      server.start();

      await registerServiceWithRetry({
        name: "EnergyService",
        host: "127.0.0.1",
        port: 50053,
        description: "Provides energy balance and live flow decisions.",
        status: "ONLINE"
      });
    }
  );
}

startServer();
