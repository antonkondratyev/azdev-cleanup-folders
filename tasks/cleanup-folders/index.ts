import * as os from 'os';
import * as path from 'path';
import * as tl from 'vsts-task-lib';

function main() {
    try {
        tl.setResourcePath(tl.resolve(__dirname, 'task.json'));

        let NormalizeArray = (arr: string[]): string[] => arr.join(' ').split(' ');

        let cleanupFoldersPath: string[] = NormalizeArray(tl.getDelimitedInput('cleanupFoldersPath', os.EOL, false));
        let excludeFiles: string[] = NormalizeArray(tl.getDelimitedInput('excludeFiles', os.EOL, false));
        let retentionDays: number = Number(tl.getInput('retentionDays', true));

        let timeStamp: Date = new Date();
        timeStamp.setDate(new Date().getDate() - retentionDays);

        let olderFiles: string[] = cleanupFoldersPath.map(folderPath => {
            return tl.resolve(folderPath);
        }).reduce((filesPathList: string[], folder: string) => {
            return filesPathList.concat(tl.find(folder));
        }, []).filter(filePath => {
            let fileStats: tl.FsStats = tl.stats(filePath);
            return fileStats.isFile() && fileStats.mtime.getTime() < timeStamp.getTime();
        });

        let filteredFiles: string[] = olderFiles.filter(filePath => {
            return excludeFiles.every(excludeFile => excludeFile !== path.basename(filePath));
        });

        let deletedFiles: string[] = filteredFiles.map(filePath => {
            tl.rmRF(filePath);
            return path.basename(filePath);
        });

        if (deletedFiles.length > 0) {
            console.log('Deleted files:');
            console.log(deletedFiles.join(os.EOL));
        } else {
            console.log(`No files older than ${retentionDays} days.`);
        }
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

process.on('warning', (warn: any) => tl.warning(warn));
process.on('uncaughtException', (err: Error) => tl.error(`Task Uncaught Exception: ${err}`));

main();