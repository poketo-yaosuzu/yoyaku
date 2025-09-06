const GAS_URL = "https://script.google.com/macros/s/AKfycbzPbS23lntPHdU7SLNCP5GhXCwlCSntiv5mOsJHSJz5cnRafMTUQ1jABE_HCjZC6cgLJw/exec";

function setEnv() {
  PropertiesService.getScriptProperties().setProperty("LIFF_ID", "2007937055-Za6zOL4e");
}

const productList = [
  { name: "【葵】5人前", price: 7800 },
  { name: "【葵】4人前", price: 6240 },
  { name: "【宴】5人前", price: 6800 },
  { name: "【宴】4人前", price: 5400 },
  { name: "【渚】5人前", price: 5000 },
  { name: "【渚】4人前", price: 4000 },
  { name: "【雅】1人前", price: 1580 },
  { name: "助六盛合わせ", price: 3000 },
  { name: "てまり", price: 3800 },
  { name: "オードブル【大】", price: 5000 },
  { name: "オードブル【中】", price: 3000 },
  { name: "サンドイッチ", price: 2800 },
  { name: "折箱入りおはぎ", price: 800 }
];

const productsDiv = document.getElementById("products");
const addProductBtn = document.getElementById("addProductBtn");

// 商品選択行を作成
function createProductRow() {
  const row = document.createElement("div");
  row.className = "product-row";

  const select = document.createElement("select");
  select.innerHTML = `<option value="">商品を選択</option>` +
    productList.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name} (${p.price}円)</option>`).join("");

  const qty = document.createElement("input");
  qty.type = "number";
  qty.min = "1";
  qty.value = "1";
  qty.style.width = "60px";

  // 削除ボタン
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "削除";
  removeBtn.addEventListener("click", () => {
    row.remove();
    updateTotal();
  });

  row.appendChild(select);
  row.appendChild(document.createTextNode(" 数量: "));
  row.appendChild(qty);
  row.appendChild(removeBtn);

  productsDiv.appendChild(row);

  select.addEventListener("change", updateTotal);
  qty.addEventListener("input", updateTotal);
}

// 合計金額を更新
function updateTotal() {
  let total = 0;
  const productDetails = [];
  const rows = productsDiv.querySelectorAll(".product-row");

  rows.forEach(row => {
    const select = row.querySelector("select");
    const qty = row.querySelector("input[type=number]");
    const selectedOption = select.options[select.selectedIndex];
    if (select.value && qty.value > 0) {
      const price = parseInt(selectedOption.dataset.price, 10);
      const subtotal = price * parseInt(qty.value, 10);
      total += subtotal;
      productDetails.push(`${select.value} ×${qty.value}`);
    }
  });

  document.getElementById("total").textContent = total;
  return { productDetails, total };
}

// 初期状態で1行表示
createProductRow();
addProductBtn.addEventListener("click", createProductRow);

// 受取日を3日後からに制限
const pickupDateInput = document.getElementById("pickupDate");
const today = new Date();
today.setDate(today.getDate() + 3);
pickupDateInput.min = today.toISOString().split("T")[0];

// 受取時間を11:00〜18:00 30分刻み
const pickupTimeSelect = document.getElementById("pickupTime");
for (let h = 11; h <= 18; h++) {
  for (let m of [0, 30]) {
    if (h === 18 && m > 0) continue;
    const time = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    const opt = document.createElement("option");
    opt.value = time;
    opt.textContent = time;
    pickupTimeSelect.appendChild(opt);
  }
}

// フォーム送信
document.getElementById("reservationForm").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    phone: form.phone.value,
    store: form.store.value,
    pickupDate: form.pickupDate.value,
    pickupTime: form.pickupTime.value,
    memo: form.memo.value
  };

  // 商品まとめ
  let productDetails = [];
  let total = 0;
  document.querySelectorAll(".productQty").forEach(q => {
    const i = q.dataset.index;
    if (Number(q.value) > 0) {
      productDetails.push(`${products[i].name} ×${q.value}`);
      total += products[i].price * Number(q.value);
    }
  });

  if (productDetails.length === 0) {
    alert("商品を1つ以上選択してください");
    return;
  }

  data.products = productDetails.join("\n"); // 改行区切り
  data.total = total;

  fetch(GAS_URL, {
    method: "POST",
    body: new URLSearchParams(data)
  })
    .then(res => res.json())
    .then(res => {
  if (res.result === "success") {
    // 予約番号と入力内容を次のページに渡す
    const query = new URLSearchParams({
      id: res.id,
      name: data.name,
      phone: data.phone,
      store: data.store,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      products: data.products,
      total: data.total,
      memo: data.memo
    }).toString();

    window.location.href = "confirm.html?" + query;
  } else {
    alert("エラー: " + res.message);
  }
})
    .catch(err => alert("通信エラー: " + err));
});
