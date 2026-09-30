import { transportConfig } from '../config/transportConfig.ts';

export interface TransportCostResult {
  cost: number;
  tollCost: number;
  fuelCost: number;
  otherCosts: number;
  isEstimate: boolean;
}

export function calculateEstimatedTransportCost(
  distanceKm: number,
  vehicleType?: string,
  fuelType?: string
): TransportCostResult {
  const vType = vehicleType || transportConfig.defaultVehicleType;
  const fType = fuelType || transportConfig.defaultFuelType;

  const mileage = transportConfig.mileage[vType] || transportConfig.mileage['Other'] || 10.0;
  const fuelPrice = transportConfig.fuelPrices[fType] || transportConfig.fuelPrices['Diesel'] || 90.0;

  const fuelRequired = distanceKm / mileage;
  const fuelCost = Math.round(fuelRequired * fuelPrice * 100) / 100;
  
  // Calculate toll estimate per km, or fallback to zero if config has it disabled/zero
  const tollCost = Math.round(transportConfig.tollPerKm * distanceKm * 100) / 100;
  const otherCosts = transportConfig.otherCostsFlat;

  const cost = Math.round((fuelCost + tollCost + otherCosts) * 100) / 100;

  return {
    cost,
    tollCost,
    fuelCost,
    otherCosts,
    isEstimate: true,
  };
}
