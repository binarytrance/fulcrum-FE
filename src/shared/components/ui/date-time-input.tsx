"use client";

import { Input } from "@/components/ui/input";
import { useMemo } from "react";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalDateTimeInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export type DateTimeInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "min"
> & {
  minDate?: Date;
};

export function DateTimeInput({ minDate, ...props }: DateTimeInputProps) {
  const min = useMemo(() => {
    if (!minDate) return undefined;
    const normalized = new Date(minDate);
    normalized.setSeconds(0, 0);
    return toLocalDateTimeInputValue(normalized);
  }, [minDate]);

  return <Input type="datetime-local" min={min} {...props} />;
}

