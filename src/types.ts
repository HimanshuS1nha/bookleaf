import {
  TicketActivityActor,
  TicketActivityType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/constants/ticket";

import { Role } from "@/enums/role.enum";

export type AuthorType = {
  id: string;
  name: string;
  email: string;
  city: string;
  phone: string;
  joinedDate: string;
  role: Role.AUTHOR;
};

export type AdminType = {
  id: string;
  name: string;
  email: string;
  role: Role.ADMIN;
};

// Shapes returned by the author-facing API routes (dates arrive as ISO strings)

export type BookType = {
  id: string;
  title: string;
  isbn: string;
  genre: string;
  publicationDate: string | null;
  status: string;
  mrp: number | null;
  printPartner: string | null;
  availableOn: string[];
  createdAt: string;
  // null while the book is in production
  authorRoyaltyPerCopy: number | null;
  totalCopiesSold: number;
  royaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate: string | null;
};

// null book means a general / account level ticket
type TicketBookType = { id: string; title: string } | null;

export type AuthorTicketType = {
  id: string;
  bookId: string | null;
  book: TicketBookType;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  responseMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminTicketListItemType = {
  id: string;
  subject: string;
  book: TicketBookType;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string };
  assignee: { id: string; name: string } | null;
};

export type AdminTicketDetailType = {
  id: string;
  subject: string;
  description: string;
  book: { id: string; title: string; isbn: string; status: string } | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  responseMessage: string | null;
  aiResponse: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    joinedDate: string;
  };
  assignee: { id: string; name: string; email: string } | null;
};

export type TicketNoteType = {
  id: string;
  note: string;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
};

export type AdminListItemType = {
  id: string;
  name: string;
  email: string;
};

export type TicketActivityEntryType = {
  id: string;
  type: TicketActivityType;
  actorType: TicketActivityActor;
  // Status/priority values or message text; assignee changes arrive as names
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  actorAdmin: { id: string; name: string } | null;
};
