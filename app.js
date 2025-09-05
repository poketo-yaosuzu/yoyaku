function setEnv() {
  PropertiesService.getScriptProperties().setProperty("LIFF_ID", "2007937055-Za6zOL4e");
}

// 商品リスト
const products = [
  { name: "【葵】５人前", price: 7800 },
  { name: "【葵】４人前", price: 6240 },
  { name: "【宴】５人前", price: 6800 },
  { name: "【宴】４人前", price: 5400 },
  { name: "【渚】５人前", price: 5000 },
  { name: "【渚】４人前", price: 4000 },
  { name: "【雅】１人前", price: 1580 },
  { name: "助六盛合わせ", price: 3000 },
  { name: "てまり", price: 3800 },
  { name: "オードブル【大】", price: 5000 },
  { name: "オードブル【中】", price: 3000 },
  { name: "サンドイッチ", price: 2800 },
  { name: "折箱入りおはぎ", price: 800 }
];

// 商品リストを表示
const productContainer = document.getElementById("products");
products.forEach((p, i) => {
  const div = document.createElement("div");
  div.classList.add("product-item");
  div.innerHTML = `
    <label>
      ${p.name} (${p.price}円)
      <input type="number" name="product_${i}" min="0" value="0">
    </label>
  `;
  productContainer.appendChild(div);
});

// 合計金額計算
const totalPriceEl = document.getElementById("totalPrice");
productContainer.addEventListener("input", updateTotal);

function updateTotal() {
  let total = 0;
  document.querySelectorAll("#products input").forEach((input, i) => {
    const qty = parseInt(input.value) || 0;
    total += qty * products[i].price;
  });
  totalPriceEl.textContent = total;
}

// 受取日（3日後以降）
const pickupDate = document.getElementById("pickupDate");
const today = new Date();
today.setDate(today.getDate() + 3);
pickupDate.min = today.toISOString().split("T")[0];

// 受取時間（11:00〜18:00まで30分刻み）
const pickupTime = document.getElementById("pickupTime");
for (let h = 11; h <= 18; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 18 && m > 0) continue;
    const timeStr = `${("0"+h).slice(-2)}:${("0"+m).slice(-2)}`;
    const opt = document.createElement("option");
    opt.value = timeStr;
    opt.textContent = timeStr;
    pickupTime.appendChild(opt);
  }
}

// フォーム送信
document.getElementById("reservationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  let items = [];
  let total = 0;

  document.querySelectorAll("#products input").forEach((input, i) => {
    const qty = parseInt(input.value) || 0;
    if (qty > 0) {
      items.push(`${products[i].name} × ${qty}`);
      total += qty * products[i].price;
    }
  });

  if (items.length === 0) {
    alert("商品を1つ以上選択してください。");
    return;
  }

  const data = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    store: formData.get("store"),
    date: formData.get("date"),
    time: formData.get("time"),
    items: items.join("\n"),
    total: total,
    note: formData.get("note")
  };

  const scriptURL = "https://script.google.com/macros/s/AKfycbx4iqTAwOdr99pKHuAgRzH6G0-1gsPNlffFQQtUIGYFBWvlILlzJGnE6yIlnKua5nBhzQ/exec"; // 公開URLを設定
  const res = await fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams(data)
  });

  if (res.ok) {
    alert("予約が送信されました。ありがとうございます！");
    e.target.reset();
    updateTotal();
  } else {
    alert("送信エラーが発生しました。");
  }
});


