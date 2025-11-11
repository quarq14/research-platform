# Academic Research Platform - Operations Runbook

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Deployment](#deployment)
4. [Configuration](#configuration)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Common Operations](#common-operations)
7. [Troubleshooting](#troubleshooting)
8. [Incident Response](#incident-response)
9. [Maintenance](#maintenance)

## System Overview

The Academic Research Platform is an English-only AI-powered academic writing and research platform built with:
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes (Edge + Node runtimes)
- **Database**: Supabase (PostgreSQL 15 + pgvector)
- **Auth**: Supabase Auth (email/password + magic link)
- **AI**: Groq (default), OpenAI, Claude, Gemini, OpenRouter, MiniMax M2
- **Payments**: PayPal and iyzico only (NO Stripe)
- **Hosting**: Vercel
- **Storage**: Supabase Storage

### Key Features

- Multi-PDF upload with OCR
- Hybrid RAG (vector + BM25) search
- Citation-enforced academic writing
- Scholarly search (OpenAlex, Semantic Scholar, Crossref)
- Plagiarism detection
- AI content detection
- Usage-based quotas
- Multi-tier pricing (Free, Pro, Team)

## Architecture

### System Components

```
┌──────────────┐
│   Vercel     │  ← Next.js App (Edge + Node)
│   (CDN)      │
└──────┬───────┘
       │
       ├─────────┐
       │         │
┌──────▼─────┐   │
│ Supabase   │   │
│ PostgreSQL │   │
│ + pgvector │   │
└────────────┘   │
                 │
┌────────────────▼──────┐
│   External Services   │
│ - Groq API           │
│ - OpenAI API         │
│ - MiniMax M2         │
│ - PayPal API         │
│ - iyzico API         │
│ - OpenAlex API       │
│ - Semantic Scholar   │
└──────────────────────┘
```

### Data Flow

1. **User Upload PDF** → Supabase Storage → API Route (Node) → PDF Processing → Embeddings → Supabase
2. **User Query** → API Route (Edge) → Hybrid Search → LLM → Streaming Response
3. **User Payment** → PayPal/iyzico → Webhook → API Route → Update Subscription
4. **Background Jobs** → Vercel Cron → Supabase Functions → Database Updates

## Deployment

### Prerequisites

- Node.js 18+
- npm or pnpm
- Vercel CLI (`npm i -g vercel`)
- Supabase CLI (`npm i -g supabase`)
- Git

### Initial Deployment

```bash
# 1. Clone repository
git clone https://github.com/quarq14/research-platform.git
cd research-platform

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Build locally
npm run build

# 5. Deploy to Vercel
vercel --prod
```

### Continuous Deployment

The platform is configured for automatic deployment:
- **Main branch** → Production (auto-deploy)
- **Feature branches** → Preview deployments

### Vercel Configuration

**Build Settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install --legacy-peer-deps`
- Node Version: 18.x

**Environment Variables:**
Set all variables from `.env.example` in Vercel Dashboard → Project → Settings → Environment Variables.

### Database Setup

```bash
# 1. Create Supabase project at https://supabase.com

# 2. Enable pgvector extension (Dashboard → Database → Extensions)

# 3. Run migrations
supabase link --project-ref <your-ref>
supabase db push

# 4. Create storage bucket
# Dashboard → Storage → New Bucket
# Name: "pdfs", Type: Private

# 5. Set RLS policies (automatically applied by migrations)
```

## Configuration

### Environment Variables

**Critical (Required):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY` (default AI provider)

**Payments (Required for billing):**
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` (sandbox/live)
- `IYZICO_API_KEY`
- `IYZICO_SECRET_KEY`

**Optional but Recommended:**
- `OPENAI_API_KEY` (for embeddings)
- `MINIMAX_API_KEY` (for agentic tasks)
- `COPYLEAKS_API_KEY` (for plagiarism)
- `SENTRY_DSN` (for error tracking)

### Feature Flags

Set in environment:
```bash
ENABLE_PLAGIARISM_CHECK=true
ENABLE_AI_DETECTION=true
ENABLE_TEAM_FEATURES=true
ENABLE_API_ACCESS=false
```

### Rate Limits

Default limits (per user, per endpoint):
- Chat: 60 requests/minute
- Upload: 10 files/hour
- Search: 100 queries/hour

Configure in `lib/rate-limiter.ts`.

## Monitoring & Alerts

### Key Metrics

**Application:**
- Response time (p50, p95, p99)
- Error rate
- Throughput (requests/minute)
- Active users

**Database:**
- Connection pool utilization
- Query latency
- Storage usage
- pgvector index size

**Payments:**
- Successful transactions
- Failed transactions
- Webhook delivery rate

### Monitoring Tools

**Vercel Analytics:**
- Dashboard → Project → Analytics
- Real-time traffic, Web Vitals, and performance

**Supabase Monitoring:**
- Dashboard → Project → Reports
- Database stats, API usage, storage

**Sentry (if configured):**
- Error tracking
- Performance monitoring
- User feedback

### Alerts

Set up alerts for:
- Error rate > 1%
- Response time p95 > 2s
- Database connections > 90%
- Failed webhook delivery rate > 5%
- Storage usage > 80%

## Common Operations

### User Management

**View user:**
```sql
SELECT id, email, created_at, updated_at
FROM auth.users
WHERE email = 'user@example.com';
```

**Check user plan:**
```sql
SELECT u.email, p.plan, p.subscription_status, p.tokens_used, p.pages_analyzed
FROM auth.users u
JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'user@example.com';
```

**Reset user quota:**
```sql
UPDATE profiles
SET tokens_used = 0, pages_analyzed = 0, searches_made = 0
WHERE user_id = '<user-id>';
```

### File Management

**View uploaded files:**
```sql
SELECT f.id, f.filename, f.size_bytes, f.pages, f.status, f.created_at
FROM files f
JOIN auth.users u ON f.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY f.created_at DESC;
```

**Check file processing status:**
```sql
SELECT id, filename, status, error_message
FROM files
WHERE status = 'error';
```

**Reprocess failed file:**
```sql
UPDATE files
SET status = 'uploaded', error_message = NULL
WHERE id = '<file-id>';
-- Then trigger reprocessing via API
```

### Subscription Management

**View active subscriptions:**
```sql
SELECT u.email, s.payment_provider, s.status, s.current_period_end, p.name AS plan
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY s.current_period_end;
```

**Cancel subscription:**
```sql
UPDATE subscriptions
SET status = 'canceled', cancel_at_period_end = true
WHERE id = '<subscription-id>';
```

**View webhook events:**
```sql
SELECT provider, event_type, processed, created_at, error_message
FROM webhook_events
WHERE processed = false OR error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;
```

### Database Maintenance

**Vacuum and analyze:**
```sql
VACUUM ANALYZE chunks;
VACUUM ANALYZE files;
VACUUM ANALYZE subscriptions;
```

**Reindex pgvector:**
```sql
REINDEX INDEX chunks_embedding_idx;
```

**Check storage usage:**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Build Failures

**Error: TypeScript errors**
```bash
# Run type check
npm run build

# Fix errors in flagged files
# Common issue: missing React import for JSX
```

**Error: Dependency conflicts**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Runtime Errors

**Error: Supabase connection failed**
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase project is active
- Check RLS policies allow operation

**Error: AI API rate limit**
- Check API key validity
- Verify rate limits with provider
- Implement exponential backoff

**Error: PDF processing timeout**
- Check file size (max 50MB)
- Verify Tesseract WASM loaded correctly
- Check Node runtime timeout settings (max 10 minutes)

**Error: Webhook delivery failed**
- Verify webhook URL is publicly accessible
- Check webhook signature validation
- Review webhook logs in PayPal/iyzico dashboard

### Performance Issues

**Slow vector search:**
```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM chunks
WHERE embedding <=> '[...]' < 0.5
LIMIT 10;

-- Rebuild index if needed
REINDEX INDEX chunks_embedding_idx;
```

**High database connections:**
- Check connection pool settings
- Identify long-running queries
- Consider read replicas for heavy read workloads

**Slow page load:**
- Check Vercel Analytics for bottlenecks
- Review Next.js build output for large bundles
- Optimize images and fonts

## Incident Response

### Severity Levels

**P0 (Critical):**
- Platform completely down
- Data loss or corruption
- Security breach

**P1 (High):**
- Major feature broken (payments, uploads)
- Significant performance degradation
- Partial outage

**P2 (Medium):**
- Minor feature broken
- Non-critical bug
- Performance issue affecting some users

**P3 (Low):**
- Cosmetic issue
- Feature request
- Documentation update

### Response Process

**P0/P1 Incidents:**
1. **Acknowledge** within 15 minutes
2. **Triage**: Identify root cause
3. **Mitigate**: Apply hotfix or rollback
4. **Communicate**: Update status page
5. **Resolve**: Deploy permanent fix
6. **Post-Mortem**: Document learnings

**P2/P3 Incidents:**
1. Track in issue tracker
2. Prioritize in sprint planning
3. Fix in next release
4. Update documentation

### Emergency Contacts

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **On-call Engineer**: [Set up PagerDuty or equivalent]

### Rollback Procedure

```bash
# 1. Identify last known good deployment
vercel list

# 2. Promote previous deployment
vercel promote <deployment-url> --scope=<team>

# 3. Verify rollback
curl -I https://your-domain.com

# 4. Notify users (if needed)
```

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates and alerts
- Check webhook delivery rates
- Review failed file processing jobs

**Weekly:**
- Review performance metrics
- Check storage usage
- Update dependencies (security patches)

**Monthly:**
- Database vacuum and analyze
- Review and optimize slow queries
- Update documentation
- Review and rotate API keys

**Quarterly:**
- Dependency major version updates
- Security audit
- Disaster recovery drill
- Performance optimization sprint

### Backup Strategy

**Database:**
- Supabase automatic daily backups (7-day retention)
- Point-in-time recovery (PITR) available
- Manual backups before major migrations

**File Storage:**
- Supabase Storage replication (automatic)
- Weekly full backup to external storage

**Code:**
- Git repository (GitHub)
- Vercel deployment history (rollback available)

### Disaster Recovery

**Database Restore:**
```bash
# From Supabase Dashboard → Database → Backups
# Select backup → Restore

# Or via CLI
supabase db dump > backup.sql
supabase db restore backup.sql
```

**Application Restore:**
```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy from Git
vercel --prod
```

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 24 hours

## Security Best Practices

1. **API Keys**: Rotate every 90 days
2. **Database**: Keep RLS enabled at all times
3. **Dependencies**: Run `npm audit` weekly
4. **Secrets**: Never commit to Git (use Vercel env vars)
5. **Access**: Principle of least privilege
6. **Logs**: Review for suspicious activity

## Support

- **Documentation**: This runbook + `/docs` folder
- **Issues**: GitHub Issues
- **Community**: [Link to community forum if available]
- **Professional Support**: [Contact information]

---

**Last Updated**: 2025-11-11
**Version**: 2.0.0
**Maintainer**: Development Team
