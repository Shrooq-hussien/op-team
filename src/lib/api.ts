// API Service for Cloudflare D1 Backend
// Replaces Firebase with direct API calls and fallback local persistence

const API_BASE = import.meta.env.VITE_API_URL || 'https://ieee-creative-arena-api.YOUR_SUBDOMAIN.workers.dev';

// Types
export interface DBEvent {
  id: string;
  title: string;
  brief: string;
  icon: string;
  accent: string;
  created_at: string;
}

export interface DBMember {
  id: string;
  event_id: string;
  name: string;
  role: string;
  avatar_id: string;
  avatar_icon: string;
  avatar_name: string;
  avatar_trait: string;
  avatar_gradient: string;
  avatar_ring: string;
  points: number;
  created_at: string;
}

export interface DBIdea {
  id: string;
  event_id: string;
  member_id: string;
  title: string;
  thought: string;
  tags: string[];
  reactions: { icon: string; label: string; count: number }[];
  created_at: string;
}

export interface DBStats {
  events: number;
  members: number;
  ideas: number;
}

export interface DBLeaderboardMember extends DBMember {
  event_title: string;
}

// Local Fallback Store
const LOCAL_STORAGE_KEY = 'ieee_operation_arena_v4';

function loadLocalFallback(): { events: DBEvent[], members: Record<string, DBMember[]>, ideas: Record<string, DBIdea[]> } {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : { events: [], members: {}, ideas: {} };
  } catch {
    return { events: [], members: {}, ideas: {} };
  }
}

function saveLocalFallback(data: { events: DBEvent[], members: Record<string, DBMember[]>, ideas: Record<string, DBIdea[]> }) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    // Ignore
  }
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3500); // Quick 3.5s timeout for snappy UI
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    clearTimeout(id);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API error: ${response.status}`);
    }
    
    return response.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ==================== EVENTS ====================

export async function fetchEvents(): Promise<DBEvent[]> {
  try {
    const remote = await apiCall<DBEvent[]>('/api/events');
    const local = loadLocalFallback();
    saveLocalFallback({ ...local, events: remote });
    return remote;
  } catch (err) {
    return loadLocalFallback().events;
  }
}

export async function createEvent(data: {
  title: string;
  brief: string;
  icon?: string;
  accent?: string;
}): Promise<DBEvent> {
  try {
    const remote = await apiCall<DBEvent>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const local = loadLocalFallback();
    local.events.unshift(remote);
    saveLocalFallback(local);
    return remote;
  } catch (err) {
    // Local fallback creation
    const newEvent: DBEvent = {
      id: `event-${Date.now()}`,
      title: data.title,
      brief: data.brief,
      icon: data.icon || '🎮',
      accent: data.accent || 'from-cyan-400 via-blue-500 to-violet-600',
      created_at: new Date().toISOString(),
    };
    const local = loadLocalFallback();
    local.events.unshift(newEvent);
    saveLocalFallback(local);
    return newEvent;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await apiCall(`/api/events/${eventId}`, { method: 'DELETE' });
  } catch (err) {
    // Ignore error, delete locally
  }
  const local = loadLocalFallback();
  local.events = local.events.filter(e => e.id !== eventId);
  delete local.members[eventId];
  saveLocalFallback(local);
}

// ==================== MEMBERS ====================

export async function fetchMembers(eventId: string): Promise<DBMember[]> {
  try {
    const remote = await apiCall<DBMember[]>(`/api/events/${eventId}/members`);
    const local = loadLocalFallback();
    local.members[eventId] = remote;
    saveLocalFallback(local);
    return remote;
  } catch (err) {
    return loadLocalFallback().members[eventId] || [];
  }
}

export async function createMember(eventId: string, data: {
  name: string;
  role?: string;
  avatarId: string;
  avatarIcon: string;
  avatarName: string;
  avatarTrait: string;
  avatarGradient: string;
  avatarRing: string;
}): Promise<DBMember> {
  try {
    const remote = await apiCall<DBMember>(`/api/events/${eventId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const local = loadLocalFallback();
    if (!local.members[eventId]) local.members[eventId] = [];
    local.members[eventId].unshift(remote);
    saveLocalFallback(local);
    return remote;
  } catch (err) {
    const newMember: DBMember = {
      id: `member-${Date.now()}`,
      event_id: eventId,
      name: data.name,
      role: data.role || 'Operation player',
      avatar_id: data.avatarId,
      avatar_icon: data.avatarIcon,
      avatar_name: data.avatarName,
      avatar_trait: data.avatarTrait,
      avatar_gradient: data.avatarGradient,
      avatar_ring: data.avatarRing,
      points: 0,
      created_at: new Date().toISOString(),
    };
    const local = loadLocalFallback();
    if (!local.members[eventId]) local.members[eventId] = [];
    local.members[eventId].unshift(newMember);
    saveLocalFallback(local);
    return newMember;
  }
}

