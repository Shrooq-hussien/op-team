// Cloudflare Worker API for IEEE Creative Arena
// Handles all D1 database operations

export interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
}

// Generate unique ID
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// CORS headers
const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
});

// Handle CORS preflight
function handleOptions(request: Request, env: Env) {
  return new Response(null, {
    headers: corsHeaders(env.FRONTEND_URL),
  });
}

// ==================== EVENTS ====================

async function getEvents(request: Request, env: Env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM events ORDER BY created_at DESC'
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

async function createEvent(request: Request, env: Env) {
  try {
    const { title, brief, icon, accent } = await request.json() as any;
    const id = `event-${uid()}`;
    
    await env.DB.prepare(
      'INSERT INTO events (id, title, brief, icon, accent) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, title, brief, icon || '🎮', accent || 'from-cyan-400 via-blue-500 to-violet-600')
    .run();
    
    const event = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
    
    return new Response(JSON.stringify(event), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

async function deleteEvent(request: Request, env: Env, eventId: string) {
  try {
    // Delete all ideas for this event
    await env.DB.prepare('DELETE FROM ideas WHERE event_id = ?').bind(eventId).run();
    // Delete all members for this event
    await env.DB.prepare('DELETE FROM members WHERE event_id = ?').bind(eventId).run();
    // Delete the event
    await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

// ==================== MEMBERS ====================

async function getMembers(request: Request, env: Env, eventId: string) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM members WHERE event_id = ? ORDER BY created_at DESC'
    ).bind(eventId).all();
    
    return new Response(JSON.stringify(results), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

async function createMember(request: Request, env: Env, eventId: string) {
  try {
    const { name, role, avatarId, avatarIcon, avatarName, avatarTrait, avatarGradient, avatarRing } = await request.json() as any;
    const id = `member-${uid()}`;
    
    await env.DB.prepare(
      `INSERT INTO members (id, event_id, name, role, avatar_id, avatar_icon, avatar_name, avatar_trait, avatar_gradient, avatar_ring) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, eventId, name, role || 'Creative player', avatarId, avatarIcon, avatarName, avatarTrait, avatarGradient, avatarRing)
    .run();
    
    const member = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(id).first();
    
    return new Response(JSON.stringify(member), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

async function updateMemberPoints(request: Request, env: Env, eventId: string, memberId: string) {
  try {
    const { points } = await request.json() as any;
    
    await env.DB.prepare(
      'UPDATE members SET points = ? WHERE id = ? AND event_id = ?'
    ).bind(points, memberId, eventId).run();
    
    const member = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(memberId).first();
    
    return new Response(JSON.stringify(member), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

// ==================== IDEAS ====================

async function getIdeas(request: Request, env: Env, eventId: string, memberId: string) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM ideas WHERE event_id = ? AND member_id = ? ORDER BY created_at DESC'
    ).bind(eventId, memberId).all();
    
    // Parse JSON fields
    const ideas = results.map((idea: any) => ({
      ...idea,
      tags: JSON.parse(idea.tags || '[]'),
      reactions: JSON.parse(idea.reactions || '[]'),
    }));
    
    return new Response(JSON.stringify(ideas), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

async function createIdea(request: Request, env: Env, eventId: string, memberId: string) {
  try {
    const { title, thought, tags, reactions } = await request.json() as any;
    const id = `idea-${uid()}`;
    
    await env.DB.prepare(
      `INSERT INTO ideas (id, event_id, member_id, title, thought, tags, reactions) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, eventId, memberId, title, thought, JSON.stringify(tags || []), JSON.stringify(reactions || []))
    .run();
    
    const idea = await env.DB.prepare('SELECT * FROM ideas WHERE id = ?').bind(id).first();
    
    return new Response(JSON.stringify({
      ...idea,
      tags: JSON.parse(idea!.tags as string || '[]'),
      reactions: JSON.parse(idea!.reactions as string || '[]'),
    }), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

async function updateIdeaReactions(request: Request, env: Env, eventId: string, memberId: string, ideaId: string) {
  try {
    const { reactions } = await request.json() as any;
    
    await env.DB.prepare(
      'UPDATE ideas SET reactions = ? WHERE id = ? AND event_id = ? AND member_id = ?'
    ).bind(JSON.stringify(reactions), ideaId, eventId, memberId).run();
    
    const idea = await env.DB.prepare('SELECT * FROM ideas WHERE id = ?').bind(ideaId).first();
    
    return new Response(JSON.stringify({
      ...idea,
      tags: JSON.parse(idea!.tags as string || '[]'),
      reactions: JSON.parse(idea!.reactions as string || '[]'),
    }), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

// ==================== LEADERBOARD ====================

async function getLeaderboard(request: Request, env: Env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT m.*, e.title as event_title 
       FROM members m 
       JOIN events e ON m.event_id = e.id 
       ORDER BY m.points DESC 
       LIMIT 20`
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

// ==================== STATS ====================

async function getStats(request: Request, env: Env) {
  try {
    const events = await env.DB.prepare('SELECT COUNT(*) as count FROM events').first();
    const members = await env.DB.prepare('SELECT COUNT(*) as count FROM members').first();
    const ideas = await env.DB.prepare('SELECT COUNT(*) as count FROM ideas').first();
    
    return new Response(JSON.stringify({
      events: events?.count || 0,
      members: members?.count || 0,
      ideas: ideas?.count || 0,
    }), {
      headers: corsHeaders(env.FRONTEND_URL),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(env.FRONTEND_URL),
    });
  }
}

// ==================== MAIN ROUTER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions(request, env);
    }
    
    // Route matching
    try {
      // Events
      if (path === '/api/events' && method === 'GET') {
        return getEvents(request, env);
      }
      if (path === '/api/events' && method === 'POST') {
        return createEvent(request, env);
      }
      
      // Event by ID
      const eventMatch = path.match(/^\/api\/events\/([^/]+)$/);
      if (eventMatch && method === 'DELETE') {
        return deleteEvent(request, env, eventMatch[1]);
      }
      
      // Members
      const membersMatch = path.match(/^\/api\/events\/([^/]+)\/members$/);
      if (membersMatch && method === 'GET') {
        return getMembers(request, env, membersMatch[1]);
      }
      if (membersMatch && method === 'POST') {
        return createMember(request, env, membersMatch[1]);
      }
      
      // Member points
      const memberPointsMatch = path.match(/^\/api\/events\/([^/]+)\/members\/([^/]+)\/points$/);
      if (memberPointsMatch && method === 'PUT') {
        return updateMemberPoints(request, env, memberPointsMatch[1], memberPointsMatch[2]);
      }
      
      // Ideas
      const ideasMatch = path.match(/^\/api\/events\/([^/]+)\/members\/([^/]+)\/ideas$/);
      if (ideasMatch && method === 'GET') {
        return getIdeas(request, env, ideasMatch[1], ideasMatch[2]);
      }
      if (ideasMatch && method === 'POST') {
        return createIdea(request, env, ideasMatch[1], ideasMatch[2]);
      }
      
      // Idea reactions
      const reactionsMatch = path.match(/^\/api\/events\/([^/]+)\/members\/([^/]+)\/ideas\/([^/]+)\/reactions$/);
      if (reactionsMatch && method === 'PUT') {
        return updateIdeaReactions(request, env, reactionsMatch[1], reactionsMatch[2], reactionsMatch[3]);
      }
      
      // Leaderboard
      if (path === '/api/leaderboard' && method === 'GET') {
        return getLeaderboard(request, env);
      }
      
      // Stats
      if (path === '/api/stats' && method === 'GET') {
        return getStats(request, env);
      }
      
      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders(env.FRONTEND_URL),
      });
      
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders(env.FRONTEND_URL),
      });
    }
  },
};
