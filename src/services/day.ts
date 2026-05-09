// "Meu Dia" — organizador simples do dia
// Apenas reuniões e tarefas (focos foram removidos por redundância).
import { auth } from './firebase';
import { pushData } from './firestore/sync';

function syncDay(data: DayData) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'day', [data]).catch(() => {});
}

export interface DayMeeting {
  id: string;
  time: string; // HH:mm
  title: string;
  notes?: string;
}

export interface DayTask {
  id: string;
  text: string;
  done: boolean;
  fromYesterday?: boolean;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  meetings: DayMeeting[];
  tasks: DayTask[];
}

const KEY = 'gss_day';
const ARCHIVE_KEY = 'gss_day_archive';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function emptyDay(date: string): DayData {
  return { date, meetings: [], tasks: [] };
}

export function getDay(): DayData {
  const today = todayStr();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDay(today);

    const parsed = JSON.parse(raw) as DayData & { focuses?: unknown };
    // Remove focos antigos (compat com versão anterior)
    if ('focuses' in parsed) delete parsed.focuses;

    if (parsed.date === today) {
      // Garante que tasks está presente
      if (!Array.isArray(parsed.tasks)) parsed.tasks = [];
      if (!Array.isArray(parsed.meetings)) parsed.meetings = [];
      return parsed as DayData;
    }

    // Dia mudou: arquiva e migra tarefas pendentes
    archiveDay(parsed as DayData);

    const pendingTasks: DayTask[] = (parsed.tasks || [])
      .filter(t => !t.done)
      .map(t => ({ ...t, fromYesterday: true }));

    const newDay: DayData = {
      date: today,
      meetings: [],
      tasks: pendingTasks,
    };
    saveDay(newDay);
    return newDay;
  } catch {
    return emptyDay(today);
  }
}

function archiveDay(day: DayData): void {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    const archive: DayData[] = raw ? JSON.parse(raw) : [];
    archive.push(day);
    const trimmed = archive.slice(-30);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export function saveDay(data: DayData): void {
  const saved = { ...data, date: todayStr() };
  localStorage.setItem(KEY, JSON.stringify(saved));
  syncDay(saved);
}

export function addMeeting(meeting: Omit<DayMeeting, 'id'>): DayData {
  const day = getDay();
  day.meetings.push({ ...meeting, id: generateId() });
  day.meetings.sort((a, b) => a.time.localeCompare(b.time));
  saveDay(day);
  return day;
}

export function removeMeeting(id: string): DayData {
  const day = getDay();
  day.meetings = day.meetings.filter(m => m.id !== id);
  saveDay(day);
  return day;
}

export function addTask(text: string): DayData {
  const day = getDay();
  day.tasks.push({ id: generateId(), text, done: false });
  saveDay(day);
  return day;
}

export function toggleTask(id: string): DayData {
  const day = getDay();
  const t = day.tasks.find(x => x.id === id);
  if (t) t.done = !t.done;
  saveDay(day);
  return day;
}

export function removeTask(id: string): DayData {
  const day = getDay();
  day.tasks = day.tasks.filter(t => t.id !== id);
  saveDay(day);
  return day;
}
