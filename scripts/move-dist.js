const fs = require("fs");
const path = require("path");

const distPath = path.resolve(__dirname, "../dist");
const rootPath = path.resolve(__dirname, "..");
const files = fs.readdirSync(distPath);

const movedFiles = [];

files.forEach(file => {
    const src = path.join(distPath, file);
    const dest = path.join(rootPath, file);
    fs.renameSync(src, dest);
    movedFiles.push(file);
    console.log(`Moved: ${file}`);
});

fs.writeFileSync(path.join(rootPath, "cleanup.json"), JSON.stringify(movedFiles, null, 2));

console.log("Dist files moved to root.");