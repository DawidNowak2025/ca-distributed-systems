const { grpc, loadProto } = require("../shared/protoLoader");
const { registerServiceWithRetry } = require("../shared/registryClient");

const solarProto = loadProto("solar.proto", "solar");

// This code is used to calculate one solar output value.
function calculateSolarOutput(sunlightLevel, panelArea, efficiency) {
  return sunlightLevel * panelArea * efficiency;
}

// This code is used to validate solar values before processing.
function validateSolarInput(sunlightLevel, panelArea, efficiency) {
  return (
    sunlightLevel > 0 &&
    panelArea > 0 &&
    efficiency > 0 &&
    efficiency <= 1
  );
}

// This code is used to implement the unary RPC method.
function getSolarOutput(call, callback) {
  const token = call.metadata.get("x-auth-token")[0];
  const clientName = call.metadata.get("x-client-name")[0] || "Unknown Client";

  if (token !== "NCI2026") {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      details: "Invalid authentication token."
    });
    return;
  }

  const { sunlightLevel, panelArea, efficiency } = call.request;

  if (!validateSolarInput(sunlightLevel, panelArea, efficiency)) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Solar input values are invalid."
    });
    return;
  }

  const currentOutput = calculateSolarOutput(sunlightLevel, panelArea, efficiency);

  callback(null, {
    currentOutput,
    status: `Solar output calculated successfully for ${clientName}.`
  });
}

// This code is used to implement the server streaming RPC method.
function streamSolarReadings(call) {
  const { numberOfReadings, baseSunlight, panelArea, efficiency } = call.request;

  if (!validateSolarInput(baseSunlight, panelArea, efficiency) || numberOfReadings <= 0) {
    call.destroy({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Solar stream request values are invalid."
    });
    return;
  }

  let readingIndex = 0;

  const interval = setInterval(() => {
    if (readingIndex >= numberOfReadings) {
      clearInterval(interval);
      call.end();
      return;
    }

    const dynamicSunlight = baseSunlight + (readingIndex * 0.2);
    const output = calculateSolarOutput(dynamicSunlight, panelArea, efficiency);

    call.write({
      timestamp: new Date().toLocaleTimeString(),
      output,
      status: "Reading streamed successfully"
    });

    readingIndex += 1;
  }, 1000);

  call.on("cancelled", () => {
    clearInterval(interval);
    console.log("Solar stream was cancelled by the client.");
  });
}

// This code is used to start the solar service and register it in the naming service.
function startServer() {
  const server = new grpc.Server();

  server.addService(solarProto.SolarService.service, {
    GetSolarOutput: getSolarOutput,
    StreamSolarReadings: streamSolarReadings
  });

  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    async () => {
      console.log("SolarService running on port 50051");
      server.start();

      await registerServiceWithRetry({
        name: "SolarService",
        host: "127.0.0.1",
        port: 50051,
        description: "Provides solar output and solar reading stream.",
        status: "ONLINE"
      });
    }
  );
}

startServer();
