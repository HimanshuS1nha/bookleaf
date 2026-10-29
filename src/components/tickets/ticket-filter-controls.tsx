"use client";

import { SearchIcon } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";

const SEARCH_DEBOUNCE_MS = 300;

export function SearchInput({
  initialValue,
  placeholder,
  onSearch,
}: {
  initialValue: string;
  placeholder: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<number | undefined>(undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setValue(nextValue);

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => onSearch(nextValue.trim()),
      SEARCH_DEBOUNCE_MS,
    );
  };

  return (
    <div className="relative">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label="Search tickets"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="h-10 bg-background pl-9"
      />
    </div>
  );
}

function FilterChip({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Toggle
      variant="outline"
      pressed={isActive}
      onPressedChange={onClick}
      className="h-8 rounded-full bg-background px-3 font-normal text-muted-foreground aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground"
    >
      {children}
    </Toggle>
  );
}

// Multi-select chips; selecting none means "All"
export function ChipFilterGroup<T extends string>({
  legend,
  options,
  labels,
  selected,
  onChange,
}: {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onChange: (selected: T[]) => void;
}) {
  const toggle = (option: T) =>
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );

  return (
    <FieldSet className="gap-1.5">
      <FieldLegend
        variant="label"
        className="mb-1.5 text-xs font-normal text-muted-foreground"
      >
        {legend}
      </FieldLegend>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          isActive={selected.length === 0}
          onClick={() => onChange([])}
        >
          All
        </FilterChip>
        {options.map((option) => (
          <FilterChip
            key={option}
            isActive={selected.includes(option)}
            onClick={() => toggle(option)}
          >
            {labels[option]}
          </FilterChip>
        ))}
      </div>
    </FieldSet>
  );
}

export function DateRangeInputs({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (updates: { from?: string; to?: string }) => void;
}) {
  return (
    <>
      <Field className="w-40 gap-1.5">
        <FieldLabel
          htmlFor="from"
          className="text-xs font-normal text-muted-foreground"
        >
          Raised from
        </FieldLabel>
        <Input
          id="from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => onChange({ from: event.target.value })}
          className="h-10 bg-background"
        />
      </Field>
      <Field className="w-40 gap-1.5">
        <FieldLabel
          htmlFor="to"
          className="text-xs font-normal text-muted-foreground"
        >
          To
        </FieldLabel>
        <Input
          id="to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onChange({ to: event.target.value })}
          className="h-10 bg-background"
        />
      </Field>
    </>
  );
}

export function TicketsPagination({
  page,
  pageSize,
  total,
  shownCount,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  shownCount: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstShown = (page - 1) * pageSize + 1;

  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        {firstShown}–{firstShown + shownCount - 1} of {total}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export function TicketsSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading tickets"
      className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2 px-5 py-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
