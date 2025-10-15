// ZK Proof Management Component for KidsViewer
// Handles generation and verification of ZK proofs for learning and financial data

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { web3Service } from '../../services/web3Service';

interface LearningData {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  dailyStudyTimeMinutes: number;
  accumulatedRewards: string;
  parentApprovalHash: string;
}

interface ZKProofData {
  proof: string;
  publicInputs: string[];
  circuitHash: string;
  timestamp: number;
}

interface ZKProofManagerProps {
  childId: string;
  onProofGenerated?: (proofData: ZKProofData) => void;
}

export const ZKProofManager: React.FC<ZKProofManagerProps> = ({ childId, onProofGenerated }) => {
  const { isDark } = useThemeStore();
  const [learningData, setLearningData] = useState<LearningData>({
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    dailyStudyTimeMinutes: 0,
    accumulatedRewards: '0',
    parentApprovalHash: '',
  });

  const [thresholds, setThresholds] = useState({
    minQuestions: 30,
    minAccuracy: 80,
    minStudyTime: 30,
    minRewards: 500000, // 0.5 USDC in wei
  });

  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isVerifyingProof, setIsVerifyingProof] = useState(false);
  const [proofData, setProofData] = useState<ZKProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPrivateData, setShowPrivateData] = useState(false);

  // Load learning data from localStorage or API
  useEffect(() => {
    loadLearningData();
  }, [childId]);

  const loadLearningData = async () => {
    try {
      // In a real implementation, this would fetch from the backend API
      const savedData = localStorage.getItem(`learningData_${childId}`);
      if (savedData) {
        setLearningData(JSON.parse(savedData));
      } else {
        // Mock data for demonstration
        setLearningData({
          totalQuestionsAnswered: 50,
          correctAnswers: 45,
          dailyStudyTimeMinutes: 60,
          accumulatedRewards: '1000000', // 1 USDC
          parentApprovalHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        });
      }
    } catch (error) {
      console.error('Failed to load learning data:', error);
    }
  };

  const generateZKProof = async () => {
    setIsGeneratingProof(true);
    setError(null);
    setSuccess(null);

    try {
      // Calculate accuracy percentage
      const accuracyPercentage = Math.floor((learningData.correctAnswers * 100) / learningData.totalQuestionsAnswered);

      // Check if data meets thresholds
      if (learningData.totalQuestionsAnswered < thresholds.minQuestions) {
        throw new Error(
          `Insufficient questions answered. Need at least ${thresholds.minQuestions}, got ${learningData.totalQuestionsAnswered}`
        );
      }

      if (accuracyPercentage < thresholds.minAccuracy) {
        throw new Error(`Insufficient accuracy. Need at least ${thresholds.minAccuracy}%, got ${accuracyPercentage}%`);
      }

      if (learningData.dailyStudyTimeMinutes < thresholds.minStudyTime) {
        throw new Error(
          `Insufficient study time. Need at least ${thresholds.minStudyTime} minutes, got ${learningData.dailyStudyTimeMinutes}`
        );
      }

      if (parseInt(learningData.accumulatedRewards) < thresholds.minRewards) {
        throw new Error(`Insufficient rewards. Need at least ${thresholds.minRewards}, got ${learningData.accumulatedRewards}`);
      }

      // In a real implementation, this would call the ZK circuit
      // For now, we'll simulate the proof generation
      const mockProofData: ZKProofData = {
        proof: '0x' + Math.random().toString(16).substr(2, 64),
        publicInputs: [
          thresholds.minQuestions.toString(),
          thresholds.minAccuracy.toString(),
          thresholds.minStudyTime.toString(),
          thresholds.minRewards.toString(),
          childId,
          Date.now().toString(),
        ],
        circuitHash: '0x' + Math.random().toString(16).substr(2, 64),
        timestamp: Date.now(),
      };

      setProofData(mockProofData);
      setSuccess('ZK proof generated successfully!');

      if (onProofGenerated) {
        onProofGenerated(mockProofData);
      }

      // Save proof to localStorage
      localStorage.setItem(`zkProof_${childId}`, JSON.stringify(mockProofData));
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const verifyZKProof = async () => {
    if (!proofData) return;

    setIsVerifyingProof(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, this would call the verifier contract
      // For now, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess('ZK proof verified successfully!');
    } catch (error: any) {
      setError('Proof verification failed: ' + error.message);
    } finally {
      setIsVerifyingProof(false);
    }
  };

  const uploadToStarknet = async () => {
    if (!proofData) return;

    try {
      const walletConnection = web3Service.getWalletConnection();

      if (!walletConnection) {
        throw new Error('Starknet wallet not connected');
      }

      // In a real implementation, this would upload the proof to Starknet
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 3000));

      setSuccess('Proof uploaded to Starknet successfully!');
    } catch (error: any) {
      setError('Failed to upload proof: ' + error.message);
    }
  };

  const updateLearningData = (field: keyof LearningData, value: string | number) => {
    setLearningData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateThresholds = (field: keyof typeof thresholds, value: number) => {
    setThresholds(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center space-x-3 mb-6">
        <Shield className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>ZK Proof Manager</h3>
      </div>

      {/* Learning Data Section */}
      <div className="space-y-4 mb-6">
        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Learning Data (Private)</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Total Questions Answered
            </label>
            <input
              type="number"
              value={learningData.totalQuestionsAnswered}
              onChange={e => updateLearningData('totalQuestionsAnswered', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Correct Answers</label>
            <input
              type="number"
              value={learningData.correctAnswers}
              onChange={e => updateLearningData('correctAnswers', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Study Time (minutes)</label>
            <input
              type="number"
              value={learningData.dailyStudyTimeMinutes}
              onChange={e => updateLearningData('dailyStudyTimeMinutes', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Accumulated Rewards (wei)
            </label>
            <input
              type="text"
              value={learningData.accumulatedRewards}
              onChange={e => updateLearningData('accumulatedRewards', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Thresholds Section */}
      <div className="space-y-4 mb-6">
        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Verification Thresholds (Public)</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Min Questions</label>
            <input
              type="number"
              value={thresholds.minQuestions}
              onChange={e => updateThresholds('minQuestions', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Min Accuracy (%)</label>
            <input
              type="number"
              value={thresholds.minAccuracy}
              onChange={e => updateThresholds('minAccuracy', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Min Study Time (min)</label>
            <input
              type="number"
              value={thresholds.minStudyTime}
              onChange={e => updateThresholds('minStudyTime', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Min Rewards (wei)</label>
            <input
              type="number"
              value={thresholds.minRewards}
              onChange={e => updateThresholds('minRewards', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={generateZKProof}
          disabled={isGeneratingProof}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          <span>{isGeneratingProof ? 'Generating...' : 'Generate Proof'}</span>
        </button>

        {proofData && (
          <button
            onClick={verifyZKProof}
            disabled={isVerifyingProof}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifyingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>{isVerifyingProof ? 'Verifying...' : 'Verify Proof'}</span>
          </button>
        )}

        {proofData && (
          <button
            onClick={uploadToStarknet}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            <Upload className="w-4 h-4" />
            <span>Upload to Starknet</span>
          </button>
        )}
      </div>

      {/* Proof Display */}
      {proofData && (
        <div className={`rounded-lg p-4 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Generated ZK Proof</h5>
            <button
              onClick={() => setShowPrivateData(!showPrivateData)}
              className="flex items-center space-x-1 text-sm text-blue-500 hover:text-blue-600"
            >
              {showPrivateData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPrivateData ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Proof Hash:</span>
              <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-800'}`}>{proofData.proof.substring(0, 20)}...</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Circuit Hash:</span>
              <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-800'}`}>{proofData.circuitHash.substring(0, 20)}...</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Timestamp:</span>
              <span className={isDark ? 'text-white' : 'text-gray-800'}>{new Date(proofData.timestamp).toLocaleString()}</span>
            </div>

            {showPrivateData && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h6 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Public Inputs:</h6>
                <div className="space-y-1">
                  {proofData.publicInputs.map((input, index) => (
                    <div key={index} className="flex justify-between">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Input {index + 1}:</span>
                      <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-800'}`}>{input}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center space-x-2 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}
    </div>
  );
};
