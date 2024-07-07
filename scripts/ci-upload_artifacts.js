const fs = require('fs');
const path = require('path');
const { uploadArtifact } = require('@actions/artifact');

// Get the JSON file path from the command line argument
const jsonFilePath = process.argv[2];
if (!jsonFilePath) {
    console.error('No JSON file path provided.');
    process.exit(1);
}

// Load the JSON configuration
const config = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

const manufacturer = config['Board Information']['Manufacturer'];
const name = config['Board Information']['Name'];
const revision = config['Board Information']['Revision'];
const role = config['Board Information']['Role'];

const klipperOutDir = 'klipper/out';
const katapultOutDir = 'katapult/out';
const klipperConfigDir = 'klipper';
const katapultConfigDir = 'katapult';
const outputDir = 'artifacts';

// Ensure the output directory exists
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

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
const artifactClient = uploadArtifact.create();
const artifactName = 'build-artifacts';
const files = fs.readdirSync(outputDir).map(file => path.join(outputDir, file));
const rootDirectory = outputDir;

artifactClient.uploadArtifact(artifactName, files, rootDirectory).then(response => {
    console.log(`Artifact upload response: ${JSON.stringify(response)}`);
}).catch(error => {
    console.error(`Artifact upload failed: ${error}`);
});
