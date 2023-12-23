const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const TelegramBot = require("node-telegram-bot-api")

const token = "6615794911:AAFsKSzwsMqyOhU-QTWXcVIOlXgsO6q1p48"
const chatid = "-1002020928156"
const groupId = "-1002113828798"
const bot = new TelegramBot(token, { polling: true });
let updatetime = ""
const lastProducts = {
    "gümüs": {},
    "bronz": {},
    "hatıra": {}
}
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
                console.log("eee ==>", e.message)
            }
        }

    }
    catch (err) {
        console.log("selenium error mesajı ==>", err.message)
    }
    finally {
        await driver.quit();
    }

    if (type == "bronz") {
        lastProducts["bronz"] = result[0]
    }
    else if (type == "gümüs") {
        lastProducts["gümüs"] = result[0]
    }
    else if (type == "diger") {
        lastProducts["hatıra"] = result[0]
    }


    result = result.filter(item => item.status === "Sepete Ekle")
    
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

const formatJsonMessage = (msg) => {
    let message = ""
    Object.entries(msg).map(([key, val]) => {
        message += `${key} : ${val} \n\n `
    })
    return message !== "" ? message : "ürün bulunamadı"
}

bot.on("message", (msg) => {
    try {
        if (msg.text.toLowerCase().trim() == "control") {
            bot.sendMessage(groupId, "server çalışıyor")
        }
        else if (msg.text.toLocaleLowerCase().trim() == "lastupdate") {
            bot.sendMessage(groupId, updatetime == "" ? "program henüz başlamadı" : updatetime)
        }
        else if(msg.text.toLocaleLowerCase().trim()=="senfoni")
        {
            bot.sendMessage(groupId,"ben hiç öyle bir şey duymadım")
        }
        else if (msg.text.toLocaleLowerCase().trim() == "help") {
            bot.sendMessage(groupId, `- control\n- lastupdate\n- gümüş\n- bronz\n- hatıra`)
        }
        else if (msg.text.toLocaleLowerCase().trim() === "gümüş") {
            bot.sendMessage(groupId, formatJsonMessage(lastProducts["gümüs"]))
        }
        else if (msg.text.toLocaleLowerCase().trim() === "bronz") {
            bot.sendMessage(groupId, formatJsonMessage(lastProducts["bronz"]))
        }
        else if (msg.text.toLocaleLowerCase().trim() === "hatıra") {
            bot.sendMessage(groupId, formatJsonMessage(lastProducts["hatıra"]))
        }
    }
    catch (err) {

        console.log("err ==>", err.message)
    }
})


setInterval(() => {
    processUrlsSequentially()
}, 120000)
