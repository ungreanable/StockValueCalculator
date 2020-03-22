const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const app = express();
const osmosis = require('osmosis');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
// build multiple CRUD interfaces:

app.get('/calc/:symbol', (req, res) => {

    (async() => {
        var a = await GatheringStockInformation(req.params.symbol);
        res.json(a)
      })();
});

app.get('/list/:symbol', (req, res) => {
    var stockList = [];
    var calculateList = [];
    var promises = [];
    var promisesSET = [];
    promisesSET.push(ScrapeSET(req.params.symbol).then(async list => { 
        list.forEach(element => {
            if(element.stock) {
                stockList.push(element.stock);
            }
        });
    }).catch( () => { }));
    Promise.all(promisesSET).then(function() {
        stockList.forEach(async stock => {
            (async() => {
            promises.push(GatheringStockInformation(stock).then(async info => 
            { 
                calculateList.push(info);
            }).catch( () => { }))
            })();
        });
        Promise.all(promises).then(function() {
            res.json(calculateList);
        });
    });
    
})

async function GatheringStockInformation(symbol) {
    var promises = [];
    var calculateList = [];
    promises.push(ScrapeHTTP(symbol).then( (info) => {
        var currentPrice = 0, 
        arrPE = [], avgPE = 0,
        arrEPS = [], avgEPS = 0,
        firstNPM = 0, secondNPM = 0, thirdNPM = 0, fourthNPM = 0,
        avgIncrementalOfNPM = 0, forecastPercentIncreaseProfit = 0,
        intrinsicValue = 0, marginOfSafety = 0;
        info.forEach(element => 
        {
            if(element.topic === "ราคาล่าสุด(บาท)") {
                currentPrice = parseFloat(element.firstYear) > 0 ? parseFloat(element.firstYear) : 0;
            }
            else if(element.topic === "P/E (เท่า)") 
            {
                !isNaN(parseFloat(element.secondYear)) ? arrPE.push(parseFloat(element.secondYear)) : 0;
                !isNaN(parseFloat(element.thirdYear)) ? arrPE.push(parseFloat(element.thirdYear)) : 0;
                !isNaN(parseFloat(element.fourthYear)) ? arrPE.push(parseFloat(element.fourthYear)) : 0;
                var totalPE = 0;
                for(var i in arrPE) { totalPE += arrPE[i]; }
                    avgPE = totalPE / arrPE.length;
            } 
            else if(element.topic === "กำไรต่อหุ้น (บาท)") 
            {
                !isNaN(parseFloat(element.secondYear)) ? arrEPS.push(parseFloat(element.secondYear)) : 0;
                !isNaN(parseFloat(element.thirdYear)) ? arrEPS.push(parseFloat(element.thirdYear)) : 0;
                !isNaN(parseFloat(element.fourthYear)) ? arrEPS.push(parseFloat(element.fourthYear)) : 0;
                var totalEPS = 0;
                for(var i in arrEPS) { totalEPS += arrEPS[i]; }
                avgEPS = totalEPS / arrEPS.length;
            }
            else if(element.topic === "อัตรากำไรสุทธิ(%)") 
            {
                firstNPM = parseFloat(element.secondYear);
                secondNPM = parseFloat(element.thirdYear);
                thirdNPM = parseFloat(element.fourthYear);
                fourthNPM = parseFloat(element.fifthYear);
                avgIncrementalOfNPM = ( 
                (parseFloat(firstNPM) - parseFloat(secondNPM)) + 
                (parseFloat(secondNPM) - parseFloat(thirdNPM)) + 
                (parseFloat(thirdNPM) - parseFloat(fourthNPM))) / 3;
            }
        });
                
        forecastPercentIncreaseProfit = (avgIncrementalOfNPM * 100) / firstNPM;
        intrinsicValue = avgPE * (avgEPS + (avgEPS * forecastPercentIncreaseProfit/100))
        marginOfSafety = 100 - ( (currentPrice * 100) / intrinsicValue)
                
        calculateList.push({
            symbol: symbol,
            currentPrice: currentPrice,
            marginOfSafety: marginOfSafety,
            intrinsicValue: intrinsicValue
        });
        return calculateList;
    }));

    return await Promise.all(promises).then(function() {
        return calculateList;
    });
}

async function ScrapeHTTP(symbol)
{
    return await new Promise((resolve, reject) => {
        var info = [];
        osmosis.get(`https://www.set.or.th/set/companyhighlight.do?symbol=${symbol}&ssoPageId=5&language=th&country=TH`)
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
        .done(() => resolve(info))
    });
}

// Expose Express API as a single Cloud Function:
exports.svc = functions.https.onRequest(app);