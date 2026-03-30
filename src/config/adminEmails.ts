const DEFAULT_ADMIN_EMAILS = ["saisumansamantaray184@gmail.com"];

export function getAdminEmails() {
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...DEFAULT_ADMIN_EMAILS, ...configured]);
}

export function isAdminEmail(email?: string) {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}
