import { existsSync } from "node:fs";
import { join } from "node:path";
import { ScrollJourney } from "@/components/scroll-journey";

export default function Home() {
  const hasResume = existsSync(join(process.cwd(), "public", "liam-krivacic-resume.pdf"));
  return <ScrollJourney showResume={hasResume} />;
}
