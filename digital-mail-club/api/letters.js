// api/letters.js - Updated with Vercel Postgres
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
    return Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 36).toString(36).toUpperCase()
    ).join('');
  }

  // Ensure unique code by checking database
  async function generateUniqueCode() {
    let code;
    let attempts = 0;
    
    do {
      code = generateCode();
      attempts++;
      
      // Check if code already exists
      const existing = await sql`
        SELECT code FROM letters WHERE code = ${code}
      `;
      
      if (existing.rows.length === 0) break;
    } while (attempts < 10);
    
    if (attempts >= 10) {
      throw new Error('Unable to generate unique code');
    }
    
    return code;
  }

  // Clean up expired letters
  async function cleanupExpiredLetters() {
    try {
      const result = await sql`
        DELETE FROM letters 
        WHERE expires_at < NOW()
      `;
      
      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} expired letters`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  try {
    // Clean up expired letters on each request (lightweight)
    await cleanupExpiredLetters();

    if (req.method === 'POST') {
      // Create new letter
      const { subject, content, senderName } = req.body;
      
      if (!subject || !content) {
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
      const cleanSenderName = (senderName || 'Anonymous Friend').trim();

      // Insert letter into database
      const result = await sql`
        INSERT INTO letters (code, subject, content, sender_name)
        VALUES (${code}, ${subject.trim()}, ${content.trim()}, ${cleanSenderName})
        RETURNING id, code, created_at
      `;

      // Update stats
      try {
        await sql`
          UPDATE stats 
          SET value = value + 1, updated_at = NOW()
          WHERE metric = 'total_letters'
        `;
      } catch (e) {
        console.log('Stats update failed:', e);
      }

      const letter = result.rows[0];
      console.log(`✅ Letter stored with code: ${code} (ID: ${letter.id})`);

      return res.status(201).json({
        success: true,
        code: code,
        message: 'Letter sent successfully!',
        id: letter.id
      });

    } else if (req.method === 'GET') {
      // Get letter by code
      const { code, stats } = req.query;
      
      // Return basic stats if requested
      if (stats === 'true') {
        try {
          const statsResult = await sql`
            SELECT metric, value FROM stats
          `;
          
          const statsData = {};
          statsResult.rows.forEach(row => {
            statsData[row.metric] = row.value;
          });

          return res.status(200).json({
            success: true,
            stats: statsData
          });
        } catch (error) {
          console.error('Stats error:', error);
          return res.status(500).json({ error: 'Failed to fetch stats' });
        }
      }

      if (!code) {
        return res.status(400).json({ 
          error: 'Code parameter is required' 
        });
      }

      if (code.length !== 6) {
        return res.status(400).json({ 
          error: 'Invalid code format - must be 6 characters' 
        });
      }

      // Get letter from database
      const result = await sql`
        SELECT id, code, subject, content, sender_name, created_at, read_count
        FROM letters 
        WHERE code = ${code.toUpperCase()} AND expires_at > NOW()
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Letter not found. It may have expired or never existed.' 
        });
      }

      const letter = result.rows[0];

      // Increment read count and update last read time
      try {
        await sql`
          UPDATE letters 
          SET read_count = read_count + 1, last_read_at = NOW()
          WHERE id = ${letter.id}
        `;

        await sql`
          UPDATE stats 
          SET value = value + 1, updated_at = NOW()
          WHERE metric = 'total_reads'
        `;
      } catch (e) {
        console.log('Read count update failed:', e);
      }

      console.log(`📖 Letter retrieved with code: ${code} (reads: ${letter.read_count + 1})`);

      return res.status(200).json({
        success: true,
        letter: {
          id: letter.id,
          code: letter.code,
          subject: letter.subject,
          content: letter.content,
          senderName: letter.sender_name,
          dateCreated: letter.created_at,
          readCount: letter.read_count + 1
        }
      });

    } else if (req.method === 'DELETE') {
      // Delete letter by code (optional feature)
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ 
          error: 'Code parameter is required' 
        });
      }

      const result = await sql`
        DELETE FROM letters 
        WHERE code = ${code.toUpperCase()}
        RETURNING id
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Letter not found' 
        });
      }

      console.log(`🗑️ Letter deleted with code: ${code}`);

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
    
    if (error.message.includes('Unable to generate unique code')) {
      return res.status(500).json({ 
        error: 'System is busy, please try again' 
      });
    }

    if (error.message.includes('duplicate key')) {
      return res.status(500).json({ 
        error: 'Code collision detected, please try again' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}