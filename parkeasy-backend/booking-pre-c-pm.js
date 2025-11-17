// Set dynamic values for the booking request
// Generate a random vehicle number if not set
if (!pm.environment.get("vehicleNumber")) {
  const randomNum = Math.floor(Math.random() * 10000);
  pm.environment.set("vehicleNumber", `MH12AB${randomNum}`);
}

// Ensure token is set for authorization
if (!pm.environment.get("token")) {
  console.log(
    "Warning: No token set in environment. Please set the token variable."
  );
}
