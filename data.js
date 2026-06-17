// Vercel Serverless Function — proxy ไป Finnhub โดยซ่อน API key ไว้ฝั่ง server
// เรียกใช้: /api/data?symbols=AAPL,MSFT,GOOGL
//
// ต้องตั้ง Environment Variable ชื่อ FINNHUB_API_KEY ใน Vercel (ดู README)
// ฟรีของ Finnhub = 60 ครั้ง/นาที (1 หุ้นใช้ 2 ครั้ง) เพียงพอสำหรับ dashboard ส่วนตัว

const FINNHUB = "https://finnhub.io/api/v1";

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("finnhub " + r.status);
  return r.json();
}

// แปลงข้อมูล Finnhub -> 10 valuation metrics ที่ dashboard ใช้
function mapStock(symbol, quote, m) {
  const f = (m && m.metric) || {};
  const num = (v) => (v === undefined || v === null || isNaN(v) ? null : Number(v));
  return {
    symbol,
    price:      num(quote.c),                 // ราคาปัจจุบัน
    changePct:  num(quote.dp),                // % เปลี่ยนแปลงวันนี้
    // ----- 10 Valuation Metrics -----
    peTTM:      num(f.peTTM),                                  // 1) P/E (TTM)
    forwardPE:  num(f.forwardPE ?? f.peInclExtraTTM),         // 2) Forward P/E (free tier อาจไม่มี -> null)
    pb:         num(f.pbQuarterly ?? f.pbAnnual),             // 3) P/B
    psTTM:      num(f.psTTM ?? f.psAnnual),                   // 4) P/S
    peg:        num(f.pegRatio ?? f.pegTTM),                  // 5) PEG (free tier อาจไม่มี)
    evEbitda:   num(f.evToEbitdaTTM ?? f["currentEv/freeCashFlowTTM"]), // 6) EV/EBITDA (อาจ null)
    evSales:    num(f.evToSalesTTM),                          // 7) EV/Sales (อาจ null)
    divYield:   num(f.dividendYieldIndicatedAnnual ?? f.currentDividendYieldTTM), // 8) Dividend Yield %
    roe:        num(f.roeTTM ?? f.roeRfy),                    // 9) ROE %
    netMargin:  num(f.netProfitMarginTTM ?? f.netProfitMarginAnnual), // 10) Net Margin %
  };
}

module.exports = async (req, res) => {
  const KEY = process.env.FINNHUB_API_KEY;
  if (!KEY) {
    res.status(500).json({ error: "ยังไม่ได้ตั้งค่า FINNHUB_API_KEY" });
    return;
  }

  const symbols = String(req.query.symbols || "AAPL")
    .split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 30);

  try {
    const stocks = [];
    for (const sym of symbols) {
      try {
        const [quote, metric] = await Promise.all([
          getJSON(`${FINNHUB}/quote?symbol=${encodeURIComponent(sym)}&token=${KEY}`),
          getJSON(`${FINNHUB}/stock/metric?symbol=${encodeURIComponent(sym)}&metric=all&token=${KEY}`),
        ]);
        stocks.push(mapStock(sym, quote, metric));
      } catch (e) {
        stocks.push({ symbol: sym, error: String(e.message || e) });
      }
    }

    // cache ที่ฝั่ง CDN ของ Vercel 60 วินาที (กัน rate limit + เร็วขึ้น)
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      source: "finnhub",
      stocks,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
