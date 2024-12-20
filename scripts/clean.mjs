import { startClean } from "../dist/index.mjs";

/**
 * 全局替换
 * @param {string} root 指定根目录
 * @param {string[]} excludes 排除文件
 * @param {string[]} targets 替换集合
 * @description targets => [
 *  {
 *    name: '项目名称（备份用）',
 *    pattern: '匹配模式支持“*”通配符',
 *    target: '目标内容',
 *    replace: '替换内容',
 *    multiple: {'A': 'B'},多个目标集合，multiple字段存在时，target和replace将不在生效
 *    root: '选填：匹配指定目录，不填默认"root"或"utils"为相对目录',
 *    flags: '正则标志不填默认"g"'
 *  }
 * ]
 */
(async function () {
  // 排除文件
  const excludes = [
    "**/scripts/node-utils",
    "**/projects/Electron/electron-am-win",
    "**/projects/Electron/electron-deployer-win",
  ];
  // 要删除的目录及文件名称
  const targets = [
    'dist',
    '.turbo',
    'dist.7z',
    'dist.tar',
    'dist.zip',
    'backup_file',
    'node_modules',
  ];
  await startClean({
    // 目标集合
    targets,
    // 排除文件
    excludes,
    // 指定目录不填默认"utils"所在为根目录
    // root: "D:\\projects\\Outside\\wadv-admin",
  });
})();
