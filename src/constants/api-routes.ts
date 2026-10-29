export const API_ROUTES = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  admin: {
    auth: {
      login: "/admin/auth/login",
      me: "/admin/auth/me",
    },
    admins: "/admin/admins",
    tickets: "/admin/tickets",
    ticket: (ticketId: string) => `/admin/tickets/${ticketId}`,
    ticketNotes: (ticketId: string) => `/admin/tickets/${ticketId}/notes`,
    ticketActivity: (ticketId: string) => `/admin/tickets/${ticketId}/activity`,
    ticketAiDraft: (ticketId: string) => `/admin/tickets/${ticketId}/ai-draft`,
  },
  authors: {
    books: (authorId: string) => `/authors/${authorId}/books`,
    tickets: (authorId: string) => `/authors/${authorId}/tickets`,
    ticket: (authorId: string, ticketId: string) =>
      `/authors/${authorId}/tickets/${ticketId}`,
  },
};
