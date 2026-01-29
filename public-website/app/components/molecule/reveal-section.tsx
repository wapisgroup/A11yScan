"use client";

import { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { useReveal } from "../../libs/motion";

type RevealSectionProps = PropsWithChildren<{
  custom?: number;
}>;

export function RevealSection({ children, custom = 0 }: RevealSectionProps) {
  const reveal = useReveal();

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={reveal}
      custom={custom}
    >
      {children}
    </motion.div>
  );
}