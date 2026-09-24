'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function Toast({ message }: { message: string | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="flex items-center gap-2 rounded-full border border-flame/30 bg-[#20060d]/95 py-2 pl-3 pr-4 shadow-[0_8px_36px_rgba(255,106,46,0.35)] backdrop-blur-md"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sun via-flame to-cherry text-[#2b060f]">
              <Check size={12} strokeWidth={3.5} />
            </span>
            <span className="text-[12.5px] font-semibold text-flame">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
