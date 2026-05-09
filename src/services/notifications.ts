// Notificações locais leves baseadas em atividade
// Sem servidor — só lembretes gerados localmente no próximo acesso

const LAST_ACTIVE_KEY = 'gss_last_active';
const NOTIFY_PERMISSION_KEY = 'gss_notify_asked';

export function markActive(): void {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export function getLastActive(): number {
  const raw = localStorage.getItem(LAST_ACTIVE_KEY);
  return raw ? parseInt(raw) : 0;
}

export function getDaysInactive(): number {
  const last = getLastActive();
  if (!last) return 0;
  return Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
}

export async function requestPermissionIfNeeded(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const asked = localStorage.getItem(NOTIFY_PERMISSION_KEY);
  if (asked) return Notification.permission === 'granted';

  try {
    const result = await Notification.requestPermission();
    localStorage.setItem(NOTIFY_PERMISSION_KEY, 'true');
    return result === 'granted';
  } catch {
    return false;
  }
}

export function showLocalNotification(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });
  } catch {
    // ignore
  }
}

// Reminder contextual: mostra toast inline se o usuário voltou depois de dias sem uso
export function getWelcomeBackMessage(): string | null {
  const days = getDaysInactive();
  if (days >= 7) return `Bem-vindo de volta! Faz ${days} dias. Que tal treinar uma objeção ou preparar sua próxima reunião?`;
  if (days >= 3) return `Bom te ver de volta! Pronto pra preparar a próxima reunião?`;
  return null;
}
