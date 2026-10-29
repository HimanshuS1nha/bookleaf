const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDate = (value: string) => {
  // Date-only strings ("2026-10-28") would otherwise be read as UTC midnight
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return dateFormatter.format(date);
};

export const formatDateTime = (value: string) =>
  dateTimeFormatter.format(new Date(value));

export const formatShortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
