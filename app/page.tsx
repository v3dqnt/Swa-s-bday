import Experience from "@/components/Experience";
import Countdown from "@/components/Countdown";
import { UNLOCK_AT } from "@/content/unlock";

// Decided per request on the server: the countdown until UNLOCK_AT, then the story.
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  // Opening early for a test run: set PREVIEW_KEY in Vercel and visit /?preview=<key>.
  const key = process.env.PREVIEW_KEY;
  const now = Date.now();
  if (now < UNLOCK_AT && !(key && preview === key)) return <Countdown unlockAt={UNLOCK_AT} serverNow={now} />;
  return <Experience />;
}
