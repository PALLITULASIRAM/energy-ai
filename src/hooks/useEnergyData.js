import { useState, useEffect, useCallback } from 'react';

const CHANNEL_ID = '629098';
const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json`;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export function useEnergyData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(THINGSPEAK_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch ThingSpeak data');
      }

      const result = await response.json();
      const processedData = processEnergyData(result.feeds);

      if (processedData.validEntries.length === 0) {
        throw new Error('No valid data found in ThingSpeak channel');
      }

      const uniqueDays = processedData.uniqueDays;
      let prediction;

      if (uniqueDays < 20) {
        prediction = await predictWithGemini(processedData, GEMINI_API_KEY);
        prediction.method = 'AI Prediction';
        prediction.methodClass = 'method-ai';
      } else {
        prediction = calculateAveragePrediction(processedData);
        prediction.method = 'Statistical Calculation';
        prediction.methodClass = 'method-calc';
      }

      setData({ ...processedData, prediction });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

function processEnergyData(feeds) {
  const validEntries = [];
  const dailyData = {};

  feeds.forEach(entry => {
    const units = parseFloat(entry.field1);
    const cost = parseFloat(entry.field2);
    const voltage = parseFloat(entry.field3);
    const date = new Date(entry.created_at);
    const dateKey = date.toISOString().split('T')[0];

    if (!isNaN(units) && !isNaN(cost)) {
      validEntries.push({
        date: date,
        dateKey: dateKey,
        units: units,
        cost: cost,
        voltage: isNaN(voltage) ? null : voltage
      });

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { units: [], costs: [], voltages: [] };
      }
      dailyData[dateKey].units.push(units);
      dailyData[dateKey].costs.push(cost);
      if (!isNaN(voltage)) {
        dailyData[dateKey].voltages.push(voltage);
      }
    }
  });

  const dailyAverages = Object.keys(dailyData).map(dateKey => {
    const day = dailyData[dateKey];
    return {
      date: dateKey,
      avgUnits: day.units.reduce((a, b) => a + b, 0) / day.units.length,
      avgCost: day.costs.reduce((a, b) => a + b, 0) / day.costs.length,
      avgVoltage: day.voltages.length > 0 ?
        day.voltages.reduce((a, b) => a + b, 0) / day.voltages.length : null
    };
  });

  return {
    validEntries: validEntries,
    dailyAverages: dailyAverages,
    uniqueDays: Object.keys(dailyData).length,
    totalUnits: validEntries.reduce((sum, entry) => sum + entry.units, 0),
    totalCost: validEntries.reduce((sum, entry) => sum + entry.cost, 0),
    avgUnitsPerReading: validEntries.reduce((sum, entry) => sum + entry.units, 0) / validEntries.length,
    avgCostPerReading: validEntries.reduce((sum, entry) => sum + entry.cost, 0) / validEntries.length,
    avgVoltage: validEntries.filter(e => e.voltage).length > 0 ?
      validEntries.filter(e => e.voltage).reduce((sum, entry) => sum + entry.voltage, 0) /
      validEntries.filter(e => e.voltage).length : null
  };
}

async function predictWithGemini(processedData, apiKey) {
  const currentDate = new Date().toLocaleDateString('en-IN');
  const dataRange = processedData.dailyAverages.length > 0 ?
    `${processedData.dailyAverages[0].date} to ${processedData.dailyAverages[processedData.dailyAverages.length - 1].date}` : 'Unknown';

  const prompt = `You are an expert energy analyst. Analyze this Indian household electricity consumption data and provide detailed insights.

📊 DATA SUMMARY:
- Analysis Date: ${currentDate}
- Data Period: ${dataRange}
- Total Readings: ${processedData.validEntries.length}
- Days of Data: ${processedData.uniqueDays}
- Average Units/Reading: ${processedData.avgUnitsPerReading.toFixed(2)} kWh
- Average Cost/Reading: ₹${processedData.avgCostPerReading.toFixed(2)}
- Average Voltage: ${processedData.avgVoltage ? processedData.avgVoltage.toFixed(1) + 'V' : 'Not Available'}

