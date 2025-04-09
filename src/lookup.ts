import { join, normalize, relative } from 'node:path';
import { StartLookupOptions } from './type';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { minimatch } from 'minimatch';
// 总计数
let total = 0;
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
                    console.log(`\x1B[32m- Lookup: ${fullPath}\x1B[0m`);
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
    const rootSrc = normalize(rootPath || '') || root;

    console.log(`\x1B[46mStarting cleanup.\x1B[0m`);
    console.log();
    console.log(`Root: --root=${rootSrc}`);
    console.log();

    for (const item of targets) {
        console.log();
        console.log(`\x1B[36mTargets: ${item.name} Root: ${item.root || rootSrc}\x1B[0m`);
        console.log();
        const lookupFiles = findLookupFiles(item.root || rootSrc, item.regex, item.excludes || excludes, item.pattern);
        // console.log('中文文件:', lookupFiles);
        total += lookupFiles.length;
        console.log(`\x1B[36m\nEnding: ${lookupFiles.length} files\n\x1B[0m`);
    }

    console.log(`\x1B[33m\nThe Lookup process completed a total of ${total} files\n\x1B[0m`);
}

export { startLookup };
