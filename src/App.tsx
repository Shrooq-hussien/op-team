import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Crown,
  Eye,
  Flame,
  Folder,
  Gamepad2,
  Heart,
  Lightbulb,
  Loader2,
  Medal,
  Plus,
  Rocket,
  Send,
  Sparkles,
  Star,
  Trophy,
  Users,
  Wand2,
  X,
} from 'lucide-react';

// Import Firebase services
import { 
  DBEvent, 
  DBMember, 
  DBIdea, 
  subscribeToEvents, 
  subscribeToMembers, 
  subscribeToIdeas,
  addEvent as dbAddEvent,
  addMember as dbAddMember,
  addIdea as dbAddIdea,
  updateIdeaReactions,
  updateMemberPoints
} from './lib/db';

type Avatar = {
  id: string;
  icon: string;
  name: string;
  trait: string;
  gradient: string;
  ring: string;
};

type Reaction = {
  icon: string;
  label: string;
  count: number;
};

type Idea = DBIdea & {
  id: string;
};

type Member = DBMember & {
  id: string;
  ideas: Idea[];
};

type CreativeEvent = DBEvent & {
  id: string;
  members: Member[];
};

type Route = {
  eventId?: string;
  memberId?: string;
};

const avatars: Avatar[] = [
  { id: 'fox', icon: '🦊', name: 'Neon Fox', trait: 'fast ideas', gradient: 'from-orange-400 via-rose-500 to-fuchsia-600', ring: 'ring-orange-300/70' },
  { id: 'panda', icon: '🐼', name: 'Zen Panda', trait: 'calm chaos', gradient: 'from-slate-200 via-slate-500 to-slate-950', ring: 'ring-slate-200/70' },
  { id: 'unicorn', icon: '🦄', name: 'Holo Unicorn', trait: 'magic maker', gradient: 'from-pink-400 via-violet-500 to-cyan-400', ring: 'ring-pink-300/70' },
  { id: 'frog', icon: '🐸', name: 'Pixel Frog', trait: 'fresh moves', gradient: 'from-lime-300 via-emerald-500 to-teal-700', ring: 'ring-lime-300/70' },
  { id: 'lion', icon: '🦁', name: 'Solar Lion', trait: 'bold calls', gradient: 'from-yellow-300 via-orange-500 to-red-600', ring: 'ring-yellow-300/70' },
  { id: 'penguin', icon: '🐧', name: 'Ice Penguin', trait: 'cool logic', gradient: 'from-sky-300 via-blue-500 to-indigo-700', ring: 'ring-sky-300/70' },
  { id: 'owl', icon: '🦉', name: 'Wise Owl', trait: 'sharp eyes', gradient: 'from-amber-300 via-stone-600 to-zinc-950', ring: 'ring-amber-300/70' },
  { id: 'octo', icon: '🐙', name: 'Octo Boss', trait: '8-task mode', gradient: 'from-purple-400 via-fuchsia-600 to-rose-600', ring: 'ring-purple-300/70' },
  { id: 'bee', icon: '🐝', name: 'Volt Bee', trait: 'team energy', gradient: 'from-yellow-200 via-amber-400 to-neutral-900', ring: 'ring-yellow-200/70' },
  { id: 'dragon', icon: '🐉', name: 'Idea Dragon', trait: 'fire pitch', gradient: 'from-red-500 via-orange-600 to-yellow-400', ring: 'ring-red-300/70' },
  { id: 'alien', icon: '👾', name: 'Arcade Alien', trait: 'weird wins', gradient: 'from-violet-400 via-indigo-600 to-purple-950', ring: 'ring-violet-300/70' },
  { id: 'robot', icon: '🤖', name: 'Tiny Bot', trait: 'auto polish', gradient: 'from-cyan-300 via-blue-500 to-slate-900', ring: 'ring-cyan-300/70' },
];

const reactionSet = [
  { icon: '🔥', label: 'hot' },
  { icon: '💡', label: 'smart' },
  { icon: '🚀', label: 'ship it' },
  { icon: '😂', label: 'funny' },
  { icon: '🧠', label: 'genius' },
  { icon: '💜', label: 'love' },
];

