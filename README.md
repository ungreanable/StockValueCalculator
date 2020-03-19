# StockValueCalculator (Firebase Function)

Stock Value Calculator API (Margin of Safety, Intrinsic Value) from Financial statements
<br>source financial statements from SET.or.th

# Requirement
- npm install -g firebase-tools
- npm install osmosis

# How to start Firebase Function localhost
- firebase serve (or firebase serve --only functions)

# Example from SET https://marketdata.set.or.th/mkt/sectorquotation.do?sector=SET50&language=th&country=TH
- http://localhost:5000/stock-value-calculator-svc/us-central1/svc/calc/AOT
- http://localhost:5000/stock-value-calculator-svc/us-central1/svc/calc/ADVANC
- http://localhost:5000/stock-value-calculator-svc/us-central1/svc/calc/CPALL
- http://localhost:5000/stock-value-calculator-svc/us-central1/svc/list/SET50 (All of SET50)