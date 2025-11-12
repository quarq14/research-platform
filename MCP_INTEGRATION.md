# Supabase MCP Integration Guide

This guide explains how to use the Model Context Protocol (MCP) integration with your Supabase database in the Academic AI Research Platform.

## What is MCP?

**Model Context Protocol (MCP)** is a protocol that enables AI assistants to securely connect to external data sources like databases, APIs, and file systems. With MCP, AI assistants can:

- Query your Supabase database directly
- Access table schemas and relationships
- Execute SQL queries with proper authentication
- Retrieve real-time data for context-aware responses

## Configuration

### 1. MCP Server Configuration

The MCP configuration is located at `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fecijxvszvftsdpjdbjk",
      "apiKey": "${SUPABASE_SERVICE_ROLE_KEY}",
      "description": "Supabase MCP server for academic research platform database access",
      "projectRef": "fecijxvszvftsdpjdbjk"
    }
  }
}
```

### 2. Environment Variables

Add the following to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fecijxvszvftsdpjdbjk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Supabase Project Reference (for MCP integration)
NEXT_PUBLIC_SUPABASE_PROJECT_REF=fecijxvszvftsdpjdbjk
```

**Important**: Replace `your-anon-key-here` and `your-service-role-key-here` with your actual Supabase keys from the [Supabase Dashboard](https://app.supabase.com/project/fecijxvszvftsdpjdbjk/settings/api).

### 3. Security Best Practices

- **Never commit** `.env.local` to version control
- **Keep your service role key secret** - it has full database access
- Use the **anon key** for client-side operations
- Use the **service role key** only for server-side and MCP operations
- Enable **Row Level Security (RLS)** on all tables

## Using MCP with AI Assistants

### Claude Code CLI

If you're using Claude Code CLI, it will automatically detect the `.claude/mcp.json` configuration and connect to your Supabase database.

You can then ask questions like:

```
"Show me all users in the profiles table"
"What are the most recent documents created?"
"How many active subscriptions do we have?"
"What's the schema of the documents table?"
```

### Other MCP-Compatible Tools

Any MCP-compatible AI assistant or tool can connect to your Supabase database using the configuration in `.claude/mcp.json`.

## Available Database Tables

Your Supabase database includes the following tables:

### User Management
- `profiles` - User profiles with usage tracking
- `user_settings` - User preferences and settings
- `api_keys` - Encrypted API keys for AI providers

### Documents & Files
- `documents` - User-created documents (articles, reviews, etc.)
- `files` - Uploaded PDF files
- `chunks` - PDF content chunks with vector embeddings

### Chat & Messaging
- `chats` - Chat sessions
- `messages` - Chat messages with AI responses
- `citations` - Citation references in messages

### Academic Research
- `sources` - Academic sources from various databases
- `projects` - Research projects

### Payments & Subscriptions
- `plans` - Subscription plans
- `subscriptions` - User subscriptions
- `invoices` - Payment records

### Usage & Analytics
- `usage_events` - Token usage and feature tracking
- `rate_limits` - Rate limiting data
- `audit_logs` - Security audit trail

### Organizations
- `organizations` - Organization accounts
- `memberships` - Organization members and roles

## Example Queries

### Get User Profile
```sql
SELECT * FROM profiles WHERE id = 'user-id';
```

### List Recent Documents
```sql
SELECT id, title, document_type, created_at
FROM documents
WHERE user_id = 'user-id'
ORDER BY created_at DESC
LIMIT 10;
```

### Count Active Subscriptions
```sql
SELECT COUNT(*) FROM subscriptions
WHERE status = 'active';
```

### Get User Usage Statistics
```sql
SELECT
  event_type,
  SUM(amount) as total_usage
FROM usage_events
WHERE user_id = 'user-id'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type;
```

## Troubleshooting

### MCP Connection Issues

**Issue**: "Authentication failed" or "401 Unauthorized"

**Solution**:
1. Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check that the key is properly set in your environment
3. Ensure the key hasn't expired or been regenerated

**Issue**: "Cannot connect to MCP server"

**Solution**:
1. Verify the project reference (`fecijxvszvftsdpjdbjk`) is correct
2. Check that your Supabase project is not paused (free tier)
3. Ensure you have internet connectivity

### Permission Errors

**Issue**: "Permission denied" when querying tables

**Solution**:
1. Check Row Level Security (RLS) policies on the table
2. Verify you're using the service role key (not anon key) for admin operations
3. Review policies in Supabase Dashboard → Database → Tables → [table] → Policies

### Rate Limiting

The Supabase MCP endpoint respects your Supabase project's rate limits:

- **Free tier**: Limited requests per minute
- **Pro tier**: Higher rate limits
- **Team/Enterprise**: Custom limits

If you hit rate limits, consider:
- Caching frequently accessed data
- Upgrading your Supabase plan
- Optimizing queries to reduce requests

## Advanced Usage

### Custom MCP Configurations

You can add additional MCP servers to `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fecijxvszvftsdpjdbjk",
      "apiKey": "${SUPABASE_SERVICE_ROLE_KEY}",
      "description": "Primary Supabase database",
      "projectRef": "fecijxvszvftsdpjdbjk"
    },
    "supabase-analytics": {
      "url": "https://mcp.supabase.com/mcp?project_ref=another-project-ref",
      "apiKey": "${ANALYTICS_SUPABASE_KEY}",
      "description": "Analytics database",
      "projectRef": "another-project-ref"
    }
  }
}
```

### Using MCP in CI/CD

For automated testing and deployment:

1. Set environment variables in your CI/CD platform
2. Ensure the MCP configuration file is available
3. Use the service role key for admin operations
4. Consider creating a separate Supabase project for testing

## Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/ai/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Supabase Dashboard](https://app.supabase.com/project/fecijxvszvftsdpjdbjk)
- [Supabase SQL Editor](https://app.supabase.com/project/fecijxvszvftsdpjdbjk/sql)

## Support

For MCP-related issues:
1. Check this documentation first
2. Review Supabase logs in the dashboard
3. Check the MCP server status
4. Refer to the [Supabase support documentation](https://supabase.com/docs)

---

**Note**: MCP integration provides direct database access to AI assistants. Always ensure proper authentication and authorization are in place to protect sensitive data.
