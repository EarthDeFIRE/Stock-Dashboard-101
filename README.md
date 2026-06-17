# 📊 Stock Valuation Dashboard — คู่มือใช้งาน

เว็บ dashboard หุ้น US & Global แสดง **10 valuation metrics** ปรับแต่งเองได้ และอัปเดตข้อมูลจริงผ่าน Finnhub (ฟรี)

---

## 📁 ไฟล์ในโปรเจกต์

| ไฟล์ | หน้าที่ | ต้องแก้เองไหม |
|---|---|---|
| `index.html` | หน้าเว็บ + โค้ดทั้งหมด | ไม่ต้องแตะ |
| **`content.json`** | **ชื่อ/โลโก้/หุ้นที่ติดตาม/ลิงก์/โปรโมชัน** | ✅ **แก้ตรงนี้** |
| `sample-data.json` | ข้อมูลตัวอย่างตอนยังไม่ deploy | ไม่ต้องแตะ |
| `api/data.js` | ดึงข้อมูลจริงจาก Finnhub (ซ่อน key) | ไม่ต้องแตะ |
| `vercel.json` | ตั้งค่า Vercel | ไม่ต้องแตะ |

> หลักคิด: **เนื้อหาแยกจากโค้ด** — สิ่งที่คุณอยากเปลี่ยนบ่อย (รูป ลิงก์ โปรโมชัน หุ้น) อยู่ใน `content.json` ไฟล์เดียว ไม่ต้องอ่านโค้ดเลย

---

## 🚀 ขั้นตอน Deploy ขึ้นเว็บ (Vercel)

### 1) สมัคร Finnhub เอา API key ฟรี
1. ไปที่ https://finnhub.io/register สมัครด้วยอีเมล (ฟรี)
2. เข้า Dashboard จะเห็น **API Key** — คัดลอกเก็บไว้
3. ฟรี = 60 ครั้ง/นาที + ราคา real-time หุ้น US ✅

### 2) อัปโหลดโค้ดขึ้น GitHub
1. สร้าง repo ใหม่ที่ https://github.com/new (เช่นชื่อ `stock-dashboard`)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้เข้า repo (ลากไฟล์เข้าหน้าเว็บ GitHub ได้เลย)

### 3) เชื่อมกับ Vercel
1. ไปที่ https://vercel.com สมัคร/ล็อกอินด้วยบัญชี GitHub
2. กด **Add New → Project** → เลือก repo `stock-dashboard` → **Import**
3. **สำคัญ:** ก่อนกด Deploy ให้ไปที่ **Environment Variables** เพิ่ม:
   - Name: `FINNHUB_API_KEY`
   - Value: *(วาง API key จากข้อ 1)*
4. กด **Deploy** รอสักครู่ → ได้ลิงก์เว็บ เช่น `https://stock-dashboard-xxx.vercel.app`

เสร็จ! เปิดลิงก์จะเห็นข้อมูลจริง (มุมขวาบนขึ้นจุดเขียว "ข้อมูลจริง")

---

## ✏️ วิธีปรับแต่งเอง (แก้ `content.json`)

เปิด `content.json` แล้วแก้ได้เลย จากนั้น push ขึ้น GitHub — Vercel จะอัปเดตเว็บอัตโนมัติภายในไม่กี่วินาที

**เปลี่ยนชื่อ/โลโก้/สี:**
```json
"brand": {
  "name": "ชื่อของคุณ",
  "tagline": "คำโปรย",
  "logoUrl": "ลิงก์รูปโลโก้",
  "accentColor": "#0ea5e9"
}
```

**เพิ่ม/ลบหุ้นที่ติดตาม:**
```json
"watchlist": [
  { "symbol": "AAPL", "name": "Apple Inc." },
  { "symbol": "TSM",  "name": "TSMC" }
]
```
> ใช้ ticker แบบสากล เช่น `AAPL` (US), `TSM`, หุ้นยุโรปบางตัวใช้ `.PA` `.L` ตามตลาด

**เพิ่มโปรโมชัน / รูป / ลิงก์ที่อยากแนะนำ:**
```json
"promotions": [
  {
    "title": "หัวข้อ",
    "description": "รายละเอียด",
    "imageUrl": "ลิงก์รูป",
    "linkUrl": "ลิงก์ปลายทาง",
    "linkText": "ข้อความปุ่ม"
  }
]
```

> 💡 ทางลัด: เข้า repo ใน GitHub → กดที่ `content.json` → ปุ่มดินสอ ✏️ → แก้ → Commit ได้เลยในเบราว์เซอร์ ไม่ต้องลงโปรแกรมอะไร

---

## ⏱️ Real-time หรือ วันละครั้ง?

template นี้ตั้งเป็น **real-time แบบประหยัด** อยู่แล้ว:
- ทุกครั้งที่เปิดหน้า/กดรีเฟรช เว็บจะดึงราคาล่าสุดจาก Finnhub
- ผลลัพธ์ถูก cache ที่ Vercel 60 วินาที (กันยิง API ถี่เกินจนเกินลิมิต)

อยากให้เด้งเองทุก X วินาที? เพิ่มบรรทัดนี้ก่อน `</script>` ใน `index.html`:
```js
setInterval(() => loadData(true), 60000); // รีเฟรชทุก 60 วิ
```

ถ้าอยากแค่ **วันละครั้ง** (ประหยัด API สุด) ใช้ Vercel Cron: สร้าง `vercel.json` เพิ่ม `"crons"` ให้รัน `/api/data` ตอนเช้า แล้วเก็บผลลง storage — แต่สำหรับ dashboard ส่วนตัว โหมด real-time ประหยัดด้านบนเพียงพอและง่ายกว่ามาก

---

## 🖥️ ทดสอบบนเครื่องก่อน deploy

เปิดด้วย Local server (ห้ามเปิดไฟล์ตรงๆ เพราะ browser บล็อกการอ่าน json):
```bash
cd stock-dashboard
python -m http.server 8000
# เปิด http://localhost:8000
```
จะเห็น **โหมดตัวอย่าง** (จุดสีส้ม) ใช้ข้อมูลจาก `sample-data.json` — พอ deploy บน Vercel แล้วจะสลับเป็นข้อมูลจริงเอง

---

## ⚠️ หมายเหตุเรื่องข้อมูล

- Finnhub ฟรีให้ครบ: ราคา, P/E, P/B, P/S, Dividend Yield, ROE, Net Margin
- บาง metric เช่น **Forward P/E, PEG, EV/EBITDA, EV/Sales** ในแพ็กฟรีอาจไม่มี (จะขึ้น "—") — ถ้าต้องการครบ อัปเป็นแพ็กเสียเงิน หรือเสริมแหล่งข้อมูลอื่น (บอกผมได้ เดี๋ยวต่อให้)
- ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน

## 🌐 ใช้โดเมนตัวเอง
ใน Vercel → Project → Settings → Domains → เพิ่มโดเมน เช่น `dashboard.earthdefire.com` แล้วตั้งค่า DNS ตามที่ Vercel บอก
