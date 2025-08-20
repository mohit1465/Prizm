const builder = require('electron-builder');
const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

// Ensure dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
}

// Build options
const options = {
    config: {
        appId: 'com.example.Prizm',
        productName: 'Prizm',
        win: {
            target: 'nsis',
            icon: 'assets/Prizm_Logo.ico'
        },
        nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true
        },
        files: [
            '**/*',
            '!node_modules/.cache/**',
            '!dist/**'
        ]
    },
    publish: 'always'
};

// Build the app
builder.build({
    targets: builder.Platform.WINDOWS.createTarget(),
    config: options.config
}).then(() => {
    console.log('Build completed successfully!');
    console.log(`Check the 'dist' folder for the installer.`);
}).catch((error) => {
    console.error('Error during build:', error);
});
