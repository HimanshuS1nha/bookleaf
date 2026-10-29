"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCwIcon, SparklesIcon, UserRoundCheckIcon } from "lucide-react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TicketActivityStream } from "@/components/admin/ticket-activity-stream";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/tickets/ticket-status-badge";

import { apiFetch } from "@/lib/api-fetch";
import {
  formatDate,
  formatDateTime,
  formatShortId,
  getInitials,
} from "@/lib/format";
import { cn } from "@/lib/utils";

import { API_ROUTES } from "@/constants/api-routes";
import {
  GENERAL_TICKET_LABEL,
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/constants/ticket";

import { adminQueries } from "@/queries/admin.queries";
import { adminTicketQueries } from "@/queries/admin-ticket.queries";

import { AdminTicketDetailType } from "@/types";

// Matches the API rule: the author must get a reply before a ticket is finished
const STATUSES_REQUIRING_RESPONSE: TicketStatus[] = ["resolved", "closed"];

// Base UI's Select can't use null as an item value, so "Unassigned" gets a sentinel
const UNASSIGNED = "unassigned";

type TicketFormValues = {
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo: string | null;
  responseMessage: string;
};

const toFormValues = (ticket: AdminTicketDetailType): TicketFormValues => ({
  status: ticket.status,
  priority: ticket.priority,
  category: ticket.category,
  assignedTo: ticket.assignee?.id ?? null,
  responseMessage: ticket.responseMessage ?? "",
});

// Only changed fields are sent, so a save never overwrites untouched ones
const getChanges = (values: TicketFormValues, saved: TicketFormValues) =>
  Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => value !== saved[key as keyof TicketFormValues],
    ),
  ) as Partial<TicketFormValues>;

const needsResponse = (values: TicketFormValues) =>
  STATUSES_REQUIRING_RESPONSE.includes(values.status) &&
  !values.responseMessage.trim();

