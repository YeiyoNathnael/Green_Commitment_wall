import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export interface CommitmentInterpretation {
  category: 'transport' | 'energy' | 'food' | 'waste' | 'water' | 'consumption' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  parameters: {
    [key: string]: any;
  };
  extractedDetails: string;
}

export interface CarbonEstimate {
  perPeriod: number;
  total: number;
  unit: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface MilestoneSuggestion {
  title: string;
  description: string;
  targetValue: number;
  estimatedCarbonSavings: number;
}

/**
 * Interpret commitment text using Gemini AI
 */
export async function interpretCommitment(text: string): Promise<CommitmentInterpretation> {
  try {
    const prompt = `Extract category, frequency, and key parameters from this sustainability commitment. Return JSON only.

Commitment: "${text}"

Extract:
- category: one of [transport, energy, food, waste, water, consumption, other]
- frequency: one of [daily, weekly, monthly, once]
- parameters: relevant details (e.g., distance, quantity, type)
- extractedDetails: brief summary

Return valid JSON format.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || 'other',
        frequency: parsed.frequency || 'once',
        parameters: parsed.parameters || {},
        extractedDetails: parsed.extractedDetails || text.substring(0, 100),
      };
    }

    // Fallback if parsing fails
    return {
      category: 'other',
      frequency: 'once',
      parameters: {},
      extractedDetails: text.substring(0, 100),
    };
  } catch (error) {
    console.error('Gemini interpretation error:', error);
    // Fallback response
    return {
      category: 'other',
      frequency: 'once',
      parameters: {},
      extractedDetails: text.substring(0, 100),
    };
  }
}

/**
 * Estimate carbon savings using Gemini AI
 */
export async function estimateCarbonSavings(
  interpretation: CommitmentInterpretation,
  duration: string = '1 month'
): Promise<CarbonEstimate> {
  try {
    const prompt = `Estimate CO2 savings in kg for this commitment. Return JSON only.

Category: ${interpretation.category}
Frequency: ${interpretation.frequency}
Duration: ${duration}
Details: ${interpretation.extractedDetails}
Parameters: ${JSON.stringify(interpretation.parameters)}

Calculate:
- perPeriod: kg CO2 saved per frequency period
- total: total kg CO2 for duration
- confidence: high/medium/low
- explanation: brief reasoning

Return valid JSON format.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        perPeriod: parseFloat(parsed.perPeriod) || 0,
        total: parseFloat(parsed.total) || 0,
        unit: 'kg CO2',
        confidence: parsed.confidence || 'medium',
        explanation: parsed.explanation || 'Estimated based on commitment details',
      };
    }

    // Fallback estimation
    return getSimpleCarbonEstimate(interpretation, duration);
  } catch (error) {
    console.error('Gemini estimation error:', error);
    return getSimpleCarbonEstimate(interpretation, duration);
  }
}

/**
 * Simple rule-based carbon estimation as fallback
 */
function getSimpleCarbonEstimate(
  interpretation: CommitmentInterpretation,
  duration: string
): CarbonEstimate {
  const baseEstimates: { [key: string]: number } = {
    transport: 5.0,
    energy: 3.0,
    food: 2.5,
    waste: 1.5,
    water: 1.0,
    consumption: 2.0,
    other: 1.0,
  };

  const frequencyMultiplier: { [key: string]: number } = {
    daily: 30,
    weekly: 4,
    monthly: 1,
    once: 1,
  };

  const perPeriod = baseEstimates[interpretation.category] || 1.0;
  const multiplier = frequencyMultiplier[interpretation.frequency] || 1;
  const total = perPeriod * multiplier;

  return {
    perPeriod,
    total,
    unit: 'kg CO2',
    confidence: 'low',
    explanation: 'Estimated using baseline averages',
  };
}

/**
 * Suggest milestones for a commitment using Gemini AI
 */
export async function suggestMilestones(
  commitmentText: string,
  interpretation: CommitmentInterpretation
): Promise<MilestoneSuggestion[]> {
  try {
    const prompt = `Suggest 3 achievable milestones for this commitment. Return JSON array only.

Commitment: "${commitmentText}"
Category: ${interpretation.category}
Frequency: ${interpretation.frequency}

For each milestone provide:
- title: short milestone name
- description: what to achieve
- targetValue: numeric goal
- estimatedCarbonSavings: kg CO2

Return valid JSON array format.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.slice(0, 3).map((m: any) => ({
        title: m.title || 'Milestone',
        description: m.description || '',
        targetValue: parseFloat(m.targetValue) || 1,
        estimatedCarbonSavings: parseFloat(m.estimatedCarbonSavings) || 0,
      }));
    }

    // Fallback milestones
    return getDefaultMilestones();
  } catch (error) {
    console.error('Gemini milestone suggestion error:', error);
    return getDefaultMilestones();
  }
}

/**
 * Default milestone suggestions
 */
function getDefaultMilestones(): MilestoneSuggestion[] {
  return [
    {
      title: 'First Week',
      description: 'Complete your commitment for 7 days',
      targetValue: 7,
      estimatedCarbonSavings: 5,
    },
    {
      title: 'One Month Strong',
      description: 'Maintain your commitment for 30 days',
      targetValue: 30,
      estimatedCarbonSavings: 20,
    },
    {
      title: 'Sustainability Champion',
      description: 'Complete 3 months of consistent action',
      targetValue: 90,
      estimatedCarbonSavings: 60,
    },
  ];
}