export async function updateMemberPoints(eventId: string, memberId: string, points: number): Promise<DBMember> {
  try {
    return await apiCall<DBMember>(`/api/events/${eventId}/members/${memberId}/points`, {
      method: 'PUT',
      body: JSON.stringify({ points }),
    });
  } catch (err) {
    const local = loadLocalFallback();
    if (local.members[eventId]) {
      const idx = local.members[eventId].findIndex(m => m.id === memberId);
      if (idx !== -1) local.members[eventId][idx].points = points;
    }
    saveLocalFallback(local);
    return local.members[eventId]?.find(m => m.id === memberId) as DBMember;
  }
}

// ==================== IDEAS ====================

export async function fetchIdeas(eventId: string, memberId: string): Promise<DBIdea[]> {
  try {
    const remote = await apiCall<DBIdea[]>(`/api/events/${eventId}/members/${memberId}/ideas`);
    const local = loadLocalFallback();
    local.ideas[memberId] = remote;
    saveLocalFallback(local);
    return remote;
  } catch (err) {
    return loadLocalFallback().ideas[memberId] || [];
  }
}

export async function createIdea(eventId: string, memberId: string, data: {
  title: string;
  thought: string;
  tags?: string[];
  reactions?: { icon: string; label: string; count: number }[];
}): Promise<DBIdea> {
  try {
    const remote = await apiCall<DBIdea>(`/api/events/${eventId}/members/${memberId}/ideas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const local = loadLocalFallback();
    if (!local.ideas[memberId]) local.ideas[memberId] = [];
    local.ideas[memberId].unshift(remote);
    saveLocalFallback(local);
    return remote;
  } catch (err) {
    const newIdea: DBIdea = {
      id: `idea-${Date.now()}`,
      event_id: eventId,
      member_id: memberId,
      title: data.title,
      thought: data.thought,
      tags: data.tags || [],
      reactions: data.reactions || [],
      created_at: new Date().toISOString(),
    };
    const local = loadLocalFallback();
    if (!local.ideas[memberId]) local.ideas[memberId] = [];
    local.ideas[memberId].unshift(newIdea);
    saveLocalFallback(local);
    return newIdea;
  }
}

export async function updateIdeaReactions(
  eventId: string,
  memberId: string,
  ideaId: string,
  reactions: { icon: string; label: string; count: number }[]
): Promise<DBIdea> {
  try {
    return await apiCall<DBIdea>(`/api/events/${eventId}/members/${memberId}/ideas/${ideaId}/reactions`, {
      method: 'PUT',
      body: JSON.stringify({ reactions }),
    });
  } catch (err) {
    const local = loadLocalFallback();
    if (local.ideas[memberId]) {
      const idx = local.ideas[memberId].findIndex(i => i.id === ideaId);
      if (idx !== -1) local.ideas[memberId][idx].reactions = reactions;
    }
    saveLocalFallback(local);
    return local.ideas[memberId]?.find(i => i.id === ideaId) as DBIdea;
  }
}

// ==================== POLLING ====================

type PollCallback<T> = (data: T) => void;

export function pollEvents(callback: PollCallback<DBEvent[]>, intervalMs = 2500): () => void {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const events = await fetchEvents();
      callback(events);
    } catch {
      // Ignore error, fallback handled
    }
    if (active) setTimeout(poll, intervalMs);
  };
  poll();
  return () => { active = false; };
}

export function pollMembers(eventId: string, callback: PollCallback<DBMember[]>, intervalMs = 2500): () => void {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const members = await fetchMembers(eventId);
      callback(members);
    } catch {
      // Ignore
    }
    if (active) setTimeout(poll, intervalMs);
  };
  poll();
  return () => { active = false; };
}

export function pollIdeas(eventId: string, memberId: string, callback: PollCallback<DBIdea[]>, intervalMs = 2500): () => void {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const ideas = await fetchIdeas(eventId, memberId);
      callback(ideas);
    } catch {
      // Ignore
    }
    if (active) setTimeout(poll, intervalMs);
  };
  poll();
  return () => { active = false; };
}
