import { GoogleGenAI, Type, Part } from "@google/genai";
import { ETHERSCAN_API_KEY, ETHERSCAN_API_URL } from '../constants';
import { AnalysisResult } from '../types';

export const fetchContractFromEtherscan = async (address: string): Promise<string> => {
  const url = `${ETHERSCAN_API_URL}?module=contract&action=getsourcecode&address=${address}&chainid=1&apikey=${ETHERSCAN_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch from Etherscan API. Status: ${response.status}`);
  }

  const data = await response.json();

  // Improved, V2-compliant error checking
  if (data.status === '0') {
    // Etherscan API returns status '0' for errors. The 'result' field then contains the error message.
    const errorMessage = data.result || 'An unknown error occurred with the Etherscan API.';
    throw new Error(`Etherscan API Error: ${errorMessage}`);
  }

  if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
    throw new Error('Etherscan API returned an unexpected or empty response format.');
  }
  
  const sourceCodeInfo = data.result[0];
  if (sourceCodeInfo.SourceCode === '' || sourceCodeInfo.SourceCode === undefined) {
    throw new Error('Contract source code is not verified or available on Etherscan.');
  }

  return sourceCodeInfo.SourceCode;
};

export const analyzeContractWithGemini = async (
  contractCode: string,
  whitepaper: { data: string; mimeType: string; isText: boolean } | null
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const promptIntro = `
    Analyze the following smart contract code and optional project white paper.

    Perform a comprehensive audit and provide the output ONLY in the specified JSON format.

    **Analysis requirements:**
    1.  **Vulnerability Scan:** Analyze the code for common vulnerabilities (reentrancy, overflows, access control, etc.). List each, its severity (Critical, High, Medium, Low), and an explanation.
    2.  **Tokenomics Analysis:** Evaluate the tokenomics (supply, distribution, vesting). Assess if the structure is sound.
    3.  **Exchange Red Flags:** Identify red flags for exchanges (honeypot, rug pull potential, centralization).
    4.  **Overall Summary & Investment Thesis:** Summarize findings and give a clear investment recommendation from a technical perspective.
    5.  **Safety Score:** Provide a safety score from 0 (extremely risky) to 100 (very secure).
    
    Here is the smart contract:
  `;

  const parts: Part[] = [
      { text: promptIntro },
      { text: `\`\`\`solidity\n${contractCode}\n\`\`\`` }
  ];

  if (whitepaper) {
      if (whitepaper.isText) {
          parts.push({ text: `Here is the whitepaper content:\n\n${whitepaper.data}` });
      } else {
          parts.push({ text: 'Here is the whitepaper file for analysis:' });
          parts.push({
              inlineData: {
                  data: whitepaper.data,
                  mimeType: whitepaper.mimeType,
              },
          });
      }
  } else {
      parts.push({ text: 'No whitepaper was provided.' });
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: 'Safety score from 0 to 100.' },
      recommendation: { type: Type.STRING, description: 'Short recommendation, e.g., "High Risk", "Proceed with Caution", "Appears Secure".' },
      summary: { type: Type.STRING, description: 'Overall summary of the audit.' },
      vulnerabilities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            severity: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "severity", "description"]
        },
        description: "List of vulnerabilities found."
      },
      tokenomics: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          passedAuditStandards: { type: Type.BOOLEAN }
        },
        required: ["analysis", "passedAuditStandards"],
        description: "Analysis of the project's tokenomics."
      },
      exchangeRedFlags: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            flag: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["flag", "description"]
        },
        description: "List of red flags for exchanges."
      }
    },
    required: ["score", "recommendation", "summary", "vulnerabilities", "tokenomics", "exchangeRedFlags"]
  };
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.2,
    },
  });

  try {
    const jsonText = response.text.trim();
    const result: AnalysisResult = JSON.parse(jsonText);
    return result;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("AI failed to return a valid analysis. Please try again.");
  }
};