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

function addProductRow() {
  const row = document.createElement("div");
  row.classList.add("product-row");

  const select = document.createElement("select");
  select.innerHTML = `
    <option value="">商品を選択</option>
    <option value="【葵】５人前" data-price="7800">【葵】５人前 7,800</option>
    <option value="【葵】４人前" data-price="6240">【葵】４人前 6,240</option>
    <option value="【宴】５人前" data-price="6800">【宴】５人前 6,800</option>
    <option value="【宴】４人前" data-price="5400">【宴】４人前 5,400</option>
    <option value="【渚】５人前" data-price="5000">【渚】５人前 5,000</option>
    <option value="【渚】４人前" data-price="4000">【渚】４人前 4,000</option>
    <option value="【雅】１人前" data-price="1580">【雅】１人前 1,580</option>
    <option value="助六盛合わせ" data-price="3000">助六盛合わせ 3,000</option>
    <option value="てまり" data-price="3800">てまり 3,800</option>
    <option value="オードブル【大】" data-price="5000">オードブル【大】 5,000</option>
    <option value="オードブル【中】" data-price="3000">オードブル【中】 3,000</option>
    <option value="サンドイッチ" data-price="2800">サンドイッチ 2,800</option>
    <option value="折箱入りおはぎ" data-price="800">折箱入りおはぎ 800</option>
  `;

  const qty = document.createElement("input");
  qty.type = "number";
  qty.min = "1";       // ★ 最低 1
  qty.value = "1";     // ★ 初期値 1

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "削除";
  removeBtn.addEventListener("click", () => row.remove());

  row.appendChild(select);
  row.appendChild(qty);
  row.appendChild(removeBtn);

  document.getElementById("products").appendChild(row);
}

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
    
    // 商品が未選択ならスキップ
    if (!select.value || select.value === "") return;

    const price = parseInt(select.options[select.selectedIndex].dataset.price, 10) || 0;
    const quantity = parseInt(qty.value, 10) || 0;

    if (quantity >= 1) {
  const subtotal = price * quantity;
  total += subtotal;
  productDetails.push(`${select.value} ×${quantity}`);
}
  });

  // 合計表示を更新
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
document.getElementById("reservationForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const { productDetails, total } = updateTotal();

  // ★ 商品未選択チェック
  if (!productDetails || productDetails.length === 0) {
    alert("商品を1つ以上選んでください");
    return;
  }

  const data = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    store: document.getElementById("store").value,
    pickupDate: document.getElementById("pickupDate").value,
    pickupTime: document.getElementById("pickupTime").value,
    products: productDetails.join("\n"),
    total: total,
    memo: document.getElementById("memo").value
  };

  fetch(GAS_URL, {
    method: "POST",
    body: new URLSearchParams(data)
  })
  .then(res => res.json())
  .then(res => {
    if (res.result === "success") {
      // 完了ページへ遷移
      const query = new URLSearchParams({
        id: res.id,
        ...data
      }).toString();
      window.location.href = "confirm.html?" + query;
    } else {
      alert("エラー: " + res.message);
    }
  })
  .catch(err => alert("通信エラー: " + err));
});

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
