const GAS_URL = "https://script.google.com/macros/s/AKfycbzPbS23lntPHdU7SLNCP5GhXCwlCSntiv5mOsJHSJz5cnRafMTUQ1jABE_HCjZC6cgLJw/exec";

function setEnv() {
  PropertiesService.getScriptProperties().setProperty("LIFF_ID", "2007937055-Za6zOL4e");
}

// 商品リスト
const PRODUCTS = [
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

document.addEventListener("DOMContentLoaded", () => {
  const productsDiv = document.getElementById("products");
  const addProductBtn = document.getElementById("addProductBtn");

  // 商品行追加
  function addProductRow() {
    const row = document.createElement("div");
    row.className = "product-row";

    const sel = document.createElement("select");
    sel.required = true;
    sel.innerHTML = `<option value="">商品を選択</option>` +
      PRODUCTS.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name} ${p.price}</option>`).join("");

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "1";
    qty.value = "1";

    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "削除";
    rm.addEventListener("click", () => {
      row.remove();
      updateTotal();
    });

    [sel, qty].forEach(el => el.addEventListener("change", updateTotal));

    row.appendChild(sel);
    row.appendChild(qty);
    row.appendChild(rm);

    productsDiv.appendChild(row);
  }

  // 合計金額更新
  function updateTotal() {
    let total = 0;
    const rows = productsDiv.querySelectorAll(".product-row");
    rows.forEach(row => {
      const select = row.querySelector("select");
      const qty = row.querySelector("input[type=number]");
      if (select.value) {
        const price = parseInt(select.options[select.selectedIndex].dataset.price, 10);
        const quantity = parseInt(qty.value, 10);
        total += price * quantity;
      }
    });
    document.getElementById("total").textContent = total;
  }

  // 初期表示
  addProductRow();
  addProductBtn.addEventListener("click", addProductRow);

  // 受取日：今日から3日後以降
  const pickupDate = document.getElementById("pickupDate");
  const today = new Date();
  today.setDate(today.getDate() + 3);
  pickupDate.min = today.toISOString().split("T")[0];

  // 受取時間：11:00〜18:00 (30分刻み)
  const pickupTime = document.getElementById("pickupTime");
  for (let h = 11; h <= 18; h++) {
    for (let m of [0, 30]) {
      if (h === 18 && m > 0) continue;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = `${hh}:${mm}`;
      opt.textContent = `${hh}:${mm}`;
      pickupTime.appendChild(opt);
    }
  }

  // 送信処理
  document.getElementById("reservationForm").addEventListener("submit", function(e) {
    e.preventDefault();

    // 商品が選択されているか確認
    const rows = productsDiv.querySelectorAll(".product-row");
    let productDetails = [];
    rows.forEach(row => {
      const select = row.querySelector("select");
      const qty = row.querySelector("input[type=number]");
      if (select.value) {
        productDetails.push(`${select.value} ×${qty.value}`);
      }
    });
    if (productDetails.length === 0) {
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
      total: document.getElementById("total").textContent,
      memo: document.getElementById("memo").value
    };

    fetch(GAS_URL, {
      method: "POST",
      body: new URLSearchParams(data)
    })
    .then(res => res.json())
    .then(res => {
      if (res.result === "success") {
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
});

