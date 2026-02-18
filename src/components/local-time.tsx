"use client";

import { useEffect, useState } from "react";

interface LocalTimeProps {
  date: string | Date;
  format?: "date" | "time" | "datetime";
  className?: string;
}

const formatters: Record<string, Intl.DateTimeFormat> = {};

function getFormatter(format: "date" | "time" | "datetime") {
  if (formatters[format]) return formatters[format];

  const options: Intl.DateTimeFormatOptions =
    format === "date"
      ? { year: "numeric", month: "2-digit", day: "2-digit" }
      : format === "time"
        ? { hour: "2-digit", minute: "2-digit", second: "2-digit" }
        : { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" };

  const f = new Intl.DateTimeFormat("pt-BR", options);
  formatters[format] = f;
  return f;
}

function parseDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(date)) return new Date(date + "Z");
  return new Date(date);
}

export function LocalTime({ date, format = "datetime", className }: LocalTimeProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(getFormatter(format).format(parseDate(date)));
  }, [date, format]);

  return <span className={className}>{formatted}</span>;
}
