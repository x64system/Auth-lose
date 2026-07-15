"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";

type ConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Substitui `window.confirm()` por um diálogo consistente com o design do
 * dashboard. Uso:
 *
 * const confirm = useConfirm();
 * const ok = await confirm({ description: "Eliminar este produto?", danger: true });
 * if (!ok) return;
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm deve ser usado dentro de <ConfirmDialogProvider>");
  return ctx;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  function handle(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={!!state}
        onClose={() => handle(false)}
        title={state?.options.title ?? "Confirmar ação"}
        footer={
          <>
            <Button className="bg-card text-foreground" onClick={() => handle(false)}>
              {state?.options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              className={state?.options.danger ? "bg-danger text-white" : "bg-success text-black"}
              onClick={() => handle(true)}
            >
              {state?.options.confirmLabel ?? "Confirmar"}
            </Button>
          </>
        }
      >
        {state?.options.description}
      </Modal>
    </ConfirmContext.Provider>
  );
}
