# TicketBot - Discord Ticket System

A feature-rich Discord ticket system bot with BattleMetrics integration, multiple account linking methods, and fully configurable messages.

## ✨ **Features**

- 🎫 **Button-based Ticket System** - Persistent ticket panels with category-specific buttons
- 🎮 **BattleMetrics Integration** - Automatic player stats lookup with ban history
- 🔗 **Flexible Account Linking** - Support for PlatformSync API, MySQL database, or Discord connections
- 🌍 **Fully Localized** - All text configurable via `config.yaml` (English by default)
- 📊 **Category-Aware Channels** - Ticket channels show category type at a glance
- ⚡ **Performance Optimized** - Built-in caching and rate limiting
- 🔒 **Staff Controls** - Claim/close buttons with permission checks
- 📝 **Comprehensive Logging** - All ticket actions logged to dedicated channel
- 🦅 **Pterodactyl Ready** - Fully compatible with Pterodactyl panel hosting

## 📋 **Requirements**

- **Node.js** 18.0.0 or higher
- **Discord Bot** with proper permissions
- **(Optional)** MySQL database for user linking
- **(Optional)** [PlatformSync API key](https://www.platformsync.io/) for account linking
- **(Optional)** BattleMetrics API key for player stats

## 🚀 **Quick Start**

### **Local Development**

```bash
# Clone the repository
git clone https://github.com/YOUR-REPO/TicketBot.git
cd TicketBot

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your tokens

# Configure the bot
# Edit config.yaml with your Discord server IDs

# Build the project
npm run build

# Deploy Discord commands
npm run deploy-commands

# Start the bot
npm run start
```

### **Pterodactyl Panel** ⭐

See [PTERODACTYL_SETUP.md](PTERODACTYL_SETUP.md) for detailed deployment instructions.

**Quick Steps:**
1. Create NodeJS server on Pterodactyl
2. Upload files or git clone
3. Set environment variables in panel
4. Configure `config.yaml`
5. Run: `npm install && npm run build && npm run deploy-commands`
6. Start the server

## ⚙️ **Configuration**

### **1. Environment Variables (.env or Pterodactyl Startup)**

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
PLATFORMSYNC_API_KEY=your_platformsync_key
BATTLEMETRICS_API_KEY=your_battlemetrics_key
BATTLEMETRICS_SERVER_ID=your_server_id
NODE_ENV=production
```

### **2. Bot Configuration (config.yaml)**

```yaml
discord:
  guildId: "YOUR_GUILD_ID"
  tickets:
	categoryId: "YOUR_CATEGORY_ID"
	staffRoleId: "YOUR_STAFF_ROLE_ID"
	logChannelId: "YOUR_LOG_CHANNEL_ID"
	maxTicketsPerUser: 3

accountLinking:
  method: "platformsync"  # Options: database, discord, platformsync, multi

platformsync:
  enabled: true

database:
  enabled: false
```

See the config.yaml file for all available options and message customization.

## 🔗 **Account Linking Methods**

The bot supports 4 different methods for linking Discord users to Steam IDs:

| Method | Description | Setup Difficulty | External Dependency |
|--------|-------------|------------------|---------------------|
| **PlatformSync** ⭐ | Uses PlatformSync API (recommended) | Easy | Yes |
| **Database** | Direct MySQL integration | Medium | No |
| **Discord** | Built-in connected accounts | Easy | No (not fully implemented) |
| **Multi** | Try all methods with fallback | Easy | Optional |

See [ACCOUNT_LINKING.md](ACCOUNT_LINKING.md) for detailed setup guides.

## 📚 **Documentation**

- 🦅 **[Pterodactyl Setup Guide](PTERODACTYL_SETUP.md)** - Deploy on Pterodactyl panel
- 🔗 **[Account Linking Guide](ACCOUNT_LINKING.md)** - Configure Steam ID linking
- 🎨 **[Message Customization](config.yaml)** - Edit all user-facing text

## 🎮 **Commands**

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/setup-tickets` | Post ticket panel with category buttons | Administrator |
| `/ticket` | Open a ticket (legacy command) | Everyone |

**Button Categories:**
- 🎫 Support - General questions and help
- ⛔ Ban Appeal - Appeal against a ban
- 📢 Report - Report a player or issue
- ❓ Question - Questions about the server
- 📝 Other - Other requests

## 🏗️ **Project Structure**

```
TicketBot/
├── src/
│   ├── bot.ts                      # Main bot entry point
│   ├── deploy-commands.ts          # Command deployment script
│   ├── commands/
│   │   ├── setup-tickets.ts        # Persistent panel command
│   │   └── ticket.ts               # Legacy ticket command
│   ├── events/
│   │   └── interactionCreate.ts    # Handle buttons/modals/commands
│   ├── services/
│   │   ├── AccountLinkingService.ts # Unified linking service
│   │   ├── PlatformSyncService.ts   # PlatformSync API client
│   │   ├── DatabaseService.ts       # MySQL integration
│   │   └── BattleMetricsService.ts  # BattleMetrics API client
│   ├── config/
│   │   └── loader.ts               # Config file loader
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── config.yaml                     # Main configuration file
├── .env.example                    # Environment template
├── start.sh                        # Pterodactyl startup script
└── package.json                    # Dependencies
```

## 🎨 **Customization**

All user-facing text can be customized in `config.yaml` under the `messages` section:

- Ticket panel title, description, footer
- Category descriptions
- Button labels
- Modal titles and placeholders
- Success/error messages
- Embed field names
- Log messages

Example:
```yaml
messages:
  panel:
	title: "🎫 Support Ticket System"
	description: "Click a button below to create a ticket."

  buttons:
	support: "Support"
	banAppeal: "Ban Appeal"
```

## 🛠️ **Development Scripts**

```bash
npm run dev           # Start with ts-node (development)
npm run build         # Compile TypeScript to JavaScript
npm run start         # Start compiled bot
npm run watch         # Watch mode for development
npm run deploy-commands  # Register/update Discord commands
npm run lint          # Run ESLint
```

## 🦅 **Pterodactyl Deployment**

Perfect for game server communities! The bot runs smoothly on Pterodactyl panels:

✅ **NodeJS Egg Compatible**  
✅ **Low Resource Usage** (100-300MB RAM)  
✅ **Auto-restart Support**  
✅ **Environment Variable Management**  
✅ **Easy Updates via Git**  

See the complete [Pterodactyl Setup Guide](PTERODACTYL_SETUP.md) for step-by-step instructions.

## 🐛 **Troubleshooting**

### Common Issues

**Bot doesn't respond to commands**
- Run `npm run deploy-commands`
- Verify bot has `applications.commands` scope
- Check bot permissions in Discord server

**"Configuration loading failed"**
- Validate YAML syntax in config.yaml
- Ensure all required Discord IDs are filled

**"Database connection failed"**
- Set `database.enabled: false` if not using MySQL
- Verify database credentials if you are using it

**"PlatformSync authentication failed"**
- Check `PLATFORMSYNC_API_KEY` in .env or environment
- Verify API key is active at platformsync.io

See [PTERODACTYL_SETUP.md](PTERODACTYL_SETUP.md#troubleshooting) for more solutions.

## 📊 **Performance**

- **RAM Usage:** 100-300MB (depending on cache size)
- **CPU Usage:** Minimal (event-driven)
- **Startup Time:** ~2-5 seconds
- **Response Time:** <500ms for ticket creation

### Optimization Tips

1. Increase cache times to reduce API calls
2. Disable unused features (database, BattleMetrics)
3. Use `NODE_ENV=production` for better performance
4. Enable caching in PlatformSync/BattleMetrics services

## 🔒 **Security**

- ✅ Environment variables for sensitive data
- ✅ Permission checks on all staff actions
- ✅ Rate limiting on external APIs
- ✅ Input validation on all user inputs
- ✅ Type-safe TypeScript codebase

**Never commit:**
- `.env` file
- API keys
- Database credentials

## 📝 **License**

ISC License - See LICENSE file for details

## 🤝 **Contributing**

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 💡 **Support**

- 📖 Check the documentation files
- 🐛 Report issues on GitHub
- 💬 Ask questions in discussions

## 🙏 **Credits**

- [discord.js](https://discord.js.org/) - Discord API library
- [PlatformSync](https://www.platformsync.io/) - Account linking service
- [BattleMetrics](https://www.battlemetrics.com/) - Game server stats

---

**Made with ❤️ for the gaming community**

### **Deployment Options**

- 🦅 Pterodactyl Panel (see [setup guide](PTERODACTYL_SETUP.md))
- 💻 Local/VPS deployment
- ☁️ Cloud hosting (Heroku, Railway, etc.)
