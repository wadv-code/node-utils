import { startReplace } from "../dist/index.mjs";

/**
 * 全局替换
 * @param {string} root 指定根目录
 * @param {string[]} excludes 排除文件
 * @param {ReplaceTargets} targets 替换集合
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
  // 排除目录或文件夹
  const excludes = [
    "node_modules",
    "dist",
    ".turbo",
    "dist.zip",
    // 排除自身
    "replace.mjs",
  ];
  // 要修改的文件
  const targets = [
    // ******************* 单个使用方式 *******************
    // {
    //   name: "target1",
    //   pattern: "*.{vue,js,ts,jsx,tsx,svelte,astro,html}",
    //   target: "This is a about page",
    //   replace: "这是一个关于我们的页面",
    //   // 指定目录
    //   // root: "D:\\projects\\Outside\\wadv-admin",
    // },
    // {
    //   name: "target1",
    //   pattern: "*.{vue,js,ts,jsx,tsx,svelte,astro,html}",
    //   target: 'class="about"',
    //   replace: 'class="about_page"',
    //   // 指定目录
    //   // root: "D:\\projects\\Outside\\wadv-admin",
    // },
    // {
    //   name: "target1",
    //   pattern: "*.{vue,js,ts,jsx,tsx,svelte,astro,html}",
    //   target: "\\.about",
    //   replace: ".about_page",
    //   // 指定目录
    //   // root: "D:\\projects\\Outside\\wadv-admin",
    // },

    // ******************* 多换一使用方式 target为数组时  "A，B" => "C" *******************
    // {
    //   name: "target1",
    //   pattern: "*.{vue,js,ts,jsx,tsx,svelte,astro,html}",
    //   target: ["This is a about page", "\\.about"],
    //   replace: "test_test_test_test_test_test",
    //   // 指定目录
    //   // root: "D:\\projects\\Outside\\wadv-admin",
    // },

    // ******************* 多个聚合使用方式 *******************
    {
      name: "target1",
      pattern: "*.{vue,js,ts,jsx,tsx,svelte,astro,html}",
      multiple: {
        // 替换1
        "This is a about page": "这是一个关于我们的页面",
        // 替换2
        'class="about"': 'class="about_page"',
        // 替换3
        "\\.about": ".about_page",
        // 等等...
      },
      // 指定目录
      // root: "D:\\projects\\Outside\\wadv-admin",
    },
  ];
  await startReplace({
    // 目标集合
    targets,
    // 排除文件
    excludes,
    // 指定目录不填默认"utils"所在为根目录
    root: "D:\\projects\\Outside\\wadv-admin",
  });
})();
