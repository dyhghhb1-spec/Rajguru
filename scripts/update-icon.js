const fs = require('fs');
const https = require('https');
const path = require('path');

const iconUrl = 'https://i.postimg.cc/DzFPd0br/file-00000000f220720bb968d59e32963632.png';
const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');

// Ensure assets directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'assets'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'assets'));
}

console.log('Downloading icon from:', iconUrl);

const file = fs.createWriteStream(iconPath);
https.get(iconUrl, function(response) {
    response.pipe(file);
    file.on('finish', function() {
        file.close();
        console.log('Icon downloaded successfully to:', iconPath);
    });
}).on('error', function(err) {
    fs.unlink(iconPath);
    console.error('Error downloading icon:', err.message);
    process.exit(1);
});
