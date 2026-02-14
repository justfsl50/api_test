# AITM ERP CLI

A beautiful command-line interface to interact with the AITM ERP system.

## Features

✨ **Interactive CLI** with beautiful menus  
🎨 **Color-coded output** for better readability  
📊 **Complete API coverage** - all endpoints supported  
🖼️ **Auto CAPTCHA handling** - opens images automatically  
⚡ **Fast & efficient** - built with Node.js  
📱 **Cross-platform** - works on Windows, macOS, Linux, and Termux

## Installation

### Global Installation (Recommended)

```bash
npm install -g aitm-erp
```

Then run anywhere:
```bash
aitm-erp
```

### Local Installation

```bash
npm install aitm-erp
```

Run with:
```bash
npx aitm-erp
```

### From Source

```bash
git clone https://github.com/justfsl50/api_test.git
cd api_test
npm install
npm start
```

## Usage

Simply run:
```bash
aitm-erp
```

The CLI will guide you through:
1. **Health Check** - Verify server status
2. **Login** - Enter credentials and solve CAPTCHA
3. **Interactive Menu** - Choose from various options:
   - 📋 Profile information
   - 📊 Dashboard details
   - 📈 Overall attendance
   - 📚 Subjects list
   - 📊 All subjects with attendance
   - 🗓️ Weekly timetable
   - 🕐 Last visit info
   - 📖 Subject-wise attendance
   - 📅 Today's schedule with attendance

## For Termux Users

### Installation on Termux

```bash
# Update packages
pkg update && pkg upgrade -y

# Install Node.js
pkg install nodejs-lts -y

# Install the CLI
npm install -g aitm-erp

# Run it
aitm-erp
```

### CAPTCHA Viewing on Termux

The CAPTCHA image will be saved as `captcha.png` in your current directory. The app will try to open it automatically, but if that fails:

```bash
termux-open captcha.png
```

Or use a file manager to view `/data/data/com.termux/files/home/captcha.png`

## Requirements

- Node.js >= 14.0.0
- Internet connection
- Valid ERP credentials

## Dependencies

- **axios** - HTTP client
- **chalk** - Terminal styling
- **inquirer** - Interactive prompts
- **ora** - Loading spinners
- **open** - Open files/URLs

## Screenshots

```
╔════════════════════════════════════╗
║        AITM ERP CLI - v1.0.0       ║
╚════════════════════════════════════╝

=== Health Check ===
Status: healthy | Uptime: 12345s | Sessions: 5

=== Login ===
? Enter your roll number: 12345678
? Enter your password: ********

✔ Session: abc123-def456-ghi789

========================================
  LOGIN SUCCESSFUL
========================================
  Name:     John Doe
  CRN:      12345678
  Roll No:  123/CS/21
  Program:  B.Tech
  Branch:   Computer Science
  Semester: 5
========================================

? Choose an option: (Use arrow keys)
❯ 📋 Profile
  📊 Dashboard
  📈 Overall Attendance
  📚 Subjects List
  📊 All Subjects with Attendance
  🗓️  Timetable
  🕐 Last Visit
  📖 Subject-wise Attendance
  📅 Today's Timetable + Attendance
  🚪 Exit
```

## Development

### Project Structure

```
api_test/
├── index.js           # Main CLI application
├── package.json       # Package configuration
├── README.md          # This file
├── .gitattributes     # Git line ending settings
├── erp-test.sh        # Legacy Bash script (for reference)
└── TERMUX-README.md   # Termux-specific docs
```

### Scripts

```bash
# Start the CLI
npm start

# Run in development
node index.js
```

## Troubleshooting

### Command not found after global install

Make sure npm's global bin directory is in your PATH:

```bash
npm config get prefix
```

Add this to your PATH in `~/.bashrc` or `~/.zshrc`:
```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

### CAPTCHA won't open

The CAPTCHA is saved as `captcha.png` in your current directory. Open it manually:

- **Windows**: `start captcha.png`
- **macOS**: `open captcha.png`
- **Linux**: `xdg-open captcha.png`
- **Termux**: `termux-open captcha.png`

### Connection timeout

Check your internet connection and ensure the backend server is accessible:
```
https://erptestbackend-production.up.railway.app/health
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project however you'd like!

## Author

**justfsl50**  
GitHub: [@justfsl50](https://github.com/justfsl50)

## Links

- [GitHub Repository](https://github.com/justfsl50/api_test)
- [Report Issues](https://github.com/justfsl50/api_test/issues)
- [NPM Package](https://www.npmjs.com/package/aitm-erp)

---

Made with ❤️ for students
