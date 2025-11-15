#!/usr/bin/env tsx

/**
 * Supabase Setup & Verification Script
 *
 * This script helps you set up and verify your Supabase connection.
 * It checks for required environment variables, tests the connection,
 * and verifies database schema.
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message: string) {
  log(`✓ ${message}`, 'green')
}

function error(message: string) {
  log(`✗ ${message}`, 'red')
}

function warning(message: string) {
  log(`⚠ ${message}`, 'yellow')
}

function info(message: string) {
  log(`ℹ ${message}`, 'cyan')
}

function header(message: string) {
  log(`\n${'='.repeat(60)}`, 'blue')
  log(message, 'bright')
  log('='.repeat(60), 'blue')
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function checkEnvFile(): Promise<boolean> {
  const envPath = path.join(process.cwd(), '.env.local')

  if (!fs.existsSync(envPath)) {
    error('.env.local file not found!')
    info('Creating .env.local from .env.local.example...')

    const examplePath = path.join(process.cwd(), '.env.local.example')
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath)
      success('.env.local file created!')
      warning('Please edit .env.local with your Supabase credentials')
      return false
    } else {
      error('.env.local.example not found!')
      return false
    }
  }

  success('.env.local file exists')
  return true
}

async function checkEnvVariables(): Promise<{
  url: string | undefined
  anonKey: string | undefined
  serviceRoleKey: string | undefined
}> {
  // Try to load .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const envLines = envContent.split('\n')
    const envVars: Record<string, string> = {}

    for (const line of envLines) {
      const match = line.match(/^([^#=]+)=(.+)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        envVars[key] = value
      }
    }

    return {
      url: envVars.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
    }
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

async function validateEnvVariables(vars: {
  url: string | undefined
  anonKey: string | undefined
  serviceRoleKey: string | undefined
}): Promise<boolean> {
  let valid = true

  if (!vars.url || vars.url.includes('your-project-id') || vars.url === '') {
    error('NEXT_PUBLIC_SUPABASE_URL is not set or invalid')
    info('Get it from: https://app.supabase.com/project/_/settings/api')
    valid = false
  } else {
    success('NEXT_PUBLIC_SUPABASE_URL is set')
  }

  if (!vars.anonKey || vars.anonKey.includes('your-anon-key') || vars.anonKey === '') {
    error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid')
    info('Get it from: https://app.supabase.com/project/_/settings/api')
    valid = false
  } else {
    success('NEXT_PUBLIC_SUPABASE_ANON_KEY is set')
  }

  if (!vars.serviceRoleKey || vars.serviceRoleKey.includes('your-service-role-key') || vars.serviceRoleKey === '') {
    warning('SUPABASE_SERVICE_ROLE_KEY is not set (optional for basic usage)')
  } else {
    success('SUPABASE_SERVICE_ROLE_KEY is set')
  }

  return valid
}

async function testConnection(url: string, anonKey: string): Promise<boolean> {
  try {
    info('Testing connection to Supabase...')
    const supabase = createClient(url, anonKey)

    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
      if (error.message.includes('relation "public.profiles" does not exist')) {
        warning('Database tables not created yet')
        info('You need to run the migrations in Supabase SQL Editor')
        return true // Connection works, just no tables yet
      }
      throw error
    }

    success('Successfully connected to Supabase!')
    return true
  } catch (err) {
    error(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`)
    return false
  }
}

async function checkTables(url: string, anonKey: string): Promise<void> {
  try {
    const supabase = createClient(url, anonKey)

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

    info('Checking database tables...')
    let missingTables = 0

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(0)
        if (error) {
          if (error.message.includes('does not exist')) {
            warning(`  Table '${table}' does not exist`)
            missingTables++
          } else {
            info(`  Table '${table}' exists but got error: ${error.message}`)
          }
        } else {
          success(`  Table '${table}' exists`)
        }
      } catch (err) {
        warning(`  Could not check table '${table}'`)
      }
    }

    if (missingTables > 0) {
      warning(`\n${missingTables} tables are missing!`)
      info('Run the migrations from supabase/migrations/ in your Supabase SQL Editor:')
      info('https://app.supabase.com/project/_/sql/new')
    } else {
      success('\nAll required tables exist!')
    }
  } catch (err) {
    error(`Failed to check tables: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function checkStorageBucket(url: string, anonKey: string): Promise<void> {
  try {
    const supabase = createClient(url, anonKey)

    info('Checking storage buckets...')
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      warning(`Could not list buckets: ${error.message}`)
      return
    }

    const pdfsBucket = buckets?.find(b => b.name === 'pdfs')

    if (pdfsBucket) {
      success('  Bucket "pdfs" exists')
      if (pdfsBucket.public) {
        warning('  Warning: "pdfs" bucket is public (should be private)')
      } else {
        success('  Bucket is properly configured as private')
      }
    } else {
      warning('  Bucket "pdfs" does not exist')
      info('  Create it in: https://app.supabase.com/project/_/storage/buckets')
      info('  Make sure to set it as PRIVATE (not public)')
    }
  } catch (err) {
    warning(`Could not check storage: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function updateEnvFile(
  url: string,
  anonKey: string,
  serviceRoleKey?: string
): Promise<void> {
  const envPath = path.join(process.cwd(), '.env.local')
  let content = fs.readFileSync(envPath, 'utf-8')

  // Update URL
  content = content.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.*/,
    `NEXT_PUBLIC_SUPABASE_URL=${url}`
  )

  // Update anon key
  content = content.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`
  )

  // Update service role key if provided
  if (serviceRoleKey) {
    content = content.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`
    )
  }

  fs.writeFileSync(envPath, content)
  success('.env.local file updated!')
}

