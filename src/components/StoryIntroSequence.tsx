import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StoryPreparingScreen from "@/components/StoryPreparingScreen";
import StoryHeartbeatLoader, { STORY_LOADER_MIN_MS } from "@/components/StoryHeartbeatLoader";
import { stopHeartbeatAudioSession } from "@/lib/heartbeat-audio-session";

export { STORY_LOADER_MIN_MS };

type Phase = "preparing" | "heart";

export default function StoryIntroSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("preparing");

  useEffect(() => () => stopHeartbeatAudioSession(), []);

  const handleHeartComplete = () => {
    stopHeartbeatAudioSession();
    onComplete();
  };

  return (
    <AnimatePresence mode="wait">
      {phase === "preparing" ? (
        <motion.div
          key="preparing"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-[100svh]"
        >
          <StoryPreparingScreen onReady={() => setPhase("heart")} />
        </motion.div>
      ) : (
        <motion.div
          key="heart"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="min-h-[100svh]"
        >
          <StoryHeartbeatLoader onComplete={handleHeartComplete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
