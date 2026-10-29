// Shared by the db schema, validators and UI so the enum values live in one place

export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export const TICKET_PRIORITIES = ["critical", "high", "medium", "low"] as const;

// Assigned by AI triage when a ticket is raised; admins can override it
export const TICKET_CATEGORIES = [
  "royalty_and_payments",
  "isbn_and_metadata",
  "printing_and_quality",
  "distribution_and_availability",
  "book_status_and_production_updates",
  "general_inquiry",
] as const;

export const TICKET_ACTIVITY_TYPES = [
  "created",
  "status_changed",
  "priority_changed",
  "category_changed",
  "assignee_changed",
  "response_updated",
] as const;

// "system" is automated work, like AI triage setting the priority
export const TICKET_ACTIVITY_ACTORS = ["author", "admin", "system"] as const;

// Admin-only filter on who a ticket is assigned to
export const TICKET_ASSIGNMENTS = ["all", "mine", "unassigned"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketAssignment = (typeof TICKET_ASSIGNMENTS)[number];
export type TicketActivityType = (typeof TICKET_ACTIVITY_TYPES)[number];
export type TicketActivityActor = (typeof TICKET_ACTIVITY_ACTORS)[number];

// Shown in place of a book title when a ticket isn't about a specific book
export const GENERAL_TICKET_LABEL = "General / account level";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  royalty_and_payments: "Royalty and payments",
  isbn_and_metadata: "ISBN and metadata issues",
  printing_and_quality: "Printing and quality",
  distribution_and_availability: "Distribution and availability",
  book_status_and_production_updates: "Book status and production updates",
  general_inquiry: "General inquiry",
};

export const TICKET_ASSIGNMENT_LABELS: Record<TicketAssignment, string> = {
  all: "Everyone",
  mine: "Assigned to me",
  unassigned: "Unassigned",
};

export const TICKETS_PAGE_SIZE = 20;
