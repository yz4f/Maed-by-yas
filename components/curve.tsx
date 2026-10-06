import { motion } from 'motion/react';

export default function Curve() {
  const initialPath = `M100 0 L100 ${window.innerHeight} Q-100 ${window.innerHeight / 2} 100 0`;
  const targetPath = `M100 0 L100 ${window.innerHeight} Q100 ${window.innerHeight / 2} 100 0`;
  const curve = {
    initial: {
      d: initialPath,
    },
    enter: {
      d: targetPath,
      transition: { duration: 1, ease: [0.76, 0, 0.24, 1] as const },
    },
    exit: {
      d: initialPath,
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const },
    },
  };

  return (
    <svg className="absolute top-0 -left-25 w-25 h-full fill-[rgb(41,41,41)] stroke-none">
      <motion.path
        variants={curve}
        initial="initial"
        animate="enter"
        exit="exit"
      />
    </svg>
  );
}
