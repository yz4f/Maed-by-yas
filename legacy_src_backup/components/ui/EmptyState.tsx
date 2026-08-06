import React from 'react';
import { motion } from 'motion/react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="mb-6 p-4 rounded-full bg-gray-800/50 border border-gray-700/50 text-gray-400">
        {icon || <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-sky-500/20"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
