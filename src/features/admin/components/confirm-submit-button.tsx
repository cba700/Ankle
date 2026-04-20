"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  confirmationMessage: string;
  disabled?: boolean;
  formAction?: string | ((formData: FormData) => void | Promise<void>);
  formNoValidate?: boolean;
};

export function ConfirmSubmitButton({
  children,
  className,
  confirmationMessage,
  disabled = false,
  formAction,
  formNoValidate = false,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled}
      formAction={formAction}
      formNoValidate={formNoValidate}
      onClick={(event) => {
        if (disabled) {
          return;
        }

        if (!window.confirm(confirmationMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
