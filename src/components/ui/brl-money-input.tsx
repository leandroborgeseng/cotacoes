"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatBrlFromCentsDigits, sanitizeBrlCentDigits } from "@/lib/format-brl-input";

export type BrlMoneyInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  valueDigits: string;
  onDigitsChange: (digits: string) => void;
};

export function BrlMoneyInput({ valueDigits, onDigitsChange, className, ...props }: BrlMoneyInputProps) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      {...props}
      className={cn("tabular-nums", className)}
      value={formatBrlFromCentsDigits(valueDigits)}
      onChange={(e) => onDigitsChange(sanitizeBrlCentDigits(e.target.value))}
    />
  );
}
