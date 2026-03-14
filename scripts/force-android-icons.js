const fs = require('fs');
const https = require('https');
const path = require('path');

const iconUrl = 'https://i.postimg.cc/DzFPd0br/file-00000000f220720bb968d59e32963632.png';
const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const mipmapDirs = [
    'mipmap-hdpi',
    'mipmap-mdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
];

const iconFiles = [
    'ic_launcher.png',
    'ic_launcher_foreground.png',
    'ic_launcher_round.png'
];

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, function(response) {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                resolve();
            });
        }).on('error', function(err) {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function run() {
    try {
        const tempIcon = path.join(__dirname, 'temp_icon.png');
        console.log('Downloading master icon...');
        await download(iconUrl, tempIcon);
        console.log('Master icon downloaded.');

        // Delete vector icons that might override our PNGs
        const vectorFiles = [
            path.join(resDir, 'drawable-v24', 'ic_launcher_foreground.xml'),
            path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
            path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml')
        ];

        for (const vFile of vectorFiles) {
            if (fs.existsSync(vFile)) {
                fs.unlinkSync(vFile);
                console.log(`Deleted vector override: ${vFile}`);
            }
        }

        for (const dir of mipmapDirs) {
            const targetDir = path.join(resDir, dir);
            if (fs.existsSync(targetDir)) {
                for (const file of iconFiles) {
                    const dest = path.join(targetDir, file);
                    fs.copyFileSync(tempIcon, dest);
                    console.log(`Overwrote: ${dir}/${file}`);
                }
            } else {
                console.log(`Directory not found: ${dir}`);
            }
        }

        // Clean up
        fs.unlinkSync(tempIcon);
        console.log('Icon force-update completed successfully.');
    } catch (err) {
        console.error('Error during force-update:', err.message);
        process.exit(1);
    }
}

run();
