const fs = require("fs");
const path = require("path");

const rootPath = path.resolve(__dirname, "..");
const cleanupFile = path.join(rootPath, "cleanup.json");

if (fs.existsSync(cleanupFile)) {
    const files = JSON.parse(fs.readFileSync(cleanupFile, "utf-8"));

    files.forEach(file => {
        const filePath = path.join(rootPath, file);
        if (fs.existsSync(filePath)) {
            const stat = fs.lstatSync(filePath);
            if (stat.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
                console.log(`Deleted directory: ${file}`);
            } else {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${file}`);
            }
        }
    });

    const distPath = path.join(rootPath, "dist");
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log("Deleted dist directory.");
    }

    fs.unlinkSync(cleanupFile);
    console.log("Cleanup complete.");
} else {
    console.log("No files to clean up.");
}