# ERP Test Script for Termux

## Installation Steps

### 1. Install Termux
Download Termux from F-Droid (recommended) or GitHub releases:
- F-Droid: https://f-droid.org/packages/com.termux/
- GitHub: https://github.com/termux/termux-app/releases

### 2. Update Termux Packages
Open Termux and run:
```bash
pkg update && pkg upgrade -y
```

### 3. Install Required Packages
```bash
pkg install curl jq termux-api bc -y
```

Package breakdown:
- `curl` - For making HTTP requests
- `jq` - For parsing JSON responses
- `termux-api` - For opening CAPTCHA images
- `bc` - For percentage calculations

### 4. Install Termux:API App (Optional but Recommended)
Download from F-Droid or GitHub to enable `termux-open` for viewing CAPTCHA:
- F-Droid: https://f-droid.org/packages/com.termux.api/
- GitHub: https://github.com/termux/termux-api/releases

### 5. Download the Script
```bash
cd ~
curl -O https://raw.githubusercontent.com/YOUR-REPO/erp-test.sh
# OR manually copy the script to your device
```

### 6. Make Script Executable
```bash
chmod +x erp-test.sh
```

## Usage

### Run the Script
```bash
./erp-test.sh
```

### Script Flow
1. **Health Check** - Verifies server is running
2. **Login** - Enter your roll number and password
3. **CAPTCHA** - Image saved to ~/captcha.png and opened automatically
4. **Main Menu** - Choose from various endpoints:
   - Profile information
   - Dashboard details
   - Overall attendance
   - Subject list
   - All subjects with attendance
   - Weekly timetable
   - Last visit info
   - Subject-wise attendance
   - Today's schedule with attendance

### Viewing CAPTCHA
The script will:
1. Save CAPTCHA to `~/captcha.png`
2. Try to open it with `termux-open` (requires Termux:API)
3. If auto-open fails, manually view: `termux-open ~/captcha.png`

## Troubleshooting

### CAPTCHA Won't Open
```bash
termux-open ~/captcha.png
```
Or use a file manager app to navigate to `/data/data/com.termux/files/home/captcha.png`

### Permission Denied
```bash
chmod +x erp-test.sh
```

### curl Not Found
```bash
pkg install curl
```

### jq Not Found
```bash
pkg install jq
```

### Script Won't Run
Make sure you're in the right directory:
```bash
cd ~
ls -la erp-test.sh
./erp-test.sh
```

### Connection Timeout
Check your internet connection and try again.

## Tips

1. **Keep Termux Updated**: Run `pkg update && pkg upgrade` regularly
2. **CAPTCHA Timing**: You have ~30 seconds to enter the CAPTCHA
3. **Session Management**: The script closes sessions on exit
4. **Color Support**: Most Android terminals support colors used in this script

## File Locations

- Script: `~/erp-test.sh`
- CAPTCHA: `~/captcha.png`
- Full path: `/data/data/com.termux/files/home/`

## Features

✓ Color-coded output for better readability
✓ Automatic CAPTCHA refresh on login failure
✓ Session management
✓ All API endpoints from original script
✓ Error handling
✓ Interactive menu system

## Notes

- This is a testing/demonstration script
- Keep your credentials secure
- Don't share your session ID
- The CAPTCHA image is overwritten each time you refresh

## Support

For issues with:
- Termux: https://github.com/termux/termux-app/issues
- The API: Contact your ERP administrator
- This script: Check the original PowerShell version for comparison
