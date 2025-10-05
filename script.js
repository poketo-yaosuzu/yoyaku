const GAS_URL = "https://script.google.com/macros/s/AKfycbyrVYR14bb_PlMbo-yK0sGAc_hJ0Pvyul0AxnCwGWk1C7zFDIGMnVPaDTjZmrCxPUqkQg/exec";

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

document.addEventListener("DOMContentLoaded", async () => {
  const productsDiv = document.getElementById("products");
  const addProductBtn = document.getElementById("addProductBtn");
  const pickupTime = document.getElementById("pickupTime");
  const pickupDate = document.getElementById("pickupDate");
  let userId = "";

  /***************
   * 🕓 受取日・時間設定
   ***************/
  const today = new Date();
  today.setDate(today.getDate() + 3);
  pickupDate.min = today.toISOString().split("T")[0];

  for (let h = 11; h <= 18; h++) {
    for (let m of [0, 30]) {
      if (h === 18 && m > 0) continue;
      const opt = document.createElement("option");
      opt.value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      opt.textContent = opt.value;
      pickupTime.appendChild(opt);
    }
  }

  /***************
   * 🛍 商品追加
   ***************/
  function addProductRow() {
    const row = document.createElement("div");
    row.className = "product-row";

    const sel = document.createElement("select");
    sel.required = true;
    sel.innerHTML = `<option value="">商品を選択</option>` +
      PRODUCTS.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name} ${p.price}円</option>`).join("");

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "1";
    qty.value = "1";

    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "✖ 削除";
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

  addProductBtn.addEventListener("click", addProductRow);

  function updateTotal() {
    let total = 0;
    const rows = productsDiv.querySelectorAll(".product-row");
    rows.forEach(row => {
      const select = row.querySelector("select");
      const qty = row.querySelector("input[type=number]");
      if (select.value) {
        const price = parseInt(select.selectedOptions[0].dataset.price);
        total += price * parseInt(qty.value);
      }
    });
    document.getElementById("total").textContent = total;
  }

  /***************
   * 💬 LIFF 初期化
   ***************/
  try {
  await liff.init({ liffId: "2007937057-4bzK6wWZ" });

  if (!liff.isLoggedIn()) {
    liff.login();
    return; // ← ログイン直後は再読み込みが必要なので、ここで止める！
  }

  const profile = await liff.getProfile();
  userId = profile.userId || "";
  console.log("取得したuserId:", userId);
} catch (err) {
  console.error("LIFF初期化エラー:", err);
}

  /***************
   * 📤 フォーム送信処理
   ***************/
  document.getElementById("reservationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const rows = productsDiv.querySelectorAll(".product-row");
    const products = [];
    rows.forEach(row => {
      const sel = row.querySelector("select");
      const qty = row.querySelector("input[type=number]");
      if (sel.value) products.push(`${sel.value} ×${qty.value}`);
    });

    if (products.length === 0) {
      alert("商品を1つ以上選んでください");
      return;
    }

    const data = {
      name: name.value,
      phone: phone.value,
      store: store.value,
      pickupDate: pickupDate.value,
      pickupTime: pickupTime.value,
      products: products.join("\n"),
      total: total.textContent,
      memo: memo.value,
      userId
    };

    const modal = document.getElementById("loadingModal");
    modal.style.display = "flex";

    try {
     const res = await fetch(GAS_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: new URLSearchParams(data)
});
      const result = await res.json();
      modal.style.display = "none";

      if (result.result === "success") {
        alert("ご予約を受け付けました！LINEにも確認メッセージをお送りします。");
        if (result.result === "success") {
  alert("ご予約を受け付けました！LINEにも確認メッセージをお送りします。");

  // URLパラメータを丁寧にエンコードして渡す
  const params = new URLSearchParams({
    id: result.id,
    name: data.name,
    phone: data.phone,
    store: data.store,
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
    products: data.products,
    total: data.total,
    memo: data.memo
  });

  window.location.href = "confirm.html?" + params.toString();
}
      } else {
        alert("エラー: " + result.message);
      }
    } catch (err) {
      modal.style.display = "none";
      alert("通信エラー: " + err.message);
    }
  });
});
