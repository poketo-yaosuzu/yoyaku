const GAS_URL = "https://script.google.com/macros/s/AKfycbzsYvMDaXk_HxPu-2L_3NTEiVQYpQI2lD5I-Max8mJCxUbkARorfrD8Xhrsm4lV7gFmJQ/exec";

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

// 商品リスト表示
const productListDiv = document.getElementById("productList");
products.forEach((p, i) => {
  const div = document.createElement("div");
  div.innerHTML = `
    <label>
      <input type="number" min="0" value="0" data-index="${i}" class="productQty">
      ${p.name}（${p.price}）
    </label>
  `;
  productListDiv.appendChild(div);
});

// 合計計算
function updateTotal() {
  const qtys = document.querySelectorAll(".productQty");
  let total = 0;
  qtys.forEach(q => {
    const i = q.dataset.index;
    total += Number(q.value) * products[i].price;
  });
  document.getElementById("total").value = total;
}
document.querySelectorAll(".productQty").forEach(el => {
  el.addEventListener("input", updateTotal);
});

// 受取日制限（3日後から）
const pickupDateInput = document.getElementById("pickupDate");
const today = new Date();
today.setDate(today.getDate() + 3);
pickupDateInput.min = today.toISOString().split("T")[0];

// 受取時間制限（11:00〜18:00、30分刻み）
const pickupTimeSelect = document.getElementById("pickupTime");
for (let h = 11; h <= 18; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 18 && m > 0) continue;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const opt = document.createElement("option");
    opt.value = `${hh}:${mm}`;
    opt.textContent = `${hh}:${mm}`;
    pickupTimeSelect.appendChild(opt);
  }
}

// フォーム送信
document.getElementById("reservationForm").addEventListener("submit", e => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // 商品リスト
  let productDetails = [];
  let total = 0;
  document.querySelectorAll(".productQty").forEach(q => {
    const i = q.dataset.index;
    if (Number(q.value) > 0) {
      productDetails.push(`${products[i].name}×${q.value}`);
      total += products[i].price * Number(q.value);
    }
  });

  if (productDetails.length === 0) {
    alert("商品を1つ以上選択してください");
    return;
  }

  data.products = productDetails.join("、");
  data.total = total;

  fetch(GAS_URL, {
    method: "POST",
    body: new URLSearchParams(data)
  })
    .then(res => res.text())
    .then(txt => {
      alert("予約を送信しました: " + txt);
      e.target.reset();
      document.getElementById("total").value = "";
    })
    .catch(err => alert("エラー: " + err));
});

