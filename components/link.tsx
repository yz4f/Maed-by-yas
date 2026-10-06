import { motion } from 'motion/react';
import { animations } from './menu-box';
import Link from 'next/link';

interface CustomLinkProps {
  data: { title: string; href: string; index: number };
  isActive: boolean;
  setSelectedIndicator: React.Dispatch<React.SetStateAction<string>>;
}

export default function CustomLink({
  data,
  isActive,
  setSelectedIndicator,
}: CustomLinkProps) {
  const { title, href, index } = data;
  return (
    <motion.div
      className="relative flex items-center"
      onMouseEnter={() => {
        setSelectedIndicator(href);
      }}
      custom={index}
      variants={animations.slide}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <motion.div
        variants={animations.scale}
        animate={isActive ? 'open' : 'closed'}
        className="w-2.5 h-2.5 bg-white rounded-full absolute -left-7.5"
      ></motion.div>
      <Link href={href}>{title}</Link>
    </motion.div>
  );
}