export function AdminTicketWorkspace({
  ticket,
  currentAdminId,
}: {
  ticket: AdminTicketDetailType;
  currentAdminId: string;
}) {
  const queryClient = useQueryClient();

  const savedValues = toFormValues(ticket);

  const { data: adminsData } = useQuery(adminQueries.all());
  const admins = adminsData?.admins ?? [];

  const { data: notesData } = useQuery(adminTicketQueries.notes(ticket.id));

  const saveTicket = useMutation({
    mutationFn: (changes: Partial<TicketFormValues>) =>
      apiFetch<{ ticket: AdminTicketDetailType }>(
        API_ROUTES.admin.ticket(ticket.id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        },
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(
        adminTicketQueries.detail(ticket.id).queryKey,
        data,
      );
      queryClient.invalidateQueries({
        queryKey: [...adminTicketQueries.root(), "list"],
      });
      // The save recorded new history entries
      queryClient.invalidateQueries({
        queryKey: adminTicketQueries.activity(ticket.id).queryKey,
      });
      // The saved ticket becomes the new baseline, which clears the unsaved bar
      form.reset(toFormValues(data.ticket));
      toast.success("Ticket updated");
    },
    onError: (error) => toast.error(error.message),
  });

  // Drafts against the saved category, so an override should be saved first
  const regenerateDraft = useMutation({
    mutationFn: () =>
      apiFetch<{ ticket: AdminTicketDetailType }>(
        API_ROUTES.admin.ticketAiDraft(ticket.id),
        { method: "POST" },
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(
        adminTicketQueries.detail(ticket.id).queryKey,
        data,
      );
      toast.success("New draft ready");
    },
    onError: (error) => toast.error(error.message),
  });

  const draftButtonLabel = regenerateDraft.isPending
    ? "Drafting…"
    : ticket.aiResponse
      ? "Regenerate"
      : "Generate draft";

  const form = useForm({
    // While untouched, the form follows these when the ticket refetches
    defaultValues: savedValues,
    onSubmit: ({ value }) =>
      saveTicket.mutateAsync(getChanges(value, savedValues)).catch(() => {}),
  });

  const values = useStore(form.store, (state) => state.values);
  const isDirty = useStore(form.store, (state) => !state.isDefaultValue);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isMissingResponse = needsResponse(values);

  const assignToMe = () => form.setFieldValue("assignedTo", currentAdminId);

  const currentStageIndex = TICKET_STATUSES.indexOf(values.status);

  const statusItems = TICKET_STATUSES.map((status) => ({
    value: status,
    label: TICKET_STATUS_LABELS[status],
  }));
  const priorityItems = TICKET_PRIORITIES.map((priority) => ({
    value: priority,
    label: TICKET_PRIORITY_LABELS[priority],
  }));
  const categoryItems = TICKET_CATEGORIES.map((category) => ({
    value: category,
    label: TICKET_CATEGORY_LABELS[category],
  }));
  const assigneeItems = [
    { value: UNASSIGNED, label: "Unassigned" },
    // The saved assignee may be missing until the admin list loads
    ...(ticket.assignee &&
    !admins.some((admin) => admin.id === ticket.assignee?.id)
      ? [{ value: ticket.assignee.id, label: ticket.assignee.name }]
      : []),
    ...admins.map((admin) => ({
      value: admin.id,
      label: admin.id === currentAdminId ? `${admin.name} (you)` : admin.name,
    })),
  ];

  return (
    <div className="pb-24">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
            <span className="text-foreground">{formatShortId(ticket.id)}</span>
            <span>Opened {formatDateTime(ticket.createdAt)}</span>
            <span>{ticket.book?.title ?? GENERAL_TICKET_LABEL}</span>
          </div>
          {values.assignedTo !== currentAdminId && (
            <Button variant="outline" onClick={assignToMe}>
              <UserRoundCheckIcon data-icon="inline-start" />
              Assign to me
            </Button>
          )}
        </div>

        <h1 className="mt-3 font-serif text-3xl leading-tight font-medium tracking-tight text-balance">
          {ticket.subject}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
          <span className="text-sm text-muted-foreground">
            {TICKET_CATEGORY_LABELS[ticket.category]}
          </span>
        </div>

        <ol
          aria-label="Ticket progress"
          className="mt-6 flex items-center gap-2"
        >
          {TICKET_STATUSES.map((status, index) => (
            <li
              key={status}
              aria-current={index === currentStageIndex ? "step" : undefined}
              className="flex flex-1 flex-col gap-2"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  index <= currentStageIndex ? "bg-primary" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "font-mono text-[0.7rem] tracking-wide uppercase",
                  index === currentStageIndex
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {TICKET_STATUS_LABELS[status]}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="flex flex-col gap-6 lg:order-last">
          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <form.Field name="status">
                {(field) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="ticket-status">State</FieldLabel>
                    <Select
                      items={statusItems}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value && field.handleChange(value)
                      }
                    >
                      <SelectTrigger id="ticket-status" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="priority">
                {(field) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="ticket-priority">Priority</FieldLabel>
                    <Select
                      items={priorityItems}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value && field.handleChange(value)
                      }
                    >
                      <SelectTrigger
                        id="ticket-priority"
                        className="h-9 w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="category">
                {(field) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="ticket-category">Category</FieldLabel>
                    <Select
                      items={categoryItems}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value && field.handleChange(value)
                      }
                    >
                      <SelectTrigger
                        id="ticket-category"
                        className="h-9 w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="assignedTo">
                {(field) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="ticket-assignee">
                      Assigned to
                    </FieldLabel>
                    <Select
                      items={assigneeItems}
                      value={field.state.value ?? UNASSIGNED}
                      onValueChange={(value) =>
                        value &&
                        field.handleChange(value === UNASSIGNED ? null : value)
                      }
                    >
                      <SelectTrigger
                        id="ticket-assignee"
                        className="h-9 w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assigneeItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <Separator />

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-muted-foreground">About</dt>
                <dd className="text-right">
                  {ticket.book ? (
                    <>
                      {ticket.book.title}
                      <span className="block font-mono text-xs text-muted-foreground">
                        {ticket.book.isbn}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {ticket.book.status}
                      </span>
                    </>
                  ) : (
                    GENERAL_TICKET_LABEL
                  )}
                </dd>
                <dt className="text-muted-foreground">Opened</dt>
                <dd className="text-right">
                  {formatDateTime(ticket.createdAt)}
                </dd>
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="text-right">
                  {formatDateTime(ticket.updatedAt)}
                </dd>
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle>Requested by</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(ticket.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{ticket.author.name}</p>
                  <a
                    href={`mailto:${ticket.author.email}`}
                    className="block truncate text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {ticket.author.email}
                  </a>
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="text-right font-mono text-xs leading-5">
                  {ticket.author.phone}
                </dd>
                <dt className="text-muted-foreground">City</dt>
                <dd className="text-right">{ticket.author.city}</dd>
                <dt className="text-muted-foreground">Author since</dt>
                <dd className="text-right">
                  {formatDate(ticket.author.joinedDate)}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle>Request</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="fulfillment">
            <TabsList variant="line" className="w-full justify-start border-b">
              <TabsTrigger value="fulfillment" className="flex-none px-3">
                Fulfillment
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-none px-3">
                Activity
                {notesData && notesData.notes.length > 0 && (
                  <span
                    title="Work notes"
                    className="rounded-full bg-muted px-1.5 font-mono text-[0.7rem]"
                  >
                    {notesData.notes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fulfillment" className="pt-4">
              <div className="flex flex-col gap-5">
                {ticket.aiResponse ? (
                  <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                        <SparklesIcon
                          aria-hidden
                          className="size-4 text-primary"
                        />
                        AI suggested reply
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={regenerateDraft.isPending}
                          onClick={() => regenerateDraft.mutate()}
                        >
                          <RefreshCwIcon
                            data-icon="inline-start"
                            className={cn(
                              regenerateDraft.isPending && "animate-spin",
                            )}
                          />
                          {draftButtonLabel}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            values.responseMessage === ticket.aiResponse
                          }
                          onClick={() =>
                            form.setFieldValue(
                              "responseMessage",
                              ticket.aiResponse ?? "",
                            )
                          }
                        >
                          Use this draft
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {ticket.aiResponse}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
                    <p className="text-sm text-muted-foreground">
                      No AI suggestion yet. It may still be generating, or the
                      AI service was unavailable. You can try again or write the
                      reply yourself below.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={regenerateDraft.isPending}
                      onClick={() => regenerateDraft.mutate()}
                    >
                      <SparklesIcon
                        data-icon="inline-start"
                        className={cn(
                          regenerateDraft.isPending && "animate-pulse",
                        )}
                      />
                      {draftButtonLabel}
                    </Button>
                  </div>
                )}

                <form.Field name="responseMessage">
                  {(field) => (
                    <Field data-invalid={isMissingResponse} className="gap-1.5">
                      <FieldLabel htmlFor="fulfillment-message">
                        Message to author
                      </FieldLabel>
                      <Textarea
                        id="fulfillment-message"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        maxLength={5000}
                        placeholder="Write the reply the author will see on their ticket"
                        aria-invalid={isMissingResponse || undefined}
                        className="min-h-40 bg-background leading-relaxed"
                      />
                      <FieldDescription
                        className={cn(
                          "text-xs",
                          isMissingResponse && "text-chart-1",
                        )}
                      >
                        {isMissingResponse
                          ? `A message is required to set the ticket to ${TICKET_STATUS_LABELS[values.status].toLowerCase()}.`
                          : "Visible to the author. Saved with the rest of your changes."}
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="pt-4">
              <TicketActivityStream
                ticketId={ticket.id}
                authorName={ticket.author.name}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {isDirty && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <div className="flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-lg border bg-popover px-4 py-3 shadow-lg">
            <p className="text-sm">
              {isMissingResponse
                ? "Add a message to the author before saving"
                : "You have unsaved changes"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => form.reset()}
              >
                Discard
              </Button>
              <Button
                disabled={isMissingResponse || isSubmitting}
                onClick={() => form.handleSubmit()}
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
