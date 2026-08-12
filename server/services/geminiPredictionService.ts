import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { env } from '../config/env.ts';
import { UpstreamError } from '../domain/errors.ts';
import type { UserInput, PredictionResult, ConsumerPrediction } from '../../types.ts';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const predictionSchema = {
  type: Type.OBJECT,
  properties: {
    best_day: { type: Type.STRING },
    best_hour_window: { type: Type.STRING },
    best_market: { type: Type.STRING },
    expected_profit: { type: Type.NUMBER },
    confidence_score: { type: Type.NUMBER },
    urgency_level: { type: Type.STRING },
    sell_now_override: { type: Type.BOOLEAN },
    simple_summary: { type: Type.STRING, description: "A simple, jargon-free instruction for a farmer, e.g., 'Take your crop to City Mandi tomorrow morning to earn the most money.'" },
    status_monitor: {
      type: Type.OBJECT,
      properties: {
        listing_status: { type: Type.STRING },
        current_state: { type: Type.STRING },
        safe_window_hours: { type: Type.NUMBER }
      },
      required: ["listing_status", "current_state", "safe_window_hours"]
    },
    collective_intelligence: {
      type: Type.OBJECT,
      properties: {
        nearby_match_count: { type: Type.NUMBER },
        is_opportunity_present: { type: Type.BOOLEAN },
        estimated_savings: { type: Type.NUMBER },
        cooperation_hint: { type: Type.STRING },
        privacy_status: { type: Type.STRING },
        sharing_split_details: { type: Type.STRING }
      },
      required: ["nearby_match_count", "is_opportunity_present", "estimated_savings", "cooperation_hint", "privacy_status", "sharing_split_details"]
    },
    logistics: {
      type: Type.OBJECT,
      properties: {
        distance_km: { type: Type.NUMBER },
        travel_duration_mins: { type: Type.NUMBER },
        traffic_delay_prob: { type: Type.STRING },
        estimated_arrival: { type: Type.STRING },
        arrival_sync_status: { type: Type.STRING },
        transit_quality_loss: { type: Type.NUMBER },
        road_type_risk: { type: Type.STRING },
        alternate_route_available: { type: Type.BOOLEAN }
      },
      required: ["distance_km", "travel_duration_mins", "traffic_delay_prob", "estimated_arrival", "arrival_sync_status", "transit_quality_loss", "road_type_risk", "alternate_route_available"]
    },
    resilience_hub: {
      type: Type.OBJECT,
      properties: {
        alternate_plan: {
          type: Type.OBJECT,
          properties: {
            market_name: { type: Type.STRING },
            estimated_profit: { type: Type.NUMBER },
            profit_delta: { type: Type.NUMBER },
            reason_for_fallback: { type: Type.STRING },
            feasibility_score: { type: Type.NUMBER }
          },
          required: ["market_name", "estimated_profit", "profit_delta", "reason_for_fallback", "feasibility_score"]
        },
        emergency_plan: {
          type: Type.OBJECT,
          properties: {
            market_name: { type: Type.STRING },
            estimated_profit: { type: Type.NUMBER },
            profit_delta: { type: Type.NUMBER },
            reason_for_fallback: { type: Type.STRING },
            feasibility_score: { type: Type.NUMBER }
          },
          required: ["market_name", "estimated_profit", "profit_delta", "reason_for_fallback", "feasibility_score"]
        },
        shock_triggers: {
          type: Type.OBJECT,
          properties: {
            weather_alert: { type: Type.BOOLEAN },
            price_crash_alert: { type: Type.BOOLEAN },
            road_blockage_alert: { type: Type.BOOLEAN }
          },
          required: ["weather_alert", "price_crash_alert", "road_blockage_alert"]
        }
      },
      required: ["alternate_plan", "emergency_plan", "shock_triggers"]
    },
    market_ethics: {
      type: Type.OBJECT,
      properties: {
        trust_score: { type: Type.NUMBER },
        fairness_rating: { type: Type.STRING },
        price_deviation_percent: { type: Type.NUMBER },
        payment_reliability_roadmap: { type: Type.STRING },
        historical_consistency: { type: Type.STRING }
      },
      required: ["trust_score", "fairness_rating", "price_deviation_percent", "payment_reliability_roadmap", "historical_consistency"]
    },
    storage_advisory: {
      type: Type.OBJECT,
      properties: {
        is_worth_it: { type: Type.BOOLEAN },
        reasoning: { type: Type.STRING },
        cooling_advised: { type: Type.BOOLEAN },
        max_safe_hours: { type: Type.NUMBER },
        stack_height_limit: { type: Type.STRING },
        ventilation_required: { type: Type.BOOLEAN },
        expected_grade_loss: { type: Type.STRING }
      },
      required: ["is_worth_it", "reasoning", "cooling_advised", "max_safe_hours", "stack_height_limit", "ventilation_required"]
    },
    strategy_breakdown: {
      type: Type.OBJECT,
      properties: {
        market_justification: { type: Type.STRING },
        timing_justification: { type: Type.STRING },
        risk_mitigation_summary: { type: Type.STRING },
        delay_consequence: { type: Type.STRING }
      },
      required: ["market_justification", "timing_justification", "risk_mitigation_summary", "delay_consequence"]
    },
    current_mandi_price: { type: Type.NUMBER },
    last_updated_mins: { type: Type.NUMBER },
    price_trend_sentiment: { type: Type.STRING },
    historical_avg_comparison: { type: Type.STRING },
    min_safe_price: { type: Type.NUMBER },
    quality_loss_per_day: { type: Type.NUMBER },
    next_grade_downgrade_eta: { type: Type.STRING },
    ai_reasoning: { type: Type.STRING },
    spoilage_risk: { type: Type.STRING },
    spoilage_rate: { type: Type.NUMBER },
    route_safety_score: { type: Type.NUMBER },
    transport_cost: { type: Type.NUMBER },
    weather: {
      type: Type.OBJECT,
      properties: {
        temp: { type: Type.NUMBER },
        humidity: { type: Type.NUMBER },
        rain_chance: { type: Type.NUMBER },
        condition: { type: Type.STRING },
        storageImpact: { type: Type.STRING },
        riskMultiplier: { type: Type.NUMBER }
      },
      required: ["temp", "humidity", "rain_chance", "condition", "storageImpact", "riskMultiplier"]
    },
    sdg_impact: {
      type: Type.OBJECT,
      properties: {
        waste_reduction_kg: { type: Type.NUMBER },
        primary_sdg: { type: Type.STRING },
        impact_statement: { type: Type.STRING }
      },
      required: ["waste_reduction_kg", "primary_sdg", "impact_statement"]
    },
    alternate_market: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        profit: { type: Type.NUMBER },
        distance: { type: Type.STRING }
      },
      required: ["name", "profit", "distance"]
    },
    profit_forecast: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          profit: { type: Type.NUMBER }
        },
        required: ["day", "profit"]
      }
    },
    price_trend: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          price: { type: Type.NUMBER },
          msp: { type: Type.NUMBER }
        },
        required: ["day", "price", "msp"]
      }
    },
    spoilage_curve: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          riskPercentage: { type: Type.NUMBER },
          qualityGrade: { type: Type.STRING }
        },
        required: ["day", "riskPercentage", "qualityGrade"]
      }
    },
    market_trust: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        fairness: { type: Type.STRING },
        paymentSpeed: { type: Type.STRING }
      }
    },
    storage_advice: {
      type: Type.OBJECT,
      properties: {
        coolingRequired: { type: Type.BOOLEAN },
        stackHeight: { type: Type.STRING },
        humidityWarning: { type: Type.STRING }
      }
    },
    community: {
      type: Type.OBJECT,
      properties: {
        nearbyFarmers: { type: Type.NUMBER },
        potentialCost_saving: { type: Type.NUMBER },
        activePools: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["nearbyFarmers", "potentialCost_saving", "activePools"]
    },
    risk_factors: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: [
    "best_day", "best_hour_window", "best_market", "expected_profit", "confidence_score",
    "urgency_level", "logistics", "resilience_hub", "market_ethics", "status_monitor", "collective_intelligence", "storage_advisory", "strategy_breakdown", "current_mandi_price", "min_safe_price",
    "ai_reasoning", "spoilage_risk", "route_safety_score", "transport_cost",
    "weather", "sdg_impact", "alternate_market", "profit_forecast", "price_trend",
    "spoilage_curve", "community", "risk_factors", "simple_summary"
  ]
};

