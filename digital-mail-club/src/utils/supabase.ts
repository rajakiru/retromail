import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for the mail club
export const letterService = {
  // Generate random 6-character code
  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  },

  // Generate unique code
  async generateUniqueCode() {
    let code;
    let attempts = 0;
    
    do {
      code = this.generateCode();
      attempts++;
      
      const { data, error } = await supabase
        .from('letters')
        .select('code')
        .eq('code', code)
        .limit(1);
      
      if (error) throw error;
      if (data.length === 0) break;
    } while (attempts < 10);
    
    if (attempts >= 10) {
      throw new Error('Unable to generate unique code after 10 attempts');
    }
    
    return code;
  },

  // Send a letter
  async sendLetter({ subject, content, senderName }) {
    if (!subject?.trim() || !content?.trim()) {
      throw new Error('Subject and content are required');
    }

    if (subject.length > 200) {
      throw new Error('Subject must be 200 characters or less');
    }

    if (content.length > 5000) {
      throw new Error('Content must be 5000 characters or less');
    }

    const code = await this.generateUniqueCode();
    const cleanSenderName = (senderName || 'Anonymous Friend').trim().substring(0, 100);

    const { data, error } = await supabase
      .from('letters')
      .insert([
        {
          code: code,
          subject: subject.trim(),
          content: content.trim(),
          sender_name: cleanSenderName,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Update stats (non-blocking)
    supabase.rpc('increment_stat', { stat_name: 'total_letters' });

    return { code, id: data.id };
  },

  // Get a letter by code
  async getLetter(code) {
    if (!code || !/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
      throw new Error('Invalid code format - must be 6 alphanumeric characters');
    }

    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .eq('code', code.toUpperCase())
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Letter not found. It may have expired or never existed.');
    }

    const letter = data[0];
    const newReadCount = (letter.read_count || 0) + 1;

    // Update read count (non-blocking)
    supabase
      .from('letters')
      .update({ 
        read_count: newReadCount, 
        last_read_at: new Date().toISOString() 
      })
      .eq('id', letter.id);

    // Update stats (non-blocking)
    supabase.rpc('increment_stat', { stat_name: 'total_reads' });

    return {
      id: letter.id,
      code: letter.code,
      subject: letter.subject,
      content: letter.content,
      senderName: letter.sender_name,
      dateCreated: letter.created_at,
      readCount: newReadCount,
      expiresAt: letter.expires_at
    };
  },

  // Get stats
  async getStats() {
    const [statsResult, activeCount] = await Promise.all([
      supabase.from('stats').select('metric, value').order('metric'),
      supabase.from('letters').select('*', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString())
    ]);
    
    if (statsResult.error) throw statsResult.error;
    
    const statsData = {};
    statsResult.data.forEach(row => {
      statsData[row.metric] = parseInt(row.value);
    });
    
    statsData.active_letters = activeCount.count || 0;
    return statsData;
  }
};