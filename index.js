const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const TelegramBot = require("node-telegram-bot-api")

const token = "6770733271:AAGhwwW9MpF66lQf8kHZdrrJbGSEtdiqh6o"
const chatid = "337475198"
const bot = new TelegramBot(token, { polling: true });
let updatetime = ""
function selectType(url) {
    if (url === "https://emagaza.darphane.gov.tr/gumus-hatira-para") {
        return "gümüs";
    } else if (url === "https://emagaza.darphane.gov.tr/bronz") {
        return "bronz";
    } else if (url === "https://emagaza.darphane.gov.tr/diger-hatira-para") {
        return "diger";
    } else {
        return "altin";
    }
}

async function check_new_products_with_selenium(url) {
    const type = selectType(url);

    const options = new firefox.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    let result = [];

    try {
        await driver.get(url);
        await driver.sleep(2000);

        const totalHeight = await driver.executeScript("return document.body.scrollHeight");

        for (let i = 0; i < totalHeight; i += 200) {
            await driver.executeScript(`window.scrollTo(0, ${i});`);
            await driver.sleep(500);
        }

        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");

        await driver.sleep(2000);

        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");

        await driver.sleep(2000);

        const element = await driver.wait(until.elementLocated(By.css('div[data-js-collection-replace-method]')), 20000);

        const childElements = await element.findElements(By.xpath("./*"));

        for (const child of childElements) {
            try {
                const productcollect = await child.findElement(By.className("product-collection"))
                const productCollectionContent = await productcollect.findElement(By.className("product-collection__content"));
                const title = await productCollectionContent.findElement(By.className("product-collection__title"))
                let price = null;

                price = await productCollectionContent.findElement(By.className("product-collection__price"));

                let status = (await productCollectionContent.findElements(By.tagName("div")))[2];

                result.push({
                    title: (await title.getText()).trim(),
                    price: (await price.getText()).trim(),
                    status: (await status.getText()).trim(),
                    type: type
                });
            } catch (e) {

            }
        }

    }
    catch (err) {
    }
    finally {
        await driver.quit();
    }

    result = result.filter(item => item.status === "Sepete Ekle")
    console.log("res ((>", result)
    if (result.length > 0) {
        const responseData = {}

        await sendMessage(result)
    }


    return result;
}

const urls = [
    "https://emagaza.darphane.gov.tr/gumus-hatira-para",
    "https://emagaza.darphane.gov.tr/bronz",
    "https://emagaza.darphane.gov.tr/diger-hatira-para"
];

async function processUrlsSequentially() {
    console.log("program çalıştııı")
    updatetime = new Date().toLocaleString()
    for (const url of urls) {
        await check_new_products_with_selenium(url)
        await sleep(10000); // 10 saniye beklet
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendMessage(message) {

    let msg = `Yeni Ürün\n\n`
    message.forEach(item => {
        msg += `isim: ${item.title}\nfiyat: ${item.price}\ndurum: ${item.status}\ntip: ${item.type}\n\n`
    })
    bot.sendMessage(chatid, msg).then(() => {
        console.log('Mesaj başarıyla gönderildi.');
    }).catch((error) => {
        console.error('Mesaj gönderirken hata oluştu:', error.message);
    });
}

bot.on("message", (msg) => {

    if (msg.text.toLowerCase().trim() == "control") {
        bot.sendMessage(chatid, "server çalışıyor")
    }
    else if (msg.text.toLocaleLowerCase().trim() == "lastupdate") {
        bot.sendMessage(chatid, updatetime)
    }
    else if (msg.text.toLocaleLowerCase().trim() == "help") {
        bot.sendMessage(chatid, `- control\n- lastupdate`)
    }
})

setInterval(() => {
    processUrlsSequentially()
}, 120000)
