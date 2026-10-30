// When the site opens: midnight at the start of her birthday, India time.
// Until then visitors see a countdown (components/Countdown.tsx). The check runs on
// the server (app/page.tsx), so changing a phone's clock doesn't open it early.
export const UNLOCK_AT = Date.parse("2026-11-01T00:00:00+05:30");
