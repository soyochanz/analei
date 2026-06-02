/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Appointment, Service, Product, Article } from './types';

// Manager/Admin Avatar URL directly from Google reference
export const ADMIN_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuAjRQePjl2vHiF7M4SnCbBhf-19dBT-577o-sOwyDzM1hDqcnQJCK-pz8IOgoyI7sjHZp0PwAV8C-RIDQhnXCUIALGRjuOfoGpIKjQ3Q9xzYP3j9szKs_jKdvmhTkOkI11AJ7iN2KUjX28-HpkdCu4PPVqIGzRBdG3ZpqNEsHwKd6TvJoVTrqeWlreKaxyZcP8Jc9lXoJG8RybN4TdpAKrosbxjgbz_bcmDGqNScFsKLgV76ZEsoxJePljySma9Xz5PO4nV_N8v73l2";

// Luminous beauty model URL directly from Google reference
export const LANDING_HERO_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuDyLiN_idBzb3wTmv40Hs6B9xkHAHeE1msweuzLui0_Df1JwtTnHyDZ5MhYnH0mpXrVqipdIvchhYAEHYL3XZCC4pF5YGQt1sa5hf7SM64EFawJJnIc4PYfP24VCSOd7U_Cj5kSTH04bXW2CyqPshoQ-__K-DBAHrpvGae9FNztIEijzdajGdizz7DoJtWEyM_vuD_yYbbb8XG_32HwirRRHqICLEWYPAa4tnN0y_carQhAAcCTKl_LCY1a470wT9lCjAbPTGybr4o2";

