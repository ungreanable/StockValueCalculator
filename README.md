# StockValueCalculator (Firebase Function)

Stock Value Calculator API (Margin of Safety, Intrinsic Value and other Information) from Financial statements
<br>source financial statements from SET.or.th

# Requirement
```diff
+ npm install -g firebase-tools
+ npm install osmosis
+ npm install request-promise
```

# How to start Firebase Function on your localhost
- firebase serve (or firebase serve --only functions)

# Example on your localhost (Return JSON)
```diff
http://localhost:5000/stock-value-calculator-svc/us-central1/svc/calc/YOUR_STOCK_HERE
```
```diff
http://localhost:5000/stock-value-calculator-svc/us-central1/svc/calc/AOT
http://localhost:5000/stock-value-calculator-svc/us-central1/svc/calc/ADVANC
http://localhost:5000/stock-value-calculator-svc/us-central1/svc/calc/CPALL
http://localhost:5000/stock-value-calculator-svc/us-central1/svc/list/SET50 (All of SET50)
```

# LINEBOT
- You need to get your LINE token 
```diff
//For LINEBOT Section
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
const LINE_HEADER = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer YOUR_TOKEN_HERE`
};
```

# Reference
- ![#008000](https://placehold.it/15/008000/000000?text=+) <b>Formula (http://blog-maoroon.blogspot.com/)</b>
- ![#008000](https://placehold.it/15/008000/000000?text=+) <b>Firebase Function Example (https://github.com/firebase/functions-samples)</b>
