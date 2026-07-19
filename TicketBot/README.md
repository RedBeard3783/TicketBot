# TicketBot - Discord Ticket System

A feature-rich Discord ticket system bot with BattleMetrics integration, multiple account linking methods, and fully configurable messages. **Pterodactyl-ready with automatic setup!**

## ✨ **Features**

- 🎫 **Button-based Ticket System** - Persistent ticket panels with category-specific buttons
- 🎮 **BattleMetrics Integration** - Automatic player stats lookup with ban history
- 🔗 **Flexible Account Linking** - Support for PlatformSync API, MySQL database, or Discord connections
- 🌍 **Fully Localized** - All text configurable via `config.yaml` (English by default)
- 📊 **Category-Aware Channels** - Ticket channels show category type at a glance
- ⚡ **Auto-setup** - `index.js` handles dependency installation and building automatically
- 🔒 **Staff Controls** - Claim/close buttons with permission checks
- 📝 **Comprehensive Logging** - All ticket actions logged to dedicated channel

## 🚀 **Quick Start (Pterodactyl)**

### **1. Upload Files**

Upload all files to your Pterodactyl server's root directory via SFTP or file manager.

**File structure:**
```
/home/container/
├── src/              # Source code
├── config.yaml       # Your Discord server settings
├── index.js          # Main entry (auto-installs & builds)
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
└── .env.example      # Environment template
```

### **2. Set Environment Variables**

In Pterodactyl **Startup** tab, add:
```
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
PLATFORMSYNC_API_KEY=your_platformsync_key_here
NODE_ENV=production
```

### **3. Configure config.yaml**

Edit via Pterodactyl file manager:
```yaml
discord:
  guildId: "YOUR_GUILD_ID"
  tickets:
	categoryId: "YOUR_CATEGORY_ID"
	staffRoleId: "YOUR_STAFF_ROLE_ID"
	logChannelId: "YOUR_LOG_CHANNEL_ID"
```

### **4. Deploy Commands (One Time)**

In Pterodactyl console:
```bash
npm run deploy-commands
```

### **5. Start the Bot**

Just click **Start** in Pterodactyl! The `index.js` will:
- ✅ Auto-install dependencies
- ✅ Auto-build TypeScript
- ✅ Start the bot

**That's it!** 🎉

---

## 📋 **What You Need**

