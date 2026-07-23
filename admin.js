// ==========================================
// CONFIG & VARIABLE GLOBAL
// ==========================================
const token = localStorage.getItem("adminToken");

// Jika belum login, arahkan ke halaman login
if (!token) {
  alert("Anda harus login terlebih dahulu!");
  window.location.href = "login.html";
}

const scriptURL = "https://script.google.com/macros/s/AKfycbwWwrJSxcymnkMaiVGfDPyq836JYU7Oc3sNi9-CyxyEZw8XCjZjqbwVayqVdYAMzkRM3w/exec";

let data = [];
let chartJenjangInstance = null;

// Tampilkan nama admin jika tersimpan di localStorage
document.addEventListener("DOMContentLoaded", () => {
  const savedName = localStorage.getItem("adminName");
  if (savedName && document.getElementById("adminNameDisplay")) {
    document.getElementById("adminNameDisplay").innerText = savedName;
  }
  loadDataFromAppScript();
});

// ==========================================
// AMBIL DATA DARI GOOGLE APPS SCRIPT
// ==========================================
function loadDataFromAppScript() {
  fetch(`${scriptURL}?token=${token}`)
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "error") {
        alert("Sesi login berakhir/tidak valid: " + result.message);
        localStorage.removeItem("adminToken");
        window.location.href = "login.html";
        return;
      }

      if (Array.isArray(result)) data = result;
      else if (result && Array.isArray(result.data)) data = result.data;
      else if (result && Array.isArray(result.result)) data = result.result;
      else data = [];

      tampilkanData(data);
      updateStatistik(data);
      hitungStatistik(data);
      renderRecentData(data);
    })
    .catch((err) => {
      console.error("Gagal mengambil data:", err);
    });
}