const eventAccents = [
  'from-cyan-400 via-blue-500 to-violet-600',
  'from-fuchsia-400 via-rose-500 to-orange-500',
  'from-emerald-300 via-teal-500 to-cyan-500',
  'from-yellow-300 via-orange-500 to-red-500',
  'from-violet-400 via-purple-600 to-fuchsia-600',
];

const makeReactions = (): Reaction[] =>
  reactionSet.map((reaction) => ({ ...reaction, count: 0 }));

const totalIdeaReactions = (idea: Idea) => idea.reactions.reduce((sum, reaction) => sum + reaction.count, 0);
const memberIdeaCount = (member: Member) => member.ideas.length;
const eventIdeaCount = (event: CreativeEvent) => event.members.reduce((sum, member) => sum + member.ideas.length, 0);
const eventReactionCount = (event: CreativeEvent) =>
  event.members.reduce((sum, member) => sum + member.ideas.reduce((ideaSum, idea) => ideaSum + totalIdeaReactions(idea), 0), 0);

// Loading Component
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#060613]">
      <motion.div 
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div 
          className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-cyan-300 via-fuchsia-400 to-yellow-300 text-slate-950 shadow-2xl shadow-fuchsia-500/30"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Gamepad2 className="h-10 w-10" />
        </motion.div>
        <div className="flex items-center gap-2 text-white/60">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-display text-lg font-bold">Loading Arena...</span>
        </div>
      </motion.div>
    </div>
  );
}

function StatChip({ icon, label, value, color }: { icon: ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
          {icon}
        </span>
        <div>
          <p className="font-display text-xl font-black leading-none text-white">{value}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{label}</p>
        </div>
      </div>
    </div>
  );
}

