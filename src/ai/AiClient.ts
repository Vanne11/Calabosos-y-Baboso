// ai/AiClient.ts
// Cliente del servidor de IA (server/ en PHP). Implementa AiProvider para el motor.
// Nunca lanza errores: ante cualquier problema devuelve null y el motor usa su respaldo.

import {
  isTone,
  type AiFeature,
  type AiProvider,
  type ChatSayInfo,
  type ChatStartInfo,
  type FreeActionReply,
  type FreeActionRequest,
  type GameEvent,
  type NarrateReply,
} from '../engine/AiProvider';
import type { ChatMode } from '../types/game';

interface ServerConfig {
  aiEnabled: boolean;
  narrate: boolean;
  /** Acción libre en las decisiones (servidores viejos no lo mandan: queda apagada) */
  freeAction?: boolean;
  modes: Partial<Record<ChatMode, boolean>>;
  events: boolean;
  maxInputChars: number;
}

type TimedEvent = GameEvent & { t: number };

const SESSION_KEY = 'cyb_ai_session';
const PREF_KEY = 'cyb_ai_pref';
const TIMEOUT = { config: 4000, narrate: 8000, freeAction: 12000, rate: 5000, chatStart: 8000, chatSay: 30000, giveup: 5000, events: 5000 };
const EVENTS_FLUSH_MS = 15000;
const EVENTS_MAX_BATCH = 20;

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // modo privado o almacenamiento bloqueado: no pasa nada
  }
}

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Preferencia del jugador (comando /ia on|off). Por defecto: activada. */
export function getAiPreference(): boolean {
  return safeStorageGet(PREF_KEY) !== 'off';
}

export function setAiPreference(enabled: boolean): void {
  safeStorageSet(PREF_KEY, enabled ? 'on' : 'off');
}

