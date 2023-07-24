const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path'); // 导入 path 模块
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const courseInfo = {
    sectionNum: '', // 节数
    courseName: '', // 课程
    weeks: '', // 周数
    location: '', // 地点
    teacher: '', // 教师
    teachingClass: '', // 教学班
    // assessmentMethod: '', // 考核方式
    // courseSelectionNote: '', // 选课备注
    // courseHoursComposition: '', // 课程学时组成
    // weeklyHours: '', // 周学时
    totalHours: '', // 总学时
    credits: '', // 学分
    courseWeek: '', // 星期几
};
// 定义一个空数组，用于存储多个 courseInfo 对象
const courseInfoArray = [];
// 定义一个新的空数组，用于存储分割后的courseInfo对象
const separatedCourseInfoArray = [];

// 添加 Stealth 插件，隐藏 Puppeteer 的自动化特征
puppeteer.use(StealthPlugin());

// 第一步，模拟点击登录按钮，获取响应的 Cookies
async function getAndUseCookies() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: false,
    });

    try {
        const username = '2112206108';
        const password = 'dy2018sl@';
        // 创建一个新的页面实例
        const page = await browser.newPage();

        // 导航到目标网页
        await page.goto('https://yjsyxt.gzhu.edu.cn/gsapp/sys/wdkbapp/*default/index.do?THEME=indigo&amp;EMAP_LANG=zh#/xskcb');

        // 获取输入框元素并输入用户名
        const usernameInput = await page.$('#un');
        await usernameInput.type(username);
        // 获取输入框元素并输入密码
        const passwordInput = await page.$('#pd');
        await passwordInput.type(password);
        // 点击按钮
        await page.click('#index_login_btn');
        // 等待登录成功和页面跳转
        await page.waitForNavigation();

        // 获取响应的 Cookies
        const cookies = await page.cookies('https://yjsyxt.gzhu.edu.cn/gsapp/sys/wdkbapp/modules/xskcb/xsskjccx.do'); // 替换为 xsskjccx.do 请求的 URL
        // 将 name 和 value 拼接成字符串
        let cookiesString = '';
        for (const cookie of cookies) {
            cookiesString += `${cookie.name}=${cookie.value}`;
            cookiesString += ';';
        }
        cookiesString += 'route=cba1b83cf7962ccec3e69ac79ab208d9';
        console.log('Cookies:', cookies);
        console.log('Cookies String:', cookiesString);

        // 调用发送 HTTPS 请求的函数，并将 cookies 作为参数传递
        let responseData = await sendHttpsRequest(cookiesString);
        // // 将获取的数据保存到 output.json 文件中
        // saveDataToFile(responseData);
        const responseObject = JSON.parse(responseData);
        // 遍历rows数组，并为每个元素创建一个courseInfo对象
        for (const row of responseObject.datas.xsjxrwcx.rows) {
            const courseInfo = {
                sectionNum: row['PKSJDD'],
                courseName: row['KCMC'],
                weeks: row['PKSJ'],
                location: row['PKSJDD'],
                teacher: row['RKJS'],
                teachingClass: row['BJDM'],
                totalHours: row['ZXS'],
                credits: row['XF'],
                courseWeek: row['PKSJ'],
                // 如果还有其他属性，继续添加到courseInfo对象中
            };
            // 将courseInfo对象存储到数组中
            courseInfoArray.push(courseInfo);
        }
        // 遍历courseInfoArray中的每个元素
        for (const course of courseInfoArray) {
            // 将sectionNum按照';'进行分割
            const sections = course.sectionNum.split(';');
            // 遍历分割后的每个时间段
            for (const section of sections) {
                // 创建一个新的courseInfo对象，复制原始courseInfo中的属性值
                const newCourseInfo = { ...course };
                // 更新sectionNum和courseWeek属性为当前时间段的值
                const matchSectionNum = section.match(/\[(.*?)\]/); // 使用正则表达式匹配方括号中间的内容
                if (matchSectionNum && matchSectionNum[1]) {
                    newCourseInfo.sectionNum = matchSectionNum[1].trim(); // 更新sectionNum属性为匹配到的内容（去除空格）
                } else {
                    newCourseInfo.sectionNum = ''; // 如果未找到匹配内容，将sectionNum属性置为空字符串
                }
                // 获取时间段中的星期信息
                const matchResult = section.match(/星期[\u4e00-\u9fa5]+/); // 使用正则表达式提取星期信息
                if (matchResult && matchResult[0]) {
                    newCourseInfo.courseWeek = matchResult[0]; // 更新courseWeek属性为星期信息
                } else {
                    newCourseInfo.courseWeek = ''; // 如果未找到星期信息，将courseWeek属性置为空字符串
                }
                // 获取地址信息中节字后面的所有文字，并去除']
                const matchLocation = section.match(/]([^\[\]]+)/); // 使用正则表达式提取节字后的文字
                if (matchLocation && matchLocation[0]) {
                    newCourseInfo.location = matchLocation[0].replace("]", ""); // 更新location属性为提取到的地址信息
                } else {
                    newCourseInfo.location = ''; // 如果未找到地址信息，将location属性置为空字符串
                }
                // 获取weeks中周字前面的所有内容
                const matchWeeks = section.match(/([^\u4e00-\u9fa5]+)周/); // 使用正则表达式提取周字前面的内容
                if (matchWeeks && matchWeeks[1]) {
                    newCourseInfo.weeks = matchWeeks[1].trim(); // 更新weeks属性为周字前面的内容
                } else {
                    newCourseInfo.weeks = ''; // 如果未找到周字前面的内容，将weeks属性置为空字符串
                }
                // 将新的courseInfo对象存储到separatedCourseInfoArray数组中
                separatedCourseInfoArray.push(newCourseInfo);
            }
        }
        // 现在courseInfoArray中包含了所有的courseInfo对象
        console.log(courseInfoArray);
        // 输出separatedCourseInfoArray数组中每个元素
        for (const course of separatedCourseInfoArray) {
            console.log(JSON.stringify(course, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

// 第二步,通过cookies发送HTTPS请求获取数据
async function sendHttpsRequest(cookiesString) {
    const https = require('https');
    const xnxqdm = '20222'; // 替换为您的 XNXQDM 参数的实际值,就是需要查询的学期
    const url = `https://yjsyxt.gzhu.edu.cn/gsapp/sys/wdkbapp/modules/xskcb/xsjxrwcx.do?XNXQDM=${xnxqdm}`;
    const headers = {
        'Custom-Header': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', // 替换为您自定义的 header 和对应的值
        'Cookie': cookiesString, // 替换为您的 cookies 和对应的值
    };
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                console.log(data);
                resolve(data);
            });
        }).on('error', (error) => {
            console.error('Error:', error);
            reject(error);
        });
    });
}
// 第三步,将数据改为json格式保存到output.json文件中
// function saveDataToFile(data) {
//     try {
//         // 将数据放入一个数组中，并保持为 JavaScript 对象
//         const jsonArray = [{ datas: JSON.parse(data) }];
//
//         // 将数组转换为 JSON 格式的字符串，这里第三个参数为 2，表示使用 2 个空格进行缩进
//         const jsonData = JSON.stringify(jsonArray, null, 2);
//
//         // 写入到 output.json 文件，添加 { flag: 'w' } 参数，指定写入模式为覆盖写入
//         const outputPath = path.join(__dirname, 'output.json');
//         fs.writeFileSync(outputPath, jsonData, { encoding: 'utf8', flag: 'w' });
//
//         console.log('Data saved to output.json successfully.');
//
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }
// 运行爬虫并发送 HTTPS 请求
(async () => {
    await getAndUseCookies();
})();
