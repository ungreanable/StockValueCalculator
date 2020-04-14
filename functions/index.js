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
        Promise.all(promises).then(() => {
            res.json(calculateList);
            return calculateList;
        }).catch( () => { });
        return calculateList;
    }).catch( () => { });
    
    
})

async function GatheringStockInformation(symbol) {
    var promises = [];
    var calculateList = {};
    promises.push(ScrapeHTTP(symbol).then( (info) => {
        var currentPrice = 0, arrPrice = [],
        arrPE = [], avgPE = 0,
        arrEPS = [], avgEPS = 0,
        arrNPM = [], avgNPM = 0,
        avgIncrementalOfNPM = 0, forecastPercentIncreaseProfit = 0,
        intrinsicValue = 0, marginOfSafety = 0,
        asset = 0.00, debt = 0.00, shareCapital = 0.00, paidShareCapital = 0, revenue = 0, netProfitMargin = 0;
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
                    var totalNPM = 0;
                    for(let i in arrNPM) { totalNPM += arrNPM[i]; }
                    avgNPM = totalNPM / arrNPM.length;

                    avgIncrementalOfNPM = ( 
                    (arrNPM[0] - arrNPM[1]) + 
                    (arrNPM[1] - arrNPM[2]) + 
                    (arrNPM[2] - arrNPM[3])) / 3;
                }
            }
            else if(element.topic === "สินทรัพย์รวม")
            {
                if( !isNaN(parseFloat(element.firstYear.replace(/,/g, '')))) { asset = parseFloat(element.firstYear.replace(/,/g, '')) }
                else if( !isNaN(parseFloat(element.secondYear.replace(/,/g, '')))) { asset = parseFloat(element.secondYear.replace(/,/g, '')) }
            }
            else if(element.topic === "หนี้สินรวม")
            {
                if( !isNaN(parseFloat(element.firstYear.replace(/,/g, '')))) { debt = parseFloat(element.firstYear.replace(/,/g, '')) }
                else if( !isNaN(parseFloat(element.secondYear.replace(/,/g, '')))) { debt = parseFloat(element.secondYear.replace(/,/g, '')) }
            }
            else if(element.topic === "ส่วนของผู้ถือหุ้น")
            {
                if( !isNaN(parseFloat(element.firstYear.replace(/,/g, '')))) { shareCapital = parseFloat(element.firstYear.replace(/,/g, '')) }
                else if( !isNaN(parseFloat(element.secondYear.replace(/,/g, '')))) { shareCapital = parseFloat(element.secondYear.replace(/,/g, '')) }
            }
            else if(element.topic === "มูลค่าหุ้นที่เรียกชำระแล้ว")
            {
                if( !isNaN(parseFloat(element.firstYear.replace(/,/g, '')))) { paidShareCapital = parseFloat(element.firstYear.replace(/,/g, '')) }
                else if( !isNaN(parseFloat(element.secondYear.replace(/,/g, '')))) { paidShareCapital = parseFloat(element.secondYear.replace(/,/g, '')) }
            }
            else if(element.topic === "รายได้รวม")
            {
                if( !isNaN(parseFloat(element.firstYear.replace(/,/g, '')))) { revenue = parseFloat(element.firstYear.replace(/,/g, '')) }
                else if( !isNaN(parseFloat(element.secondYear.replace(/,/g, '')))) { revenue = parseFloat(element.secondYear.replace(/,/g, '')) }
            }
            else if(element.topic === "กำไรสุทธิ")
            {
                if( !isNaN(parseFloat(element.firstYear.replace(/,/g, '')))) { netProfitMargin = parseFloat(element.firstYear.replace(/,/g, '')) }
                else if( !isNaN(parseFloat(element.secondYear.replace(/,/g, '')))) { netProfitMargin = parseFloat(element.secondYear.replace(/,/g, '')) }
            }
        });
        if(!isNaN(avgIncrementalOfNPM)) {
            forecastPercentIncreaseProfit = ( (avgIncrementalOfNPM * 100) / arrNPM[0]);
            intrinsicValue = avgPE * (avgEPS + (avgEPS * forecastPercentIncreaseProfit/100))
            marginOfSafety = 100 - ( (currentPrice * 100) / intrinsicValue)
        }
        calculateList = {
            symbol: symbol,
            currentPrice: currentPrice,
            currentAsset: asset,
            currentDebt: debt,
            currentShareCapital: shareCapital,
            currentPaidShareCapital: paidShareCapital,
            currentRevenue: revenue,
            currentNPM: netProfitMargin,
            currentEPS: arrEPS[0],
            currentNPMRatio: arrNPM[0],
            marginOfSafety: !isNaN(marginOfSafety) && intrinsicValue > 0 ? marginOfSafety : "ไม่สามารถคำนวณได้",
            intrinsicValue: !isNaN(intrinsicValue) && intrinsicValue > 0 ? intrinsicValue : "ไม่สามารถคำนวณได้"
        };
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
                        if(stockInfo && stockInfo.currentPrice !== 0) {
                                let msg = `ชื่อหุ้น: ${stockInfo.symbol}\nราคาปัจจุบัน (บาท): ${stockInfo.currentPrice}\n\uDBC0\uDC50ส่วนเผื่อความปลอดภัย: ${stockInfo.marginOfSafety.toFixed(2)}%\uDBC0\uDC50\n\uDBC0\uDC35มูลค่าที่แท้จริง (บาท): ${stockInfo.intrinsicValue.toFixed(2)}\uDBC0\uDC35\n
บัญชีทางการเงินที่สำคัญ (ล่าสุด) (ล้านบาท)\nสินทรัพย์รวม: ${stockInfo.currentAsset.toLocaleString()}\nหนี้สินรวม: ${stockInfo.currentDebt.toLocaleString()}\nส่วนของผู้ถือหุ้น: ${stockInfo.currentShareCapital.toLocaleString()}\nมูลค่าหุ้นที่เรียกชำระแล้ว: ${stockInfo.currentPaidShareCapital.toLocaleString()}\nรายได้รวม: ${stockInfo.currentRevenue.toLocaleString()}\nกำไรสุทธิ: ${stockInfo.currentNPM.toLocaleString()}\nกำไรต่อหุ้น (บาท): ${stockInfo.currentEPS}\nอัตรากำไรสุทธิ: ${stockInfo.currentNPMRatio}%`;
                                reply(req.body, res, msg);
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