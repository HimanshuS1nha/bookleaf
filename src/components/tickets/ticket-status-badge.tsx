import { cn } from "@/lib/utils";

import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TicketPriority,
  TicketStatus,
} from "@/constants/ticket";

const statusDotClassNames: Record<TicketStatus, string> = {
  open: "bg-primary",
  in_progress: "bg-chart-1",
  resolved: "bg-chart-2",
  closed: "bg-muted-foreground",
};

const priorityClassNames: Record<TicketPriority, string> = {
  critical: "border-chart-1 text-chart-1",
  high: "border-chart-1/50 text-foreground",
  medium: "border-border text-muted-foreground",
  low: "border-border text-muted-foreground",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] tracking-wide whitespace-nowrap uppercase">
      <span
        aria-hidden
        className={cn("size-2 rounded-full", statusDotClassNames[status])}
      />
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.7rem] tracking-wide whitespace-nowrap uppercase",
        priorityClassNames[priority],
      )}
    >
      {TICKET_PRIORITY_LABELS[priority]}
    </span>
  );
}
