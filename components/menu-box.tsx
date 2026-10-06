'use client';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { useState } from 'react';
import Link from './link';
import Curve from './curve';

export interface MenuItem {
  title: string;
  href: string;
}

export const animations = {
  menuSlide: {
    initial: { x: 'calc(100% + 100px)' },

    enter: {
      x: '0',
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const },
    },

    exit: {
      x: 'calc(100% + 100px)',
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const },
    },
  },
  slide: {
    initial: { x: 80 },

    enter: (i: number) => ({
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1] as const,
        delay: 0.05 * i,
      },
    }),

    exit: (i: number) => ({
      x: 80,
      transition: {
        duration: 0.8,
        ease: [0.76, 0, 0.24, 1] as const,
        delay: 0.05 * i,
      },
    }),
  },
  scale: {
    open: { scale: 1, transition: { duration: 0.3 } },

    closed: { scale: 0, transition: { duration: 0.4 } },
  },
};

export function MenuBox({ menuItems }: { menuItems: MenuItem[] }) {
  const pathname = usePathname();
  const [selectedIndicator, setSelectedIndicator] = useState(pathname);
  return (
    <motion.div
      variants={animations.menuSlide}
      initial="initial"
      animate="enter"
      exit="exit"
      className="h-screen bg-[rgb(41,41,41)] fixed right-0 top-0 text-white"
    >
      <div className="box-border h-full p-25 flex flex-col justify-between">
        <div
          onMouseLeave={() => {
            setSelectedIndicator(pathname);
          }}
          className="flex flex-col text-6xl gap-3 mt-20"
        >
          <div className="text-[rgb(153,153,153)] border-b-[rgb(153,153,153)] border-b uppercase text-xs mb-10">
            <p>navigation</p>
          </div>
          {menuItems.map((data, index) => (
            <Link
              key={index}
              isActive={selectedIndicator === data.href}
              setSelectedIndicator={setSelectedIndicator}
              data={{ ...data, index }}
            />
          ))}
        </div>
      </div>
      <Curve />
    </motion.div>
  );
}
