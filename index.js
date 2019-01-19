const puppeteer = require('puppeteer');
const assert = require('assert');
const fs = require('fs');

const sleep = function (time) {
    console.log(`now to sleep ${time}ms`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time)
    })
};

const url = 'https://www.yeitu.com/meinvbaike/';
const filename = process.argv[3];
let final_data = [];

puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    page.on('response', response => {

    });
    await get_image(url, page);
    await sleep(2000);
    // for (let i = 2; i <= 42; i++) {
    //     await get_image(`${url}${i}.html`, page);
    // }
    browser.close();
});


async function getResourceContent(page, url) {
    const {content, base64Encoded} = await page._client.send(
        'Page.getResourceContent',
        {frameId: String(page.mainFrame()._id), url},
    );
    assert.equal(base64Encoded, true);
    return content;
}

const write_img = async function (url, page, dirName) {
    await page.goto(url);
    await sleep(2000);
    const img = await page.$('.img_box');
    if (img) {
        const next_url = await img.$eval('a', a => a.href);
        const img_url = await img.$$('img', img => img.src);
        const url_split = img_url.split('/');
        const img_name = url_split[url_split.length - 1];
        const content = await getResourceContent(page, img_url);
        const contentBuffer = Buffer.from(content, 'base64');
        fs.writeFileSync(`./${dirName}/${img_name}`, contentBuffer, 'base64');
        if (next_url) {
            await write_img(next_url, page, dirName);
        }
    }
};

const get_star_img_group = async function (star_list, page) {
    await page.goto(star_list.starUrl);
    await sleep(2000);
    if (!fs.existsSync(`./${star_list.starName}`)) {
        fs.mkdirSync(`./${star_list.starName}`);
    }
    const item_group_list = await page.$$('.img_content .image-box');
    const item_group_url_list = [];
    for (let i = 0; i < item_group_list.length; i++) {
        const item_group = item_group_list[i];
        const img_group_url = await item_group.$eval('a', a => a.href);
        item_group_url_list.push(img_group_url);
    }
    await write_img(item_group_url_list[0], page, star_list.starName)
};


const get_image = async function (url, page) {
    await page.goto(url);
    await sleep(2000);
    const star_url_list = [];
    let star_list = await page.$$('.image-box');
    if (star_list) {
        for (let i = 0; i < star_list.length; i++) {
            const star = star_list[i];
            const starName = await star.$eval('img', img => img.alt);
            const starUrl = await star.$eval('a', a => a.href);
            star_url_list.push({starName, starUrl})
        }
    }
    await get_star_img_group(star_url_list[0], page);
};