// api/letters.js - Working version for Supabase
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set JSON headers FIRST
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log(`🔍 API called: ${req.method} ${req.url}`);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check database connection
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable not found');
    return res.status(500).json({
      success: false,
      error: 'Database configuration missing',
      hint: 'Please set POSTGRES_URL in Vercel environment variables'
    });
  }

  // Generate random 6-character code
  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  // Ensure unique code
  async function generateUniqueCode() {
    let code;
    let attempts = 0;
    
    do {
      code = generateCode();
      attempts++;
      
      try {
        const existing = await sql`
          SELECT 1 FROM letters WHERE code = ${code} LIMIT 1
        `;
        
        if (existing.rows.length === 0) break;
      } catch (error) {
        console.error('Error checking code uniqueness:', error);
        if (attempts >= 5) throw error;
      }
    } while (attempts < 10);
    
    if (attempts >= 10) {
      throw new Error('Unable to generate unique code after 10 attempts');
    }
    
    return code;
  }

  try {
    // Test database connection
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connected');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        hint: 'Check your POSTGRES_URL format and database availability',
        details: dbError.message
      });
    }

    if (req.method === 'POST') {
      console.log('📝 Processing POST request');
      
      const { subject, content, senderName } = req.body || {};
      
      // Validation
      if (!subject?.trim() || !content?.trim()) {
        return res.status(400).json({ 
          success: false,
          error: 'Subject and content are required' 
        });
      }

      if (subject.length > 200) {
        return res.status(400).json({ 
          success: false,
          error: 'Subject must be 200 characters or less' 
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({ 
          success: false,
          error: 'Content must be 5000 characters or less' 
        });
      }

      const code = await generateUniqueCode();
      const cleanSenderName = (senderName || 'Anonymous Friend').trim().substring(0, 100);

      console.log(`🔤 Generated unique code: ${code}`);

      // Insert letter
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

      // Update stats (non-blocking)
      sql`
        UPDATE stats 
        SET value = value + 1, updated_at = NOW()
        WHERE metric = 'total_letters'
      `.catch(e => console.log('Stats update failed:', e.message));

      const letter = result.rows[0];
      console.log(`✅ Letter created successfully: ${code} (ID: ${letter.id})`);

      return res.status(201).json({
        success: true,
        code: code,
        message: 'Letter sent successfully!',
        id: letter.id
      });

    } else if (req.method === 'GET') {
      console.log('📖 Processing GET request');
      
      const { code, stats } = req.query;
      
      // Return stats if requested
      if (stats === 'true') {
        try {
          const [statsResult, activeCount] = await Promise.all([
            sql`SELECT metric, value FROM stats ORDER BY metric`,
            sql`SELECT COUNT(*) as count FROM letters WHERE expires_at > NOW()`
          ]);
          
          const statsData = {};
          statsResult.rows.forEach(row => {
            statsData[row.metric] = parseInt(row.value);
          });
          statsData.active_letters = parseInt(activeCount.rows[0].count);

          return res.status(200).json({
            success: true,
            stats: statsData
          });
        } catch (error) {
          console.error('Stats error:', error);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to fetch stats' 
          });
        }
      }

      // Get letter by code
      if (!code) {
        return res.status(400).json({ 
          success: false,
          error: 'Code parameter is required' 
        });
      }

      if (!/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid code format - must be 6 alphanumeric characters' 
        });
      }

      const result = await sql`
        SELECT id, code, subject, content, sender_name, created_at, read_count, expires_at
        FROM letters 
        WHERE code = ${code.toUpperCase()} AND expires_at > NOW()
        LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Letter not found. It may have expired or never existed.' 
        });
      }

      const letter = result.rows[0];
      const newReadCount = letter.read_count + 1;

      // Update read count (non-blocking)
      sql`
        UPDATE letters 
        SET read_count = ${newReadCount}, last_read_at = NOW()
        WHERE id = ${letter.id}
      `.catch(e => console.log('Read count update failed:', e.message));

      sql`
        UPDATE stats 
        SET value = value + 1, updated_at = NOW()
        WHERE metric = 'total_reads'
      `.catch(e => console.log('Stats update failed:', e.message));

      console.log(`📖 Letter retrieved: ${code} (reads: ${newReadCount})`);

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
      const { code } = req.query;
      
      if (!code || !/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
        return res.status(400).json({ 
          success: false,
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
          success: false,
          error: 'Letter not found' 
        });
      }

      console.log(`🗑️ Letter deleted: ${code}`);

      return res.status(200).json({
        success: true,
        message: 'Letter deleted successfully'
      });

    } else {
      return res.status(405).json({ 
        success: false,
        error: `Method ${req.method} not allowed` 
      });
    }

  } catch (error) {
    console.error('❌ Unhandled API Error:', error);
    
    // Handle specific database errors
    const errorResponses = {
      '23505': { error: 'Code collision detected, please try again', status: 409 },
      '42P01': { error: 'Database tables not found. Please run the setup SQL.', status: 500 },
      '28P01': { error: 'Database authentication failed. Check your connection string.', status: 500 },
      '3D000': { error: 'Database does not exist. Check your connection string.', status: 500 }
    };

    const errorResponse = errorResponses[error.code];
    if (errorResponse) {
      return res.status(errorResponse.status).json({
        success: false,
        ...errorResponse
      });
    }

    // Generic error response
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message,
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  }
}