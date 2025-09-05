const GAS_URL_READ = "https://script.google.com/macros/s/AKfycbzq6aJ2Vq6GAlzoLVJu5frjSKWFE72Ww84qs6WKDS1ulqTx0xlEdpyimCBT1d5L7tmxtw/exec"; // doGetでJSONを返す

const storeFilter = document.getElementById("storeFilter");
const dateFilter = document.getElementById("dateFilter");
const reloadBtn = document.getElementById("reloadBtn");
const tbody = document.querySelector("#reservationTable tbody");

reloadBtn.addEventListener("click", loadData);
window.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  tbody.innerHTML = `<tr><td colspan="9">読み込み中...</td></tr>`;
  try {
    const res = await fetch(GAS_URL_READ);
    const json = await res.json();
    const data = json.data || [];

    // フィルタ
    let filtered = data;
    if (storeFilter.value) {
      filtered = filtered.filter(r => r["受取店舗"] === storeFilter.value);
    }
    if (dateFilter.value) {
      filtered = filtered.filter(r => r["受取日"] === dateFilter.value);
    }

    // 表示
    tbody.innerHTML = "";
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9">該当データがありません</td></tr>`;
      return;
    }

    filtered.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${safe(r["予約番号"])}</td>
        <td style="white-space: pre-line">${safe(r["注文内容"])}</td>
        <td>${Number(r["合計金額"] || 0).toLocaleString()}円</td>
        <td>${safe(r["受取店舗"])}</td>
        <td>${safe(r["受取日"])}</td>
        <td>${safe(r["受取時間"])}</td>
        <td>${safe(r["氏名"])}</td>
        <td>${safe(r["電話番号"])}</td>
        <td>${safe(r["備考"] || "")}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9">読み込みエラー：${e}</td></tr>`;
  }
}

function safe(v) {
  return (v ?? "").toString().replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[s]));
}





