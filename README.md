# AITM ERP CLI

A beautiful command-line interface to interact with the AITM ERP system.

## Features

- **Interactive menu** - OpenClaw-style selection with arrow keys
- **Axis Colleges branding** - Gradient banner and clean layout
- **Profile, Attendance, Subjects, Timetable** - Full API coverage
- **Bunk Calculator** - See how many classes you can bunk
- **In-terminal CAPTCHA** - View CAPTCHA in terminal (or fallback to file on Windows)
- **Cross-platform** - Works on Windows, macOS, Linux, and Termux

## Installation

### Global Installation (Recommended)

```bash
npm install -g aitm-erp
```

Then run:
```bash
aitm-erp
```

### Local Installation

```bash
npm install aitm-erp
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

```bash
aitm-erp
```

Run the CLI and use arrow keys to select:
- Profile
- Attendance
- Subjects
- Timetable
- Today's Schedule
- Bunk Calculator
- Last Visit
- Help
- Logout

### Flags

- `--no-color` - Disable ANSI colors
- `-V` or `--version` - Print version

## For Termux Users

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts -y
npm install -g aitm-erp
aitm-erp
```

### CAPTCHA on Termux

The CAPTCHA is displayed in the terminal when supported. If not, it's saved as `captcha.png`:

```bash
termux-open captcha.png
```

## Requirements

- Node.js >= 14.0.0
- Internet connection
- Valid ERP credentials

## Project Structure

```
aitm-erp/
├── api/
│   └── erpClient.js   # ERPClient, session persistence
├── commands/
│   ├── login.js       # Login flow
│   ├── help.js        # Help screen
│   └── attendance.js  # ensureSession
├── ui/
│   ├── palette.js     # Colors
│   ├── banner.js      # figlet + gradient banner
│   ├── box.js         # boxen wrappers
│   └── table.js       # CLI-style formatters
├── index.js           # Entry point
└── package.json
```

## Troubleshooting

### CAPTCHA won't open (Windows)

The CAPTCHA is saved as `captcha.png` in your current directory:

```bash
start captcha.png
```

### Connection timeout

Check your internet connection. Backend: `https://erptestbackend-production.up.railway.app/health`

## License

MIT License

## Author

**justfsl50** - [GitHub](https://github.com/justfsl50)

## Links

- [NPM Package](https://www.npmjs.com/package/aitm-erp)
- [GitHub Repository](https://github.com/justfsl50/api_test)
