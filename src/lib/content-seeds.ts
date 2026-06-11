/** Conteúdo inicial para popular o banco (lugares + memórias). */
export const SEED_PLACES = [
  { icon_name: "MapPin", icon: "📍", title: "Primeiro encontro", subtitle: "Onde tudo começou", sort_order: 1 },
  { icon_name: "Heart", icon: "💋", title: "Primeiro beijo", subtitle: "Mirante da cidade", sort_order: 2 },
  { icon_name: "Plane", icon: "✈️", title: "Primeira viagem", subtitle: "Praia inesquecível", sort_order: 3 },
  { icon_name: "Utensils", icon: "🍝", title: "Restaurante favorito", subtitle: "Nossa mesa de canto", sort_order: 4 },
  { icon_name: "Home", icon: "🏠", title: "Nosso lugar", subtitle: "Onde o tempo desacelera", sort_order: 5 },
  { icon_name: "Sunrise", icon: "🌅", title: "Pôr do sol favorito", subtitle: "Aquele que nunca esquecemos", sort_order: 6 },
] as const;

export const SEED_MEMORY_ENVELOPES = [
  {
    slug: "hard-days",
    icon_name: "Mail",
    icon: "💌",
    title: "Para os dias difíceis",
    message: "Respira. Eu tô aqui. Sempre.",
    is_easter_egg: false,
    sort_order: 1,
  },
  {
    slug: "dream-together",
    icon_name: "Star",
    icon: "🌟",
    title: "Para sonhar comigo",
    message: "Tem uma vida inteira nos esperando.",
    is_easter_egg: false,
    sort_order: 2,
  },
  {
    slug: "our-song",
    icon_name: "Music",
    icon: "🎶",
    title: "Nossa música",
    message: "Toca, fecha os olhos, e lembra de mim.",
    is_easter_egg: false,
    sort_order: 3,
  },
  {
    slug: "just-because",
    icon_name: "Flower2",
    icon: "🌹",
    title: "Só porque sim",
    message: "Você é a parte boa do meu dia.",
    is_easter_egg: false,
    sort_order: 4,
  },
] as const;