function GameBackdrop() {
  const stars = useMemo(
    () => Array.from({ length: 36 }, (_, index) => ({
      id: index,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      size: 2 + Math.random() * 3,
    })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#060613]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(217,70,239,0.2),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.18),transparent_30%)]" />
      <div className="arena-grid absolute inset-0 opacity-55" />
      <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />
      <motion.div
        className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ x: [0, 70, 20, 0], y: [0, 30, -25, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ x: [0, -50, 30, 0], y: [0, -45, 20, 0], scale: [1, 0.9, 1.2, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.8)]"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
          animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.5, 0.8] }}
          transition={{ duration: 2.4, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-white/15 bg-[#111127]/95 p-5 shadow-2xl shadow-fuchsia-950/50"
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.94 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Leaderboard({ members, title }: { members: (Member & { eventTitle?: string })[]; title?: string }) {
  const sorted = [...members].sort((a, b) => b.points - a.points).slice(0, 8);

  return (
    <section className="rounded-[2rem] border border-yellow-300/20 bg-yellow-300/[0.04] p-4 shadow-2xl shadow-yellow-950/20 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-500 text-slate-950 shadow-lg shadow-yellow-500/20">
          <Trophy className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-display text-lg font-black uppercase tracking-wide text-yellow-200">{title || 'Leaderboard'}</h3>
          <p className="text-sm text-white/45">Points from ideas and reactions</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center text-white/45">
          <Trophy className="mx-auto mb-3 h-9 w-9 text-yellow-200/70" />
          No players yet. Create the first folder.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((member, index) => (
            <motion.div
              key={member.id}
              className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="w-8 text-center">
                {index === 0 ? <Crown className="mx-auto h-6 w-6 text-yellow-300" /> : index < 3 ? <Medal className="mx-auto h-6 w-6 text-orange-200" /> : <span className="font-display text-sm text-white/45">{index + 1}</span>}
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${member.avatarGradient} text-2xl shadow-lg ring-1 ${member.avatarRing}`}>
                {member.avatarIcon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{member.name}</p>
                {member.eventTitle && <p className="truncate text-xs text-white/40">{member.eventTitle}</p>}
              </div>
              <div className="rounded-2xl bg-black/25 px-3 py-2 text-right">
                <p className="font-display text-sm font-black text-yellow-200">{member.points}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/35">XP</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function EventCard({ event, index, onOpen }: { event: CreativeEvent; index: number; onOpen: () => void }) {
  const ideas = eventIdeaCount(event);
  const reactions = eventReactionCount(event);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 text-left shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:border-white/20"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${event.accent} opacity-25 blur-2xl transition group-hover:opacity-40`} />
      <div className="relative mb-8 flex items-start justify-between">
        <div className={`grid h-20 w-20 place-items-center rounded-[1.7rem] bg-gradient-to-br ${event.accent} text-4xl shadow-2xl transition group-hover:scale-110 group-hover:rotate-3`}>
          {event.icon}
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Quest {index + 1}</span>
      </div>
      <h3 className="relative font-display text-2xl font-black leading-tight text-white">{event.title}</h3>
      <p className="relative mt-3 min-h-12 text-sm leading-6 text-white/55">{event.brief}</p>
      <div className="relative mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="font-display text-lg font-black text-white">{event.members.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/35">players</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="font-display text-lg font-black text-white">{ideas}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/35">ideas</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="font-display text-lg font-black text-white">{reactions}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/35">vibes</p>
        </div>
      </div>
    </motion.button>
  );
}

function MemberFolder({ member, rank, onOpen }: { member: Member; rank: number; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="group text-left"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: rank * 0.045 }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="folder-card relative aspect-[0.95] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className={`absolute inset-x-4 top-3 h-10 rounded-2xl bg-gradient-to-r ${member.avatarGradient} opacity-80`} />
        <div className="absolute left-6 top-0 h-9 w-28 rounded-t-2xl bg-white/15" />
        <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${member.avatarGradient} opacity-30 blur-2xl`} />
        <div className="relative grid h-full place-items-center pt-6">
          <div className={`grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br ${member.avatarGradient} text-6xl shadow-2xl ring-2 ${member.avatarRing} transition group-hover:scale-110 group-hover:rotate-6 sm:h-28 sm:w-28`}>
            {member.avatarIcon}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{member.name}</p>
              <p className="truncate text-xs text-white/45">{member.role}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-2 py-1 text-right">
              <p className="font-display text-sm font-black text-yellow-200">{member.points}</p>
              <p className="text-[9px] uppercase tracking-widest text-white/35">xp</p>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function IdeaOrb({ idea, member, onReact }: { idea: Idea; member: Member; onReact: (icon: string) => void }) {
  const total = totalIdeaReactions(idea);
  const impression = Math.min(100, 15 + total * 3);

  return (
    <motion.article
      layout
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`absolute -right-14 -top-14 h-36 w-36 rounded-full bg-gradient-to-br ${member.avatarGradient} opacity-20 blur-2xl`} />
      <div className="relative flex items-start gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${member.avatarGradient} text-2xl ring-1 ${member.avatarRing}`}>
          {member.avatarIcon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-lg font-black leading-tight text-white">{idea.title}</h4>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/35">by {member.name}</p>
        </div>
      </div>

      <p className="relative mt-4 text-sm leading-6 text-white/60">{idea.thought}</p>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {idea.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100/80">
            #{tag}
          </span>
        ))}
      </div>

      <div className="relative mt-5 rounded-3xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
          <span>Impression</span>
          <span>{impression}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${member.avatarGradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${impression}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {idea.reactions.map((reaction) => (
          <motion.button
            key={reaction.icon}
            type="button"
            onClick={() => onReact(reaction.icon)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-2 text-center transition hover:border-white/20 hover:bg-white/10"
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -3 }}
            title={reaction.label}
          >
            <span className="block text-xl">{reaction.icon}</span>
            <span className="font-display text-xs font-black text-white/75">{reaction.count}</span>
          </motion.button>
        ))}
      </div>
    </motion.article>
  );
}

function CreateEventModal({ onClose, onCreate }: { onClose: () => void; onCreate: (event: Omit<DBEvent, 'id' | 'createdAt'>) => void }) {
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [icon, setIcon] = useState('🎮');
  const [accent, setAccent] = useState(eventAccents[0]);
  const [loading, setLoading] = useState(false);
  const icons = ['🎮', '🚀', '💡', '🎨', '⚡', '🏆', '🧪', '📣', '🌟', '🔥'];

  const submit = async () => {
    if (!title.trim() || !brief.trim()) return;
    setLoading(true);
    try {
      await onCreate({ title: title.trim(), brief: brief.trim(), icon, accent });
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="pr-12">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-200/70">New Quest</p>
        <h2 className="mt-2 font-display text-3xl font-black text-white">Create Event</h2>
      </div>
      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">Event name</label>
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Viral Reel Challenge" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">Mission brief</label>
          <textarea className="field min-h-28 resize-none" value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="What should the creative team upload and evaluate?" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">Icon</label>
          <div className="flex flex-wrap gap-2">
            {icons.map((item) => (
              <button key={item} type="button" onClick={() => setIcon(item)} className={`grid h-12 w-12 place-items-center rounded-2xl border text-2xl transition ${icon === item ? 'border-white/40 bg-white/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">Color power</label>
          <div className="grid grid-cols-5 gap-2">
            {eventAccents.map((item) => (
              <button key={item} type="button" onClick={() => setAccent(item)} className={`h-12 rounded-2xl bg-gradient-to-r ${item} transition ${accent === item ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111127]' : 'opacity-70 hover:opacity-100'}`} aria-label="Choose event color" />
            ))}
          </div>
        </div>
        <button type="button" onClick={submit} disabled={loading} className="primary-button w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          {loading ? 'Creating...' : 'Create quest'}
        </button>
      </div>
    </Modal>
  );
}

function CreateMemberModal({ onClose, onCreate }: { onClose: () => void; onCreate: (member: Omit<DBMember, 'id' | 'createdAt' | 'points'>) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Creative player');
  const [avatar, setAvatar] = useState<Avatar>(avatars[0]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ 
        name: name.trim(), 
        role: role.trim() || 'Creative player', 
        avatarId: avatar.id,
        avatarIcon: avatar.icon,
        avatarName: avatar.name,
        avatarTrait: avatar.trait,
        avatarGradient: avatar.gradient,
        avatarRing: avatar.ring
      });
      onClose();
    } catch (error) {
      console.error('Failed to create member:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="pr-12">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-fuchsia-200/70">Public Folder</p>
        <h2 className="mt-2 font-display text-3xl font-black text-white">Create Member</h2>
      </div>
      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">Member name</label>
            <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">Creative role</label>
            <input className="field" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Designer, writer..." />
          </div>
        </div>
        <div>
          <label className="mb-3 block text-sm font-bold text-white/70">Funny avatar</label>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {avatars.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setAvatar(item)}
                className={`grid aspect-square place-items-center rounded-3xl bg-gradient-to-br ${item.gradient} text-3xl shadow-lg ring-offset-2 ring-offset-[#111127] transition ${avatar.id === item.id ? `ring-2 ${item.ring}` : 'opacity-75 hover:opacity-100'}`}
                whileHover={{ y: -4, rotate: 3 }}
                whileTap={{ scale: 0.92 }}
                title={item.name}
              >
                {item.icon}
              </motion.button>
            ))}
          </div>
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            Selected: <span className="font-bold text-white">{avatar.name}</span> - {avatar.trait}
          </p>
        </div>
        <button type="button" onClick={submit} disabled={loading} className="primary-button w-full bg-gradient-to-r from-fuchsia-400 to-violet-500 text-white disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Folder className="h-5 w-5" />}
          {loading ? 'Creating...' : 'Create folder'}
        </button>
      </div>
    </Modal>
  );
}

