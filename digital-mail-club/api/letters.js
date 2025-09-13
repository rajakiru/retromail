// api/letters.js - Optimized for Supabase
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Generate random 6-character code
  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  // Ensure unique code by checking database
  async function generateUniqueCode() {
    let code;
    let attempts = 0;
    
    do {
      code = generateCode();
      attempts++;
      
      try {
        // Check if code already exists
        const existing = await sql`
          SELECT 1 FROM letters WHERE code = ${code} LIMIT 1
        `;
        
        if (existing.rows.length === 0) break;
      } catch (error) {
        console.error('Error checking code uniqueness:', error);
        throw new Error('Database error while generating code');
      }
    } while (attempts < 10);
    
    if (attempts >= 10) {
      throw new Error('Unable to generate unique code after 10 attempts');
    }
    
    return code;
  }

  // Clean up expired letters (run occasionally)
  async function cleanupExpiredLetters() {
    try {
      // Only cleanup 1% of the time to avoid unnecessary database calls
      if (Math.random() > 0.01) return;

      const result = await sql`
        DELETE FROM letters 
        WHERE expires_at < NOW()
        AND created_at < NOW() - INTERVAL '1 day'
      `;
      
      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} expired letters`);
      }
    } catch (error) {
      console.error('Cleanup error (non-critical):', error);
    }
  }

  try {
    // Periodic cleanup
    await cleanupExpiredLetters();

    if (req.method === 'POST') {
      // Create new letter
      const { subject, content, senderName } = req.body || {};
      
      // Validation
      if (!subject?.trim() || !content?.trim()) {
        return res.status(400).json({ 
          error: 'Subject and content are required' 
        });
      }

      if (subject.length > 200) {
        return res.status(400).json({ 
          error: 'Subject must be 200 characters or less' 
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({ 
          error: 'Content must be 5000 characters or less' 
        });
      }

      const code = await generateUniqueCode();
      const cleanSenderName = (senderName || 'Anonymous Friend').trim().substring(0, 100);

      // Insert letter into database
      const result = await sql`
        INSERT INTO letters (code, subject, content, sender_name, expires_at)
        VALUES (
          ${code}, 
          ${subject.trim()}, 
          ${content.trim()}, 
          ${cleanSenderName},
          NOW() + INTERVAL '30 days'
        )
        RETURNING id, code, created_at
      `;

      const letter = result.rows[0];

      // Update stats (non-blocking)
      sql`
        INSERT INTO stats (metric, value, updated_at) 
        VALUES ('total_letters', 1, NOW())
        ON CONFLICT (metric) 
        DO UPDATE SET value = stats.value + 1, updated_at = NOW()
      `.catch(e => console.log('Stats update failed (non-critical):', e.message));

      console.log(`✅ Letter stored with code: ${code} (ID: ${letter.id})`);

      return res.status(201).json({
        success: true,
        code: code,
        message: 'Letter sent successfully!',
        id: letter.id
      });

    } else if (req.method === 'GET') {
      const { code, stats } = req.query;
      
      // Return basic stats if requested
      if (stats === 'true') {
        try {
          const [statsResult, countResult] = await Promise.all([
            sql`SELECT metric, value FROM stats ORDER BY metric`,
            sql`SELECT COUNT(*) as active FROM letters WHERE expires_at > NOW()`
          ]);
          
          const statsData = {};
          statsResult.rows.forEach(row => {
            statsData[row.metric] = parseInt(row.value);
          });

          statsData.active_letters = parseInt(countResult.rows[0].active);

          return res.status(200).json({
            success: true,
            stats: statsData
          });
        } catch (error) {
          console.error('Stats error:', error);
          return res.status(200).json({ 
            success: true, 
            stats: { error: 'Stats temporarily unavailable' }
          });
        }
      }

      if (!code) {
        return res.status(400).json({ 
          error: 'Code parameter is required' 
        });
      }

      if (!/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
        return res.status(400).json({ 
          error: 'Invalid code format - must be 6 alphanumeric characters' 
        });
      }

      // Get letter from database
      const result = await sql`
        SELECT id, code, subject, content, sender_name, created_at, read_count, expires_at
        FROM letters 
        WHERE code = ${code.toUpperCase()} AND expires_at > NOW()
        LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Letter not found. It may have expired or never existed.' 
        });
      }

      const letter = result.rows[0];

      // Increment read count (non-blocking)
      const newReadCount = letter.read_count + 1;
      
      sql`
        UPDATE letters 
        SET read_count = ${newReadCount}, last_read_at = NOW()
        WHERE id = ${letter.id}
      `.catch(e => console.log('Read count update failed (non-critical):', e.message));

      sql`
        INSERT INTO stats (metric, value, updated_at) 
        VALUES ('total_reads', 1, NOW())
        ON CONFLICT (metric) 
        DO UPDATE SET value = stats.value + 1, updated_at = NOW()
      `.catch(e => console.log('Stats update failed (non-critical):', e.message));

      console.log(`📖 Letter retrieved with code: ${code} (reads: ${newReadCount})`);

      return res.status(200).json({
        success: true,
        letter: {
          id: letter.id,
          code: letter.code,
          subject: letter.subject,
          content: letter.content,
          senderName: letter.sender_name,
          dateCreated: letter.created_at,
          readCount: newReadCount,
          expiresAt: letter.expires_at
        }
      });

    } else if (req.method === 'DELETE') {
      // Delete letter by code (optional feature)
      const { code } = req.query;
      
      if (!code || !/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
        return res.status(400).json({ 
          error: 'Valid 6-character code is required' 
        });
      }

      const result = await sql`
        DELETE FROM letters 
        WHERE code = ${code.toUpperCase()}
        RETURNING id, subject
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Letter not found' 
        });
      }

      console.log(`🗑️ Letter deleted with code: ${code} (ID: ${result.rows[0].id})`);

      return res.status(200).json({
        success: true,
        message: 'Letter deleted successfully'
      });

    } else {
      return res.status(405).json({ 
        error: 'Method not allowed' 
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Handle specific Postgres error codes
    if (error.code === '23505') { // Unique violation
      return res.status(500).json({ 
        error: 'Code collision detected, please try again' 
      });
    }

    if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({ 
        error: 'Database tables not found. Please run database setup first.',
        setup_url: '/api/setup'
      });
    }

    if (error.code === '28P01' || error.code === '3D000') { // Auth or database doesn't exist
      return res.status(500).json({ 
        error: 'Database connection failed. Please check your POSTGRES_URL.' 
      });
    }

    if (error.message?.includes('Unable to generate unique code')) {
      return res.status(500).json({ 
        error: 'System is busy generating codes, please try again' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error. Please try again.',
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  }
}