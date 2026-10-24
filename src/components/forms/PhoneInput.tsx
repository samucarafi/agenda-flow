"use client";

import { formatBrazilianPhone } from "@/lib/phone";
import { useState } from "react";

export function PhoneInput({
  value,
  onChange,
  defaultValue,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState(
    formatBrazilianPhone(String(defaultValue ?? "")),
  );
  const inputValue = value ?? internalValue;

  return (
    <input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete={props.autoComplete ?? "tel"}
      pattern="\(\d{2}\) \d{4,5}-\d{4}"
      maxLength={20}
      value={inputValue}
      onChange={(event) => {
        const formatted = formatBrazilianPhone(event.target.value);
        if (value === undefined) setInternalValue(formatted);
        onChange?.(formatted);
      }}
    />
  );
}
