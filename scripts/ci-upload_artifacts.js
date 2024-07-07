const fs = require('fs');
const path = require('path');
const { DefaultArtifactClient } = require('@actions/artifact');

// Get the JSON file path from the command line argument
const jsonFilePath = process.argv[2];
if (!jsonFilePath) {
    console.error('No JSON file path provided.');
    process.exit(1);
}

const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
    console.error('GITHUB_TOKEN is not set.');
    process.exit(1);
}

// Load the JSON configuration
const config = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

const manufacturer = config['Board Information']['Manufacturer'];
const name = config['Board Information']['Name'].replace(/\s+/g, '-'); // Replace spaces with dashes
const revision = config['Board Information']['Revision'];
const role = config['Board Information']['Role'];

const klipperOutDir = 'klipper/out';
const katapultOutDir = 'katapult/out';
const klipperConfigDir = 'klipper';
const katapultConfigDir = 'katapult';
const outputDir = 'artifacts';

// Ensure the output directory exists and is empty
if (fs.existsSync(outputDir)) {
    fs.rmdirSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir);

// Function to rename and move files
function processFiles(sourceDir, configDir, prefix, files) {
    files.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        if (fs.existsSync(sourcePath)) {
            const ext = path.extname(file);
            const baseName = path.basename(file, ext);
            const newFileName = `${prefix}_${manufacturer}_${name}_${revision}_${role}${ext}`;
            const destPath = path.join(outputDir, newFileName);
            fs.copyFileSync(sourcePath, destPath);
            console.log(`Copied ${sourcePath} to ${destPath}`);
        }
    });

    // Special case for .config file
    const configFilePath = path.join(configDir, '.config');
    if (fs.existsSync(configFilePath)) {
        const newConfigFileName = `${prefix}_${manufacturer}_${name}_${revision}_${role}.config`;
        const destConfigPath = path.join(outputDir, newConfigFileName);
        fs.copyFileSync(configFilePath, destConfigPath);
        console.log(`Copied ${configFilePath} to ${destConfigPath}`);
    }
}

// Process Klipper files
processFiles(klipperOutDir, klipperConfigDir, 'klipper', ['klipper.bin', 'klipper.dict']);

// Process Katapult files
processFiles(katapultOutDir, katapultConfigDir, 'katapult', ['katapult.bin', 'deployer.bin'].filter(file => fs.existsSync(path.join(katapultOutDir, file))));

// Upload artifacts
(async () => {
        const artifactClient = new DefaultArtifactClient({
            token: githubToken // Pass the GitHub token here
        });
    const artifactName = 'build-artifacts';
    const files = fs.readdirSync(outputDir).map(file => path.join(outputDir, file));
    const rootDirectory = outputDir;

    try {
        const { id, size } = await artifactClient.uploadArtifact(artifactName, files, rootDirectory);
        console.log(`Artifact uploaded with ID: ${id} and size: ${size} bytes`);
    } catch (error) {
        console.error(`Artifact upload failed: ${error}`);
    }
})();
