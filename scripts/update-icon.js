const fs = require('fs');
const https = require('https');
const path = require('path');

const iconUrl = 'https://i.postimg.cc/DzFPd0br/file-00000000f220720bb968d59e32963632.png';
const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

function download(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(assetsDir, filename);
        const file = fs.createWriteStream(filePath);
        https.get(url, function(response) {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', function(err) {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

async function run() {
    try {
        console.log('Starting icon downloads...');
        
        // Download main icon
        await download(iconUrl, 'icon-only.png');
        
        // Copy/Download others
        await Promise.all([
            download(iconUrl, 'icon-foreground.png'),
            download(iconUrl, 'logo.png'),
            download(iconUrl, 'splash.png')
        ]);

        // Create a simple white background for adaptive icons if possible
        // Since we can't easily make a PNG, we'll just use the icon as background too for now
        // but naming it correctly helps the generator.
        await download(iconUrl, 'icon-background.png');

        console.log('All assets downloaded successfully.');
    } catch (err) {
        console.error('Error during asset download:', err.message);
        process.exit(1);
    }
}

run();
