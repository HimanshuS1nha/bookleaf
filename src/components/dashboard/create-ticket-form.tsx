"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmitEvent } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { apiFetch } from "@/lib/api-fetch";

import {
  createTicketValidator,
  CreateTicketValidatorType,
} from "@/validators/create-ticket.validator";

import { API_ROUTES } from "@/constants/api-routes";
import { ROUTES } from "@/constants/routes";
import { GENERAL_TICKET_LABEL } from "@/constants/ticket";

import { bookQueries } from "@/queries/book.queries";
import { ticketQueries } from "@/queries/ticket.queries";

import { AuthorTicketType } from "@/types";

// Base UI's Select can't use null as an item value, so "General" gets a sentinel
const GENERAL = "general";

const defaultValues: CreateTicketValidatorType = {
  bookId: null,
  subject: "",
  description: "",
};

export function CreateTicketForm({ authorId }: { authorId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: booksData, isPending: isBooksPending } = useQuery(
    bookQueries.all(authorId),
  );
  const bookItems = [
    { value: GENERAL, label: GENERAL_TICKET_LABEL },
    ...(booksData?.books ?? []).map((book) => ({
      value: book.id,
      label: book.title,
    })),
  ];

  const createTicket = useMutation({
    mutationFn: (values: CreateTicketValidatorType) =>
      apiFetch<{ ticket: AuthorTicketType }>(
        API_ROUTES.authors.tickets(authorId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      ),
    onSuccess: async ({ ticket }) => {
      // Cached ticket lists no longer include the new ticket
      await queryClient.invalidateQueries({
        queryKey: ticketQueries.root(authorId),
      });
      router.push(ROUTES.tickets.detail(ticket.id));
    },
  });

  const form = useForm({
    defaultValues,
    // Same schema the API validates with, so errors show before a round trip
    validators: { onSubmit: createTicketValidator },
    onSubmit: ({ value }) =>
      createTicket
        .mutateAsync(createTicketValidator.parse(value))
        .catch(() => {}),
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <form.Field name="bookId">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>What is this about?</FieldLabel>
              <Select
                items={bookItems}
                value={field.state.value ?? GENERAL}
                onValueChange={(value) =>
                  value && field.handleChange(value === GENERAL ? null : value)
                }
              >
                <SelectTrigger
                  id={field.name}
                  disabled={isBooksPending}
                  className="h-10 w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bookItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Pick a book, or general for questions about your account,
                payouts or our services.
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Field name="subject">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Subject</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  maxLength={255}
                  placeholder="e.g. Royalty statement missing for March"
                  aria-invalid={isInvalid || undefined}
                  className="h-10"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="description">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  maxLength={5000}
                  rows={7}
                  placeholder="Tell us what happened, with any dates, order ids or platforms that help us look into it."
                  aria-invalid={isInvalid || undefined}
                  className="min-h-36 leading-relaxed"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        {/* Placeholder only: files aren't stored or sent to the API yet */}
        <Field>
          <FieldLabel htmlFor="attachments">Attachments</FieldLabel>
          <Input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept="image/*,.pdf"
            className="h-10 py-1.5 file:mr-3 file:h-7 file:rounded-md file:bg-muted file:px-2.5"
          />
          <FieldDescription>
            Optional. Screenshots or documents that help explain the issue.
          </FieldDescription>
        </Field>

        {createTicket.error && (
          <FieldError>{createTicket.error.message}</FieldError>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={ROUTES.tickets.list}
            className={buttonVariants({
              variant: "ghost",
              size: "lg",
              className: "h-10 px-4",
            })}
          >
            Cancel
          </Link>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-10 px-4 text-[0.95rem]"
              >
                {isSubmitting ? "Submitting…" : "Submit ticket"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  );
}
