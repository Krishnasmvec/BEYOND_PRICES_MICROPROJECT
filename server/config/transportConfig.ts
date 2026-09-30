export const transportConfig = {
  fuelPrices: {
    'Petrol': 102.5,  // Configurable latest known value
    'Diesel': 92.2,   // Configurable latest known value
    'CNG': 82.0,      // Configurable latest known value
    'Electric': 9.5,  // Configurable latest known value (₹/kWh)
  } as Record<string, number>,
  mileage: {
    'Two-wheeler': 45.0,
    'Mini truck': 15.0,
    'Pickup truck': 12.0,
    'Tractor-trailer': 8.0,
    'Large truck': 5.0,
    'Other': 10.0,
  } as Record<string, number>,
  defaultVehicleType: 'Mini truck',
  defaultFuelType: 'Diesel',
  tollPerKm: 1.5,       // Configured estimate per km
  otherCostsFlat: 150.0 // Configured flat cost (e.g. loading, driver allowance)
};
