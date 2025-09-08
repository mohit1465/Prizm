const { build } = require('electron-builder');
const fs = require('fs');
const path = require('path');

// Ensure build directory exists
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy the NSIS script to the build directory
const nsisScript = `!macro customInstall
  ; Register Prizm as default browser
  WriteRegStr HKCR "http\\shell\\open\\command" "" '"$INSTDIR\\\\${APP_EXEC}" "%1"'
  WriteRegStr HKCR "https\\shell\\open\\command" "" '"$INSTDIR\\\\${APP_EXEC}" "%1"'
  WriteRegStr HKCR "PrizmHTML" "" "Prizm HTML Document"
  WriteRegStr HKCR "PrizmHTML\\shell\\open\\command" "" '"$INSTDIR\\\\${APP_EXEC}" "%1"'
  WriteRegStr HKCR ".html\\\\OpenWithProgIds" "PrizmHTML" ""
  WriteRegStr HKCR ".htm\\\\OpenWithProgIds" "PrizmHTML" ""
  
  ; Refresh shell
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro customUnInstall
  ; Clean up registry entries
  DeleteRegKey HKCR "PrizmHTML"
  DeleteRegValue HKCR ".html\\\\OpenWithProgIds" "PrizmHTML"
  DeleteRegValue HKCR ".htm\\\\OpenWithProgIds" "PrizmHTML"
  
  ; Reset default browser if it was Prizm
  ReadRegStr $0 HKCR "http\\\\shell\\\\open\\\\command" ""
  StrCpy $1 '"$INSTDIR\\\\${APP_EXEC}" "%1"'
  StrCmp $0 $1 0 +2
  DeleteRegValue HKCR "http\\\\shell\\\\open\\\\command" ""
  
  ReadRegStr $0 HKCR "https\\\\shell\\\\open\\\\command" ""
  StrCmp $0 $1 0 +2
  DeleteRegValue HKCR "https\\\\shell\\\\open\\\\command" ""
!macroend`;

fs.writeFileSync(path.join(buildDir, 'installer.nsh'), nsisScript);

// Build configuration
build({
  targets: {
    win: 'nsis',
  },
  config: {
    appId: 'com.example.Prizm',
    productName: 'Prizm',
    publisherName: 'PrimeX',
    directories: {
      output: 'dist',
      buildResources: 'build'
    },
    win: {
      target: 'nsis',
      icon: 'assets/Prizm_Logo.ico',
      publisherName: 'PrimeX',
      verifyUpdateCodeSignature: false,
      rfc3161TimeStampServer: 'http://timestamp.digicert.com'
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      runAfterFinish: true,
      installerIcon: 'assets/Prizm_Logo.ico',
      uninstallerIcon: 'assets/Prizm_Logo.ico',
      installerHeaderIcon: 'assets/Prizm_Logo.ico',
      menuCategory: true,
      shortcutName: 'Prizm Browser',
      uninstallDisplayName: 'Prizm Browser',
      include: 'build/installer.nsh'
    },
    files: [
      '**/*',
      '!node_modules/.cache/**',
      '!dist/**',
      '!.git/**',
      '!*.md',
      '!build-simple.js',
      '!builder-effective-config.yaml',
      '!yarn.lock',
      '!package-lock.json'
    ],
  },
}).then(() => {
  console.log('Build completed successfully!');
  console.log('The installer is in the dist folder.');
  
  // Clean up
  try {
    fs.unlinkSync(path.join(buildDir, 'installer.nsh'));
    console.log('Temporary files cleaned up.');
  } catch (err) {
    console.warn('Could not clean up temporary files:', err.message);
  }
}).catch(err => {
  console.error('Error during build:', err);
  
  // Ensure cleanup even if build fails
  try {
    if (fs.existsSync(path.join(buildDir, 'installer.nsh'))) {
      fs.unlinkSync(path.join(buildDir, 'installer.nsh'));
    }
  } catch (cleanupErr) {
    console.warn('Error during cleanup:', cleanupErr.message);
  }
});
