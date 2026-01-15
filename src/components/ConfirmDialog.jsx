import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  icon: CustomIcon = null,
}) {
  if (!isOpen) return null;

  const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    info: AlertTriangle,
  };

  const colors = {
    danger: {
      icon: 'text-red-400',
      iconBg: 'bg-red-500/20',
      button: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-navy',
    },
    info: {
      icon: 'text-gold',
      iconBg: 'bg-gold/20',
      button: 'btn-primary',
    },
  };

  const Icon = CustomIcon || icons[type];
  const colorScheme = colors[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card max-w-sm w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cream/50 hover:text-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${colorScheme.iconBg} flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${colorScheme.icon}`} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-serif text-cream text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-cream/60 text-center mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              className="flex-1 btn-secondary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {cancelText}
            </motion.button>
            <motion.button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${colorScheme.button}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {confirmText}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for easier usage
import { useState, useCallback } from 'react';

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: () => {},
  });

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'danger',
        onConfirm: () => resolve(true),
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={closeDialog}
      onConfirm={dialogState.onConfirm}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      type={dialogState.type}
    />
  );

  return { showConfirm, closeDialog, ConfirmDialogComponent };
}