export const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Balayage y Corte Luxury',
    description: 'Técnica personalizada de balayage orgánico pintado a mano e idóneo para dar luz y movimiento natural a tu cabello. Incluye tratamiento de lavado de lujo, mascarilla regeneradora y corte profesional.',
    category: 'hair',
    duration: '150 min',
    price: 135,
    iconName: 'Scissors'
  },
  {
    id: 's2',
    name: 'Higiene Facial Profunda',
    description: 'Tratamiento de extracción profunda de impurezas y nutrición botánica diseñado para restaurar la estructura, elasticidad y tono luminoso natural de tu piel.',
    category: 'facials',
    duration: '60 min',
    price: 65,
    iconName: 'Sparkles'
  },
  {
    id: 's3',
    name: 'Manicura Spa de Lavanda',
    description: 'Tratamiento hidratante de uñas botánico, exfoliación con sales, masaje de manos completo con aceites esenciales, cuidado de cutículas y acabado en gel de alta duración.',
    category: 'nails',
    duration: '45 min',
    price: 35,
    iconName: 'Heart'
  },
  {
    id: 's4',
    name: 'Retoque de Color Orgánico',
    description: 'Revisión y cobertura de color en raíz utilizando pigmentos totalmente orgánicos sin amoníaco, preservando la hidratación y maximizando el brillo capilar.',
    category: 'hair',
    duration: '90 min',
    price: 55,
    iconName: 'Scissors'
  },
  {
    id: 's5',
    name: 'Terapia de Hidratación Profunda',
    description: 'Mascarilla capilar revitalizante de queratina pura y aceite de argán salvaje, potenciada con absorción asistida por microbruma templada.',
    category: 'hair',
    duration: '45 min',
    price: 45,
    iconName: 'Droplet'
  },
  {
    id: 's6',
    name: 'Masaje Facial por Acupresión',
    description: 'Reflexología facial para liberación de tensiones que drena toxinas, define el óvalo facial y alivia el estrés mental acumulado.',
    category: 'facials',
    duration: '30 min',
    price: 40,
    iconName: 'Smile'
  },
  {
    id: 's7',
    name: 'Pedicura Deluxe con Piedras Calientes',
    description: 'Ritual relajante que combina sales marinas, exfoliación natural, masaje profundo con piedras calientes volcánicas y esculpido de uñas de precisión.',
    category: 'nails',
    duration: '60 min',
    price: 45,
    iconName: 'Sparkles'
  },
  {
    id: 's8',
    name: 'Sesión de Bienestar de Lavanda',
    description: 'Masaje corporal relajante integral realizado con aceites templados de flores de lavanda e hilos florales de descompresión física para un alivio muscular completo.',
    category: 'wellness',
    duration: '90 min',
    price: 85,
    iconName: 'Flame'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  // Thursday, October 24, 24 (Matches screenshot main table)
  {
    id: 'a1',
    clientName: 'Lucía Castro',
    clientInitials: 'LC',
    service: 'Balayage y Corte Luxury',
    time: '10:00 AM',
    date: '2024-10-24',
    status: 'Confirmed',
    price: 135,
    avatarColor: 'bg-rose-50 text-[#da4d73] border border-rose-100'
  },
  {
    id: 'a2',
    clientName: 'Marta Gómez',
    clientInitials: 'MG',
    service: 'Higiene Facial Profunda',
    time: '12:30 PM',
    date: '2024-10-24',
    status: 'Pending',
    price: 65,
    avatarColor: 'bg-amber-50 text-amber-700 border border-amber-100'
  },
  {
    id: 'a3',
    clientName: 'Sofía Ruiz',
    clientInitials: 'SR',
    service: 'Manicura Spa de Lavanda',
    time: '02:00 PM',
    date: '2024-10-24',
    status: 'Confirmed',
    price: 35,
    avatarColor: 'bg-purple-50 text-[#a855f7] border border-purple-150'
  },
  {
    id: 'a4',
    clientName: 'Ana López',
    clientInitials: 'AL',
    service: 'Retoque de Color Orgánico',
    time: '04:30 PM',
    date: '2024-10-24',
    status: 'Confirmed',
    price: 55,
    avatarColor: 'bg-blue-50 text-blue-700 border border-blue-100'
  },

  // Oct 23rd
  {
    id: 'a5',
    clientName: 'Elena Vivas',
    clientInitials: 'EV',
    service: 'Sesión de Bienestar de Lavanda',
    time: '11:00 AM',
    date: '2024-10-23',
    status: 'Confirmed',
    price: 85,
    avatarColor: 'bg-pink-50 text-pink-600 border border-pink-100'
  },
  {
    id: 'a6',
    clientName: 'Clara Ortiz',
    clientInitials: 'CO',
    service: 'Pedicura Deluxe con Piedras Calientes',
    time: '03:00 PM',
    date: '2024-10-23',
    status: 'Confirmed',
    price: 45,
    avatarColor: 'bg-teal-50 text-teal-700 border border-teal-100'
  },

  // Oct 25th
  {
    id: 'a7',
    clientName: 'Beatriz Sanz',
    clientInitials: 'BS',
    service: 'Balayage y Corte Luxury',
    time: '09:30 AM',
    date: '2024-10-25',
    status: 'Confirmed',
    price: 135,
    avatarColor: 'bg-rose-50 text-[#da4d73] border border-rose-100'
  },
  {
    id: 'a8',
    clientName: 'Isabel Ferrer',
    clientInitials: 'IF',
    service: 'Masaje Facial por Acupresión',
    time: '01:00 PM',
    date: '2024-10-25',
    status: 'Pending',
    price: 40,
    avatarColor: 'bg-pink-100 text-pink-800'
  }
];

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'PhytoRx Combo Regenerador e Iluminador',
    brand: 'Lotus Professional',
    description: 'Fórmula científica avanzada que restaura la luminosidad natural del rostro, atenúa las manchas de pigmentación y purifica la dermis en profundidad manteniendo la hidratación óptima.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop',
    tag: 'RECOMENDADO',
    features: [
      'Ilumina y unifica el tono de la piel facial',
      'Combo de cuidado intensivo día y noche',
      'Apto para todo tipo de pieles, incluso sensibles'
    ],
    benefits: [
      'Marca Líder',
      'Resultados Visibles',
      'Seguro y Eficaz',
      'Testado en Clínica'
    ]
  },
  {
    id: 'p2',
    name: 'Limpiador Botánico Hidratante de Rosa Orgánica',
    brand: 'Aura & Bloom',
    description: 'Espuma facial extrasuave enriquecida con destilados puros de rosa búlgara orgánica. Limpia profundamente y restablece la barrera lipídica sin resecar.',
    price: 24.50,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop',
    tag: 'FÓRMULA ECO',
    features: [
      'Infundido con destilados de rosas 100% orgánicas',
      'Neutraliza los radicales libres y la polución urbana',
      'Preserva y equilibra el pH fisiológico de la piel'
    ],
    benefits: [
      'Alivio Aromático',
      'Bomba Hidratante',
      'Aprobado Vegano'
    ]
  },
  {
    id: 'p3',
    name: 'Sérum Antioxidante Elasticidad Avanzada',
    brand: 'Mary Care',
    description: 'Tratamiento corrector con alta concentración de Vitamina C y microesferas de Ácido Hialurónico para hidratar capas profundas y atenuar líneas de expresión.',
    price: 38.00,
    image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop',
    tag: 'ALTA COSMÉTICA',
    features: [
      'Complejo potenciador celular antifatiga',
      'Reafirma y redefine el contorno de cuello y rostro',
      'Textura premium de absorción ultra veloz'
    ],
    benefits: [
      'Grado Dermocosmético',
      'Activador Celular',
      'Sin Fragancias Artificiales'
    ]
  }
];

