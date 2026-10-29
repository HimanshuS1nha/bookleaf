"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightLeftIcon,
  FlagIcon,
  LockIcon,
  TagIcon,
  MailIcon,
  PlusIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import { KeyboardEvent, SubmitEvent } from "react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { apiFetch } from "@/lib/api-fetch";
import { formatDateTime, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

import { API_ROUTES } from "@/constants/api-routes";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/constants/ticket";

import { adminTicketQueries } from "@/queries/admin-ticket.queries";

import { TicketActivityEntryType, TicketNoteType } from "@/types";

type StreamItem =
  | { kind: "note"; createdAt: string; note: TicketNoteType }
  | { kind: "event"; createdAt: string; event: TicketActivityEntryType };

const eventIcons = {
  created: PlusIcon,
  status_changed: ArrowRightLeftIcon,
  priority_changed: FlagIcon,
  category_changed: TagIcon,
  assignee_changed: UserRoundIcon,
  response_updated: MailIcon,
};

// Work notes and field changes in one stream, like a ServiceNow activity feed
export function TicketActivityStream({
  ticketId,
  authorName,
}: {
  ticketId: string;
  authorName: string;
}) {
  const queryClient = useQueryClient();

  const notesQuery = useQuery(adminTicketQueries.notes(ticketId));
  const activityQuery = useQuery(adminTicketQueries.activity(ticketId));

  const error = notesQuery.error ?? activityQuery.error;
  const isPending = notesQuery.isPending || activityQuery.isPending;

  // Newest first
  const items: StreamItem[] = [
    ...(notesQuery.data?.notes ?? []).map((note) => ({
      kind: "note" as const,
      createdAt: note.createdAt,
      note,
    })),
    ...(activityQuery.data?.activity ?? []).map((event) => ({
      kind: "event" as const,
      createdAt: event.createdAt,
      event,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const postNote = useMutation({
    mutationFn: (note: string) =>
      apiFetch(API_ROUTES.admin.ticketNotes(ticketId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      }),
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({
        queryKey: adminTicketQueries.notes(ticketId).queryKey,
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const form = useForm({
    defaultValues: { note: "" },
    onSubmit: ({ value }) =>
      postNote.mutateAsync(value.note.trim()).catch(() => {}),
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit();
  };

  // Cmd/Ctrl+Enter posts, like most ticketing tools
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      form.handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border bg-card p-3 shadow-xs"
      >
        <form.Field name="note">
          {(field) => (
            <Field className="gap-2">
              <FieldLabel htmlFor="work-note" className="sr-only">
                Work note
              </FieldLabel>
              <Textarea
                id="work-note"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={5000}
                placeholder="Add a work note for the team"
                className="min-h-20 border-none bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <div className="flex items-center justify-between gap-3">
                <FieldDescription className="inline-flex items-center gap-1.5 text-xs">
                  <LockIcon aria-hidden className="size-3" />
                  Only visible to staff
                </FieldDescription>
                <form.Subscribe
                  selector={(state) => [state.isSubmitting, state.values.note]}
                >
                  {([isSubmitting, note]) => (
                    <Button
                      type="submit"
                      disabled={Boolean(isSubmitting) || !String(note).trim()}
                    >
                      {isSubmitting ? "Posting…" : "Post note"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </Field>
          )}
        </form.Field>
      </form>

      {error ? (
        <p role="alert" className="text-sm">
          {error.message}
        </p>
      ) : isPending ? (
        <div aria-busy aria-label="Loading activity" className="space-y-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="relative flex flex-col gap-5 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-border">
          {items.map((item) =>
            item.kind === "note" ? (
              <NoteItem key={`note-${item.note.id}`} note={item.note} />
            ) : (
              <EventItem
                key={`event-${item.event.id}`}
                event={item.event}
                authorName={authorName}
              />
            ),
          )}
        </ol>
      )}
    </div>
  );
}

function NoteItem({ note }: { note: TicketNoteType }) {
  return (
    <li className="relative flex gap-3">
      <Avatar className="ring-4 ring-background">
        <AvatarFallback>
          {note.createdBy ? getInitials(note.createdBy.name) : "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 rounded-lg border bg-card px-4 py-3 shadow-xs">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">
            {note.createdBy?.name ?? "Former staff member"}
          </span>
          <span className="text-xs text-muted-foreground">
            added a work note
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatDateTime(note.createdAt)}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
          {note.note}
        </p>
      </div>
    </li>
  );
}

function EventItem({
  event,
  authorName,
}: {
  event: TicketActivityEntryType;
  authorName: string;
}) {
  const Icon =
    event.actorType === "system" ? SparklesIcon : eventIcons[event.type];

  const actor =
    event.actorType === "author"
      ? authorName
      : event.actorType === "system"
        ? "AI triage"
        : (event.actorAdmin?.name ?? "Former staff member");

  return (
    <li className="relative flex gap-3">
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted ring-4 ring-background",
          event.actorType === "system" && "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        <p className="text-sm">
          <span className="font-medium">{actor}</span>{" "}
          <span className="text-muted-foreground">
            <EventDescription event={event} />
          </span>{" "}
          <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
            {formatDateTime(event.createdAt)}
          </span>
        </p>
        {event.type === "response_updated" && event.toValue && (
          <p className="mt-2 line-clamp-3 border-l-2 border-primary/40 pl-3 text-sm whitespace-pre-wrap text-muted-foreground">
            {event.toValue}
          </p>
        )}
      </div>
    </li>
  );
}

function ValueChange({ from, to }: { from: string | null; to: string | null }) {
  return (
    <>
      {from && (
        <>
          from <span className="text-foreground">{from}</span>{" "}
        </>
      )}
      to <span className="text-foreground">{to ?? "nobody"}</span>
    </>
  );
}

function EventDescription({ event }: { event: TicketActivityEntryType }) {
  switch (event.type) {
    case "created":
      return <>raised this ticket</>;
    case "status_changed":
      return (
        <>
          changed state{" "}
          <ValueChange
            from={
              event.fromValue
                ? TICKET_STATUS_LABELS[event.fromValue as TicketStatus]
                : null
            }
            to={
              event.toValue
                ? TICKET_STATUS_LABELS[event.toValue as TicketStatus]
                : null
            }
          />
        </>
      );
    case "priority_changed":
      return (
        <>
          {event.actorType === "system" ? "set priority" : "changed priority"}{" "}
          <ValueChange
            from={
              event.fromValue
                ? TICKET_PRIORITY_LABELS[event.fromValue as TicketPriority]
                : null
            }
            to={
              event.toValue
                ? TICKET_PRIORITY_LABELS[event.toValue as TicketPriority]
                : null
            }
          />
        </>
      );
    case "category_changed":
      return (
        <>
          {event.actorType === "system" ? "set category" : "changed category"}{" "}
          <ValueChange
            from={
              event.fromValue
                ? TICKET_CATEGORY_LABELS[event.fromValue as TicketCategory]
                : null
            }
            to={
              event.toValue
                ? TICKET_CATEGORY_LABELS[event.toValue as TicketCategory]
                : null
            }
          />
        </>
      );
    case "assignee_changed":
      return event.toValue ? (
        <>
          {event.fromValue ? "reassigned the ticket " : "assigned the ticket "}
          <ValueChange from={event.fromValue} to={event.toValue} />
        </>
      ) : (
        <>
          unassigned <span className="text-foreground">{event.fromValue}</span>
        </>
      );
    case "response_updated":
      return event.toValue ? (
        <>
          {event.fromValue
            ? "edited the message to the author"
            : "sent a message to the author"}
        </>
      ) : (
        <>removed the message to the author</>
      );
  }
}