📈 DAILY CONSUMPTION PATTERN:
${processedData.dailyAverages.slice(-7).map(day =>
  `${new Date(day.date).toLocaleDateString('en-IN')}: ${day.avgUnits.toFixed(1)} kWh → ₹${day.avgCost.toFixed(2)}`
).join('\n')}

🎯 ANALYSIS REQUIRED:
1. Predict monthly electricity bill (30 days) in INR
2. Identify consumption patterns and trends
3. Provide energy-saving recommendations
4. Rate prediction confidence
5. Note any anomalies or concerns

⚡ RESPONSE FORMAT (JSON):
{
  "monthlyBill": <predicted_amount_number>,
  "confidence": "<high/medium/low>",
  "consumptionPattern": "<description_of_usage_pattern>",
  "trends": "<increasing/stable/decreasing_with_details>",
  "recommendations": [
    "<actionable_tip_1>",
    "<actionable_tip_2>",
    "<actionable_tip_3>"
  ],
  "anomalies": "<any_unusual_readings_or_concerns>",
  "peakUsageDays": "<days_with_highest_consumption>",
  "estimatedUnitsPerMonth": <predicted_monthly_units>,
  "costPerUnit": <average_cost_per_unit>
}

Make sure your response is valid JSON only, no additional text.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
  }

  const result = await response.json();
  const text = result.candidates[0].content.parts[0].text;

  try {
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const aiPrediction = JSON.parse(jsonMatch[0]);
      return {
        monthlyBill: aiPrediction.monthlyBill || (processedData.avgCostPerReading * 30),
        confidence: aiPrediction.confidence || 'medium',
        consumptionPattern: aiPrediction.consumptionPattern || 'Pattern analysis unavailable',
        trends: aiPrediction.trends || 'Trend analysis unavailable',
        recommendations: aiPrediction.recommendations || ['Monitor daily usage', 'Use energy-efficient appliances'],
        anomalies: aiPrediction.anomalies || 'No significant anomalies detected',
        peakUsageDays: aiPrediction.peakUsageDays || 'Analysis unavailable',
        estimatedUnitsPerMonth: aiPrediction.estimatedUnitsPerMonth || (processedData.avgUnitsPerReading * 30),
        costPerUnit: aiPrediction.costPerUnit || (processedData.avgCostPerReading / processedData.avgUnitsPerReading)
      };
    } else {
      throw new Error('Invalid JSON format in AI response');
    }
  } catch (parseError) {
    console.warn('JSON parsing failed, using fallback calculation');
    const dailyAvgCost = processedData.totalCost / processedData.uniqueDays;
    return {
      monthlyBill: dailyAvgCost * 30,
      confidence: 'low',
      consumptionPattern: 'Unable to analyze pattern due to parsing error',
      trends: 'Trend analysis failed',
      recommendations: ['Monitor energy usage regularly', 'Consider energy audit'],
      anomalies: 'Analysis incomplete',
      peakUsageDays: 'Data unavailable',
      estimatedUnitsPerMonth: (processedData.totalUnits / processedData.uniqueDays) * 30,
      costPerUnit: processedData.avgCostPerReading / processedData.avgUnitsPerReading
    };
  }
}

function calculateAveragePrediction(processedData) {
  const dailyAvgCost = processedData.totalCost / processedData.uniqueDays;
  const dailyAvgUnits = processedData.totalUnits / processedData.uniqueDays;
  const monthlyBill = dailyAvgCost * 30;

  return {
    monthlyBill: monthlyBill,
    confidence: 'high',
    consumptionPattern: `Consistent usage pattern based on ${processedData.uniqueDays} days of data`,
    trends: `Average daily consumption: ${dailyAvgUnits.toFixed(1)} kWh, ₹${dailyAvgCost.toFixed(2)}`,
    recommendations: ['Continue monitoring usage', 'Look for peak consumption times', 'Consider time-of-use tariffs'],
    anomalies: 'Statistical analysis - no anomaly detection',
    peakUsageDays: 'Requires AI analysis for detailed breakdown',
    estimatedUnitsPerMonth: dailyAvgUnits * 30,
    costPerUnit: processedData.avgCostPerReading / processedData.avgUnitsPerReading
  };
}
