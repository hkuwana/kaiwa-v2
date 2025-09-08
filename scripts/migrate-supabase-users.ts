#!/usr/bin/env tsx

import { db } from './db-standalone.js';
import { users } from '../src/lib/server/db/schema/users.js';
import type { NewUser } from '../src/lib/server/db/types.js';
import { eq } from 'drizzle-orm';

interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: {
    name?: string;
    picture?: string;
    email?: string;
    sub?: string;
    iss?: string;
  };
  raw_app_meta_data?: {
    provider?: string;
    providers?: string[];
  };
}

/**
 * Migration script to transfer Supabase auth users to local database
 * 
 * Usage:
 * 1. Place your Supabase user data in supabase-users.json
 * 2. Run: pnpm tsx scripts/migrate-supabase-users.ts
 */
async function migrateSupabaseUsers() {
  try {
    console.log('🚀 Starting Supabase user migration...');

    // TODO: Replace this with actual data source
    // You can load from JSON file, CSV, or connect directly to Supabase
    const supabaseUsers: SupabaseUser[] = await loadSupabaseUsers();
    
    console.log(`📥 Found ${supabaseUsers.length} users to migrate`);

    const migrationResults = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const supabaseUser of supabaseUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({ 
          where: eq(users.email, supabaseUser.email) 
        });
        
        if (existingUser) {
          console.log(`⏭️  Skipping existing user: ${supabaseUser.email}`);
          migrationResults.skipped++;
          continue;
        }

        // Map Supabase user to our user schema
        const newUser: NewUser = mapSupabaseUserToLocal(supabaseUser);

        // Create user in local database
        const [createdUser] = await db.insert(users).values(newUser).returning();
        
        console.log(`✅ Migrated user: ${createdUser.email}`);
        migrationResults.successful++;

      } catch (error) {
        const errorMsg = `Failed to migrate user ${supabaseUser.email}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        migrationResults.errors.push(errorMsg);
        migrationResults.failed++;
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${migrationResults.successful}`);
    console.log(`⏭️  Skipped: ${migrationResults.skipped}`);
    console.log(`❌ Failed: ${migrationResults.failed}`);
    
    if (migrationResults.errors.length > 0) {
      console.log('\n💥 Errors:');
      migrationResults.errors.forEach(error => console.log(`   ${error}`));
    }

    // Extract emails for beta testing
    await extractBetaTestEmails(supabaseUsers);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Load Supabase users from data source
 * TODO: Implement based on your data format
 */
async function loadSupabaseUsers(): Promise<SupabaseUser[]> {
  // Option 1: From JSON file
  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile('./supabase-users.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('📝 No supabase-users.json found. Please provide user data.');
    console.log('You can:');
    console.log('1. Create supabase-users.json with your user data');
    console.log('2. Modify this script to connect directly to Supabase');
    console.log('3. Load from CSV or other format');
    process.exit(1);
  }
}

/**
 * Map Supabase user to local user schema
 */
function mapSupabaseUserToLocal(supabaseUser: SupabaseUser): NewUser {
  const metadata = supabaseUser.raw_user_meta_data || {};
  const provider = supabaseUser.raw_app_meta_data?.provider;
  
  return {
    email: supabaseUser.email,
    displayName: metadata.name || extractNameFromEmail(supabaseUser.email),
    avatarUrl: metadata.picture || null,
    googleId: provider === 'google' ? metadata.sub || null : null,
    emailVerified: supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null,
    createdAt: supabaseUser.created_at ? new Date(supabaseUser.created_at) : new Date(),
    lastUsage: supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : new Date(),
    // Set defaults for required fields
    nativeLanguageId: 'en', // Default, users can update later
    preferredUILanguageId: 'ja' // Default, users can update later
  };
}

/**
 * Extract name from email address
 */
function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  return localPart
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Extract and save beta tester emails
 */
async function extractBetaTestEmails(users: SupabaseUser[]): Promise<void> {
  console.log('\n📧 Extracting beta tester emails...');
  
  // Sort by creation date to get earliest users
  const betaTesters = users
    .filter(user => user.created_at) // Only users with creation date
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(user => ({
      email: user.email,
      joinedDate: user.created_at,
      lastSignIn: user.last_sign_in_at,
      name: user.raw_user_meta_data?.name || extractNameFromEmail(user.email),
      provider: user.raw_app_meta_data?.provider || 'unknown'
    }));

  const emailList = {
    totalUsers: users.length,
    extractedAt: new Date().toISOString(),
    betaTesters: betaTesters
  };

  try {
    const fs = await import('fs/promises');
    await fs.writeFile('./beta-testers.json', JSON.stringify(emailList, null, 2));
    console.log(`✅ Saved ${betaTesters.length} beta tester emails to beta-testers.json`);
    
    // Create simple email list for easy copy/paste
    const simpleEmailList = betaTesters.map(user => user.email).join('\n');
    await fs.writeFile('./beta-testers-emails.txt', simpleEmailList);
    console.log('✅ Simple email list saved to beta-testers-emails.txt');
    
  } catch (error) {
    console.error('❌ Failed to save beta tester emails:', error);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSupabaseUsers();
}

export { migrateSupabaseUsers, mapSupabaseUserToLocal };