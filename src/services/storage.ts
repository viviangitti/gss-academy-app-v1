// LocalStorage service

const KEYS = {
  CHAT_HISTORY: 'gss_chat',
  PROFILE: 'gss_profile',
};

export function loadData<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function saveData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export { KEYS };
