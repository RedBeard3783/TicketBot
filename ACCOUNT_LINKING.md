# Account Linking Configuration Guide

The TicketBot supports multiple methods for linking Discord users to Steam IDs, allowing flexibility based on your infrastructure and needs.

## **Available Methods**

### 1. **PlatformSync API** (Recommended)
Uses PlatformSync's verification system for reliable Discord-to-Steam linking.

**Pros:**
- ✅ No database setup required
- ✅ Built-in verification system
- ✅ Managed infrastructure
- ✅ Easy to set up

**Cons:**
- ❌ Requires API subscription
- ❌ Depends on third-party service

**Setup:**
1. Get an API key from [PlatformSync.io](https://www.platformsync.io/)
2. Add to `.env`: `PLATFORMSYNC_API_KEY=your_key_here`
3. Set in `config.yaml`:
   ```yaml
   platformsync:
	 enabled: true
   accountLinking:
	 method: "platformsync"
   ```

### 2. **MySQL Database**
Direct database integration for existing user linking systems.

**Pros:**
- ✅ Full control over data
- ✅ No external dependencies
- ✅ Customizable table structure

**Cons:**
- ❌ Requires database setup
- ❌ Need to implement linking system
- ❌ Maintenance required

**Setup:**
1. Configure database credentials in `.env`
2. Set in `config.yaml`:
   ```yaml
   database:
	 enabled: true
   accountLinking:
	 method: "database"
   ```

### 3. **Discord Connected Accounts**
Uses Discord's built-in connected accounts feature.

**Note:** Currently not fully implemented - requires OAuth2 flow.

### 4. **Multi-Method** (Best of All Worlds)
Tries multiple methods in priority order: Discord → PlatformSync → Database

**Setup:**
```yaml
accountLinking:
  method: "multi"

platformsync:
  enabled: true

database:
  enabled: true
```

## **Configuration Reference**

### config.yaml

```yaml
# Account Linking Configuration
accountLinking:
  method: "platformsync"  # Options: "database", "discord", "platformsync", "multi"

# PlatformSync Settings
platformsync:
  enabled: true
  apiKey: "YOUR_API_KEY"  # Or set via PLATFORMSYNC_API_KEY env var
  apiUrl: "https://api.platformsync.io/v1"
  cacheTime: 3600  # Cache results for 1 hour
  rateLimit:
	maxRequests: 100
	perMinute: 60

# Database Settings
database:
  enabled: false
  tableName: "user_links"
  columns:
	discordId: "discord_id"
	steamId: "steam_id"
```

### .env

```env
# PlatformSync
PLATFORMSYNC_API_KEY=your_platformsync_api_key

# MySQL (only if using database method)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
```

## **Migration Guide**

### From Database-Only to PlatformSync

1. **Keep database enabled as fallback:**
   ```yaml
   accountLinking:
	 method: "multi"

   database:
	 enabled: true

   platformsync:
	 enabled: true
	 apiKey: "YOUR_KEY"
   ```

2. Users will automatically use PlatformSync if linked, falling back to database

3. Once all users are on PlatformSync, switch to:
   ```yaml
   accountLinking:
	 method: "platformsync"

   database:
	 enabled: false
   ```

## **API Endpoints Used**

### PlatformSync API

**Get User by Discord ID:**
```
GET https://api.platformsync.io/v1/user/{discord_id}
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "data": {
	"discord_id": "123456789",
	"steam_id_64": "76561198012345678",
	"steam_id": "STEAM_0:0:12345678"
  }
}
```

## **Troubleshooting**

### "No Steam ID found"
1. Check which linking method is enabled in config
2. Verify user has linked their account on PlatformSync (if using that method)
3. Check database connection and table structure (if using database)
4. Review logs for specific error messages

### "PlatformSync authentication failed"
- Verify `PLATFORMSYNC_API_KEY` is set correctly
- Check API key is valid at platformsync.io

### "Rate limit exceeded"
- Adjust `platformsync.rateLimit.maxRequests` in config
- Increase `platformsync.cacheTime` to reduce API calls
- Consider implementing request queuing

## **Best Practices**

1. **Use caching** - Set appropriate cache times to reduce API calls
2. **Enable fallbacks** - Use "multi" method for redundancy
3. **Monitor rate limits** - Check logs for rate limit warnings
4. **Secure API keys** - Always use environment variables for keys
5. **Test thoroughly** - Verify linking works before going live

## **Support Resources**

- [PlatformSync Documentation](https://www.platformsync.io/docs)
- [PlatformSync API Reference](https://www.platformsync.io/2022/12/03/platform-sync-api/)
- [TicketBot GitHub Issues](your-repo-url)
