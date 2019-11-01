'esversion: 6'

const superagent = require('superagent')
const cheerio = require('cheerio')

const gradeTableUrl = 'http://us.nwpu.edu.cn/eams/teach/grade/course/person!historyCourseGrade.action'
const loginUrl = 'http://us.nwpu.edu.cn/eams/login.action'
const logoutUrl = 'http://us.nwpu.edu.cn/eams/logout.action'
const testcase = {
    'semesters': ['2016-2017 秋', '2016-2017 春'],
    'grades': [
        [
            { 'name': 'C程序设计II实验', 'grade': '95', 'score': '1.5' },
            { 'name': '体育1（羽毛球）', 'grade': '92', 'score': '1' },
            { 'name': '高等数学（上）', 'grade': '97', 'score': '5.5' }
        ],
        [
            { 'name': '体育1（武术）', 'grade': '85', 'score': '1' },
            { 'name': '思想道德修养与法律基础', 'grade': '82', 'score': '3' },
            { 'name': '形势与政策', 'grade': '90', 'score': '2' },
            { 'name': '大学英语（Ⅱ）', 'grade': '85', 'score': '2' }
        ]
    ],
    'code': 0
}

exports.main = async (event, context) => {
    const agent = superagent.agent()
    const id = event.id
    const password = event.password

    // 测试账号
    if (id === '2016301234' && password === 'password') {
        return testcase
    }
    const loginText = await agent.post(loginUrl).type('form').send({
        'username': id,
        'password': password,
        'encodedPassword': '',
        'session_locale': 'zh_CN'
    })
    //   错误处理
    if (loginText.text.indexOf('密码错误') !== -1) {
        return {
            'code': 1001,
            'grades': '密码错误',
            'semesters': {}
        }
    }
    const gradeHtmlRes = await agent.post(gradeTableUrl).send({
        'projectType': 'MAJOR'
    })
    // 将成绩表提取出来，然后退出登录
    const $ = cheerio.load(gradeHtmlRes.text)
    let trs = $('div.grid').first().find('tr').map(function (i, el) { return $(this).find('td') }).filter(function (i, el) { return el.length > 0 })
    agent.get(logoutUrl)
    // 重新组织成绩信息
    let gradeTable = []
    let semesters = []
    for (let i = 0; i < trs.length; ++i) {
        const semester = trs[i][0].children[0].data
        const name = trs[i][3].children[1].children[0].data
        const score = trs[i][5].children[0].data
        const grade = trs[i][trs[i].length - 2].children[0].data.trim()
        if (!semesters.includes(semester)) {
            semesters.push(semester)
            gradeTable[semester] = []
        }
        gradeTable[semester].push({ 'name': name, 'grade': grade, 'score': score })
    }
    let grades = []
    for (let s of semesters) {
        grades.push(gradeTable[s])
    }
    // TODO: 云函数在某个随机IP上运行，所以每次查询都是使用的不同的IP访问教务系统，导致有时（大概率）会登录失败
    // 本地测试没有问题，云端测试大概率无法获取结果
    return { 'semesters': semesters, 'grades': grades, 'code': 0 }
}
