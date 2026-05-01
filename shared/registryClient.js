const { grpc, loadProto } = require("./protoLoader");

const registryProto = loadProto("registry.proto", "registry");

// This code is used to create a client for RegistryService.
function createRegistryClient() {
  return new registryProto.RegistryService(
    "127.0.0.1:50050",
    grpc.credentials.createInsecure()
  );
}

// This code is used to register a service in the registry.
function registerService(serviceInfo) {
  return new Promise((resolve, reject) => {
    const client = createRegistryClient();

    client.RegisterService(serviceInfo, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

// This code is used to retry registration if registry is not ready yet.
async function registerServiceWithRetry(serviceInfo, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await registerService(serviceInfo);
      console.log(`[Registry] ${serviceInfo.name} registered: ${response.message}`);
      return response;
    } catch (error) {
      console.log(`[Registry] Register attempt ${attempt} failed for ${serviceInfo.name}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`[Registry] Could not register ${serviceInfo.name}.`);
  return null;
}

// This code is used to discover all registered services.
function discoverServices() {
  return new Promise((resolve, reject) => {
    const client = createRegistryClient();
    const call = client.DiscoverServices({});

    const services = [];

    call.on("data", (service) => {
      services.push(service);
    });

    call.on("end", () => {
      resolve(services);
    });

    call.on("error", (error) => {
      reject(error);
    });
  });
}

// This code is used to find one service by name.
async function discoverServiceByName(serviceName) {
  const services = await discoverServices();
  return services.find((service) => service.name === serviceName);
}

module.exports = {
  createRegistryClient,
  registerService,
  registerServiceWithRetry,
  discoverServices,
  discoverServiceByName
};