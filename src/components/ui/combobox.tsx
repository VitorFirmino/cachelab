"use client";

import { useState, useRef, useEffect, useCallback, useId, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  "aria-label": ariaLabel,
  className,
}: ComboboxProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const searchable = options.length > 5;
  const selectedOption = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Position the portal dropdown relative to the trigger button
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-combobox-item]");
    items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[highlightedIndex]) {
            onChange(filtered[highlightedIndex].value);
            setOpen(false);
            setSearch("");
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          setSearch("");
          break;
      }
    },
    [open, filtered, highlightedIndex, onChange],
  );

  const dropdown = open && (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="z-50 overflow-hidden rounded-lg border border-[rgba(79,125,255,0.2)] bg-card-solid shadow-[0_0_30px_rgba(79,125,255,0.1)] backdrop-blur-xl"
      onKeyDown={handleKeyDown}
    >
      {searchable && (
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              className="h-8 w-full rounded-md border border-border bg-[rgba(17,27,46,0.5)] pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[rgba(79,125,255,0.5)] focus:outline-none"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
            />
          </div>
        </div>
      )}
      <div ref={listRef} id={listboxId} role="listbox" className="max-h-56 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado</div>
        ) : (
          filtered.map((option, index) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              data-combobox-item
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                index === highlightedIndex
                  ? "bg-[rgba(79,125,255,0.15)] text-foreground"
                  : "text-foreground hover:bg-[rgba(79,125,255,0.1)]",
                option.value === value && "font-medium",
              )}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                setSearch("");
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  option.value === value ? "text-primary opacity-100" : "opacity-0",
                )}
              />
              {option.label}
            </div>
          ))
        )}
      </div>
    </div>
  );
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div className={cn("relative", className)} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-[rgba(17,27,46,0.5)] px-3 text-sm backdrop-blur-sm transition-all duration-200 focus:border-[rgba(79,125,255,0.5)] focus:shadow-[0_0_0_2px_rgba(79,125,255,0.15),0_0_15px_rgba(79,125,255,0.1)] focus:outline-none"
        onClick={() => {
          setOpen(!open);
          setHighlightedIndex(0);
          if (open) setSearch("");
        }}
      >
        <span className={selectedOption ? "text-foreground truncate" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {portalTarget && createPortal(dropdown, portalTarget)}
    </div>
  );
}
