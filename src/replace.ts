import { dirname, join, normalize } from 'node:path';
import { minimatch } from 'minimatch';
import {
  copyFile,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { ReplaceTarget, ReplaceTargets, StartReplaceOptions, TypedString } from './type';

// 根目录
const rootDir = process.cwd();
// 备份文件名
const backupDir = 'backup_file';
// 当前目录计数
let count = 0;
// 总计数
let total = 0;

/**
 * 递归查找并删除目标目录
 * @param {string} currentDir - 当前遍历的目录路径
 */
async function replaceTargetsRecursively(
  currentDir: string,
  targets: ReplaceTargets,
  excludes: string[],
  root?: string,
) {
  const items = readdirSync(currentDir);

  for (const item of items) {
    try {
      const itemPath = join(currentDir, item);
      if (!matchPattern(itemPath, excludes)) {
        // 锁定
        const replaceTargets = filterPattern(itemPath, targets);
        // 修改文件
        if (replaceTargets.length) await modifyTargetsFile(itemPath, replaceTargets, root);
        // 目录
        const stat = lstatSync(itemPath);
        if (stat.isDirectory()) await replaceTargetsRecursively(itemPath, targets, excludes, root);
      }
    } catch {
      // console.error(`Error handling item ${item} in ${currentDir}: ${error.message}`);
    }
  }
}

/**
 * 匹配排除目录或文件
 * @param {string} itemPath - 当前遍历的目录路径
 * @param {string[]} excludes - 匹配目标
 */
function matchPattern(itemPath: string, excludes: string[]) {
  return excludes.some((pattern) => minimatch(itemPath, pattern, { matchBase: true }));
}

/**
 * 检出匹配排除目录或文件
 * @param {string} itemPath - 当前遍历的目录路径
 * @param {string[]} targets - 匹配目标
 */
function filterPattern(itemPath: string, targets: ReplaceTargets) {
  return targets.filter((target) => minimatch(itemPath, target.pattern, { matchBase: true }));
}

/**
 * 检查文件内容是否匹配
 * @param data 文件数据
 * @param target 目标集合
 * @returns {boolean}
 */
function isPatternExist(data: string, targets: ReplaceTargets) {
  return targets.map(target => {
    const multiple = target.multiple
    const pattern = target.target
    let exp: string | undefined = '87E4C20A-4615-0142-11CD-54281EC52129'
    if (multiple) {
      exp = Object.keys(multiple).join('|')
    } else {
      exp = Array.isArray(pattern) ? pattern.join('|') : pattern;
    }
    if (!exp) return false;
    const reg = new RegExp(exp, target.flags ?? 'g');
    return reg.test(data);
  }).some(s => s)
}

/**
 * 
 * @param data 文件数据
 * @param targets 目标集合
 * @returns {string}
 */
async function execModify(data: string, targets: ReplaceTargets) {
  let result = data;
  for (const target of targets) {
    const multiple = target.multiple
    if (multiple) {
      // 多换多
      result = await multipleModify(result, target, multiple)
    } else {
      // 一换一或多换一
      result = await patternModify(result, target)
    }
  }
  return result
}

/**
 * 多换多
 * @param data 被
 * @param target 
 * @param multiple 
 * @returns 
 */
async function multipleModify(data: string, target: ReplaceTarget, multiple: TypedString) {
  const keys = Object.keys(multiple)
  let result = data;
  for (const key of keys) {
    const reg = new RegExp(key, target.flags ?? 'g');
    result = result.replace(reg, multiple[key]);
  }
  return result
}


/**
 * 一换一或多换一
 * @param data 被
 * @param target 
 * @param multiple 
 * @returns 
 */
async function patternModify(data: string, target: ReplaceTarget) {
  const pattern = target.target
  const replace = target.replace
  if (!pattern || !replace) return data;
  let result = data;
  if (Array.isArray(pattern)) {
    for (const pat of pattern) {
      const reg = new RegExp(pat, target.flags ?? 'g');
      result = result.replace(reg, replace);
    }
  } else {
    const reg = new RegExp(pattern, target.flags ?? 'g');
    result = data.replace(reg, replace);
  }
  return result
}

/**
 * 修改文件内容
 * @param {string} itemPath - 当前遍历的目录路径
 * @param {object} targets - 替换目标集合
 * @param {string} root - 根目录
 */
async function modifyTargetsFile(itemPath: string, targets: ReplaceTargets, root: string = rootDir) {
  // 异步读取文件
  const data = readFileSync(itemPath, 'utf8');
  if (isPatternExist(data, targets)) {
    // 备份
    await copyAndBackup(itemPath, root, targets);
    // 修改文件内容
    const modifiedData = await execModify(data, targets)
    // 异步写入新内容到文件
    if (modifiedData) {
      writeFileSync(itemPath, modifiedData, 'utf8');
      // 替换完成
      console.log(`* Replace: ${itemPath}`);
      // 自增
      count++;
    }
  }
  // const reg = new RegExp(target.target, target.flags ?? 'g');
  // if (reg.test(data)) {
  //   // 备份
  //   await copyAndBackup(itemPath, target, root);
  //   // 修改文件内容
  //   const modifiedData = data.replace(reg, target.replace);
  //   // 异步写入新内容到文件
  //   writeFileSync(itemPath, modifiedData, 'utf8');
  //   // 替换完成
  //   console.log(`* Replace: ${itemPath}`);
  //   // 自增
  //   count++;
  // }
}

/**
 * 确保目录存在
 * @param itemPath - 当前遍历的目录路径
 * @returns
 */
async function ensureDirectoryExistence(itemPath: string) {
  const fileName = dirname(itemPath);
  if (existsSync(fileName)) {
    return true;
  }
  await ensureDirectoryExistence(fileName);
  mkdirSync(fileName);
}

/**
 * 备份
 * @param itemPath - 当前遍历的目录路径
 * @param root - 根目录
 * @param {ReplaceTargets} targets - 替换目标集合
 */
async function copyAndBackup(itemPath: string, root: string = rootDir, targets: ReplaceTargets) {
  const target = targets.find(f => f.name)
  const date = new Date();
  const dateString = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${date.getHours()}时${date.getMinutes()}分`;
  // 组合正则
  const rootReg = new RegExp(root.replace(/\\/g, '/'), 'g');
  let replacePath = `/${backupDir}/${dateString}/`
  if (target) replacePath += `${target.name}/`
  const joinPath = normalize(join(process.cwd(), replacePath));
  const writePath = normalize(itemPath.replace(/\\/g, '/').replace(rootReg, joinPath));
  // 确保目录存在
  await ensureDirectoryExistence(writePath);
  // 备份文件;
  await new Promise((resolve, reject) => {
    copyFile(itemPath, writePath, (error) => {
      if (error) return reject();
      resolve(true);
    });
  });
}

async function startReplacement({ targets, excludes, root = rootDir }: StartReplaceOptions) {

  const replaceTargets = [...targets.map((v) => v.pattern)];
  console.log(`\x1B[36m\nTargets: ${replaceTargets.join(', ')}\x1B[0m`);
  console.log(`\x1B[36mRoot: ${root}\x1B[0m`);

  try {
    await replaceTargetsRecursively(root, targets, excludes, root);
    // 输出当前目录计数
    console.log(`'\x1B[32m${root} for ${count} times\n\x1B[0m`);
    // 计入总数
    total += count;
    // 清除当前目录计数
    count = 0;
  } catch {
    // console.error(`Unexpected error during replace: ${error.message}`);
  }
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
 *    pattern: '匹配模式支持“*”通配符',
 *    target: '目标内容',
 *    replace: '替换内容',
 *    root: '匹配指定目录，不填默认本mjs为根目录目录',
 *    flags: '正则标志不填默认"g"'
 *  }
 * ]
 */
async function startReplace(option: StartReplaceOptions) {
  const { targets, excludes = [] } = option;

  const valid = targets.every(s => (s.target && s.replace) || ((!s.target || !s.replace) && !!s.multiple))

  if (!valid) {
    console.log(`\x1B[41mError: The matching rule is a required field.\x1B[0m`);
    return;
  }

  const roots = targets.filter((f) => f.root);
  const notRoots = targets.filter((f) => !f.root);

  // 加入备份目录
  excludes.push(backupDir);

  if (roots.length) {
    console.warn(`\x1B[46mMultiple directory\x1B[0m`);
    for (const item of roots) {
      await startReplacement({ ...option, targets: [item], root: item.root });
    }
    if (notRoots.length) await startReplacement({ ...option, targets: notRoots });
  } else {
    console.warn(`\x1B[46mSingle directory\x1B[0m`);
    await startReplacement(option);
  }

  console.log(`'\x1B[32m\nThe replace process completed a total of ${total} files\n\x1B[0m`);
}

export { startReplace };
