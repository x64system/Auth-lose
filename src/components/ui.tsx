import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-xl border border-border bg-foreground px-4 py-2 text-sm text-bg transition-all duration-200 hover:opacity-90",
        props.className
      )}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-0 transition-all focus:border-light",
        props.className
      )}
    />
  );
}