/** Id de línea válido que devolvió el servidor, o undefined */
function lineId(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

export class AiClient implements AiProvider {
  private readonly base: string;
  private readonly game: string;
  private readonly sessionId: string;
  private config: ServerConfig | null = null;
  private queue: TimedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly onPageHide = () => this.flush(true);

  constructor(game: string, endpoint: string) {
    this.game = game;
    this.base = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    let id = safeStorageGet(SESSION_KEY);
    if (!id || !/^[a-zA-Z0-9-]{16,64}$/.test(id)) {
      id = newSessionId();
      safeStorageSet(SESSION_KEY, id);
    }
    this.sessionId = id;
  }

  /** Lee la configuración del servidor. Devuelve false si no hay servidor de IA. */
  async init(): Promise<boolean> {
    const config = await this.request<ServerConfig>('GET', 'api/config.php', undefined, TIMEOUT.config);
    this.config = config && typeof config.aiEnabled === 'boolean' ? config : null;
    if (this.config?.events) {
      this.flushTimer = setInterval(() => this.flush(false), EVENTS_FLUSH_MS);
      window.addEventListener('pagehide', this.onPageHide);
    }
    return this.config !== null;
  }

  dispose(): void {
    this.flush(true);
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = null;
    window.removeEventListener('pagehide', this.onPageHide);
  }

  /** Estado para el comando /ia */
  status(): { server: boolean; enabled: boolean; preference: boolean; narrate: boolean; freeAction: boolean; modes: string[] } {
    const c = this.config;
    return {
      server: c !== null,
      enabled: !!c?.aiEnabled,
      preference: getAiPreference(),
      narrate: !!c?.narrate,
      freeAction: !!c?.freeAction,
      modes: c ? Object.entries(c.modes).filter(([, on]) => on).map(([m]) => m) : [],
    };
  }

  available(feature: AiFeature): boolean {
    const c = this.config;
    if (!c || !c.aiEnabled || !getAiPreference()) return false;
    if (feature === 'narrate') return c.narrate;
    if (feature === 'libre') return !!c.freeAction;
    return !!c.modes[feature];
  }

  async narrate(prompt: string, vars: Record<string, string>): Promise<NarrateReply | null> {
    const res = await this.post<{ text?: string; tone?: unknown; lineId?: unknown }>('api/narrate.php', { prompt, vars }, TIMEOUT.narrate);
    if (!res || typeof res.text !== 'string' || !res.text.trim()) return null;
    return { text: res.text.trim(), tone: isTone(res.tone) ? res.tone : null, lineId: lineId(res.lineId) };
  }

  async freeAction(prompt: string, request: FreeActionRequest): Promise<FreeActionReply | null> {
    const res = await this.post<{ text?: string; tone?: unknown; option?: unknown; consequence?: unknown; lineId?: unknown }>(
      'api/libre.php',
      { prompt, ...request },
      TIMEOUT.freeAction
    );
    if (!res || typeof res.text !== 'string' || !res.text.trim()) return null;
    const option = typeof res.option === 'number' && Number.isInteger(res.option) && res.option >= 0 && res.option < request.options.length ? res.option : null;
    const consequence = typeof res.consequence === 'string' && res.consequence in request.consequences ? res.consequence : null;
    return { text: res.text.trim(), tone: isTone(res.tone) ? res.tone : null, option, consequence, lineId: lineId(res.lineId) };
  }

  async chatStart(
    mode: ChatMode,
    npc: string,
    vars: Record<string, string>,
    maxTurns?: number,
    gestures?: Record<string, string>
  ): Promise<ChatStartInfo | null> {
    const res = await this.post<ChatStartInfo>('api/chat.php', { action: 'start', mode, npc, vars, maxTurns, gestures }, TIMEOUT.chatStart);
    return res && typeof res.chatId === 'string' ? res : null;
  }

  async chatSay(chatId: string, message: string): Promise<ChatSayInfo | null> {
    const res = await this.post<ChatSayInfo>('api/chat.php', { action: 'say', chatId, message }, TIMEOUT.chatSay);
    if (!res || typeof res.reply !== 'string') return null;
    return {
      ...res,
      tone: isTone(res.tone) ? res.tone : null,
      gesture: typeof res.gesture === 'string' ? res.gesture : null,
      memory: typeof res.memory === 'string' && res.memory.trim() ? res.memory.trim() : null,
      lineId: lineId(res.lineId),
    };
  }

  async chatGiveUp(chatId: string): Promise<void> {
    await this.post('api/chat.php', { action: 'giveup', chatId }, TIMEOUT.giveup);
  }

  /** Califica una línea de la IA (/bien = 1, /mal = -1). Devuelve si el servidor la anotó */
  async rate(id: number, rating: 1 | -1): Promise<boolean> {
    const res = await this.post<{ ok?: boolean }>('api/rate.php', { lineId: id, rating }, TIMEOUT.rate);
    return !!res?.ok;
  }

  /** Registra un evento de juego (se envían en lotes) */
  readonly track = (event: GameEvent): void => {
    if (!this.config?.events) return;
    this.queue.push({ ...event, t: Date.now() });
    if (this.queue.length >= EVENTS_MAX_BATCH) this.flush(false);
  };

  private flush(useBeacon: boolean): void {
    if (!this.queue.length) return;
    const events = this.queue.splice(0, 50);
    const body = JSON.stringify({ sessionId: this.sessionId, game: this.game, events });
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(`${this.base}api/events.php`, new Blob([body], { type: 'text/plain' }));
      return;
    }
    void this.request('POST', 'api/events.php', body, TIMEOUT.events);
  }

  private post<T>(path: string, payload: Record<string, unknown>, timeout: number): Promise<T | null> {
    const body = JSON.stringify({ sessionId: this.sessionId, game: this.game, ...payload });
    return this.request<T>('POST', path, body, timeout);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body: string | undefined, timeout: number): Promise<T | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(`${this.base}${path}`, {
        method,
        body,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        signal: controller.signal,
        credentials: 'omit',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // La IA se apagó en el servidor mientras se jugaba: dejar de pedir
        if (res.status === 503 && data?.error === 'ai_disabled' && this.config) this.config.aiEnabled = false;
        return null;
      }
      return data as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
