// Ganti dengan URL Web App Apps Script kamu yang terbaru
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwWwrJSxcymnkMaiVGfDPyq836JYU7Oc3sNi9-CyxyEZw8XCjZjqbwVayqVdYAMzkRM3w/exec";

// Fungsi untuk menampilkan animasi loading overlay
function showLoading(
  title = "Memproses Masuk",
  message = "Mohon tunggu beberapa saat...",
) {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingMessage = document.getElementById("loadingMessage");

  if (loadingTitle) loadingTitle.innerText = title;
  if (loadingMessage) loadingMessage.innerText = message;

  if (loadingOverlay) {
    loadingOverlay.classList.add("show");
  }
}

// Fungsi untuk menyembunyikan animasi loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.classList.remove("show");
  }
}

// Fungsi Utama Login (Menyesuaikan backend doPost dengan FormData)
function login(event) {
  if (event) event.preventDefault();

  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value.trim();
  const pesanEl = document.getElementById("pesan");

  if (pesanEl) pesanEl.innerText = "";

  if (!usernameInput || !passwordInput) {
    if (pesanEl) {
      pesanEl.innerText = "Username dan Password wajib diisi!";
    } else {
      alert("Username dan Password wajib diisi!");
    }
    return;
  }

  // 1. Tampilkan Animasi Loading Profesional
  showLoading("Autentikasi Akun", "Memeriksa kredensial admin ke server...");

  // Kirim data menggunakan FormData dengan metode POST (Sesuai handler doPost di Apps Script)
  const formData = new FormData();
  formData.append("action", "login");
  formData.append("username", usernameInput);
  formData.append("password", passwordInput);

  // Timeout pengaman 10 detik agar tidak stuck selamanya jika jaringan/server lambat
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  fetch(SCRIPT_URL, {
    method: "POST",
    body: formData,
    signal: controller.signal,
    redirect: "follow",
  })
    .then((res) => res.json())
    .then((response) => {
      clearTimeout(timeoutId);

      if (response.status === "success") {
        // 🟢 Simpan Token (API_SECRET) & Nama Admin ke Browser
        localStorage.setItem("adminToken", response.token);
        localStorage.setItem("adminName", response.adminName);

        // Ubah teks loading menjadi sukses sebelum pindah halaman
        showLoading(
          "Login Berhasil!",
          `Selamat datang, ${response.adminName}!`,
        );

        setTimeout(() => {
          window.location.href = "admin.html";
        }, 800);
      } else {
        hideLoading();
        const errorMsg =
          response.message ||
          "Gagal Login: Periksa kembali username & password.";
        if (pesanEl) {
          pesanEl.innerText = errorMsg;
        } else {
          alert(errorMsg);
        }
      }
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      hideLoading();
      console.error("Error login:", err);

      const errorMsg =
        "Terjadi kesalahan koneksi atau server Google Apps Script sibuk.";
      if (pesanEl) {
        pesanEl.innerText = errorMsg;
      } else {
        alert(errorMsg);
      }
    });
}

// Fitur Tambahan: Tombol Lihat/Sembunyikan Password
document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      this.innerHTML =
        type === "password"
          ? '<i class="bi bi-eye-fill"></i>'
          : '<i class="bi bi-eye-slash-fill"></i>';
    });
  }
});
