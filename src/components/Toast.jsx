import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-500/90 border-green-400/50',
    error: 'bg-red-500/90 border-red-400/50',
    warning: 'bg-yellow-500/90 border-yellow-400/50',
    info: 'bg-blue-500/90 border-blue-400/50',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className={`pointer-events-auto px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 max-w-sm ${colors[toast.type]}`}
            >
              <Icon className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white font-medium text-sm flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Simple standalone toast for use without context
export function Toast({ message, type = 'info', onClose }) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-500/90 border-green-400/50',
    error: 'bg-red-500/90 border-red-400/50',
    warning: 'bg-yellow-500/90 border-yellow-400/50',
    info: 'bg-blue-500/90 border-blue-400/50',
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      className={`fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 max-w-sm ${colors[type]}`}
    >
      <Icon className="w-5 h-5 text-white flex-shrink-0" />
      <span className="text-white font-medium text-sm flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
