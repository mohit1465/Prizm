const { build } = require('electron-builder');
const path = require('path');

build({
  targets: {
    win: 'nsis',
  },
  config: {
    appId: 'com.example.Prizm',
    productName: 'Prizm',
    directories: {
      output: 'dist',
    },
    win: {
      target: 'nsis',
      icon: 'assets/Prizm_Logo.ico',
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
    },
    files: [
      '**/*',
      '!node_modules/.cache/**',
      '!dist/**',
    ],
  },
}).then(() => {
  console.log('Build completed successfully!');
  console.log('The installer is in the dist folder.');
}).catch(err => {
  console.error('Error during build:', err);
});
