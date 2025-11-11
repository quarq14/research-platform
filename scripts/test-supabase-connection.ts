/**
 * Test Supabase Connection
 * Run this script to verify your Supabase configuration
 *
 * Usage: npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/types'

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testConnection() {
  log('\n🔍 Testing Supabase Connection...\n', 'cyan')

  // Check environment variables
  log('1️⃣  Checking environment variables...', 'blue')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    log('❌ Missing environment variables!', 'red')
    log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY', 'yellow')
    log('Copy .env.local.example to .env.local and fill in your credentials\n', 'yellow')
    process.exit(1)
  }

  log('✅ Environment variables found', 'green')
  log(`   URL: ${url}`, 'reset')
  log(`   Key: ${anonKey.substring(0, 20)}...\n`, 'reset')

  // Create Supabase client
  log('2️⃣  Creating Supabase client...', 'blue')
  const supabase = createClient<Database>(url, anonKey)
  log('✅ Client created successfully\n', 'green')

  // Test database connection
  log('3️⃣  Testing database connection...', 'blue')
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
      if (error.code === '42P01') {
        log('⚠️  Tables not found - you need to run migrations', 'yellow')
        log('Follow the instructions in SUPABASE_SETUP.md\n', 'yellow')
      } else {
        throw error
      }
    } else {
      log('✅ Database connection successful\n', 'green')
    }
  } catch (error: any) {
    log(`❌ Database connection failed: ${error.message}`, 'red')
    log('Check your Supabase project status and credentials\n', 'yellow')
  }

  // Check tables
  log('4️⃣  Checking database tables...', 'blue')
  const tables = [
    'profiles',
    'user_settings',
    'api_keys',
    'projects',
    'documents',
    'files',
    'chunks',
    'chats',
    'messages',
    'sources',
    'citations',
    'plans',
    'subscriptions',
  ]

  let tablesFound = 0
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table as any).select('count').limit(1)
      if (!error) {
        tablesFound++
      }
    } catch (error) {
      // Table doesn't exist
    }
  }

  if (tablesFound === 0) {
    log('❌ No tables found - please run migrations', 'red')
    log('See SUPABASE_SETUP.md for instructions\n', 'yellow')
  } else if (tablesFound < tables.length) {
    log(`⚠️  Some tables missing (${tablesFound}/${tables.length} found)`, 'yellow')
    log('Consider re-running migrations\n', 'yellow')
  } else {
    log(`✅ All tables found (${tablesFound}/${tables.length})\n`, 'green')
  }

  // Check extensions
  log('5️⃣  Checking PostgreSQL extensions...', 'blue')
  try {
    const { data, error } = await supabase.rpc('pg_extension_exists' as any, {
      extension_name: 'vector',
    })

    if (error && error.code !== '42883') {
      log('⚠️  Cannot verify extensions (normal for some setups)', 'yellow')
    }
    log('   Extensions should be enabled in Supabase dashboard\n', 'reset')
  } catch (error) {
    log('⚠️  Cannot verify extensions (normal for some setups)\n', 'yellow')
  }

  // Check authentication
  log('6️⃣  Checking authentication...', 'blue')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    log('✅ Authentication configured correctly\n', 'green')
  } catch (error: any) {
    log(`❌ Authentication error: ${error.message}`, 'red')
    log('Check your Supabase auth configuration\n', 'yellow')
  }

  // Check storage
  log('7️⃣  Checking storage buckets...', 'blue')
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) throw error

    const pdfBucket = data?.find((b) => b.name === 'pdfs')
    if (pdfBucket) {
      log('✅ PDF storage bucket found\n', 'green')
    } else {
      log('⚠️  PDF storage bucket not found', 'yellow')
      log('Create a bucket named "pdfs" in Supabase Storage\n', 'yellow')
    }
  } catch (error: any) {
    log(`⚠️  Storage check failed: ${error.message}`, 'yellow')
    log('This is normal if using service role key\n', 'yellow')
  }

  // Summary
  log('═══════════════════════════════════════════════════', 'cyan')
  log('✨ Supabase Connection Test Complete!', 'cyan')
  log('═══════════════════════════════════════════════════\n', 'cyan')

  if (tablesFound === tables.length) {
    log('🎉 Everything looks good! You\'re ready to go!', 'green')
    log('Run "npm run dev" to start the development server\n', 'green')
  } else if (tablesFound > 0) {
    log('⚠️  Some setup steps are incomplete', 'yellow')
    log('Review the messages above and SUPABASE_SETUP.md\n', 'yellow')
  } else {
    log('❌ Setup incomplete - please run migrations', 'red')
    log('Follow SUPABASE_SETUP.md for step-by-step instructions\n', 'red')
  }
}

// Run the test
testConnection().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
