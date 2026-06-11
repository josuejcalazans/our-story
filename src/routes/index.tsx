import { createFileRoute } from "@tanstack/react-router";
import OurStory from "@/components/OurStory";
import PageGate from "@/components/PageGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Our Story" },
      { name: "description", content: "Uma jornada através da nossa história — preparada especialmente para você." },
      { property: "og:title", content: "Our Story" },
      { property: "og:description", content: "Preparei algo especial para você." },
    ],
  }),
  component: () => (
    <PageGate>
      <OurStory />
    </PageGate>
  ),
});
