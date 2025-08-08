// src/components/EmailInputDialog.tsx
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

interface EmailInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  loading?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
}

export function EmailInputDialog({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  title = 'Send Email',
  description = 'Enter the email address to send to:',
  placeholder = 'Enter email address',
}: EmailInputDialogProps): JSX.Element {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email.trim());
      setEmail('');
    }
  };

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-xl shadow-lg w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary">{title}</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-muted hover:text-body hover:bg-bg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-body mb-4">{description}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-borders rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 disabled:opacity-50 text-sm"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-body bg-white border border-borders rounded-xl hover:bg-bg transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {loading ? 'SENDING...' : 'SEND'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default EmailInputDialog;
