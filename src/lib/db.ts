import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from './firebase';

// Database collections
const EVENTS_COLLECTION = 'events';
const MEMBERS_COLLECTION = 'members';
const IDEAS_COLLECTION = 'ideas';

// ==================== EVENTS ====================

export interface DBEvent {
  id?: string;
  title: string;
  brief: string;
  icon: string;
  accent: string;
  createdAt: any;
}

// Get all events (real-time)
export function subscribeToEvents(callback: (events: DBEvent[]) => void) {
  const q = query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const events: DBEvent[] = [];
    snapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() } as DBEvent);
    });
    callback(events);
  });
}

// Add new event
export async function addEvent(event: Omit<DBEvent, 'id' | 'createdAt'>) {
  return await addDoc(collection(db, EVENTS_COLLECTION), {
    ...event,
    createdAt: serverTimestamp()
  });
}

// Delete event (and all its members and ideas)
export async function deleteEvent(eventId: string) {
  // Delete all members in this event
  const membersSnapshot = await getDocs(collection(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION));
  for (const memberDoc of membersSnapshot.docs) {
    // Delete all ideas for each member
    const ideasSnapshot = await getDocs(collection(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION, memberDoc.id, IDEAS_COLLECTION));
    for (const ideaDoc of ideasSnapshot.docs) {
      await deleteDoc(ideaDoc.ref);
    }
    await deleteDoc(memberDoc.ref);
  }
  // Delete the event itself
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}

// ==================== MEMBERS ====================

export interface DBMember {
  id?: string;
  name: string;
  role: string;
  avatarId: string;
  avatarIcon: string;
  avatarName: string;
  avatarTrait: string;
  avatarGradient: string;
  avatarRing: string;
  points: number;
  createdAt: any;
}

// Get all members for an event (real-time)
export function subscribeToMembers(eventId: string, callback: (members: DBMember[]) => void) {
  const q = query(collection(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const members: DBMember[] = [];
    snapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() } as DBMember);
    });
    callback(members);
  });
}

// Add member to event
export async function addMember(eventId: string, member: Omit<DBMember, 'id' | 'createdAt' | 'points'>) {
  return await addDoc(collection(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION), {
    ...member,
    points: 0,
    createdAt: serverTimestamp()
  });
}

// Update member points
export async function updateMemberPoints(eventId: string, memberId: string, points: number) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION, memberId), {
    points: points
  });
}

// ==================== IDEAS ====================

export interface DBIdea {
  id?: string;
  title: string;
  thought: string;
  tags: string[];
  reactions: { icon: string; label: string; count: number }[];
  createdAt: any;
  memberId: string;
}

// Get all ideas for a member (real-time)
export function subscribeToIdeas(eventId: string, memberId: string, callback: (ideas: DBIdea[]) => void) {
  const q = query(collection(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION, memberId, IDEAS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const ideas: DBIdea[] = [];
    snapshot.forEach((doc) => {
      ideas.push({ id: doc.id, ...doc.data() } as DBIdea);
    });
    callback(ideas);
  });
}

// Add idea to member
export async function addIdea(eventId: string, memberId: string, idea: Omit<DBIdea, 'id' | 'createdAt' | 'memberId'>) {
  return await addDoc(collection(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION, memberId, IDEAS_COLLECTION), {
    ...idea,
    memberId,
    createdAt: serverTimestamp()
  });
}

// Update idea reactions
export async function updateIdeaReactions(
  eventId: string, 
  memberId: string, 
  ideaId: string, 
  reactions: { icon: string; label: string; count: number }[]
) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId, MEMBERS_COLLECTION, memberId, IDEAS_COLLECTION, ideaId), {
    reactions: reactions
  });
}

// ==================== HELPER ====================

// Get all members across all events (for leaderboard)
export function subscribeToAllMembers(callback: (members: (DBMember & { eventId: string; eventTitle: string })[]) => void) {
  return onSnapshot(collection(db, EVENTS_COLLECTION), async (eventsSnapshot) => {
    const allMembers: (DBMember & { eventId: string; eventTitle: string })[] = [];
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const membersSnapshot = await getDocs(
        query(collection(db, EVENTS_COLLECTION, eventDoc.id, MEMBERS_COLLECTION), orderBy('points', 'desc'))
      );
      
      membersSnapshot.forEach((memberDoc) => {
        allMembers.push({
          id: memberDoc.id,
          ...memberDoc.data(),
          eventId: eventDoc.id,
          eventTitle: eventData.title
        } as DBMember & { eventId: string; eventTitle: string });
      });
    }
    
    callback(allMembers.sort((a, b) => b.points - a.points));
  });
}
