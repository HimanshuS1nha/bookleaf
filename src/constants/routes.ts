export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  books: "/dashboard/books",
  tickets: {
    list: "/dashboard/tickets",
    new: "/dashboard/tickets/new",
    detail: (ticketId: string) => `/dashboard/tickets/${ticketId}`,
  },
  auth: {
    login: "/login",
    register: "/register",
  },
  admin: {
    dashboard: "/admin",
    login: "/admin/login",
    tickets: "/admin/tickets",
    ticket: (ticketId: string) => `/admin/tickets/${ticketId}`,
  },
};
