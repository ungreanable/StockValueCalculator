const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const app = express();
const osmosis = require('osmosis');
const request = require('request-promise');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
// build multiple CRUD interfaces:

//For LINEBOT Section
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
const LINE_HEADER = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer YOUR_TOKEN_HERE`
};

app.get('/calc/:symbol', (req, res) => {

    (async() => {
        var a = await GatheringStockInformation(req.params.symbol);
        res.json(a)
    })();
});

app.get('/list/:symbol', (req, res) => {
    var stockList = [];
    var promises = [];
    var promisesSET = [];
    promisesSET.push(ScrapeSET(req.params.symbol).then(list => { 
        list.forEach(element => {
            if(element.stock) {
                stockList.push(element.stock);
            }
        });
        return stockList;
    }).catch( () => { }));
    Promise.all(promisesSET).then(() => {
        var calculateList = [];
        stockList.forEach(stock => {  
            promises.push(GatheringStockInformation(stock.trim()).then(info => {
                calculateList.push(info);
                return calculateList;
            }).catch( () => { }))
        });
        return calculateList;
    }).catch( () => { });
    
    Promise.all(promises).then(() => {
        res.json(calculateList);
        return calculateList;
    }).catch( () => { });
})

async function GatheringStockInformation(symbol) {
    var promises = [];
    var calculateList = [];
    promises.push(ScrapeHTTP(symbol).then( (info) => {
        var currentPrice = 0, arrPrice = [],
        arrPE = [], avgPE = 0,
        arrEPS = [], avgEPS = 0,
        arrNPM = [],
        avgIncrementalOfNPM = 0, forecastPercentIncreaseProfit = 0,
        intrinsicValue = 0, marginOfSafety = 0;
        info.forEach(element => 
        {
            if(element.topic === "ราคาล่าสุด(บาท)") {
                if( !isNaN(parseFloat(element.firstYear))) { arrPrice.push( parseFloat(element.firstYear) ); }
                if( !isNaN(parseFloat(element.secondYear))) { arrPrice.push( parseFloat(element.secondYear) ); }
                if( !isNaN(parseFloat(element.thirdYear))) { arrPrice.push( parseFloat(element.thirdYear) ); }
                if( !isNaN(parseFloat(element.fourthYear))) { arrPrice.push( parseFloat(element.fourthYear) ); }
                if( !isNaN(parseFloat(element.fifthYear))) { arrPrice.push( parseFloat(element.fifthYear) ); }
                currentPrice = arrPrice.length > 0 ? arrPrice[0] : 0;
            }
            else if(element.topic === "P/E (เท่า)") 
            {
                !isNaN(parseFloat(element.secondYear)) ? arrPE.push(parseFloat(element.secondYear)) : 0;
                !isNaN(parseFloat(element.thirdYear)) ? arrPE.push(parseFloat(element.thirdYear)) : 0;
                !isNaN(parseFloat(element.fourthYear)) ? arrPE.push(parseFloat(element.fourthYear)) : 0;
                var totalPE = 0;
                for(let i in arrPE) { totalPE += arrPE[i]; }
                    avgPE = totalPE / arrPE.length;
            } 
            else if(element.topic === "กำไรต่อหุ้น (บาท)") 
            {
                !isNaN(parseFloat(element.secondYear)) ? arrEPS.push(parseFloat(element.secondYear)) : 0;
                !isNaN(parseFloat(element.thirdYear)) ? arrEPS.push(parseFloat(element.thirdYear)) : 0;
                !isNaN(parseFloat(element.fourthYear)) ? arrEPS.push(parseFloat(element.fourthYear)) : 0;
                var totalEPS = 0;
                for(let i in arrEPS) { totalEPS += arrEPS[i]; }
                avgEPS = totalEPS / arrEPS.length;
            }
            else if(element.topic === "อัตรากำไรสุทธิ(%)") 
            {
                if( !isNaN(parseFloat(element.secondYear))) { arrNPM.push( parseFloat(element.secondYear) ); }
                if( !isNaN(parseFloat(element.thirdYear))) { arrNPM.push( parseFloat(element.thirdYear) ); }
                if( !isNaN(parseFloat(element.fourthYear))) { arrNPM.push( parseFloat(element.fourthYear) ); }
                if( !isNaN(parseFloat(element.fifthYear))) { arrNPM.push( parseFloat(element.fifthYear) ); }
                if(arrNPM.length > 3) {
                    avgIncrementalOfNPM = ( 
                    (arrNPM[0] - arrNPM[1]) + 
                    (arrNPM[1] - arrNPM[2]) + 
                    (arrNPM[2] - arrNPM[3])) / 3;
                }
            }
        });
        if(!isNaN(avgIncrementalOfNPM)) {
            forecastPercentIncreaseProfit = (avgIncrementalOfNPM * 100) / arrNPM[0];
            intrinsicValue = avgPE * (avgEPS + (avgEPS * forecastPercentIncreaseProfit/100))
            marginOfSafety = 100 - ( (currentPrice * 100) / intrinsicValue)
        }
        calculateList.push({
            symbol: symbol,
            currentPrice: currentPrice,
            marginOfSafety: !isNaN(marginOfSafety) ? marginOfSafety : "Cannot Calculate",
            intrinsicValue: !isNaN(intrinsicValue) ? intrinsicValue : "Cannot Calculate"
        });
        return calculateList;
    }));

    return await Promise.all(promises).then(() => {
        return calculateList;
    });
}

async function ScrapeHTTP(symbol)
{
	var url = "";
	url = `https://www.settrade.com/C04_06_stock_financial_p1.jsp?txtSymbol=${symbol}&ssoPageId=13&selectPage=6`;
    return await new Promise((resolve, reject) => {
        var info = [];
		osmosis.get(url)
        .find('.table-info:first tr:gt(0)')
        .set({
            topic: 'td[1]',
            fifthYear: 'td[2]',
            fourthYear: 'td[3]',
            thirdYear: 'td[4]',
            secondYear: 'td[5]',
            firstYear: 'td[6]'
        })
        .data(item => {
            info.push(item);
        })
		.error(err => { 
			console.log(err)
		})
        .done(() => resolve(info));
    });
}