function CreateIdeaModal({ onClose, onCreate }: { onClose: () => void; onCreate: (idea: Omit<DBIdea, 'id' | 'createdAt' | 'memberId'>) => void }) {
  const [title, setTitle] = useState('');
  const [thought, setThought] = useState('');
  const [tags, setTags] = useState('design, social');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim() || !thought.trim()) return;
    setLoading(true);
    try {
      await onCreate({
        title: title.trim(),
        thought: thought.trim(),
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 4),
        reactions: makeReactions(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to create idea:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="pr-12">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200/70">Idea Upload</p>
        <h2 className="mt-2 font-display text-3xl font-black text-white">Add Thought</h2>
      </div>
      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">Title</label>
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give the idea a name" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">Thought</label>
          <textarea className="field min-h-36 resize-none" value={thought} onChange={(event) => setThought(event.target.value)} placeholder="Upload the concept, copy, execution, or feedback here." />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">Tags, comma separated</label>
          <input className="field" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="branding, reel, poster" />
        </div>
        <button type="button" onClick={submit} disabled={loading} className="primary-button w-full bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {loading ? 'Uploading...' : 'Upload idea'}
        </button>
      </div>
    </Modal>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CreativeEvent[]>([]);
  const [route, setRoute] = useState<Route>({});
  const [modal, setModal] = useState<'event' | 'member' | 'idea' | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [burst, setBurst] = useState(false);

  // Real-time data subscriptions
  useEffect(() => {
    let unsubscribeEvents: () => void;
    let unsubscribers: (() => void)[] = [];

    // Subscribe to events
    unsubscribeEvents = subscribeToEvents((dbEvents) => {
      const eventsWithMembers: CreativeEvent[] = [];
      
      dbEvents.forEach((dbEvent) => {
        if (!dbEvent.id) return;
        
        const eventWithMembers: CreativeEvent = {
          ...dbEvent,
          id: dbEvent.id,
          members: []
        };
        
        // Subscribe to members for each event
        const unsubMembers = subscribeToMembers(dbEvent.id, (dbMembers) => {
          eventWithMembers.members = dbMembers.map(dbMember => ({
            ...dbMember,
            id: dbMember.id || '',
            ideas: []
          }));
          
          // Subscribe to ideas for each member
          dbMembers.forEach((dbMember) => {
            if (!dbMember.id) return;
            
            const unsubIdeas = subscribeToIdeas(dbEvent.id!, dbMember.id, (dbIdeas) => {
              const memberIndex = eventWithMembers.members.findIndex(m => m.id === dbMember.id);
              if (memberIndex !== -1) {
                eventWithMembers.members[memberIndex].ideas = dbIdeas.map(idea => ({
                  ...idea,
                  id: idea.id || ''
                }));
              }
              
              // Update events state
              setEvents(prev => {
                const updated = [...prev];
                const eventIndex = updated.findIndex(e => e.id === dbEvent.id);
                if (eventIndex !== -1) {
                  updated[eventIndex] = { ...eventWithMembers };
                }
                return updated;
              });
            });
            
            unsubscribers.push(unsubIdeas);
          });
          
          // Update events state
          setEvents(prev => {
            const updated = [...prev];
            const eventIndex = updated.findIndex(e => e.id === dbEvent.id);
            if (eventIndex !== -1) {
              updated[eventIndex] = { ...eventWithMembers };
            } else {
              updated.push({ ...eventWithMembers });
            }
            return updated;
          });
        });
        
        unsubscribers.push(unsubMembers);
        eventsWithMembers.push(eventWithMembers);
      });
      
      setEvents(eventsWithMembers);
      setLoading(false);
    });

    return () => {
      unsubscribeEvents?.();
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const currentEvent = events.find((event) => event.id === route.eventId);
  const currentMember = currentEvent?.members.find((member) => member.id === route.memberId);
  const allMembers = events.flatMap((event) => event.members.map(member => ({ ...member, eventTitle: event.title })));
  const allIdeas = events.reduce((sum, event) => sum + eventIdeaCount(event), 0);
  const allReactions = events.reduce((sum, event) => sum + eventReactionCount(event), 0);

  const celebrate = () => {
    setBurst(true);
    window.setTimeout(() => setBurst(false), 900);
  };

  const handleAddEvent = async (eventData: Omit<DBEvent, 'id' | 'createdAt'>) => {
    await dbAddEvent(eventData);
    celebrate();
  };

  const handleAddMember = async (memberData: Omit<DBMember, 'id' | 'createdAt' | 'points'>) => {
    if (!currentEvent?.id) return;
    await dbAddMember(currentEvent.id, memberData);
    celebrate();
  };

  const handleAddIdea = async (ideaData: Omit<DBIdea, 'id' | 'createdAt' | 'memberId'>) => {
    if (!currentEvent?.id || !currentMember?.id) return;
    await dbAddIdea(currentEvent.id, currentMember.id, ideaData);
    // Add 15 points for new idea
    await updateMemberPoints(currentEvent.id, currentMember.id, currentMember.points + 15);
    celebrate();
  };

  const handleReact = async (ideaId: string, reactionIcon: string) => {
    if (!currentEvent?.id || !currentMember?.id) return;
    
    const idea = currentMember.ideas.find(i => i.id === ideaId);
    if (!idea) return;
    
    const updatedReactions = idea.reactions.map(r => 
      r.icon === reactionIcon ? { ...r, count: r.count + 1 } : r
    );
    
    await updateIdeaReactions(currentEvent.id, currentMember.id, ideaId, updatedReactions);
    // Add 2 points for reaction
    await updateMemberPoints(currentEvent.id, currentMember.id, currentMember.points + 2);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen overflow-hidden text-white">
      <GameBackdrop />

      <AnimatePresence>
        {burst && (
          <motion.div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="rounded-full bg-white/10 p-10 text-7xl backdrop-blur-xl" initial={{ scale: 0, rotate: -20 }} animate={{ scale: [0, 1.1, 1], rotate: [0, 12, 0] }} exit={{ scale: 0 }}>
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070713]/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {route.eventId && (
              <button
                type="button"
                onClick={() => route.memberId ? setRoute({ eventId: route.eventId }) : setRoute({})}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-fuchsia-400 to-yellow-300 text-slate-950 shadow-lg shadow-fuchsia-500/20">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-black uppercase tracking-wide sm:text-2xl">IEEE Menoufia SB</p>
              <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/45">Creative Quest Arena</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowBoard(true)} className="secondary-button hidden sm:flex">
              <Trophy className="h-4 w-4 text-yellow-200" /> Leaderboard
            </button>
            <button type="button" onClick={() => setModal('event')} className="primary-button bg-gradient-to-r from-cyan-300 to-fuchsia-400 text-slate-950">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Event</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <AnimatePresence mode="wait">
          {!currentEvent && (
            <motion.div key="home" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
              <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10 lg:p-12">
                <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                  <div>
                    <motion.div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm font-bold text-cyan-100" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Sparkles className="h-4 w-4" /> Real-time powered by Firebase
                    </motion.div>
                    <motion.h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      Creative<br />Quest Arena
                    </motion.h1>
                    <motion.p className="mt-6 max-w-2xl text-lg leading-8 text-white/60" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      Create events, let every member own a public folder, upload wild thoughts, react to ideas, and climb the leaderboard like a game.
                    </motion.p>
                    <motion.div className="mt-8 flex flex-col gap-3 sm:flex-row" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                      <button type="button" onClick={() => setModal('event')} className="primary-button bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300 text-slate-950">
                        <Wand2 className="h-5 w-5" /> Start a quest
                      </button>
                      <button type="button" onClick={() => setShowBoard(true)} className="secondary-button justify-center">
                        <Trophy className="h-5 w-5 text-yellow-200" /> View leaderboard
                      </button>
                    </motion.div>
                  </div>
                  <motion.div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80" animate={{ rotate: 360 }} transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}>
                    <div className="absolute inset-0 rounded-full border border-dashed border-white/20" />
                    <div className="absolute inset-8 rounded-full border border-cyan-200/20" />
                    {avatars.slice(0, 8).map((avatar, index) => {
                      const angle = (index / 8) * Math.PI * 2;
                      const x = Math.cos(angle) * 126;
                      const y = Math.sin(angle) * 126;
                      return (
                        <motion.div key={avatar.id} className={`absolute left-1/2 top-1/2 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br ${avatar.gradient} text-4xl shadow-2xl ring-1 ${avatar.ring}`} style={{ x: x - 32, y: y - 32 }} animate={{ rotate: -360 }} transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}>
                          {avatar.icon}
                        </motion.div>
                      );
                    })}
                    <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] bg-white/10 text-center backdrop-blur-xl">
                      <div>
                        <Star className="mx-auto h-7 w-7 fill-yellow-200 text-yellow-200" />
                        <p className="mt-2 font-display text-xs font-black uppercase tracking-widest text-white/70">Players</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>

              <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatChip icon={<Calendar className="h-5 w-5" />} label="events" value={events.length} color="from-cyan-300 to-blue-500" />
                <StatChip icon={<Users className="h-5 w-5" />} label="members" value={allMembers.length} color="from-fuchsia-400 to-violet-600" />
                <StatChip icon={<Lightbulb className="h-5 w-5" />} label="ideas" value={allIdeas} color="from-yellow-300 to-orange-500" />
                <StatChip icon={<Heart className="h-5 w-5" />} label="reactions" value={allReactions} color="from-rose-400 to-pink-600" />
              </section>

              <section className="mt-10">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/35">Choose your level</p>
                    <h2 className="mt-2 font-display text-3xl font-black text-white">Event Portals</h2>
                  </div>
                  <button type="button" onClick={() => setModal('event')} className="secondary-button">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
                {events.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-12 text-center backdrop-blur-xl">
                    <motion.span className="text-7xl block mb-4" animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>🎮</motion.span>
                    <h3 className="font-display text-2xl font-black text-white">No quests yet!</h3>
                    <p className="mx-auto mt-3 max-w-md text-white/50">Create your first event and invite team members to start sharing creative ideas.</p>
                    <button type="button" onClick={() => setModal('event')} className="primary-button mx-auto mt-6 bg-gradient-to-r from-cyan-300 to-fuchsia-400 text-slate-950">
                      <Plus className="h-5 w-5" /> Create First Quest
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event, index) => <EventCard key={event.id} event={event} index={index} onOpen={() => setRoute({ eventId: event.id })} />)}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {currentEvent && !currentMember && (
            <motion.div key="event" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
              <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
                <div className={`absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br ${currentEvent.accent} opacity-30 blur-3xl`} />
                <div className="relative grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                  <div>
                    <div className={`mb-5 grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br ${currentEvent.accent} text-5xl shadow-2xl`}>
                      {currentEvent.icon}
                    </div>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/35">Mission room</p>
                    <h1 className="mt-2 font-display text-4xl font-black leading-tight text-white sm:text-6xl">{currentEvent.title}</h1>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-white/60">{currentEvent.brief}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <StatChip icon={<Users className="h-5 w-5" />} label="players" value={currentEvent.members.length} color="from-fuchsia-400 to-violet-600" />
                    <StatChip icon={<Lightbulb className="h-5 w-5" />} label="ideas" value={eventIdeaCount(currentEvent)} color="from-yellow-300 to-orange-500" />
                    <StatChip icon={<Flame className="h-5 w-5" />} label="vibes" value={eventReactionCount(currentEvent)} color="from-rose-400 to-red-600" />
                  </div>
                </div>
              </section>

              <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
                <div>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/35">Open folders</p>
                      <h2 className="mt-2 font-display text-3xl font-black text-white">Creative Players</h2>
                    </div>
                    <button type="button" onClick={() => setModal('member')} className="primary-button bg-gradient-to-r from-fuchsia-400 to-violet-500 text-white">
                      <Plus className="h-4 w-4" /> Join
                    </button>
                  </div>
                  {currentEvent.members.length === 0 ? (
                    <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-12 text-center backdrop-blur-xl">
                      <Folder className="mx-auto h-14 w-14 text-fuchsia-200/70" />
                      <h3 className="mt-4 font-display text-2xl font-black text-white">No folders yet</h3>
                      <p className="mx-auto mt-3 max-w-md text-white/50">Create the first member folder. Everyone can enter, add thoughts, and react.</p>
                      <button type="button" onClick={() => setModal('member')} className="primary-button mx-auto mt-6 bg-gradient-to-r from-fuchsia-400 to-violet-500 text-white">
                        <Plus className="h-5 w-5" /> Create folder
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {currentEvent.members.map((member, index) => <MemberFolder key={member.id} member={member} rank={index} onOpen={() => setRoute({ eventId: currentEvent.id, memberId: member.id })} />)}
                    </div>
                  )}
                </div>
                <Leaderboard members={currentEvent.members} title={`${currentEvent.title} Board`} />
              </section>
            </motion.div>
          )}

          {currentEvent && currentMember && (
            <motion.div key="member" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
              <section className={`relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-gradient-to-br ${currentMember.avatarGradient} p-6 shadow-2xl sm:p-8`}>
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute right-8 top-8 hidden h-48 w-48 rounded-full border border-white/15 sm:block" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-5">
                    <motion.div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-white/20 text-7xl shadow-2xl backdrop-blur-xl" animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                      {currentMember.avatarIcon}
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/60">Member folder</p>
                      <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-6xl">{currentMember.name}</h1>
                      <p className="mt-2 text-white/70">{currentMember.role} - {currentMember.avatarName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:w-72">
                    <div className="rounded-3xl bg-black/25 p-4 backdrop-blur-xl">
                      <p className="font-display text-3xl font-black text-yellow-200">{currentMember.points}</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/45">XP</p>
                    </div>
                    <div className="rounded-3xl bg-black/25 p-4 backdrop-blur-xl">
                      <p className="font-display text-3xl font-black text-cyan-100">{memberIdeaCount(currentMember)}</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/45">Ideas</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <button type="button" onClick={() => setModal('idea')} className="group flex w-full items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-cyan-200/25 bg-cyan-200/[0.06] p-6 font-display text-lg font-black uppercase tracking-wide text-cyan-100 transition hover:border-cyan-100/50 hover:bg-cyan-200/[0.1]">
                  <Rocket className="h-6 w-6 transition group-hover:-translate-y-1 group-hover:translate-x-1" /> Upload a new thought
                </button>
              </section>

              <section className="mt-8">
                <div className="mb-5 flex items-center gap-3">
                  <Eye className="h-6 w-6 text-cyan-200" />
                  <h2 className="font-display text-3xl font-black text-white">Idea Gallery</h2>
                </div>
                {currentMember.ideas.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-12 text-center backdrop-blur-xl">
                    <Lightbulb className="mx-auto h-14 w-14 text-yellow-200/70" />
                    <h3 className="mt-4 font-display text-2xl font-black text-white">Empty gallery</h3>
                    <p className="mx-auto mt-3 max-w-md text-white/50">Upload a concept, caption, design thought, or weird genius idea.</p>
                  </div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {currentMember.ideas.map((idea) => <IdeaOrb key={idea.id} idea={idea} member={currentMember} onReact={(reaction) => handleReact(idea.id, reaction)} />)}
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showBoard && (
          <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setShowBoard(false)}>
            <motion.aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#090918]/95 p-5 shadow-2xl" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 240 }} onMouseDown={(event) => event.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-2xl font-black text-white">Rank Board</p>
                <button type="button" onClick={() => setShowBoard(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white/70 hover:bg-white/15 hover:text-white" aria-label="Close leaderboard">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Leaderboard members={allMembers} title="All Events" />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === 'event' && <CreateEventModal onClose={() => setModal(null)} onCreate={handleAddEvent} />}
        {modal === 'member' && currentEvent && <CreateMemberModal onClose={() => setModal(null)} onCreate={handleAddMember} />}
        {modal === 'idea' && currentMember && <CreateIdeaModal onClose={() => setModal(null)} onCreate={handleAddIdea} />}
      </AnimatePresence>

      <footer className="relative z-10 border-t border-white/10 bg-[#070713]/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <p className="text-sm text-white/35">Made with 💜 by IEEE Menoufia SB — Creative Quest Arena</p>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Firebase Connected
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
