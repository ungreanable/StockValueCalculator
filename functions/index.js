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
    scrapeHTTP(req.params.symbol).then(async info => { 
        let currentPrice = 0, 
        currentPE = 0, firstPE = 0, secondPE = 0, thirdPE = 0, avgPE = 0,
        firstEPS = 0, secondEPS = 0, thirdEPS = 0, avgEPS = 0,
        firstNPM = 0, secondNPM = 0, thirdNPM = 0, fourthNPM = 0,
        avgIncrementalOfNPM = 0, forecastPercentIncreaseProfit = 0,
        intrinsicValue = 0, marginOfSafety = 0;
        info.forEach(element => {
            if(element.topic === "ราคาล่าสุด(บาท)")
                currentPrice = parseFloat(element.firstYear);
            else if(element.topic === "P/E (เท่า)") {
                currentPE = parseFloat(element.firstYear);
                firstPE = parseFloat(element.secondYear);
                secondPE = parseFloat(element.thirdYear);
                thirdPE = parseFloat(element.fourthYear);
                avgPE = (parseFloat(firstPE) + parseFloat(secondPE) + parseFloat(thirdPE)) / 3;
            } 
            else if(element.topic === "กำไรต่อหุ้น (บาท)") 
            {
                firstEPS = parseFloat(element.secondYear);
                secondEPS = parseFloat(element.thirdYear);
                thirdEPS = parseFloat(element.fourthYear);
                avgEPS = (parseFloat(firstEPS + parseFloat(secondEPS) + parseFloat(thirdEPS)) / 3)
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
        
        return res.json({ symbol: req.params.symbol, currentPrice: currentPrice, marginOfSafety: marginOfSafety, intrinsicValue: intrinsicValue});
    }).catch( () => { });

});

async function scrapeHTTP(symbol)
{
    return await new Promise((resolve, reject) => {
        let info = [];
        osmosis.get(`http://webcache.googleusercontent.com/search?q=cache:https://www.set.or.th/set/companyhighlight.do?symbol=${symbol}&ssoPageId=5&language=th&country=TH`)
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
        .done(() => resolve(info))
    });
}

// Expose Express API as a single Cloud Function:
exports.svc = functions.https.onRequest(app);