const { grpc, loadProto } = require("../shared/protoLoader");

const registryProto = loadProto("registry.proto", "registry");
const registryStore = new Map();

// This code is used to register or update one service in memory.
function registerService(call, callback) {
  const { name, host, port, description, status } = call.request;

  if (!name || !host || !port) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Service name, host and port are required."
    });
    return;
  }

  registryStore.set(name, {
    name,
    host,
    port,
    description,
    status
  });

  callback(null, {
    success: true,
    message: `${name} registered successfully.`
  });
}

// This code is used to stream all registered services back to the client.
function discoverServices(call) {
  for (const service of registryStore.values()) {
    call.write(service);
  }

  call.end();
}

// This code is used to start the registry naming service.
function startServer() {
  const server = new grpc.Server();

  server.addService(registryProto.RegistryService.service, {
    RegisterService: registerService,
    DiscoverServices: discoverServices
  });

  server.bindAsync(
    "0.0.0.0:50050",
    grpc.ServerCredentials.createInsecure(),
    () => {
      console.log("RegistryService running on port 50050");
      server.start();
    }
  );
}

startServer();
