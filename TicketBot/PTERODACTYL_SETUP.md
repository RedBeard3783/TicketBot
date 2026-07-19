# Pterodactyl Deployment Guide

Complete step-by-step guide for deploying TicketBot on a Pterodactyl panel. **Features automatic setup with zero manual installation!**

---

## 🎯 **What You'll Need**

- ✅ Pterodactyl panel with NodeJS egg
- ✅ Discord bot token ([get it here](https://discord.com/developers/applications))
- ✅ SFTP or File Manager access
- ⚠️ (Optional) PlatformSync API key
- ⚠️ (Optional) BattleMetrics API key

---

## 📦 **Step 1: Create Server**

### **1.1 Server Creation**

1. Go to your Pterodactyl panel
2. Click **Create Server**
3. Select **NodeJS Generic** egg
4. Configure resources:

| Setting | Recommended | Minimum |
|---------|-------------|---------|
| **RAM** | 1GB | 512MB |
| **CPU** | 100% | 50% |
| **Disk** | 1GB | 500MB |

5. Click **Create Server**

---

## 📁 **Step 2: Upload Files**

**IMPORTANT:** Upload files to the **root** of your server - NO nested folders!

### **Option A: SFTP (Recommended)**

1. Connect via SFTP:
   - Host: Your panel SFTP address
   - Port: Usually 2022
   - Username: Shown in Pterodactyl
   - Password: Your Pterodactyl password

2. Upload **all bot files** directly to `/home/container/`

### **Option B: File Manager**

1. **Zip the bot files** (not the folder itself!)
   - Select all files inside the TicketBot folder
   - Create a zip archive

2. Upload the zip via Pterodactyl file manager
3. Extract to `/home/container/`

### **✅ Correct Structure**

```
/home/container/
├── src/                 # Source code
├── index.js             # Main entry point ⭐
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── config.yaml          # Server settings
└── .env.example         # Environment template
```

### **❌ WRONG Structure**

```
/home/container/
└── TicketBot/
	└── TicketBot/       # ❌ Nested folders!
		└── src/
```

---

## ⚙️ **Step 3: Environment Variables**

### **3.1 Set in Pterodactyl**

Go to **Server → Startup** tab and add these variables:

#### **Required Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Your Discord bot token | `MTIzNDU2Nzg5...` |
| `DISCORD_CLIENT_ID` | Your Discord application ID | `1234567890123456789` |
| `NODE_ENV` | Environment mode | `production` |

#### **Optional Variables** (PlatformSync)

| Variable | Description |
|----------|-------------|
| `PLATFORMSYNC_API_KEY` | PlatformSync API key for account linking |

#### **Optional Variables** (BattleMetrics)

| Variable | Description |
|----------|-------------|
| `BATTLEMETRICS_API_KEY` | BattleMetrics API key |
| `BATTLEMETRICS_SERVER_ID` | Your Rust server ID |

#### **Optional Variables** (MySQL)

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | - |

### **3.2 How to Get Discord IDs**

1. Enable Developer Mode:
   - Discord Settings → Advanced → Developer Mode ✅

2. Copy IDs:
   - Right-click your bot user → Copy User ID
   - Right-click your application → Copy Application ID

---

## 🛠️ **Step 4: Configure config.yaml**

Edit `config.yaml` via the file manager:

```yaml
discord:
  guildId: "YOUR_SERVER_ID"           # Right-click server → Copy ID

  tickets:
	categoryId: "YOUR_CATEGORY_ID"    # Right-click category → Copy ID
	staffRoleId: "YOUR_STAFF_ROLE_ID" # Right-click role → Copy ID
	logChannelId: "YOUR_LOG_CHANNEL_ID" # Right-click channel → Copy ID
	autoCloseAfterHours: 48
	maxTicketsPerUser: 3

battlemetrics:
  enabled: true                        # Set false if not using

platformsync:
  enabled: true                        # Set false if not using

database:
  enabled: false                       # Set true if using MySQL

accountLinking:
  method: "platformsync"               # Options: platformsync, database, multi
```

**How to get Discord IDs:**
1. Enable Developer Mode (Discord Settings → Advanced)
2. Right-click servers/channels/roles → Copy ID

---

## 🚀 **Step 5: First-Time Setup**

### **5.1 Deploy Discord Commands**

In the Pterodactyl console, run:

```bash
npm run deploy-commands
```

Wait for: `✅ Successfully deployed commands to Discord!`

**Note:** This only needs to be done **once** (or after command changes)

### **5.2 Start the Bot**

Click the **Start** button in Pterodactyl!

**The `index.js` will automatically:**
1. ✅ Check for dependencies
2. ✅ Install packages if needed (`npm install`)
3. ✅ Build TypeScript if needed (`npm run build`)
4. ✅ Validate configuration
5. ✅ Start the bot

**Watch the console for:**
```
🎫 TicketBot Starting...
📦 Installing dependencies...
✅ Dependencies installed successfully
🔨 Building TypeScript...
✅ Build completed successfully
🚀 Starting TicketBot...
✅ Logged in as YourBot#1234
✅ Registered 2 slash commands
```

---

## 🎮 **Step 6: Using the Bot**

### **6.1 Create Ticket Panel**

In Discord, run:
```
/setup-tickets
```

This posts a persistent panel with category buttons!

### **6.2 Test Tickets**

1. Click a category button (Support, Ban Appeal, etc.)
2. Fill out the modal
3. Bot creates a ticket channel with staff controls

---

## 📋 **Startup Command Reference**

Pterodactyl will use these automatically:

| Action | Command |
|--------|---------|
| **Start Bot** | `node index.js` |
| **Deploy Commands** | `npm run deploy-commands` |
| **Manual Build** | `npm run build` |

The **default startup** is `node index.js` - which handles everything automatically!

---

## 🐛 **Troubleshooting**

### **"Cannot find module './dist/bot.js'"**

**Solution:** The build didn't run. Manually run:
```bash
npm install
npm run build
node index.js
```

### **"DISCORD_TOKEN not found"**

**Solution:** Set environment variable in Pterodactyl Startup tab

### **Commands don't appear in Discord**

1. Run `npm run deploy-commands` in console
2. Wait 5-10 minutes for Discord to sync
3. Restart Discord client
4. Check bot has `applications.commands` scope

### **"Permission denied" errors**

Check the bot has these permissions:
- ✅ Manage Channels
- ✅ Manage Roles
- ✅ Send Messages
- ✅ Embed Links
- ✅ Read Message History
- ✅ Use Application Commands

### **Database connection errors**

If not using MySQL:
```yaml
database:
  enabled: false
```

If you ARE using MySQL, verify environment variables in Startup tab.

### **Bot starts then immediately stops**

Common causes:
1. Invalid `DISCORD_TOKEN`
2. Missing required IDs in `config.yaml`
3. Bot not invited to server
4. Invalid YAML syntax in config.yaml

---

## 🔄 **Updating the Bot**

### **Method 1: Manual Update**

1. Stop the server
2. Upload new files via SFTP (overwrite old files)
3. Delete the `dist/` folder
4. Start the server (it will rebuild automatically)

### **Method 2: Git Pull** (if using Git)

```bash
git pull
rm -rf dist/
npm run build
```

Then restart the server.

---

## ⚡ **Performance Tips**

1. **Set NODE_ENV=production** in environment variables
2. **Allocate 1GB RAM** for smooth operation
3. **Enable caching** in config.yaml:
   ```yaml
   platformsync:
	 cacheTime: 3600  # 1 hour
   ```

4. **Monitor logs** via Pterodactyl console

---

## 🔒 **Security Best Practices**

✅ **Never share** your `DISCORD_TOKEN`  
✅ **Use environment variables** for tokens (not config.yaml)  
✅ **Set restrictive permissions** on the bot  
✅ **Keep dependencies updated**: `npm update`  
✅ **Monitor logs** for unusual activity  

---

## 📊 **Resource Usage**

Typical usage on Pterodactyl:

| Metric | Idle | Active (10 tickets) |
|--------|------|---------------------|
| **RAM** | 100-150MB | 200-300MB |
| **CPU** | 0-5% | 5-15% |
| **Disk** | 200MB | 250MB |

---

## 🆘 **Getting Help**

**Check these first:**
1. Console logs in Pterodactyl
2. [README.md](README.md) - Main documentation
3. [ACCOUNT_LINKING.md](ACCOUNT_LINKING.md) - PlatformSync setup

**Common Issues:**
- Build errors? Delete `dist/` and `node_modules/`, then restart
- Module errors? Run `npm install` manually
- Permission errors? Check bot invite scopes

---

## 🎉 **Success Checklist**

Before going live, verify:

- [ ] Bot appears online in Discord
- [ ] `/setup-tickets` command works
- [ ] Clicking ticket buttons creates tickets
- [ ] Ticket channels have correct names
- [ ] Staff can claim/close tickets
- [ ] Logs appear in log channel
- [ ] Account linking works (if enabled)
- [ ] BattleMetrics stats load (if enabled)

---

## 🚀 **You're Done!**

Your TicketBot is now running on Pterodactyl!

**Next steps:**
- Run `/setup-tickets` in your support channel
- Test each ticket category
- Configure custom messages in `config.yaml`
- Monitor the log channel

**Enjoy your automated ticket system! 🎫**
