import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import { ArrowRight, CheckCircle, MapPin, Phone, Star } from 'lucide-react';
import { Product, Service } from '../types';
import LogoAnalei from './LogoAnalei';

type Review = {
  name: string;
  age: string;
  initial: string;
  color: string;
  text: string;
};

type PremiumScrollLandingProps = {
  onOpenBooking: () => void;
  reviews: Review[];
  services: Service[];
  products: Product[];
};

const FRAME_COUNT = 90;
const FRAME_SPEED = 2.05;

const framePath = (index: number) => `/scroll-frames/frame_${String(index + 1).padStart(4, '0')}.webp`;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value), 3);
const easeInOut = (value: number) => {
  const t = clamp(value);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};
const money = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

function cleanText(value: string) {
  return value
    .replaceAll('\u00c3\u00a9', 'e')
    .replaceAll('\u00c3\u00a1', 'a')
    .replaceAll('\u00c3\u00ad', 'i')
    .replaceAll('\u00c3\u00b3', 'o')
    .replaceAll('\u00c3\u00ba', 'u')
    .replaceAll('\u00c3\u00b1', 'n')
    .replaceAll('\u00c3\u2030', 'E')
    .replaceAll('\u00c3\u0192\u00c2\u00a9', 'e')
    .replaceAll('\u00c3\u0192\u00c2\u00a1', 'a')
    .replaceAll('\u00c3\u0192\u00c2\u00ad', 'i')
    .replaceAll('\u00c3\u0192\u00c2\u00b3', 'o')
    .replaceAll('\u00c3\u0192\u00c2\u00ba', 'u')
    .replaceAll('\u00c3\u0192\u00c2\u00b1', 'n')
    .replaceAll('\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c2\u00a2', '-')
    .replaceAll('\u00c2', '');
}

