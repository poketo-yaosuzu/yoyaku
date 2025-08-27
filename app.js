// ====== 設定 ======
const GAS_URL = "https://script.google.com/macros/s/AKfycbytt5oXfScFPHO3_4H3HQVdkfdphA_ZRx2_b20bh-5cz4u2w0FGfBUc1ISQyFFmdfrK7g/exec";
const LIFF_ID = "2007937055-Za6zOL4e"; // ★いただいたLIFF ID

// 商品マスタ（前回と同じ）
const productsData = [
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

const productsContainer = document.getElementById("products");
const totalDisplay = document.getElementById("total");
const totalInput = document.getElementById("totalInput");
const addProductBtn = document.getElementById("addProductBtn");

const liffUserIdInput = document.getElementById("liffUserId");
const liffDisplayNameInput = document.getElementById("liffDisplayName");

// --- 初期化 ---
window.addEventListener("DOMContentLoaded", async () => {
  // 受取日：今日+3日
  const dateInput = document.getElementById("date");
  const base = new Date();
  base.setDate(base.getDate() + 3);
  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;

  // 受取時間：11:00〜18:00、30分刻み
  const timeInput = document.getElementById("time");
  timeInput.min = "11:00";
  timeInput.max = "18:00";
  timeInput.step = 1800;

  // 初期1行
  addProductRow();

  // ▼ 追加：LIFF初期化
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      // ミニアプリ（LINE内）なら自動ログイン不要だが、外部ブラウザならログイン誘導
      liff.login();
      return; // ログイン後に戻る
    }
    const profile = await liff.getProfile();
    // hiddenに保持（シートへ保存用）
    liffUserIdInput.value = profile.userId || "";
    liffDisplayNameInput.value = profile.displayName || "";

    // 氏名が未入力ならLINEの表示名をセット（編集は可能）
    const nameField = document.querySelector('input[name="name"]');
    if (nameField && !nameField.value) {
      nameField.value = profile.displayName || "";
    }
  } catch (e) {
    console.warn("LIFF初期化エラー:", e);
    // 失敗してもフォームは通常どおり使えるようにする
  }
});

addProductBtn.addEventListener("click", addProductRow);

function addProductRow() {
  const row = document.createElement("div");
  row.className = "product-row";

  const select = document.createElement("select");
  select.name = "product[]";
  select.required = true;
  productsData.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = `${p.name}（${p.price.toLocaleString()}円）`;
    opt.dataset.price = String(p.price);
    select.appendChild(opt);
  });

  const qty = document.createElement("input");
  qty.type = "number";
  qty.name = "quantity[]";
  qty.min = 1;
  qty.value = 1;
  qty.required = true;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.textContent = "削除";
  remove.addEventListener("click", () => {
    row.remove();
    updateTotal();
  });

  select.addEventListener("change", updateTotal);
  qty.addEventListener("input", updateTotal);

  row.appendChild(select);
  row.appendChild(qty);
  row.appendChild(remove);

  productsContainer.appendChild(row);
  updateTotal();
}

function updateTotal() {
  let total = 0;
  const rows = productsContainer.querySelectorAll(".product-row");
  rows.forEach(row => {
    const sel = row.querySelector("select");
    const qty = row.querySelector('input[type="number"]');
    const price = Number(sel.selectedOptions[0].dataset.price || 0);
    const q = Math.max(0, Number(qty.value || 0));
    total += price * q;
  });
  totalDisplay.textContent = `合計金額: ${total.toLocaleString()}円`;
  totalInput.value = String(total); // 円なし数値
}

// --- 送信処理 ---
document.getElementById("reservationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // 商品必須チェック
  const rows = productsContainer.querySelectorAll(".product-row");
  if (rows.length === 0) {
    alert("商品を1つ以上追加してください。");
    return;
  }
  for (const row of rows) {
    const sel = row.querySelector("select");
    const qty = row.querySelector('input[type="number"]');
    if (!sel.value || Number(qty.value) <= 0) {
      alert("商品と数量を正しく入力してください。");
      return;
    }
  }

  const form = e.currentTarget;
  const formData = new FormData(form);

  try {
    const res = await fetch(GAS_URL, { method: "POST", body: formData });
    await res.text();
    alert("予約を送信しました。ありがとうございました！");

    // LIFF内なら画面を閉じるなどのオプション（任意）
    // if (liff.isInClient()) { liff.closeWindow(); }

    form.reset();
    productsContainer.innerHTML = "";
    addProductRow();
    updateTotal();
  } catch (err) {
    alert("送信エラー：" + err);
  }
});
