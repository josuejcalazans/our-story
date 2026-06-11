import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CinematicIntro, { STORY_LOADER_MIN_MS } from "@/components/story/CinematicIntro";
import StoryWelcomeScreen from "@/components/story/StoryWelcomeScreen";
import { stopHeartbeatAudioSession } from "@/lib/heartbeat-audio-session";
import { preloadStoryAssets } from "@/lib/preload-story-assets";
import { useSettings, useGallery } from "@/lib/use-site-content";

export { STORY_LOADER_MIN_MS };

type Phase = "cinematic" | "welcome";

export default function StoryIntroSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("cinematic");
  const { data: settings } = useSettings();
  const { data: gallery } = useGallery();

  useEffect(() => () => stopHeartbeatAudioSession(), []);

  useEffect(() => {
    void preloadStoryAssets({
      musicUrl: settings?.music_url,
      galleryImageUrls: (gallery ?? []).map((g) => g.image_url),
    });
  }, [settings?.music_url, gallery]);

  const handleWelcomeReady = () => {
    stopHeartbeatAudioSession();
    onComplete();
  };

  return (
    <AnimatePresence mode="wait">
      {phase === "cinematic" ? (
        <motion.div
          key="cinematic"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="min-h-[100svh]"
        >
          <CinematicIntro onComplete={() => setPhase("welcome")} />
        </motion.div>
      ) : (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="min-h-[100svh]"
        >
          <StoryWelcomeScreen
            herName={settings?.her_name}
            musicUrl={settings?.music_url}
            onReady={handleWelcomeReady}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
