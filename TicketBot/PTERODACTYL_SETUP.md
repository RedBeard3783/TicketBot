# Pterodactyl Panel Setup Guide

This guide will help you deploy the TicketBot on a Pterodactyl panel using the NodeJS egg.

## **Prerequisites**

- Pterodactyl panel access
- NodeJS egg installed on your panel
- Discord bot token
- (Optional) BattleMetrics API key
- (Optional) PlatformSync API key

---

## **Step 1: Create a New Server**

1. Go to your Pterodactyl panel
2. Create a new server with the **NodeJS** egg
3. Recommended allocations:
   - **RAM:** 512MB - 1GB
   - **CPU:** 50-100%
   - **Disk:** 1-2GB

---

## **Step 2: Upload Files**

### Option A: Git Clone (Recommended)
1. Open the server console
2. Run:
   ```bash
   git clone https://github.com/YOUR-REPO/TicketBot.git .
   ```

### Option B: Manual Upload
1. Upload all project files via SFTP or the file manager
2. Ensure all files are in the **root directory** of your server

---

## **Step 3: Configure Environment Variables**

### Via Pterodactyl Startup Variables (Recommended):

Go to your server's **Startup** tab and set:

| Variable | Value | Required |
|----------|-------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | ✅ Yes |
| `DISCORD_CLIENT_ID` | Your Discord application ID | ✅ Yes |
| `BATTLEMETRICS_API_KEY` | Your BattleMetrics API key | ⚠️ Optional |
| `BATTLEMETRICS_SERVER_ID` | Your Rust server ID | ⚠️ Optional |
| `PLATFORMSYNC_API_KEY` | Your PlatformSync API key | ⚠️ Optional |
| `DB_HOST` | Database host (if using MySQL) | ⚠️ Optional |
| `DB_PORT` | Database port (default: 3306) | ⚠️ Optional |
| `DB_USER` | Database username | ⚠️ Optional |
| `DB_PASSWORD` | Database password | ⚠️ Optional |
| `DB_NAME` | Database name | ⚠️ Optional |
| `NODE_ENV` | `production` | ✅ Yes |

### Via .env File (Alternative):

1. Copy `.env.example` to `.env`
2. Edit the `.env` file with your values:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_application_id_here
   PLATFORMSYNC_API_KEY=your_platformsync_api_key_here
   BATTLEMETRICS_API_KEY=your_battlemetrics_api_key_here
   BATTLEMETRICS_SERVER_ID=your_rust_server_id_here
   NODE_ENV=production
   ```

---

## **Step 4: Configure config.yaml**

Edit `config.yaml` with your Discord server settings:

```yaml
discord:
  guildId: "YOUR_GUILD_ID"

  tickets:
	categoryId: "YOUR_CATEGORY_ID"
	staffRoleId: "YOUR_STAFF_ROLE_ID"
	logChannelId: "YOUR_LOG_CHANNEL_ID"
	createChannelId: "YOUR_CREATE_CHANNEL_ID"
	autoCloseAfterHours: 48
	maxTicketsPerUser: 3

accountLinking:
  method: "platformsync"  # or "database", "discord", "multi"

platformsync:
  enabled: true

database:
  enabled: false  # Set to true if using MySQL
```

**How to get IDs:**
1. Enable Developer Mode in Discord (User Settings → Advanced)
2. Right-click on servers, channels, roles → Copy ID

---

## **Step 5: Install Dependencies**

### Pterodactyl will automatically run:
```bash
npm install
```

**If it doesn't auto-install**, run manually in the console:
```bash
npm install --production
```

---

## **Step 6: Build the Project**

Run in the console:
```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

---

## **Step 7: Deploy Discord Commands**

Before starting the bot for the first time:

```bash
npm run deploy-commands
```

This registers all slash commands with Discord.

⚠️ **Important:** You only need to do this once, or when you add/modify commands.

---

## **Step 8: Configure Startup Command**

### Option A: Update Pterodactyl Egg Startup

If your egg allows custom start commands, set it to:
```bash
npm run start
```

### Option B: Modify package.json (if needed)

The `package.json` already has the correct startup:
```json
{
  "scripts": {
	"start": "node dist/bot.js"
  }
}
```

---

## **Step 9: Start the Bot**

1. Click **Start** in the Pterodactyl console
2. Check the console for:
   ```
   ✅ Configuration loaded successfully from config.yaml
   ✅ Database connection established successfully (if enabled)
   ✅ Logged in as YourBotName#1234
   ✅ PlatformSync service initialized (if enabled)
   ```