async function ScrapeSET(symbol)
{
    return await new Promise((resolve, reject) => {
        var info = [];
        osmosis.get(`https://marketdata.set.or.th/mkt/sectorquotation.do?sector=${symbol}&language=th&country=TH`)
        .find('.table-info:last tr:gt(0)')
        .set({
            stock: 'a',
        })
        .data(item => { 
            info.push(item); 
         })
		.error(err => { 
			console.log(err)
		})
        .done(() => resolve(info))
    });
}

const reply = async (bodyResponse, res, msg) => {
    try {
        await request({
            method: `POST`,
            uri: `${LINE_MESSAGING_API}/reply`,
            headers: LINE_HEADER,
            body: JSON.stringify({
                replyToken: bodyResponse.events[0].replyToken,
                messages: [
                    {
                        type: `text`,
                        text: msg
                    }
                ]
            })
        });
        return res.status(200).send("SUCCESS");
    }
    catch (error) {
        return Promise.reject(error);
    }
};


app.post('/linebot', (req, res) => {
    if (req.body.events[0].message.type !== 'text') {
        res.status(200).send('Done');
    }
    else 
    {
        let textFromLine = req.body.events[0].message.text;
        if(textFromLine) {
            let stockName = "";
            if(textFromLine.includes("หุ้น ")) {
                let splitText = textFromLine.split(" ");
                stockName = splitText && splitText.length > 0 && splitText[1] ? splitText[1] : "";
                if(stockName) {
                    (async() => {
                        let stockInfo = await GatheringStockInformation(stockName);
                        if(stockInfo && stockInfo.length > 0 && stockInfo[0].currentPrice !== 0) {
                            stockInfo.forEach(item => {
                                let msg = `ชื่อหุ้น: ${item.symbol}\nราคาปัจจุบัน (บาท): ${item.currentPrice}\nส่วนเผื่อความปลอดภัย: ${item.marginOfSafety.toFixed(2)}%\nมูลค่าที่แท้จริง (บาท): ${item.intrinsicValue.toFixed(2)}`;
                                reply(req.body, res, msg);
                            });
                        }
                        else reply(req.body, res, `ไม่พบหุ้น ${stockName} หรือไม่สามารคำนวณมูลค่าได้ในขณะนี้ โปรดลองใหม่อีกครั้ง`);
                    })();
                }
            }
        }
        res.status(200);
    }
})
//

// Expose Express API as a single Cloud Function:
exports.svc = functions.https.onRequest(app);