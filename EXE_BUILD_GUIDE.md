# 🖥️ Windows Executable (.exe) Build Guide

## 🎯 **Overview**
This guide will help you create a Windows executable (.exe) file from your Electron browser application.

## 📋 **Prerequisites**
- ✅ Node.js installed (you already have this)
- ✅ npm installed (you already have this)
- ✅ Your Electron app working (you already have this)

## 🚀 **Quick Build Method**

### **Option 1: Using the Build Script (Recommended)**
```bash
.\build-exe.bat
```

### **Option 2: Using npm commands**
```bash
# Build installer (.exe)
npm run build:exe

# Build portable version
npm run build:portable

# Build both
npm run dist
```

## 📁 **What Gets Created**

After building, you'll find these files in the `dist/` folder:

### **Portable Version** (No installation required)
- `dist/win-unpacked/prizm.exe` - **Run this directly!**
- `dist/win-unpacked/` - All supporting files

### **Installer Version** (Windows installer)
- `dist/prizm Setup.exe` - **Install this on other computers**

## 🎨 **Customizing the Icon**

1. **Open the icon generator**: Open `assets/generate-icon.html` in your browser
2. **Generate icon**: Click "Generate Icon" to create a browser icon
3. **Download icon**: Click "Download Icon" to save as `icon.png`
4. **Convert to .ico**: Use an online converter to convert `icon.png` to `Prizm_Logo.ico`
5. **Place in assets**: Put the `Prizm_Logo.ico` file in the `assets/` folder

## 🔧 **Build Configuration**

The build is configured in `package.json`:

```json
"build": {
  "appId": "com.example.prizm",
  "productName": "prizm",
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "assets/Prizm_Logo.ico"
  }
}
```

## 📦 **Build Options**

### **Portable Version** (Recommended for testing)
- ✅ No installation required
- ✅ Can run from USB drive
- ✅ Easy to share
- ✅ No admin rights needed

### **Installer Version** (Recommended for distribution)
- ✅ Professional installation
- ✅ Creates Start Menu shortcuts
- ✅ Desktop shortcut option
- ✅ Uninstall support

## 🚀 **Step-by-Step Build Process**

1. **Open Command Prompt** in your project folder
2. **Run the build script**:
   ```bash
   .\build-exe.bat
   ```
3. **Wait for completion** (may take 2-5 minutes)
4. **Find your files** in the `dist/` folder

## 📱 **Testing Your .exe**

### **Test the Portable Version**
1. Navigate to `dist/win-unpacked/`
2. Double-click `prizm.exe`
3. Your browser should open with the dark theme

### **Test the Installer**
1. Run `dist/prizm Setup.exe`
2. Follow the installation wizard
3. Launch from Start Menu or Desktop shortcut

## 🔍 **Troubleshooting**

### **Build Fails**
- **Solution**: Run `npm install` first
- **Solution**: Make sure you're in the correct directory
- **Solution**: Check that all files exist (main.js, index.html, etc.)

### **App Doesn't Start**
- **Solution**: Check Windows Defender/antivirus isn't blocking it
- **Solution**: Try running as administrator
- **Solution**: Check the console for error messages

### **Missing Dependencies**
- **Solution**: Run `npm install` to install all dependencies
- **Solution**: Make sure electron-builder is installed

## 📊 **File Sizes**

Expected file sizes:
- **Portable version**: ~150-200 MB
- **Installer**: ~100-150 MB
- **Unpacked folder**: ~200-250 MB

## 🎯 **Distribution**

### **For Personal Use**
- Use the portable version from `dist/win-unpacked/`
- Copy the entire folder to any location

### **For Others**
- Share the installer: `dist/prizm Setup.exe`
- Or share the portable folder: `dist/win-unpacked/`

## 🔄 **Updating the App**

To create a new version:
1. Update your code
2. Update version in `package.json`
3. Run `.\build-exe.bat` again
4. New files will be created in `dist/`

## 🎉 **Success!**

Once you've built your .exe file, you have:
- ✅ A standalone Windows application
- ✅ No need for Node.js on target computers
- ✅ Professional installer option
- ✅ Portable version option
- ✅ Your custom browser with dark theme

Your Electron browser is now ready for Windows distribution! 🖥️🌐✨
