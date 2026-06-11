import { toast } from "sonner";

const SAVED_BY_CONTEXT = {
  timeline: [
    "Esse momento ficou guardado para sempre ♥",
    "Mais um capítulo salvo na nossa história",
    "Esse dia especial está guardado com carinho",
  ],
  stats: [
    "Nossos números de amor foram atualizados ♥",
    "Cada estatística conta a nossa história",
  ],
  settings: [
    "Nossa história foi atualizada com amor ♥",
    "Tudo guardado — do jeitinho que a gente quer",
    "Configurações salvas no coração do site",
  ],
  places: [
    "Mais um lugar especial na memória ♥",
    "Esse cantinho ficou guardado para sempre",
  ],
  memories: [
    "Envelope guardado com todo carinho ♥",
    "Mais uma memória na nossa caixa",
  ],
  gallery: [
    "Foto guardada no nosso álbum ♥",
    "Mais um instante salvo para sempre",
  ],
  default: [
    "Guardado com carinho ♥",
    "Salvo no coração da nossa história",
    "Pronto — com todo amor",
  ],
} as const;

export type RomanticSaveContext = keyof typeof SAVED_BY_CONTEXT;

function pickMessage(context: RomanticSaveContext): string {
  const pool = SAVED_BY_CONTEXT[context] ?? SAVED_BY_CONTEXT.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function toastRomanticSave(context: RomanticSaveContext = "default") {
  toast.success(pickMessage(context), {
    description: "Tudo certo por aqui.",
  });
}
