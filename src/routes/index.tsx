import { createFileRoute } from "@tanstack/react-router";
import OurStory from "@/components/OurStory";
import PageGate from "@/components/PageGate";
import { getSiteOgMeta } from "@/lib/site-meta.functions";

export const Route = createFileRoute("/")({
  loader: () => getSiteOgMeta(),
  head: ({ loaderData }) => {
    const herName = loaderData?.herName;
    const title = herName ? `Algo especial para ${herName}` : "Nossa História";
    const description = herName
      ? `${herName}, preparei algo só para você.`
      : "Uma jornada através da nossa história — preparada especialmente para você.";
    const ogImage = loaderData?.ogImage ?? "/og.svg";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: ogImage },
        { property: "og:image:type", content: "image/svg+xml" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: () => (
    <PageGate>
      <OurStory />
    </PageGate>
  ),
});
