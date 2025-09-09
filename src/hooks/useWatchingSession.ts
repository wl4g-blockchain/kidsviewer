import { useState, useEffect, useRef, useCallback } from 'react';
import { APIFactory } from '../api/APIFactory';
import { Question as APIQuestion } from '../types';

// Common interface for watching session questions
export interface WatchingQuestion {
  id: string;
  question: string;
  options?: string[];
  type?: 'multiple-choice' | 'true-false' | 'fill-blank' | 'calculation';
  correctAnswer?: string | number;
}

// Hook return type
interface UseWatchingSessionReturn {
  watchingToken: string | null;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  showQuestions: boolean;
  questions: WatchingQuestion[];
  remainingTime: number; // Remaining time in milliseconds
  remainingDailyTime: number; // Remaining daily time in milliseconds
  startWatching: () => Promise<void>;
  handleAnswerQuestion: (questionId: string, answer: string) => Promise<boolean>;
  setShowQuestions: (show: boolean) => void;
  clearError: () => void;
  resetWatchingSession: () => void;
  onSessionEnd?: () => void; // Callback when session ends (time limit exceeded)
  onQuestionsShown?: () => void; // Callback when questions are shown (hide subwindow)
  onQuestionsHidden?: () => void; // Callback when questions are hidden (show subwindow)
}

/**
 * Custom hook for managing watching sessions
 * Handles token management, question flow, and error states
 * Shared between ElectronWebViewer and IOSWebViewer
 */
