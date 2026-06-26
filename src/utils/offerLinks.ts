// Helpers de link e logo de marca pras ofertas dos concorrentes.
// À prova de 404: usa páginas oficiais verificadas (mapa manual) ou cai numa
// busca honesta no Google — nunca a sourceUrl que a IA inventa (gera 404).

// Brand → domínio oficial — usado para logos (Clearbit) E links de busca
const BRAND_DOMAINS: Record<string, string> = {
  honda: 'honda.com.br', volkswagen: 'vw.com.br', vw: 'vw.com.br',
  fiat: 'fiat.com.br', chevrolet: 'chevrolet.com.br', hyundai: 'hyundai.com.br',
  nissan: 'nissan.com.br', jeep: 'jeep.com.br', renault: 'renault.com.br',
  toyota: 'toyota.com.br', mitsubishi: 'mitsubishimotors.com.br', ford: 'ford.com.br',
  peugeot: 'peugeot.com.br', citroen: 'citroen.com.br',
  byd: 'byd.com.br', gwm: 'gwmmotors.com.br',
  'caoa chery': 'caoachery.com.br', chery: 'caoachery.com.br',
  jac: 'jacmotors.com.br', 'jac motors': 'jacmotors.com.br',
  haval: 'gwmmotors.com.br', ora: 'gwmmotors.com.br',
  'gac motor': 'gacgroup.com', gac: 'gacgroup.com',
  jaecoo: 'omodajaecoo.com.br', omoda: 'omodajaecoo.com.br', 'omoda & jaecoo': 'omodajaecoo.com.br',
  'mg motor': 'mgmotoroficial.com.br', mg: 'mgmotoroficial.com.br',
  changan: 'caoachangan.com.br', kia: 'kia.com/br',
  bmw: 'bmw.com.br', mercedes: 'mercedes-benz.com.br', 'mercedes-benz': 'mercedes-benz.com.br',
  audi: 'audi.com.br', porsche: 'porsche.com/brazil', volvo: 'volvocars.com/br',
  'land rover': 'landrover.com.br', jaguar: 'jaguar.com.br',
  lexus: 'lexus.com.br', maserati: 'maserati.com',
  ambev: 'ambev.com.br', heineken: 'heineken.com.br',
  miolo: 'miolo.com.br', aurora: 'vinicolaaurora.com.br',
  salton: 'salton.com.br', chandon: 'chandon.com.br',
  'magazine luiza': 'magazineluiza.com.br', magalu: 'magazineluiza.com.br',
  americanas: 'americanas.com.br', shopee: 'shopee.com.br',
  'casas bahia': 'casasbahia.com.br', amazon: 'amazon.com.br',
  mrv: 'mrv.com.br', cyrela: 'cyrela.com.br', tenda: 'construtora-tenda.com.br',
  nubank: 'nubank.com.br', itaú: 'itau.com.br', itau: 'itau.com.br',
  bradesco: 'bradesco.com.br', xp: 'xpi.com.br',
  hapvida: 'hapvida.com.br', unimed: 'unimed.coop.br',
  'raia drogasil': 'raiadrogasil.com.br', ultrafarma: 'ultrafarma.com.br',
  nissei: 'nissei.com.br',
  totvs: 'totvs.com', syngenta: 'syngenta.com.br',
  anhanguera: 'anhanguera.com', 'rd station': 'rdstation.com',
  solfacil: 'solfacil.com.br', 'solfácil': 'solfacil.com.br',
};

export function getBrandLogo(name: string): string | null {
  const key = (name || '').toLowerCase().trim();
  const domain = BRAND_DOMAINS[key] || BRAND_DOMAINS[key.replace(/[^a-záàãéêíóôõúüç\s]/gi, '').trim()];
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

// Páginas verificadas MANUALMENTE — SÓ páginas de OFERTAS reais (que mostram
// as condições/promos do mês). Marcas cujo link seria só a homepage (Chevrolet,
// BYD, Land Rover, Porsche, Lexus, Jaguar) ou que bloqueiam (BMW/Audi/Mercedes/
// Volvo) NÃO entram aqui de propósito: caem na busca direcionada do Google
// ("Marca Modelo oferta"), que leva à oferta do modelo em vez de uma página
// genérica sem a informação da oferta.
const VERIFIED_OFFER_PAGES: Record<string, string> = {
  fiat: 'https://ofertas.fiat.com.br/',
  volkswagen: 'https://ofertas.vw.com.br/', vw: 'https://ofertas.vw.com.br/',
  toyota: 'https://www.toyota.com.br/ofertas',
  renault: 'https://www.renault.com.br/ofertas.html',
  hyundai: 'https://www.hyundai.com.br/ofertas',
  jeep: 'https://www.jeep.com.br/ofertas.html',
  nissan: 'https://www.nissan.com.br/ofertas.html',
  honda: 'https://www.honda.com.br/automoveis/ofertas',
  'caoa chery': 'https://www.caoachery.com.br/ofertas', chery: 'https://www.caoachery.com.br/ofertas',
};

export type OfferLink = { url: string; label: string; official: boolean };

/** Decide o link da oferta — à prova de 404. */
export function buildOfferLink(offer: { competitor?: string; model?: string; title?: string }): OfferLink {
  const key = (offer.competitor || '').toLowerCase().trim();
  const page = VERIFIED_OFFER_PAGES[key] || VERIFIED_OFFER_PAGES[key.split(' ')[0]];
  if (page) return { url: page, label: `Site ${offer.competitor}`, official: true };

  const terms = [offer.competitor, offer.model, offer.title].filter(Boolean).join(' ');
  return {
    url: `https://www.google.com/search?q=${encodeURIComponent(terms + ' oferta')}`,
    label: 'Pesquisar',
    official: false,
  };
}
