// api/stats.js - Get usage statistics
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get basic stats
    const statsResult = await sql`
      SELECT metric, value, updated_at FROM stats
    `;
    
    // Get recent activity
    const recentResult = await sql`
      SELECT 
        COUNT(*) as letters_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as letters_week
      FROM letters
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;

    // Get active letters count
    const activeResult = await sql`
      SELECT COUNT(*) as active_letters
      FROM letters 
      WHERE expires_at > NOW()
    `;

    const stats = {};
    statsResult.rows.forEach(row => {
      stats[row.metric] = {
        value: row.value,
        updated: row.updated_at
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        ...stats,
        active_letters: activeResult.rows[0].active_letters,
        recent_activity: recentResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}