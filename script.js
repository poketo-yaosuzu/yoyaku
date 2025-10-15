const GAS_URL = "https://script.google.com/macros/s/AKfycbyoR4pJ3QQbnWdvmpibSw4JpqctswehX0wCqiVqIRQUtu9IKlKIEfL4hg7AtxkXgGJKow/exec";

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
   * 🗓 定休日データ取得（GASから）
   ***************/
  let CLOSED_DAYS = [];
  let HOLIDAYS = [];

  async function loadClosedDays() {
    try {
      const res = await fetch(GAS_URL + "?action=getClosedDays");
      const data = await res.json();
      CLOSED_DAYS = data.weekdays || [];
      HOLIDAYS = data.holidays || [];
      console.log("取得した定休日:", data);
    } catch (err) {
      console.error("定休日データ取得エラー:", err);
    }
  }

  // ✅ この位置で await 呼び出し（OK）
  await loadClosedDays();

  /***************
   * 🕓 受取日・時間設定
   ***************/
  const today = new Date();
  today.setDate(today.getDate() + 3);

  let firstAvailable = new Date(today);
  while (CLOSED_DAYS.includes(firstAvailable.getDay()) ||
        HOLIDAYS.includes(firstAvailable.toISOString().split("T")[0])) {
    firstAvailable.setDate(firstAvailable.getDate() + 1);
  }
  pickupDate.min = firstAvailable.toISOString().split("T")[0];

  /***************
 * 🚫 定休日（特定日）を取得して反映
 ***************/
try {
  const res = await fetch(GAS_URL + "?action=getClosedDays");
  const { holidays } = await res.json();
  console.log("定休日（特定日）:", holidays);

  pickupDate.addEventListener("input", (e) => {
    const dateStr = e.target.value;
    if (holidays.includes(dateStr)) {
      alert("この日は定休日のため選択できません。");
      e.target.value = ""; // 選択をクリア
    }
  });
} catch (err) {
  console.error("定休日の取得に失敗:", err);
}

  // 受取時間設定
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
    qty.style.width = "3em"; // 👈 2桁が見える程度に小さく
    qty.style.textAlign = "center";

    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "✖ 削除";
    rm.style.background = "#f80101";
    rm.style.border = "none";
    rm.style.borderRadius = "6px";
    rm.style.padding = "4px 8px";
    rm.style.cursor = "pointer";

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

  if (!userId) {
    alert("LINEユーザーIDが取得できませんでした。LINEアプリから開いてください。");
  }
} catch (err) {
  console.error("LIFF初期化エラー:", err);
}

  /***************
   * 📤 フォーム送信処理
   ***************/
document.getElementById("reservationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // 🧩 LINE連携チェック
  if (!userId) {
    alert("LINEログイン情報が確認できません。LINEアプリから再度開いてください。");
    return;
  }
  
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
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(data)
      });

      const result = await res.json();
      modal.style.display = "none";

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
      } else {
        alert("エラー: " + result.message);
      }
    } catch (err) {
      modal.style.display = "none";
      alert("通信エラー: " + err.message);
    }
  });
});