// ==========================================
// RENDER TABEL UTAMA & RECENT
// ==========================================
function tampilkanData(listData) {
  const tableBody = document.getElementById("tableData");
  if (!tableBody) return;

  if (!listData || listData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="11" class="text-center py-3 text-muted">Tidak ada data pendaftaran.</td></tr>`;
    return;
  }

  let html = "";
  listData.forEach((item, index) => {
    html += `
      <tr>
          <td>${index + 1}</td>
          <td class="fw-bold">${item.nama || "-"}</td>
          <td><span class="badge bg-secondary">${(item.jenjang || "-").toUpperCase()}</span></td>
          <td>${item.sekolah || "-"}</td>
          <td>${item.kelas || "-"}</td>
          <td>${item.umur || "-"} Thn</td>
          <td>${item.tempatLahir || "-"}</td>
          <td>${item.tanggalLahir || "-"}</td>
          <td>${item.whatsapp || "-"}</td>
          <td>${item.alamat || "-"}</td>
          <td>${item.email || "-"}</td>
      </tr>
    `;
  });
  tableBody.innerHTML = html;
}

function renderRecentData(listData) {
  const tbody = document.getElementById("tableRecent");
  if (!tbody) return;

  if (!listData || listData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Belum ada data</td></tr>`;
    return;
  }

  const recent = listData.slice(0, 5);
  let html = "";
  recent.forEach((item) => {
    html += `
      <tr>
        <td class="fw-semibold">${item.nama || "-"}</td>
        <td><span class="badge bg-secondary">${(item.jenjang || "-").toUpperCase()}</span></td>
        <td>${item.sekolah || "-"}</td>
        <td>${item.whatsapp || "-"}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// ==========================================
// STATISTIK & CHART
// ==========================================
function updateStatistik(listData) {
  if (!listData) return;

  const total = listData.length;
  if (document.getElementById("totalPendaftar")) document.getElementById("totalPendaftar").innerText = total;
  if (document.getElementById("statTotalPendaftar")) document.getElementById("statTotalPendaftar").innerText = total;

  const rekapJenjang = {};
  let totalUmur = 0;
  let jumlahDataUmurValid = 0;

  listData.forEach((item) => {
    const jenjangText = item.jenjang ? String(item.jenjang).toUpperCase().trim() : "LAINNYA";
    if (jenjangText !== "") rekapJenjang[jenjangText] = (rekapJenjang[jenjangText] || 0) + 1;

    const umurAngka = parseInt(item.umur);
    if (!isNaN(umurAngka) && umurAngka > 0) {
      totalUmur += umurAngka;
      jumlahDataUmurValid++;
    }
  });

  const elRata = document.getElementById("rataRataUmur");
  if (elRata) {
    const rataRata = jumlahDataUmurValid > 0 ? (totalUmur / jumlahDataUmurValid).toFixed(1) : 0;
    elRata.innerText = rataRata + " Thn";
  }

  const elMax = document.getElementById("jenjangTerbanyak");
  if (elMax) {
    let jenjangMax = "-";
    let jumlahMax = 0;
    for (const [key, value] of Object.entries(rekapJenjang)) {
      if (value > jumlahMax) {
        jumlahMax = value;
        jenjangMax = key;
      }
    }
    elMax.innerText = jenjangMax;
  }

  const canvas = document.getElementById("grafikJenjang");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (chartJenjangInstance) chartJenjangInstance.destroy();

    chartJenjangInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(rekapJenjang),
        datasets: [{
          label: "Jumlah Peserta",
          data: Object.values(rekapJenjang),
          backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#0dcaf0", "#6c757d"],
          borderRadius: 8
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }
}

function hitungStatistik(listData) {
  if (!listData) return;

  let sd = 0, smp = 0, smk = 0;
  listData.forEach((item) => {
    const sekolah = item.sekolah ? String(item.sekolah).toLowerCase() : "";
    const jenjang = item.jenjang ? String(item.jenjang).toLowerCase() : "";

    if (sekolah.includes("sd") || jenjang.includes("sd")) sd++;
    else if (sekolah.includes("smp") || jenjang.includes("smp")) smp++;
    else if (sekolah.includes("smk") || sekolah.includes("smk") || jenjang.includes("smk") || jenjang.includes("smk")) smk++;
  });

  if (document.getElementById("jumlahSD")) document.getElementById("jumlahSD").innerText = sd;
  if (document.getElementById("jumlahSMP")) document.getElementById("jumlahSMP").innerText = smp;
  if (document.getElementById("jumlahSMK")) document.getElementById("jumlahSMK").innerText = smk;
}

// ==========================================
// NAVIGASI SECTION DENGAN ANIMASI HALUS
// ==========================================
function showSection(sectionId, event) {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((sec) => {
    sec.classList.remove("active-section");
  });

  const target = document.getElementById(sectionId + "-section");
  if (target) {
    target.classList.add("active-section");
  }

  // Handle tombol aktif sidebar / navbar
  const buttons = document.querySelectorAll(".sidebar-menu button, .navbar-nav button, .list-group-item");
  buttons.forEach((btn) => btn.classList.remove("active"));

  if (event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }
}

// ==========================================
// FITUR PENCARIAN, FILTER, EKSPOR & SYNC
// ==========================================
function cariAnggota() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const hasil = data.filter((item) =>
    (item.nama && item.nama.toLowerCase().includes(keyword)) ||
    (item.sekolah && item.sekolah.toLowerCase().includes(keyword))
  );
  tampilkanData(hasil);
}

function filterData(kategori, tombol) {
  document.querySelectorAll("#anggota-section .card button").forEach((btn) => {
    btn.classList.remove("btn-dark");
    btn.classList.add("btn-outline-dark");
  });
  if (tombol) {
    tombol.classList.remove("btn-outline-dark");
    tombol.classList.add("btn-dark");
  }

  if (kategori === "semua") {
    tampilkanData(data);
  } else {
    const hasil = data.filter((item) => {
      const s = (item.sekolah || "").toLowerCase();
      const j = (item.jenjang || "").toLowerCase();
      return s.includes(kategori) || j.includes(kategori);
    });
    tampilkanData(hasil);
  }
}

function eksporKeCSV() {
  if (!data || data.length === 0) return alert("Tidak ada data untuk diekspor!");
  
  let csvContent = "data:text/csv;charset=utf-8,No,Nama,Jenjang,Sekolah,Kelas,Umur,Tempat Lahir,Tanggal Lahir,WhatsApp,Alamat,Email\n";
  data.forEach((item, index) => {
    let row = [
      index + 1,
      `"${item.nama || ''}"`,
      `"${item.jenjang || ''}"`,
      `"${item.sekolah || ''}"`,
      `"${item.kelas || ''}"`,
      `"${item.umur || ''}"`,
      `"${item.tempatLahir || ''}"`,
      `"${item.tanggalLahir || ''}"`,
      `"${item.whatsapp || ''}"`,
      `"${item.alamat || ''}"`,
      `"${item.email || ''}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `Data_Pendaftar_Perisai_Diri_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function refreshData(btn) {
  const icon = document.getElementById("iconSync");
  if (icon) icon.classList.add("spin-animation");

  loadDataFromAppScript();
  
  setTimeout(() => {
    if (icon) icon.classList.remove("spin-animation");
    alert("Data berhasil disinkronkan dari Google Sheets!");
  }, 800);
}

function logout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    window.location.href = "login.html";
  }
}