export const useWatchingSession = (
  personId: string,
  platformId: string,
  onLoadError?: (error: string) => void,
  onLoadSuccess?: () => void,
  onSessionEnd?: () => void,
  onQuestionsShown?: () => void,
  onQuestionsHidden?: () => void
): UseWatchingSessionReturn => {
  const [watchingToken, setWatchingToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<WatchingQuestion[]>([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [remainingDailyTime, setRemainingDailyTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const checkIntervalRef = useRef<number | null>(null);
  const showQuestionsRef = useRef<boolean>(false);
  const hasStartedRef = useRef<boolean>(false);
  const onLoadErrorRef = useRef(onLoadError);
  const onLoadSuccessRef = useRef(onLoadSuccess);
  const onSessionEndRef = useRef(onSessionEnd);
  const onQuestionsShownRef = useRef(onQuestionsShown);
  const onQuestionsHiddenRef = useRef(onQuestionsHidden);
  const api = APIFactory.createAPIHandler();

  // Wrapper for setShowQuestions to keep ref in sync
  const setShowQuestionsWrapper = useCallback((show: boolean) => {
    const wasShowing = showQuestionsRef.current;
    setShowQuestions(show);
    showQuestionsRef.current = show;
    
    // Call appropriate callbacks when question visibility changes
    if (show && !wasShowing) {
      onQuestionsShownRef.current?.();
    } else if (!show && wasShowing) {
      onQuestionsHiddenRef.current?.();
    }
  }, []);

  // Convert API questions to common format
  const convertAPIQuestionToCommon = useCallback((apiQuestions: APIQuestion[]): WatchingQuestion[] => {
    return apiQuestions.map(q => ({
      id: q.id,
      question: q.content,
      options: q.options || [],
      type: q.type,
      correctAnswer: q.correctAnswer,
    }));
  }, []);

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
          //alert(JSON.stringify(response));

          if (response.errcode === '200' && response.data) {
            // Update remaining time information
            if (response.data.remainingTime !== undefined) {
              setRemainingTime(response.data.remainingTime);
            }
            if (response.data.remainingDailyTime !== undefined) {
              setRemainingDailyTime(response.data.remainingDailyTime);
            }

            // Check if questions need to be shown - only update if not already showing questions
            // Double check with ref to ensure we don't override user's current question interaction
            if (response.data.questions && response.data.questions.length > 0 && !showQuestionsRef.current) {
              console.log('Showing new questions:', response.data.questions);
              setQuestions(convertAPIQuestionToCommon(response.data.questions));
              setShowQuestionsWrapper(true);
            }

            // Check if daily time exceeded or session expired
            if (response.data.dailyTimeExceeded) {
              setHasError(true);
              setErrorMessage('Daily time limit exceeded');
              setHasStarted(false); // Reset started flag
              hasStartedRef.current = false;

              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
              }

              // Notify parent component that session has ended
              onSessionEndRef.current?.();
            }

            // Check if session time expired (remainingTime <= 0)
            // Note: We don't immediately end the session here as the server might
            // return questions for the user to answer (4018 error code)
            if (response.data.remainingTime <= 0) {
              console.log('Session time limit reached, waiting for server response...');
              // Don't immediately end session - let 4018 error code handle question display
            }
          } else if (response.errcode === '4018' && response.data) {
            // Session time limit exceeded - show questions
            console.log('Session time limit exceeded, showing questions:', response.data);

            // Update remaining time information
            if (response.data.remainingTime !== undefined) {
              setRemainingTime(response.data.remainingTime);
            }
            if (response.data.remainingDailyTime !== undefined) {
              setRemainingDailyTime(response.data.remainingDailyTime);
            }

            // Show questions if available and not already showing
            if (response.data.questions && response.data.questions.length > 0 && !showQuestionsRef.current) {
              setQuestions(convertAPIQuestionToCommon(response.data.questions));
              setShowQuestionsWrapper(true);
            }
          } else if (response.errcode === '4017' && response.data) {
            // Daily time limit exceeded
            console.log('Daily time limit exceeded');

            // Update remaining time information
            if (response.data.remainingTime !== undefined) {
              setRemainingTime(response.data.remainingTime);
            }
            if (response.data.remainingDailyTime !== undefined) {
              setRemainingDailyTime(response.data.remainingDailyTime);
            }

            setHasError(true);
            setErrorMessage('Daily time limit exceeded');
            setHasStarted(false); // Reset started flag
            hasStartedRef.current = false;

            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }

            // Notify parent component that session has ended
            onSessionEndRef.current?.();
          }
        } catch (error) {
          console.error('Error checking watching status:', error);
        }
      }, 1000); // Check every 5 seconds to avoid too frequent requests
    },
    [convertAPIQuestionToCommon, setShowQuestionsWrapper]
  );

  // Handle answering questions
  const handleAnswerQuestion = useCallback(
    async (questionId: string, answer: string): Promise<boolean> => {
      if (!watchingToken) return false;

      try {
        const response = await api.verifyQuestion(watchingToken, questionId, answer);

        if (response.errcode === '200' && response.data) {
          console.log('useWatchingSession: Response data:', response.data);
          if (response.data.correct) {
            // Answer is correct - update token if available
            console.log('Answer is correct, updating token but keeping questions visible');
            //alert('useWatchingSession: Answer is CORRECT, returning true');
            if (response.data.newWatchingToken) {
              //alert('Correct answer 3333 '+ JSON.stringify(response));
              setWatchingToken(response.data.newWatchingToken);
              startCheckingWatchingStatus(response.data.newWatchingToken);
            }
            return true; // Answer is correct
          } else {
            // Incorrect answer - keep questions visible for user to try again
            console.log('Incorrect answer provided');
            //alert('useWatchingSession: Answer is INCORRECT, returning false');
            return false; // Answer is incorrect
          }
        }
        return false; // Default to incorrect if no valid response
      } catch (error) {
        console.error('Error verifying question:', error);
        return false; // On error, treat as incorrect
      }
    },
    [watchingToken, startCheckingWatchingStatus, setShowQuestionsWrapper]
  );

  // Start watching session
  const startWatching = useCallback(async () => {
    // Only start if not already started
    if (hasStartedRef.current) {
      console.log('Watching session already started, skipping...');
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');

      const response = await api.startWatching(personId, platformId);

      if (response.errcode === '200' && response.data?.watchingToken) {
        setWatchingToken(response.data.watchingToken);
        setHasStarted(true);
        hasStartedRef.current = true;
        startCheckingWatchingStatus(response.data.watchingToken);
        onLoadSuccessRef.current?.();
      } else {
        throw new Error('Failed to start watching session');
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      setHasError(true);
      setErrorMessage(errMsg);
      onLoadErrorRef.current?.(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [personId, platformId, startCheckingWatchingStatus]);

  // Clear error state
  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
  }, []);

  // Reset watching session state
  const resetWatchingSession = useCallback(() => {
    setWatchingToken(null);
    setHasStarted(false);
    hasStartedRef.current = false;
    setRemainingTime(0);
    setRemainingDailyTime(0);
    setQuestions([]);
    setShowQuestionsWrapper(false);
    setHasError(false);
    setErrorMessage('');

    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, [setShowQuestionsWrapper]);

  // Reset hasStartedRef on mount to ensure clean state
  useEffect(() => {
    hasStartedRef.current = false;
  }, []);

  // Keep refs in sync with props and state
  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  useEffect(() => {
    onLoadSuccessRef.current = onLoadSuccess;
  }, [onLoadSuccess]);

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
  }, [onSessionEnd]);

  useEffect(() => {
    onQuestionsShownRef.current = onQuestionsShown;
  }, [onQuestionsShown]);

  useEffect(() => {
    onQuestionsHiddenRef.current = onQuestionsHidden;
  }, [onQuestionsHidden]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

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
      // Reset state when component unmounts
      resetWatchingSession();
    };
  }, [resetWatchingSession]);

  return {
    watchingToken,
    isLoading,
    hasError,
    errorMessage,
    showQuestions,
    questions,
    remainingTime,
    remainingDailyTime,
    startWatching,
    handleAnswerQuestion,
    setShowQuestions: setShowQuestionsWrapper,
    clearError,
    resetWatchingSession,
    onSessionEnd,
    onQuestionsShown,
    onQuestionsHidden,
  };
};