const consumerPredictionSchema = {
  type: Type.OBJECT,
  properties: {
    recommendedCrops: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          crop: { type: Type.STRING },
          farmerPrice: { type: Type.NUMBER },
          retailPrice: { type: Type.NUMBER },
          trend: { type: Type.STRING },
          freshnessScore: { type: Type.NUMBER },
          freshnessCategory: { type: Type.STRING },
          harvestRecency: { type: Type.STRING },
          transportImpact: { type: Type.STRING },
          demandLevel: { type: Type.STRING },
          effectiveValueScore: { type: Type.NUMBER },
          bestMarketName: { type: Type.STRING }
        },
        required: ["crop", "farmerPrice", "retailPrice", "trend", "freshnessScore", "freshnessCategory", "harvestRecency", "transportImpact", "demandLevel", "effectiveValueScore", "bestMarketName"]
      }
    },
    nearbyMarkets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          distance: { type: Type.STRING },
          distance_km: { type: Type.NUMBER },
          specialty: { type: Type.STRING },
          meiScore: { type: Type.NUMBER },
          trustScore: { type: Type.NUMBER },
          isOpen: { type: Type.BOOLEAN },
          availabilitySignal: { type: Type.STRING },
          lastSupplyUpdate: { type: Type.STRING }
        },
        required: ["name", "distance", "distance_km", "specialty", "meiScore", "trustScore", "isOpen", "availabilitySignal", "lastSupplyUpdate"]
      }
    },
    marketTiming: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          crop: { type: Type.STRING },
          signal: { type: Type.STRING },
          reason: { type: Type.STRING },
          buyRecommendation: { type: Type.STRING }
        },
        required: ["crop", "signal", "reason", "buyRecommendation"]
      }
    },
    marketBalance: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          crop: { type: Type.STRING },
          message: { type: Type.STRING },
          impactLevel: { type: Type.STRING }
        },
        required: ["type", "crop", "message", "impactLevel"]
      }
    },
    alerts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          message: { type: Type.STRING },
          actionHint: { type: Type.STRING }
        },
        required: ["id", "type", "message", "actionHint"]
      }
    },
    freshAndAffordable: {
      type: Type.OBJECT,
      properties: {
        crop: { type: Type.STRING },
        marketName: { type: Type.STRING },
        price: { type: Type.NUMBER },
        reason: { type: Type.STRING }
      },
      required: ["crop", "marketName", "price", "reason"]
    },
    rationalInsights: {
      type: Type.OBJECT,
      properties: {
        timingOutlook: { type: Type.STRING },
        marketVerdict: { type: Type.STRING },
        effortTradeOff: { type: Type.STRING },
        confidenceScore: { type: Type.NUMBER }
      },
      required: ["timingOutlook", "marketVerdict", "effortTradeOff", "confidenceScore"]
    },
    smartBasket: {
      type: Type.OBJECT,
      properties: {
        strategy: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        totalCost: { type: Type.NUMBER },
        totalSavingsVsRetail: { type: Type.NUMBER },
        avgFreshness: { type: Type.NUMBER },
        travelEffort: { type: Type.STRING },
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              marketName: { type: Type.STRING },
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
              subtotal: { type: Type.NUMBER },
              freshnessScore: { type: Type.NUMBER }
            },
            required: ["marketName", "items", "subtotal", "freshnessScore"]
          }
        },
        fallbackSingleMarket: {
          type: Type.OBJECT,
          properties: {
            marketName: { type: Type.STRING },
            totalCost: { type: Type.NUMBER },
            avgFreshness: { type: Type.NUMBER },
            items: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["marketName", "totalCost", "avgFreshness", "items"]
        }
      },
      required: ["strategy", "reasoning", "totalCost", "totalSavingsVsRetail", "avgFreshness", "travelEffort", "nodes"]
    },
    aiAdvice: { type: Type.STRING },
    simple_advice: { type: Type.STRING, description: "A simple, jargon-free instruction for a shopper, e.g., 'Buy Onions and Potatoes from Market A today to save ₹50.'" },
    regionalSupplyStrength: { type: Type.NUMBER }
  },
  required: ["recommendedCrops", "nearbyMarkets", "marketTiming", "marketBalance", "alerts", "freshAndAffordable", "rationalInsights", "smartBasket", "aiAdvice", "simple_advice", "regionalSupplyStrength"]
};

export const generatePrediction = async (input: UserInput): Promise<PredictionResult> => {
  const prompt = `System: National Agricultural Intelligence.
  CONTEXT:
  - Location: ${input.location}
  - Crop: ${input.cropType}
  - Quantity: ${input.quantity} ${input.quantityUnit}
  - Harvest Date: ${input.harvestDate}
  - Storage Available: ${input.storageAvailable ? 'Yes' : 'No'}
  - Max Travel: ${input.travelRange} km

  TASK: Provide a hyper-local strategic selling plan. Output JSON.
  CRITICAL: 'simple_summary' must be one sentence, direct instruction for a farmer.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: predictionSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini prediction failed:', err);
    throw new UpstreamError('Strategic analysis failed. Please try again.');
  }
};

export const generateConsumerInsights = async (input: { location: string; preferences: any[] }): Promise<ConsumerPrediction> => {
  const prompt = `System: National Agricultural Intelligence. Location: ${input.location}.
  Provide procurement strategy. Output JSON.
  CRITICAL: 'simple_advice' must be one sentence, no jargon, direct instruction for a household shopper.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: consumerPredictionSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini consumer insights failed:', err);
    throw new UpstreamError('Market intelligence feed unavailable for this region.');
  }
};