async function interactiveSetup(): Promise<void> {
  header('Interactive Supabase Setup')

  info('\nThis will guide you through setting up Supabase for your project.')
  info('You can find these values at: https://app.supabase.com/project/_/settings/api\n')

  const url = await promptUser('Enter your Supabase URL: ')
  const anonKey = await promptUser('Enter your Supabase Anon Key: ')
  const serviceRoleKey = await promptUser('Enter your Supabase Service Role Key (optional, press Enter to skip): ')

  if (!url || !anonKey) {
    error('URL and Anon Key are required!')
    return
  }

  await updateEnvFile(url, anonKey, serviceRoleKey || undefined)

  // Test the connection
  const connected = await testConnection(url, anonKey)
  if (connected) {
    await checkTables(url, anonKey)
    await checkStorageBucket(url, anonKey)
  }
}

async function main() {
  header('Supabase Connection Setup & Verification')

  // Check if we're in interactive mode
  const args = process.argv.slice(2)
  if (args.includes('--setup') || args.includes('-s')) {
    await interactiveSetup()
    return
  }

  // Step 1: Check .env.local file
  header('Step 1: Checking .env.local file')
  const hasEnvFile = await checkEnvFile()

  if (!hasEnvFile) {
    info('\nRun this script again after editing .env.local with your credentials')
    info('Or run with --setup flag for interactive setup: npm run setup-supabase -- --setup')
    return
  }

  // Step 2: Check environment variables
  header('Step 2: Checking environment variables')
  const envVars = await checkEnvVariables()
  const varsValid = await validateEnvVariables(envVars)

  if (!varsValid) {
    error('\nPlease fix the environment variables in .env.local')
    info('Or run with --setup flag for interactive setup: npm run setup-supabase -- --setup')
    return
  }

  // Step 3: Test connection
  header('Step 3: Testing Supabase connection')
  const connected = await testConnection(envVars.url!, envVars.anonKey!)

  if (!connected) {
    error('\nFailed to connect to Supabase. Please check your credentials.')
    return
  }

  // Step 4: Check tables
  header('Step 4: Verifying database schema')
  await checkTables(envVars.url!, envVars.anonKey!)

  // Step 5: Check storage
  header('Step 5: Checking storage configuration')
  await checkStorageBucket(envVars.url!, envVars.anonKey!)

  // Final summary
  header('Setup Complete!')
  success('\nYour Supabase connection is configured!')
  info('\nNext steps:')
  info('1. If tables are missing, run migrations in Supabase SQL Editor')
  info('2. If storage bucket is missing, create it in Supabase Dashboard')
  info('3. Run your development server: npm run dev')
  info('\nFor more information, check:')
  info('- SUPABASE_SETUP.md - Complete setup guide')
  info('- MCP_INTEGRATION.md - MCP integration guide')
  info('- DATABASE_SETUP.md - Database schema guide')
}

main().catch((err) => {
  error(`\nFatal error: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
