
import React from 'react';
import { AnalysisResult, Vulnerability } from '../types';

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 019-2.606 11.955 11.955 0 019 2.606c.342-1.286.342-2.67.0-4.016z" />
    </svg>
);
const TokenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5A6.5 6.5 0 1012 5.5a6.5 6.5 0 000 13z" />
    </svg>
);
const FlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
);

const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
};

const getSeverityClass = (severity: Vulnerability['severity']): string => {
    switch (severity.toLowerCase()) {
        case 'critical': return 'bg-red-900/50 text-red-300 border-red-500';
        case 'high': return 'bg-orange-900/50 text-orange-300 border-orange-500';
        case 'medium': return 'bg-yellow-900/50 text-yellow-300 border-yellow-500';
        case 'low': return 'bg-blue-900/50 text-blue-300 border-blue-500';
        default: return 'bg-gray-700/50 text-gray-300 border-gray-600';
    }
}

const ScoreDisplay: React.FC<{ score: number }> = ({ score }) => (
    <div className="flex flex-col items-center justify-center bg-gray-900 p-6 rounded-lg border border-gray-700">
        <div className={`relative w-40 h-40 rounded-full flex items-center justify-center ${getScoreColor(score)}`}>
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-gray-700" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getScoreColor(score)} strokeWidth="2" strokeDasharray={`${score}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute text-5xl font-bold">{score}</span>
        </div>
        <p className="mt-4 text-xl font-semibold text-gray-300">Safety Score</p>
    </div>
);

interface ReportSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, icon, children }) => (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center mb-4">
            {icon}
            <h3 className="text-xl font-semibold text-gray-200">{title}</h3>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);


const AnalysisReport: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    return (
        <div className="mt-8 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ScoreDisplay score={result.score} />
                <div className="lg:col-span-2 bg-gray-900 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-2">Audit Summary</h2>
                    <p className={`text-xl font-semibold mb-4 ${getScoreColor(result.score)}`}>{result.recommendation}</p>
                    <p className="text-gray-400">{result.summary}</p>
                </div>
            </div>

            <ReportSection title="Vulnerability Scan" icon={<ShieldIcon />}>
                {result.vulnerabilities.length > 0 ? (
                    result.vulnerabilities.map((vuln, index) => (
                        <div key={index} className={`p-4 rounded-md border-l-4 ${getSeverityClass(vuln.severity)}`}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-white">{vuln.name}</h4>
                                <span className="text-sm font-medium px-2 py-1 rounded-full">{vuln.severity}</span>
                            </div>
                            <p className="text-gray-400 mt-2 text-sm">{vuln.description}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-green-400">No major vulnerabilities found.</p>
                )}
            </ReportSection>

            <ReportSection title="Tokenomics Analysis" icon={<TokenIcon />}>
                <div className="flex items-center mb-2">
                    <p className="mr-4">Passes Standard Audits:</p>
                    {result.tokenomics.passedAuditStandards ? (
                         <span className="text-green-400 font-semibold flex items-center">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                             Yes
                         </span>
                    ) : (
                         <span className="text-red-400 font-semibold flex items-center">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                             No
                         </span>
                    )}
                </div>
                <p className="text-gray-400">{result.tokenomics.analysis}</p>
            </ReportSection>

            <ReportSection title="Exchange Red Flags" icon={<FlagIcon />}>
                {result.exchangeRedFlags.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 text-gray-400">
                        {result.exchangeRedFlags.map((flag, index) => (
                            <li key={index}><strong className="text-gray-300">{flag.flag}:</strong> {flag.description}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-green-400">No major exchange red flags identified.</p>
                )}
            </ReportSection>
        </div>
    );
};

export default AnalysisReport;
