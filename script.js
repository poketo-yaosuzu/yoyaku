const GAS_URL = "https://script.google.com/macros/s/AKfycbydiE4I-Q6t58xEbnbxEvlJMeHsqKooDvGu0AXxIlq9Iuz5uVn5gWqpc7aqrOGwTixuwg/exec";

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
  let liffId = "";

  /***************
   * 定休日データ取得
   ***************/
  let CLOSED_DAYS = [];
  let HOLIDAYS = [];

  async function loadClosedDays() {
    try {
      const res = await fetch(GAS_URL + "?action=getClosedDays");
      const data = await res.json();
      CLOSED_DAYS = data.weekdays || [];
      HOLIDAYS = data.holidays || [];
    } catch (err) {
      console.error("定休日データ取得エラー:", err);
    }
  }
  await loadClosedDays();

  /***************
   * 受取日・時間設定
   ***************/
  const today = new Date();
  today.setDate(today.getDate() + 3);
  let firstAvailable = new Date(today);
  while (CLOSED_DAYS.includes(firstAvailable.getDay()) ||
        HOLIDAYS.includes(firstAvailable.toISOString().split("T")[0])) {
    firstAvailable.setDate(firstAvailable.getDate() + 1);
  }
  pickupDate.min = firstAvailable.toISOString().split("T")[0];

  // 受取時間（11:00～18:00、30分刻み）
  for (let h = 11; h <= 18; h++) {
    for (let m of [0, 30]) {
      if (h === 18 && m > 0) continue;
      const opt = document.createElement("option");
      opt.value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      opt.textContent = `${h}時${m === 0 ? "" : m + "分"}`;
      pickupTime.appendChild(opt);
    }
  }

  /***************
   * 商品追加
   ***************/
  function addProductRow() {
    const row = document.createElement("div");
    row.className = "product-row";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";

    const sel = document.createElement("select");
    sel.required = true;
    sel.innerHTML = `<option value="">商品を選択</option>` +
      PRODUCTS.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name} ${p.price}円</option>`).join("");

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "1";
    qty.value = "1";
    qty.style.width = "3em";
    qty.style.textAlign = "center";

    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "✖ 削除";
    rm.style.background = "#f80101";
    rm.style.border = "none";
    rm.style.borderRadius = "6px";
    rm.style.padding = "4px 8px";
    rm.style.cursor = "pointer";
    rm.addEventListener("click", () => { row.remove(); updateTotal(); });

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
      if (select.value) total += parseInt(select.selectedOptions[0].dataset.price) * parseInt(qty.value);
    });
    document.getElementById("total").textContent = total;
  }

  /***************
   * LIFF 初期化
   ***************/
  async function initLiff() {
    try {
      // GASからLIFF ID取得
      const res = await fetch(GAS_URL + "?action=getLiffId");
      const data = await res.json();
      liffId = data.liffId || "";
      if (!liffId) { alert("LIFF IDが取得できません。"); return; }

      await liff.init({ liffId });
      if (!liff.isLoggedIn()) { liff.login(); return; }

      const profile = await liff.getProfile();
      userId = profile.userId || "";
      if (!userId) alert("LINEユーザーIDが取得できません。LINEアプリから開いてください。");
    } catch (err) {
      console.error("LIFF初期化エラー:", err);
    }
  }
  await initLiff();

  /***************
   * フォーム送信
   ***************/
  document.getElementById("reservationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!userId) { alert("LINEログイン情報が確認できません。"); return; }

    const rows = productsDiv.querySelectorAll(".product-row");
    const products = [];
    rows.forEach(row => {
      const sel = row.querySelector("select");
      const qty = row.querySelector("input[type=number]");
      if (sel.value) products.push(`${sel.value} ×${qty.value}`);
    });

    if (products.length === 0) { alert("商品を1つ以上選んでください"); return; }

    const data = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      store: document.getElementById("store").value,
      pickupDate: pickupDate.value,
      pickupTime: pickupTime.value,
      products: products.join("\n"),
      total: document.getElementById("total").textContent,
      memo: document.getElementById("memo").value,
      userId
    };

    const modal = document.getElementById("loadingModal");
    modal.style.display = "flex";

    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data)
      });
      const result = await res.json();
      modal.style.display = "none";

      if (result.result === "success") {
        alert("ご予約を受け付けました！LINEにも確認メッセージをお送りします。");

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
      } else {
        alert("エラー: " + result.message);
      }
    } catch (err) {
      modal.style.display = "none";
      alert("通信エラー: " + err.message);
    }
  });
});
