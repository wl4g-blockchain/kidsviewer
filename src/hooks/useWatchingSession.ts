import { useState, useEffect, useRef, useCallback } from 'react';
import { APIFactory } from '../api/APIFactory';
import { Question as APIQuestion } from '../types';

// Common interface for watching session questions
export interface WatchingQuestion {
  id: string;
  question: string;
  options: string[];
}

// Hook return type
interface UseWatchingSessionReturn {
  watchingToken: string | null;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  showQuestions: boolean;
  questions: WatchingQuestion[];
  startWatching: () => Promise<void>;
  handleAnswerQuestion: (questionId: string, answer: string) => Promise<void>;
  setShowQuestions: (show: boolean) => void;
  clearError: () => void;
}

/**
 * Custom hook for managing watching sessions
 * Handles token management, question flow, and error states
 * Shared between ElectronWebViewer and IOSWebViewer
 */
export const useWatchingSession = (
  personId: string,
  url: string,
  onLoadError?: (error: string) => void,
  onLoadSuccess?: () => void
): UseWatchingSessionReturn => {
  const [watchingToken, setWatchingToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<WatchingQuestion[]>([]);

  const checkIntervalRef = useRef<number | null>(null);
  const showQuestionsRef = useRef<boolean>(false);
  const api = APIFactory.createAPIHandler();

  // Wrapper for setShowQuestions to keep ref in sync
  const setShowQuestionsWrapper = useCallback((show: boolean) => {
    setShowQuestions(show);
    showQuestionsRef.current = show;
  }, []);

  // Convert API questions to common format
  const convertAPIQuestionToCommon = useCallback((apiQuestions: APIQuestion[]): WatchingQuestion[] => {
    return apiQuestions.map(q => ({
      id: q.id,
      question: q.content,
      options: q.options || [],
    }));
  }, []);

  // Start watching session
  const startWatching = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');

      const response = await api.startWatching(personId, url);

      if (response.errcode === '200' && response.data?.watchingToken) {
        setWatchingToken(response.data.watchingToken);
        startCheckingWatchingStatus(response.data.watchingToken);
        onLoadSuccess?.();
      } else {
        throw new Error('Failed to start watching session');
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      setHasError(true);
      setErrorMessage(errMsg);
      onLoadError?.(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [personId, url, onLoadError, onLoadSuccess]);

  // Periodically check watching status
  const startCheckingWatchingStatus = useCallback(
    (token: string) => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      checkIntervalRef.current = window.setInterval(async () => {
        if (!token) return;

        // Use ref to get current state to avoid stale closure issues
        const currentShowQuestions = showQuestionsRef.current;
        
        // Pause checking when questions are visible to avoid interrupting user interaction
        if (currentShowQuestions) {
          return;
        }

        try {
          const response = await api.checkWatching(token);

          if (response.errcode === '200' && response.data) {
            // Check if questions need to be shown - only update if not already showing questions
            // Double check with ref to ensure we don't override user's current question interaction
            if (response.data.questions && response.data.questions.length > 0 && !showQuestionsRef.current) {
              setQuestions(convertAPIQuestionToCommon(response.data.questions));
              setShowQuestionsWrapper(true);
            }

            // Check if daily time exceeded or session expired
            if (response.data.dailyTimeExceeded) {
              setHasError(true);
              setErrorMessage('Daily time limit exceeded');

              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
              }
            }
          }
        } catch (error) {
          console.error('Error checking watching status:', error);
        }
      }, 1000); // Check every 3 seconds
    },
    [convertAPIQuestionToCommon, setShowQuestionsWrapper]
  );

  // Handle answering questions
  const handleAnswerQuestion = useCallback(
    async (questionId: string, answer: string) => {
      if (!watchingToken) return;

      try {
        const response = await api.verifyQuestion(watchingToken, questionId, answer);

        if (response.errcode === '200' && response.data) {
          if (response.data.correct && response.data.newWatchingToken) {
            // Update token and continue watching
            setWatchingToken(response.data.newWatchingToken);
            setShowQuestionsWrapper(false);
            startCheckingWatchingStatus(response.data.newWatchingToken);
          } else {
            // Incorrect answer - keep questions visible for user to try again
            console.log('Incorrect answer provided');
          }
        }
      } catch (error) {
        console.error('Error verifying question:', error);
      }
    },
    [watchingToken, startCheckingWatchingStatus, setShowQuestionsWrapper]
  );

  // Clear error state
  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
  }, []);

  // Keep ref in sync with state on mount and updates
  useEffect(() => {
    showQuestionsRef.current = showQuestions;
  }, [showQuestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    watchingToken,
    isLoading,
    hasError,
    errorMessage,
    showQuestions,
    questions,
    startWatching,
    handleAnswerQuestion,
    setShowQuestions: setShowQuestionsWrapper,
    clearError,
  };
};
