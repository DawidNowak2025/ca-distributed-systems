// This code is used to send one HTTP request and return JSON.
async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return response.json();
}

// This code is used to discover services from the naming service.
document.getElementById("discoverBtn").addEventListener("click", async () => {
  const output = document.getElementById("servicesOutput");

  try {
    const response = await fetch("/api/services");
    const data = await response.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = error.message;
  }
});

// This code is used to call the solar unary RPC from the GUI.
document.getElementById("solarUnaryBtn").addEventListener("click", async () => {
  const output = document.getElementById("solarUnaryOutput");

  const body = {
    sunlightLevel: Number(document.getElementById("sunlightLevel").value),
    panelArea: Number(document.getElementById("panelArea").value),
    efficiency: Number(document.getElementById("solarEfficiency").value)
  };

  const data = await postJson("/api/solar/output", body);
  output.textContent = JSON.stringify(data, null, 2);
});

// This code is used to call the solar server streaming RPC from the GUI.
document.getElementById("solarStreamBtn").addEventListener("click", async () => {
  const output = document.getElementById("solarStreamOutput");

  const body = {
    numberOfReadings: Number(document.getElementById("streamCount").value),
    baseSunlight: Number(document.getElementById("streamSunlight").value),
    panelArea: Number(document.getElementById("streamArea").value),
    efficiency: Number(document.getElementById("streamEfficiency").value)
  };

  const data = await postJson("/api/solar/stream", body);
  output.textContent = JSON.stringify(data, null, 2);
});

// This code is used to call the battery unary RPC from the GUI.
document.getElementById("batteryStatusBtn").addEventListener("click", async () => {
  const output = document.getElementById("batteryStatusOutput");

  const body = {
    capacity: Number(document.getElementById("batteryCapacity").value),
    currentCharge: Number(document.getElementById("batteryCharge").value)
  };

  const data = await postJson("/api/battery/status", body);
  output.textContent = JSON.stringify(data, null, 2);
});

// This code is used to call the battery client streaming RPC from the GUI.
document.getElementById("batteryEventsBtn").addEventListener("click", async () => {
  const output = document.getElementById("batteryEventsOutput");

  const body = {
    events: [
      { eventType: "CHARGE", amount: 10 },
      { eventType: "DISCHARGE", amount: 5 },
      { eventType: "CHARGE", amount: 15 }
    ]
  };

  const data = await postJson("/api/battery/events", body);
  output.textContent = JSON.stringify(data, null, 2);
});

// This code is used to call the energy unary RPC from the GUI.
document.getElementById("energyBalanceBtn").addEventListener("click", async () => {
  const output = document.getElementById("energyBalanceOutput");

  const body = {
    production: Number(document.getElementById("energyProduction").value),
    consumption: Number(document.getElementById("energyConsumption").value),
    batteryLevel: Number(document.getElementById("energyBatteryLevel").value)
  };

  const data = await postJson("/api/energy/balance", body);
  output.textContent = JSON.stringify(data, null, 2);
});

// This code is used to call the energy bidirectional streaming RPC from the GUI.
document.getElementById("energyFlowBtn").addEventListener("click", async () => {
  const output = document.getElementById("energyFlowOutput");

  const body = {
    messages: [
      { production: 8, consumption: 5, batteryLevel: 60 },
      { production: 3, consumption: 6, batteryLevel: 70 },
      { production: 2, consumption: 7, batteryLevel: 10 }
    ]
  };

  const data = await postJson("/api/energy/flow", body);
  output.textContent = JSON.stringify(data, null, 2);
});
