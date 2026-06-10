import { createFileRoute } from "@tanstack/react-router";
import OurStory from "@/components/OurStory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Our Story ❤️" },
      { name: "description", content: "Uma jornada através da nossa história — preparada especialmente para você." },
      { property: "og:title", content: "Our Story ❤️" },
      { property: "og:description", content: "Preparei algo especial para você." },
    ],
  }),
  component: OurStory,
});