---

## **Troubleshooting**

### ❌ "Cannot find module" errors
**Solution:** Run `npm install --production`

### ❌ "Configuration loading failed"
**Solution:** 
- Check `config.yaml` syntax (use a YAML validator)
- Ensure all required IDs are filled in

### ❌ "Login failed" / "Invalid token"
**Solution:** 
- Verify `DISCORD_TOKEN` in environment variables or `.env`
- Regenerate token at https://discord.com/developers

### ❌ "Database connection failed"
**Solutions:**
- If not using MySQL, set `database.enabled: false` in config.yaml
- Check database credentials in environment variables
- Verify database host is reachable from Pterodactyl

### ❌ TypeScript errors on build
**Solution:** Run `npm install` (without --production) to install dev dependencies

### ❌ Commands not showing in Discord
**Solution:** 
- Run `npm run deploy-commands`
- Wait 5-10 minutes for Discord to sync
- Check bot has `applications.commands` scope

---

## **File Structure on Pterodactyl**

```
/home/container/
├── config.yaml          # Main configuration
├── .env                 # Environment variables (optional)
├── package.json         # Dependencies & scripts
├── tsconfig.json        # TypeScript config
├── src/                 # Source TypeScript files
│   ├── bot.ts
│   ├── commands/
│   ├── events/
│   └── services/
└── dist/                # Compiled JavaScript (generated)
	└── bot.js           # Main entry point
```

---

## **Updating the Bot**

### If using Git:
```bash
git pull
npm install
npm run build
```

### If using manual upload:
1. Stop the bot
2. Upload new files
3. Run `npm install` (if package.json changed)
4. Run `npm run build`
5. Start the bot

---

## **Performance Tips**

1. **Use Production Mode:**
   ```
   NODE_ENV=production
   ```

2. **Disable Database if Not Needed:**
   ```yaml
   database:
	 enabled: false
   ```

3. **Increase Cache Times to Reduce API Calls:**
   ```yaml
   platformsync:
	 cacheTime: 7200  # 2 hours

   battlemetrics:
	 cacheTime: 600   # 10 minutes
   ```

4. **Monitor RAM Usage:**
   - Normal: 100-200MB
   - With BattleMetrics cache: 200-300MB
   - If exceeding, increase server RAM allocation

---

## **Auto-Restart Configuration**

Pterodactyl can auto-restart the bot on crash:

1. Go to **Startup** tab
2. Enable **Auto-restart**
3. Set restart delay to 10-30 seconds

---

## **Logs & Debugging**

All logs appear in the Pterodactyl console. Look for:

- `✅` Green checks = Success
- `⚠️` Warnings = Non-critical issues
- `❌` Red X = Errors requiring attention

**Enable More Detailed Logging:**
```bash
NODE_ENV=development npm run start
```

---

## **Security Best Practices**

1. ✅ **Never commit `.env` to Git**
2. ✅ **Use Pterodactyl environment variables for tokens**
3. ✅ **Restrict file permissions** (Pterodactyl handles this)
4. ✅ **Keep dependencies updated:** `npm update`
5. ✅ **Use strong database passwords** (if applicable)

---

## **Support Checklist**

Before asking for help, verify:

- [ ] All environment variables are set
- [ ] `config.yaml` has valid Discord IDs
- [ ] `npm install` completed successfully
- [ ] `npm run build` completed without errors
- [ ] `npm run deploy-commands` ran at least once
- [ ] Bot has correct permissions in Discord server
- [ ] BattleMetrics/PlatformSync API keys are valid (if using)

---

## **Quick Start Commands**

```bash
# First time setup
npm install
npm run build
npm run deploy-commands
npm run start

# Updates
git pull
npm install
npm run build
# Restart bot via Pterodactyl panel

# Redeploy commands (only if changed)
npm run deploy-commands
```

---

## **Pterodactyl NodeJS Egg Compatibility**

✅ **Compatible with:**
- parkervcp/eggs NodeJS Generic
- parkervcp/eggs Discord.js Bot
- Any NodeJS 18+ egg

**Minimum Node Version:** 18.0.0  
**Recommended:** Node 20 LTS

---

## **Need Help?**

- Check the console logs for specific error messages
- Review `ACCOUNT_LINKING.md` for linking setup
- Verify all configuration files are correct
- Ensure bot has proper Discord permissions