- **Node.js** 18.0.0 or higher
- **Discord Bot Token** ([discord.com/developers](https://discord.com/developers/applications))
- **(Optional)** [PlatformSync API key](https://www.platformsync.io/)
- **(Optional)** BattleMetrics API key

---

## ⚙️ **Configuration**

### **Environment Variables** (Pterodactyl Startup Tab)

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ Yes | Your Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ Yes | Your Discord application ID |
| `PLATFORMSYNC_API_KEY` | ⚠️ Optional | PlatformSync API key for account linking |
| `BATTLEMETRICS_API_KEY` | ⚠️ Optional | BattleMetrics API for player stats |
| `BATTLEMETRICS_SERVER_ID` | ⚠️ Optional | Your Rust server ID |
| `NODE_ENV` | ✅ Yes | Set to `production` |

### **config.yaml** (Discord Server Settings)

```yaml
discord:
  guildId: "123456789"              # Your Discord server ID

  tickets:
	categoryId: "123456789"         # Category where tickets are created
	staffRoleId: "123456789"        # Role that can manage tickets
	logChannelId: "123456789"       # Channel for ticket logs
	createChannelId: "123456789"    # (Optional) Legacy create channel
	autoCloseAfterHours: 48         # Auto-close after X hours
	maxTicketsPerUser: 3            # Max open tickets per user

accountLinking:
  method: "platformsync"            # Options: platformsync, database, multi

platformsync:
  enabled: true

database:
  enabled: false                    # Set true if using MySQL
```

**How to get Discord IDs:**
1. Enable Developer Mode (Discord Settings → Advanced → Developer Mode)
2. Right-click servers/channels/roles → Copy ID

---

## 🎮 **Commands**

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/setup-tickets` | Post ticket panel with buttons | Administrator |
| `/ticket` | Open a ticket (legacy) | Everyone |

**Ticket Categories:**
- 🎫 Support
- ⛔ Ban Appeal
- 📢 Report
- ❓ Question
- 📝 Other

---

## 🔗 **Account Linking**

Support for multiple Steam ID linking methods:

| Method | Description | Setup |
|--------|-------------|-------|
| **PlatformSync** ⭐ | Uses PlatformSync API | Easy - just add API key |
| **MySQL Database** | Direct database integration | Medium - requires DB setup |
| **Multi** | Try all methods with fallback | Easy - enable both |

See [ACCOUNT_LINKING.md](ACCOUNT_LINKING.md) for detailed setup.

---

## 🛠️ **Commands Reference**

```bash
# Deploy Discord commands (first time / after changes)
npm run deploy-commands

# Start the bot (auto-installs & builds)
npm start

# Development mode
npm run dev

# Manual build
npm run build
```

---

## 🎨 **Customization**

All text is editable in `config.yaml` under `messages`:

```yaml
messages:
  panel:
	title: "🎫 Support Ticket System"
	description: "Click a button below to create a ticket."

  buttons:
	support: "Support"
	banAppeal: "Ban Appeal"

  modal:
	title: "📋 New Support Ticket"
```

**Everything is customizable:**
- Panel text & footer
- Button labels
- Modal fields
- Success/error messages
- Embed field names

---

## 🐛 **Troubleshooting**

### **Bot doesn't start**
- Check `DISCORD_TOKEN` is set in environment variables
- Verify `config.yaml` syntax (use a YAML validator)
- Check console for error messages

### **Commands not showing**
- Run `npm run deploy-commands`
- Wait 5-10 minutes for Discord to sync
- Bot needs `applications.commands` scope

### **"No Steam ID found"**
- Set `accountLinking.method` in config.yaml
- Verify PlatformSync API key if using that method
- Or disable: set `platformsync.enabled: false`

### **Database errors**
- If not using MySQL, set `database.enabled: false`
- Verify credentials if you are using it

---

## 📊 **Performance**

- **RAM Usage:** 100-300MB
- **CPU Usage:** Minimal (event-driven)
- **Startup Time:** ~5-10 seconds (includes auto-install/build)
- **Response Time:** <500ms

---

## 📁 **Project Structure**

```
TicketBot/
├── index.js                        # 🚀 Main entry (auto-setup)
├── package.json                    # Dependencies
├── config.yaml                     # Your settings
├── src/
│   ├── bot.ts                      # Bot core
│   ├── commands/                   # Slash commands
│   ├── events/                     # Discord events
│   └── services/                   # API integrations
└── dist/                           # Compiled JS (auto-generated)
```

---

## 🦅 **Why It's Perfect for Pterodactyl**

✅ **Single `index.js` entry** - Just like other bots  
✅ **Auto-installs packages** - No manual npm install needed  
✅ **Auto-builds TypeScript** - Handles compilation automatically  
✅ **Low resources** - 100-300MB RAM  
✅ **NodeJS egg compatible** - Works with standard eggs  
✅ **Environment variables** - Uses Pterodactyl's built-in system  

---

## 📚 **Documentation**

- 🦅 **[PTERODACTYL_SETUP.md](PTERODACTYL_SETUP.md)** - Detailed deployment guide
- 🔗 **[ACCOUNT_LINKING.md](ACCOUNT_LINKING.md)** - PlatformSync & linking setup
- 🎨 **config.yaml** - All customization options

---

## 🔒 **Security**

✅ Environment variables for tokens  
✅ Permission checks on staff actions  
✅ Rate limiting on APIs  
✅ Type-safe TypeScript code  

**Never commit:**
- `.env` files
- API keys
- Tokens

---

## 📝 **License**

ISC License

---

## 🙏 **Credits**

- [discord.js](https://discord.js.org/)
- [PlatformSync](https://www.platformsync.io/)
- [BattleMetrics](https://www.battlemetrics.com/)

---

**Made with ❤️ for gaming communities**
