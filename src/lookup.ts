import { join, normalize, relative } from 'node:path';
import { StartLookupOptions } from './type';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { minimatch, unescape } from 'minimatch';
import { promises as fs } from 'node:fs';

/**
 * 支持排除目录/文件的中文文件名搜索
 * @param dirPath 目标目录路径
 * @param regex 正则
 * @param excludePatterns 排除模式数组
 * @param pattern 包含模式（默认匹配所有文件）
 * @returns 匹配的文件路径数组
 */
function findLookupFiles(
    dirPath: string,
    regex: RegExp = /[\u4e00-\u9fff]/,
    excludePatterns: string[] = [],
    pattern: string = '**/*'
): string[] {
    const results: string[] = [];
    const chineseRegex = regex;

    function shouldExclude(relativePath: string): boolean {
        return excludePatterns.some(excludePattern =>
            minimatch(relativePath, excludePattern, { matchBase: true })
        );
    }

    function traverse(currentPath: string) {
        if (!existsSync(currentPath)) return;

        const entries = readdirSync(currentPath);
        for (const entry of entries) {
            const fullPath = join(currentPath, entry);
            const stat = statSync(fullPath);
            const relativePath = relative(dirPath, fullPath);

            // 检查是否匹配排除模式
            if (shouldExclude(relativePath)) {
                console.log(`\x1B[2m* Skip: ${relativePath}\x1B[0m`);
                continue;
            }

            if (stat.isDirectory()) {
                traverse(fullPath); // 继续递归子目录
            } else {
                // 同时满足包含模式与中文名称
                if (
                    minimatch(relativePath, pattern) &&
                    chineseRegex.test(entry)
                ) {
                    results.push(fullPath);
                    console.log(`\x1B[32m+ Lookup: ${fullPath}\x1B[0m`);
                }
            }
        }
    }

    traverse(dirPath);
    return results;
}

/**
 * 全局替换
 * @param {string} root 指定根目录
 * @param {string[]} excludes 排除文件
 * @param {ReplaceTargets} targets 替换集合
 *
 * @description targets => [
 *  {
 *    name: '项目名称（备份用）',
 *    regex: '正则',
 *    root: '匹配指定目录，不填默认本mjs为根目录目录',
 *  }
 * ]
 */
async function startLookup(option: StartLookupOptions) {
    const { targets = [], excludes = [], root = process.cwd() } = option;
    // 去掉node和文件路径
    const args = process.argv.slice(2);
    const rootPath = args.find((arg) => arg.startsWith('--root'))?.split('=')[1];
    const reg = args.find((arg) => arg.startsWith('--reg'))?.split('=')[1];
    const regex = reg ? new RegExp(unescape(reg)) : /[\u4e00-\u9fff]/;
    const rootSrc = rootPath ? normalize(rootPath || '') : root;

    const deleteFile = process.argv.includes('--delete');
    console.log(`\x1B[46mStarting cleanup.\x1B[0m`);
    console.log();
    console.log(`Root: --root=${rootSrc}`);
    console.log(`Deleted: ${deleteFile}`);
    console.log('Regex:', regex);

    const results = [];

    for (const item of targets) {
        console.log();
        console.log(`\x1B[36mTargets: ${item.name}\x1B[0m`);
        console.log(`\x1B[36mRoot: ${item.root || rootSrc}\x1B[0m`);
        console.log();
        const lookupFiles = findLookupFiles(item.root || rootSrc, item.regex || regex, item.excludes || excludes, item.pattern);
        // console.log('中文文件:', lookupFiles);
        results.push(...lookupFiles);
        console.log(`\x1B[36m\nEnding: ${lookupFiles.length} files\n\x1B[0m`);
    }

    if (deleteFile) {
        for (const itemPath of results) {
            // 匹配到目标目录或文件时直接删除
            await fs.rm(itemPath, { force: true, recursive: true });
            console.log(`\x1B[31m- Deleted: ${itemPath}\x1B[0m`);
        }
        console.log(`\x1B[31m\nThe Deleted process completed a total of ${results.length} files\n\x1B[0m`);
    } else {
        console.log(`\x1B[33m\nThe Lookup process completed a total of ${results.length} files\n\x1B[0m`);
    }
}

export { startLookup };