export const BEAUTY_ARTICLES: Article[] = [
  {
    id: 'art1',
    title: '5 Pasos Esenciales para una Piel Radiante y Luminosa',
    category: 'Skincare',
    readTime: '3 min de lectura',
    summary: 'Descubre los pasos clave que recomiendan los dermatólogos de cabecera para conseguir un rostro jugoso, revitalizado y lleno de luz de manera natural.',
    content: `Lograr un rostro saludable e iluminado no requiere una rutina interminable. Los especialistas coinciden en que priorizar estos pasos fundamentales produce beneficios inmediatos e infinitamente más duraderos:

1. **Limpieza Respetuosa:** Limpia tu rostro eliminando residuos de sudor, grasa o maquillaje sin arrastrar la barrera lipídica protectora. Opta por fórmulas sin sulfatos.
2. **Capas de Hidratación (Humectantes):** Utiliza ingredientes activos capaces de retener agua en las células, como el aloe vera puro o la glicerina botánica.
3. **Tratamiento Focalizado (Sérums):** Aplica gotitas de vitaminas concentradas específicas para atenuar imperfecciones, manchas o falta de elasticidad.
4. **Sellado de Hidratación:** Aplica un escudo hidratante o un aceite seco vegetal (squalane, jojoba) para crear un escudo oclusivo y evitar la deshidratación por evaporación.
5. **Protección Solar Diaria:** La radiación UV es el mayor causante de envejecimiento y manchas. Los protectores con filtros minerales o físicos son óptimos para proteger la dermis.`,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop',
    publishedDate: '2 Jun 2026'
  },
  {
    id: 'art2',
    title: 'Cómo Elegir el Sérum Perfecto para tu Tipo de Piel',
    category: 'Skincare',
    readTime: '4 min de lectura',
    summary: 'Las moléculas activas pueden abrumarte. Aquí tienes una guía clara y sencilla para elegir el sérum que tu piel realmente necesita para brillar.',
    content: `Los sérums contienen la mayor concentración de principios activos de cualquier cosmético. Elegir la combinación ganadora dependerá puramente del objetivo prioritario para tu piel:

- **Para líneas finas y textura desigual:** Busca fórmulas con Retinol o Bakuchiol (la alternativa vegana). Aceleran el recambio de las células cutáneas.
- **Para manchas oscuras y falta de luminosidad:** Elige Vitamina C o Niacinamida. Estos potentes antioxidantes neutralizan el estrés oxidativo de forma inmediata.
- **Para una deshidratación intensa:** El Ácido Hialurónico de diferentes pesos moleculares restaurará el volumen y la jugosidad desde el interior.
- **Para pieles reactivas o con rojeces:** La Centella Asiática (Cica) y la provitamina B5 (Pantenol) calmarán la inflamación de forma express.`,
    image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop',
    publishedDate: '28 May 2026'
  },
  {
    id: 'art3',
    title: 'Rutina Nocturna para un Rostro Despierto y Despejado',
    category: 'Skincare',
    readTime: '3 min de lectura',
    summary: 'Aprende a sincronizar tus productos cosméticos con el ciclo de regeneración celular nocturno de tu propio cuerpo.',
    content: `Mientras descansas, la piel activa sus mecanismos de autocuración celular, elevando la división celular y aumentando también la pérdida de humedad. Sincronizar tus aplicaciones con este ciclo corporal optimizará tus resultados:

1. **La Doble Limpieza:** Primero retira el maquillaje y grasa con un limpiador oleoso, y luego purifica con profundidad los poros con un limpiador acuoso de pH respetuoso.
2. **Renovación Exfoliante Suave:** Aplica un exfoliante químico suave (como ácido láctico) dos noches por semana para retirar las células muertas y habilitar el paso a la nueva dermis.
3. **Nutrición Celular Activa:** Aplica productos ricos en péptidos y antioxidantes para guiar la síntesis de colágeno.
4. **Barrera de Cierre:** Termina con una crema rica en ceramidas para evitar la deshidratación capilar mientras duermes.`,
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop',
    publishedDate: '24 May 2026'
  },
  {
    id: 'art4',
    title: 'Pinceles y Brochas 101: Usos y Beneficios Esenciales',
    category: 'Maquillaje',
    readTime: '2 min de lectura',
    summary: 'La sutil línea que separa un acabado amateur de uno sublime y profesional radica en el diseño y la densidad de tus pinceles.',
    content: `El uso de las herramientas adecuadas de diseño optimiza el producto sobrante y fusiona los pigmentos de tu base con absoluta suavidad:

- **La Brocha de Polvos:** Sus fibras grandes y aireadas esparcen el maquillaje de forma ultraligera para un efecto Photoshop suave.
- **La Brocha de Base:** Fibras de corte plano o redondeado densas para estirar polvos o cremas fluidas sin absorción excesiva.
- **La Brocha Difuminadora:** Cerdas finas y sueltas que degradan las líneas marcadas de las sombras de ojos.
- **El Pincel Biselado:** Fino y cortante, idóneo para trazar líneas simétricas con eyeliner.

*Práctica recomendada:* Lava tus brochas una vez por semana con jabón neutro para preservar la suavidad de las cerdas y evitar bacterias en el cutis.`,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
    publishedDate: '20 May 2026'
  }
];
