"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Anima a entrada do conteúdo sempre que a rota muda, usando `pathname`
 * como `key` para forçar o remount e reproduzir a transição — evita ter
 * de gerir `AnimatePresence` entre trocas de página do App Router.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
