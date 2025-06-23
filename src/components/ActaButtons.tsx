// Codex: Updated visual layout
import { clsx } from 'clsx';
import { type HTMLMotionProps, motion } from 'framer-motion';

interface ActaButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary';
}

export function ActaButton({
  variant = 'primary',
  className,
  ...props
}: ActaButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={clsx(
        'inline-flex items-center gap-2 rounded-md px-4 py-2 font-medium shadow transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary'
          ? 'bg-[#4ac795] text-white hover:bg-[#3cb488]'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        className
      )}
      {...props}
    />
  );
}
