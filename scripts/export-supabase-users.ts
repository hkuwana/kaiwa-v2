#!/usr/bin/env tsx

/**
 * Export users from Supabase to prepare for migration
 * 
 * Usage:
 * 1. Set environment variables:
 *    - SUPABASE_URL=https://your-project.supabase.co
 *    - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 2. Run: pnpm tsx scripts/export-supabase-users.ts
 */

interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  user_metadata?: any;
  app_metadata?: any;
}

async function exportSupabaseUsers() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    console.log('Please set environment variables:');
    console.log('  SUPABASE_URL=https://your-project.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log('');
    console.log('Alternative: Export manually from Supabase Dashboard');
    console.log('1. Go to Authentication > Users');
    console.log('2. Click "Export" button');
    console.log('3. Save as supabase-users.json in project root');
    return;
  }

  try {
    console.log('🔍 Connecting to Supabase...');
    
    // Fetch users from Supabase auth.users table
    const response = await fetch(`${supabaseUrl}/rest/v1/auth.users`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users: SupabaseUser[] = await response.json();
    
    console.log(`✅ Found ${users.length} users`);

    // Save to JSON file for migration
    const fs = await import('fs/promises');
    await fs.writeFile('./supabase-users.json', JSON.stringify(users, null, 2));
    
    console.log('📁 Saved to supabase-users.json');
    console.log('🚀 Now run: pnpm tsx scripts/migrate-supabase-users.ts');

    // Show preview
    console.log('\n👀 Preview of first user:');
    if (users[0]) {
      console.log({
        email: users[0].email,
        created_at: users[0].created_at,
        email_confirmed: !!users[0].email_confirmed_at,
        metadata: users[0].user_metadata
      });
    }

  } catch (error) {
    console.error('💥 Export failed:', error);
    console.log('\n💡 Alternative approaches:');
    console.log('1. Export from Supabase Dashboard (Authentication > Users > Export)');
    console.log('2. Use Supabase SQL Editor:');
    console.log(`   SELECT id, email, created_at, email_confirmed_at, user_metadata 
   FROM auth.users 
   ORDER BY created_at DESC;`);
  }
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportSupabaseUsers();
}