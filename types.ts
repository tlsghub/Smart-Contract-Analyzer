
export interface Vulnerability {
  name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  description: string;
}

export interface Tokenomics {
  analysis: string;
  passedAuditStandards: boolean;
}

export interface RedFlag {
  flag: string;
  description: string;
}

export interface AnalysisResult {
  score: number;
  recommendation: string;
  summary: string;
  vulnerabilities: Vulnerability[];
  tokenomics: Tokenomics;
  exchangeRedFlags: RedFlag[];
}

export type InputType = 'address' | 'file';