export default function PremiumScrollLanding({ onOpenBooking, reviews, services, products }: PremiumScrollLandingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const frames = useMemo(() => Array.from({ length: FRAME_COUNT }, (_, index) => framePath(index)), []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.96, touchMultiplier: 1.1 });
    let raf = 0;
    const animate = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    imagesRef.current = frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }, [frames]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = scrollRef.current;
    if (!canvas || !section) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let raf = 0;
    const draw = () => {
      const total = section.offsetHeight - window.innerHeight;
      const nextProgress = clamp((window.scrollY - section.offsetTop) / total);
      setProgress(nextProgress);

      const ratio = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const frameProgress = clamp(nextProgress * FRAME_SPEED);
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(frameProgress * (FRAME_COUNT - 1)));
      const img = imagesRef.current[frameIndex];
      if (img?.complete) {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const x = (width - img.naturalWidth * scale) / 2;
        const y = (height - img.naturalHeight * scale) / 2;
        context.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
      }

      const reveal = nextProgress < 0.06 ? nextProgress / 0.06 * 145 : 145;
      canvas.style.clipPath = `circle(${reveal}% at 50% 52%)`;
      raf = requestAnimationFrame(draw);
    };

    const first = imagesRef.current[0];
    if (first) first.onload = draw;
    window.addEventListener('scroll', draw, { passive: true });
    window.addEventListener('resize', draw);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', draw);
      window.removeEventListener('resize', draw);
    };
  }, []);

  const canvasClip = progress < 0.06 ? `circle(${progress / 0.06 * 145}% at 50% 52%)` : 'circle(145% at 50% 52%)';
  const heroText = easeOut((progress - 0.08) / 0.25);
  const marqueeProgress = clamp(progress / 0.82, 0, 1);
  const marqueeOpacity = 1 - easeInOut((progress - 0.82) / 0.14);
  const marqueeX = -marqueeProgress * 34;
  const shownServices = services.slice(0, 8);
  const shownProducts = products.slice(0, 3);

  return (
    <div className="bg-[oklch(98.7%_0.008_25)] text-[#2d2522]">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#eadce0] bg-[oklch(98.7%_0.008_25)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-10">
          <a href="#hero" className="transition-opacity hover:opacity-80">
            <LogoAnalei />
          </a>
          <div className="hidden items-center gap-7 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 md:flex">
            <a href="#services" className="transition-colors hover:text-[#9f6f79]">Servicios</a>
            <a href="#products" className="transition-colors hover:text-[#9f6f79]">Productos</a>
            <a href="#reviews" className="transition-colors hover:text-[#9f6f79]">Resenas</a>
            <a href="#contact" className="transition-colors hover:text-[#9f6f79]">Contacto</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/" className="hidden rounded-full border border-[#eadce0] bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#7f5861] transition-all hover:border-[#9f6f79] md:inline-flex">
              Admin
            </a>
            <button onClick={onOpenBooking} className="rounded-full bg-[#9f6f79] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#7f5861]">
              Reservar
            </button>
          </div>
        </div>
      </nav>

      <section id="hero" className="flex h-screen items-end overflow-hidden px-5 pb-12 pt-28 md:px-10 md:pb-16">
        <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-[0.58fr_0.42fr] md:items-end">
          <div className="max-w-[40vw] min-w-[320px]">
            <p className="mb-5 text-[11px] font-black uppercase tracking-[0.34em] text-[#9f6f79]">Analei / Sant Jordi</p>
            <h1 className="font-serif text-[12rem] font-bold leading-[0.78] tracking-normal text-[#2d2522] max-xl:text-[10rem] max-lg:text-[7rem] max-sm:text-[4.8rem]">
              Belleza en movimiento
            </h1>
          </div>
          <div className="ml-auto max-w-[38vw] text-right max-md:max-w-full">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-stone-500">Scroll para ver</p>
          </div>
        </div>
      </section>

      <section ref={scrollRef} className="relative h-[340vh] bg-[oklch(98.7%_0.008_25)] text-[#2d2522]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ clipPath: canvasClip }} aria-label="Animacion controlada por scroll" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,246,0.82),rgba(255,248,246,0.18),rgba(230,214,219,0.78))]" />

          <div className="pointer-events-none absolute inset-x-0 top-[10vh] overflow-hidden whitespace-nowrap" style={{ opacity: marqueeOpacity }}>
            <p className="font-serif text-[11vw] font-bold leading-none text-[#9f6f79]/15" style={{ transform: `translate3d(${marqueeX}vw,0,0)` }}>
              ANALEI BEAUTY STUDIO - COLOR CORTE CUIDADO -
            </p>
          </div>

          <div className="absolute left-[5vw] top-[27vh] max-w-[40vw] max-md:left-5 max-md:right-5 max-md:max-w-none" style={{ opacity: heroText, transform: `translate3d(${(1 - heroText) * -60}px,0,0)` }}>
            <p className="mb-5 text-[11px] font-black uppercase tracking-[0.32em] text-[#9f6f79]">Experiencia Analei</p>
            <h2 className="font-serif text-[5rem] font-bold leading-[0.88] text-[#2d2522] max-lg:text-[4rem] max-sm:text-[3.2rem]">
              Cuidar tu imagen tambien puede sentirse tranquilo.
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-stone-600">
              Una visita elegante, cercana y precisa: asesoramiento real, tecnica cuidada y resultados faciles de llevar.
            </p>
            <button onClick={onOpenBooking} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#eadce0] px-7 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#2d2522] hover:bg-white">
              Reservar cita <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[oklch(98.7%_0.008_25)] px-5 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#9f6f79]">Servicios</p>
              <h2 className="font-serif text-[4.8rem] font-bold leading-[0.9] text-[#2d2522] max-md:text-[3.6rem]">Carta esencial, acabados cuidados.</h2>
            </div>
            <button onClick={onOpenBooking} className="w-fit rounded-full bg-[#9f6f79] px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#7f5861]">
              Pedir cita
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {shownServices.map(service => (
              <article key={service.id} className="flex min-h-[285px] flex-col justify-between rounded-[1.25rem] border border-[#eadce0] bg-white p-6 shadow-[0_18px_45px_rgba(159,111,121,0.08)] transition-colors hover:bg-white">
                <div>
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9f6f79]">{cleanText(service.category)} / {cleanText(service.duration)}</p>
                  <h3 className="font-serif text-2xl font-bold leading-tight text-[#2d2522]">{cleanText(service.name)}</h3>
                  <p className="mt-5 line-clamp-4 text-sm leading-7 text-stone-600">{cleanText(service.description)}</p>
                </div>
                <div className="mt-7 flex items-center justify-between border-t border-stone-950/10 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{money(service.price)}</span>
                  <button onClick={onOpenBooking} className="text-xs font-black uppercase tracking-[0.14em] text-[#9f6f79]">Reservar</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="bg-[oklch(98.7%_0.008_25)] px-5 py-24 text-[#2d2522] md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#9f6f79]">Productos</p>
            <h2 className="font-serif text-[4.8rem] font-bold leading-[0.9] max-md:text-[3.6rem]">Seleccion para continuar el ritual en casa.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {shownProducts.map(product => (
              <article key={product.id} className="group overflow-hidden rounded-[1.4rem] border border-[#eadce0] bg-white shadow-[0_22px_60px_rgba(159,111,121,0.12)]">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={product.image} alt={cleanText(product.name)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9f6f79]">{cleanText(product.brand)}</p>
                  <h3 className="mt-3 font-serif text-2xl font-bold leading-tight">{cleanText(product.name)}</h3>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-stone-600">{cleanText(product.description)}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-[#eadce0] pt-4">
                    <span className="font-serif text-2xl font-bold">{money(product.price)}</span>
                    <button onClick={onOpenBooking} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#9f6f79]">
                      Consultar <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="bg-[oklch(98.7%_0.008_25)] px-5 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#9f6f79]">Resenas</p>
              <h2 className="font-serif text-[4.8rem] font-bold leading-[0.9] text-[#2d2522] max-md:text-[3.6rem]">Clientes que salen contentos y vuelven.</h2>
            </div>
            <div className="flex gap-1 text-amber-500">
              {[0, 1, 2, 3, 4].map(star => <Star key={star} className="h-5 w-5 fill-current" />)}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map(review => (
              <article key={review.name} className="flex min-h-[300px] flex-col justify-between rounded-[1.4rem] border border-stone-950/10 bg-white p-7 shadow-[0_22px_70px_rgba(33,27,22,0.06)]">
                <div>
                  <div className="mb-5 flex gap-1 text-amber-500">
                    {[0, 1, 2, 3, 4].map(star => <Star key={star} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-sm leading-7 text-stone-700">"{review.text}"</p>
                </div>
                <div className="mt-8 flex items-center gap-3 border-t border-stone-950/10 pt-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${review.color} text-sm font-black text-white`}>{review.initial}</div>
                  <div>
                    <h3 className="text-sm font-black text-[#2d2522]">{review.name}</h3>
                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">5/5 - {review.age}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[oklch(98.7%_0.008_25)] px-5 py-24 text-[#2d2522] md:px-10">
        <div className="mx-auto max-w-7xl border-y border-[#eadce0] py-16">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#9f6f79]">Contacto</p>
              <h2 className="font-serif text-[4.8rem] font-bold leading-[0.9] max-md:text-[3.6rem]">Estamos en Sant Jordi.</h2>
            </div>
            <button onClick={onOpenBooking} className="inline-flex w-fit items-center gap-2 rounded-full bg-[#9f6f79] px-7 py-3 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#7f5861]">
              Reservar cita <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid overflow-hidden rounded-[1.6rem] border border-[#eadce0] bg-white shadow-[0_24px_70px_rgba(159,111,121,0.12)] lg:grid-cols-[0.64fr_0.36fr]">
            <div className="min-h-[420px] bg-[#eadce0]">
              <iframe
                title="Mapa de Analei"
                src="https://www.google.com/maps?q=Ctra.%20al%20Aeropuerto%2C%20Bajo%2054%2C%2007817%20Sant%20Jordi%20de%20ses%20Salines%2C%20Illes%20Balears&output=embed"
                className="h-full min-h-[420px] w-full border-0 grayscale-[18%]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="flex flex-col justify-between p-7 md:p-9">
              <div className="space-y-7">
                <a href="https://www.google.com/maps/search/?api=1&query=Ctra.%20al%20Aeropuerto%2C%20Bajo%2054%2C%2007817%20Sant%20Jordi%20de%20ses%20Salines%2C%20Illes%20Balears" target="_blank" rel="noreferrer" className="group flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eadce0] text-[#7f5861]"><MapPin className="h-5 w-5" /></span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Direccion</span>
                    <span className="mt-2 block text-lg font-black leading-7 group-hover:text-[#9f6f79]">Ctra. al Aeropuerto, Bajo 54, 07817 Sant Jordi de ses Salines, Illes Balears</span>
                  </span>
                </a>
                <a href="tel:+34971396593" className="group flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eadce0] text-[#7f5861]"><Phone className="h-5 w-5" /></span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Telefono</span>
                    <span className="mt-2 block text-2xl font-black group-hover:text-[#9f6f79]">971 39 65 93</span>
                  </span>
                </a>
              </div>
              <div className="mt-10 border-t border-[#eadce0] pt-6">
                <p className="text-sm leading-7 text-stone-600">Abre el mapa para calcular ruta o llámanos directamente para resolver dudas antes de reservar.</p>
                <a href="https://www.google.com/maps/search/?api=1&query=Ctra.%20al%20Aeropuerto%2C%20Bajo%2054%2C%2007817%20Sant%20Jordi%20de%20ses%20Salines%2C%20Illes%20Balears" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#9f6f79]">
                  Abrir ruta <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-persist="true" className="bg-[oklch(98.7%_0.008_25)] px-5 py-20 text-[#2d2522] md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-3xl font-serif text-[4.6rem] font-bold leading-[0.9] max-md:text-[3.2rem]">Reserva una cita y cuentanos que quieres cambiar.</h2>
          <button onClick={onOpenBooking} className="inline-flex w-fit items-center gap-2 rounded-full bg-[#9f6f79] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#7f5861]">
            Reservar ahora <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="bg-[#2d2522] px-5 py-14 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/15 pb-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="mb-6 inline-flex rounded-2xl bg-white px-4 py-3">
                <LogoAnalei />
              </div>
              <p className="max-w-sm text-sm leading-7 text-white/65">
                Belleza, color y cuidado en Sant Jordi de ses Salines. Un espacio tranquilo para salir con una imagen facil de llevar.
              </p>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#e9c9d0]">Explorar</p>
              <div className="flex flex-col gap-3 text-sm font-bold text-white/70">
                <a href="#services" className="hover:text-white">Servicios</a>
                <a href="#products" className="hover:text-white">Productos</a>
                <a href="#reviews" className="hover:text-white">Resenas</a>
                <a href="#contact" className="hover:text-white">Contacto</a>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#e9c9d0]">Visitanos</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Ctra.%20al%20Aeropuerto%2C%20Bajo%2054%2C%2007817%20Sant%20Jordi%20de%20ses%20Salines%2C%20Illes%20Balears" target="_blank" rel="noreferrer" className="block text-sm font-bold leading-7 text-white/70 hover:text-white">
                Ctra. al Aeropuerto, Bajo 54, 07817 Sant Jordi de ses Salines
              </a>
              <a href="tel:+34971396593" className="mt-4 block text-xl font-black text-white">971 39 65 93</a>
            </div>

            <div className="md:text-right">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#e9c9d0]">Cita</p>
              <button onClick={onOpenBooking} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2d2522] hover:bg-[#eadce0]">
                Reservar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-7 text-xs font-bold uppercase tracking-[0.16em] text-white/45 md:flex-row md:items-center md:justify-between">
            <p>Analei Beauty Studio</p>
            <p>Sant Jordi de ses Salines, Illes Balears</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
