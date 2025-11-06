import React, { useState, useCallback, useRef } from 'react';
import { AnalysisResult, InputType } from './types';
import { fetchContractFromEtherscan, analyzeContractWithGemini } from './services/apiService';
import AnalysisReport from './components/AnalysisReport';

const Header: React.FC = () => (
    <header className="text-center py-6 border-b border-gray-800">
        <h1 className="text-4xl font-bold text-white">Smart Contract Auditor</h1>
        <p className="text-lg text-gray-400 mt-2">AI-Powered Security & Tokenomics Analysis</p>
    </header>
);

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center space-y-4 my-8">
        <svg className="animate-spin h-10 w-10 text-blue-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-gray-400">{message}</p>
    </div>
);

const App: React.FC = () => {
    const [inputType, setInputType] = useState<InputType>('address');
    const [contractAddress, setContractAddress] = useState<string>('');
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [whitepaperFile, setWhitepaperFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const whitepaperInputRef = useRef<HTMLInputElement>(null);

    const fileReader = <T extends string | ArrayBuffer | null>(file: File, readAs: 'text' | 'arrayBuffer' | 'dataURL'): Promise<T> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as T);
            reader.onerror = (error) => reject(error);
            if (readAs === 'text') {
                reader.readAsText(file);
            } else if (readAs === 'dataURL') {
                reader.readAsDataURL(file);
            }
             else {
                reader.readAsArrayBuffer(file);
            }
        });
    };

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            let contractCode: string;
            if (inputType === 'address') {
                if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                    throw new Error("Please enter a valid Ethereum address.");
                }
                setLoadingMessage('Fetching contract from Etherscan...');
                contractCode = await fetchContractFromEtherscan(contractAddress);
            } else {
                if (!contractFile) throw new Error("Please upload a contract file.");
                setLoadingMessage('Reading contract file...');
                contractCode = await fileReader<string>(contractFile, 'text');
            }
            
            let whitepaperPayload: { data: string; mimeType: string; isText: boolean } | null = null;
            if (whitepaperFile) {
                setLoadingMessage('Reading whitepaper...');
                const fileType = whitepaperFile.type;
                const fileName = whitepaperFile.name.toLowerCase();

                if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileType.startsWith('text/')) {
                    const text = await fileReader<string>(whitepaperFile, 'text');
                    whitepaperPayload = { data: text, mimeType: fileType || 'text/plain', isText: true };
                } else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
                    const dataUrl = await fileReader<string>(whitepaperFile, 'dataURL');
                    const base64Data = dataUrl.split(',')[1];
                    whitepaperPayload = { data: base64Data, mimeType: 'application/pdf', isText: false };
                } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const dataUrl = await fileReader<string>(whitepaperFile, 'dataURL');
                    const base64Data = dataUrl.split(',')[1];
                    whitepaperPayload = { data: base64Data, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', isText: false };
                } else {
                    throw new Error(`Unsupported whitepaper file type: ${whitepaperFile.name}. Please use PDF, DOCX, TXT, or MD.`);
                }
            }

            setLoadingMessage('Analyzing with Gemini AI...');
            const analysisResult = await analyzeContractWithGemini(contractCode, whitepaperPayload);
            setResult(analysisResult);

        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [contractAddress, contractFile, whitepaperFile, inputType]);


    return (
        <div className="min-h-screen bg-gray-950">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-800 shadow-lg">
                    <div className="grid grid-cols-2 gap-2 bg-gray-800 rounded-lg p-1 mb-6 max-w-sm mx-auto">
                        <button onClick={() => setInputType('address')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputType === 'address' ? 'bg-blue-accent text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            Contract Address
                        </button>
                        <button onClick={() => setInputType('file')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputType === 'file' ? 'bg-blue-accent text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            Upload File
                        </button>
                    </div>

                    <div className="space-y-4">
                        {inputType === 'address' ? (
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Etherscan Contract Address</label>
                                <input id="address" type="text" value={contractAddress} onChange={e => setContractAddress(e.target.value)} placeholder="0x..." className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-accent focus:outline-none" />
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="contract-file" className="block text-sm font-medium text-gray-300 mb-1">Smart Contract File (.sol)</label>
                                <input id="contract-file" type="file" accept=".sol" ref={fileInputRef} onChange={e => setContractFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="whitepaper-file" className="block text-sm font-medium text-gray-300 mb-1">White Paper (Optional, .pdf, .docx, .txt, .md)</label>
                            <input id="whitepaper-file" type="file" accept=".pdf,.docx,.txt,.md" ref={whitepaperInputRef} onChange={e => setWhitepaperFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600" />
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="w-full bg-blue-accent hover:bg-blue-accent/90 text-white font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Contract'}
                        </button>
                    </div>
                </div>

                {isLoading && <Loader message={loadingMessage} />}
                {error && <div className="mt-6 bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-md text-center">{error}</div>}
                {result && <AnalysisReport result={result} />}
            </main>
        </div>
    );
};

export default App;