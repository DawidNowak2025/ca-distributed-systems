const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// This code is used to load proto files for gRPC services.
function loadProto(protoFileName, packageName) {
  const protoPath = path.join(__dirname, "..", "protos", protoFileName);

  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  return grpc.loadPackageDefinition(packageDefinition)[packageName];
}

module.exports = {
  grpc,
  loadProto
};