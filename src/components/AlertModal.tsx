import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
  onConfirm?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  showCancel = false,
  cancelText = 'Cancel',
  onConfirm,
}) => {
  const { isDark } = useThemeStore();

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className={`p-2 rounded-full ${
                type === 'success'
                  ? isDark
                    ? 'bg-green-900/20'
                    : 'bg-green-100'
                  : type === 'error'
                  ? isDark
                    ? 'bg-red-900/20'
                    : 'bg-red-100'
                  : type === 'warning'
                  ? isDark
                    ? 'bg-yellow-900/20'
                    : 'bg-yellow-100'
                  : isDark
                  ? 'bg-blue-900/20'
                  : 'bg-blue-100'
              }`}
            >
              {getIcon()}
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          </div>

          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>

          <div className="flex space-x-3">
            {showCancel && (
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                {cancelText}
              </button>
            )}
            <button onClick={handleConfirm} className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${getButtonColor()}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
