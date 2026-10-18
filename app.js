// CÁC KHÓA LƯU TRỮ TRONG LOCALSTORAGE
const LOCAL_POSTS_KEY = "dantri_posts";
const LOCAL_CATEGORIES_KEY = "dantri_categories";

// BIẾN TOÀN CỤC BỘ NHỚ TRONG
let allPosts = [];
let allCategories = [];
let currentCategory = "latest";

// TỰ ĐỘNG CHẠY KHI TRANG WEB TẢI XONG
document.addEventListener("DOMContentLoaded", async () => {
  await initData();
  renderMenu();
  renderFooterCategories();
  renderPosts(currentCategory);
});

/**
 * 1. KHỞI TẠO DỮ LIỆU VÀ LƯU VÀO LOCALSTORAGE
 */
async function initData() {
  // --- Đọc hoặc Khởi tạo Chuyên mục ---
  const localCats = localStorage.getItem(LOCAL_CATEGORIES_KEY);
  if (localCats) {
    allCategories = JSON.parse(localCats);
  } else {
    try {
      const res = await fetch("categories.json");
      const data = await res.json();
      allCategories = data.menu || [];
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(allCategories));
    } catch (err) {
      console.error("Lỗi đọc file categories.json:", err);
    }
  }

  // --- Đọc hoặc Khởi tạo Bài viết ---
  const localPosts = localStorage.getItem(LOCAL_POSTS_KEY);
  if (localPosts) {
    allPosts = JSON.parse(localPosts);
  } else {
    try {
      const res = await fetch("posts.json");
      allPosts = await res.json();
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(allPosts));
    } catch (err) {
      console.error("Lỗi đọc file posts.json:", err);
    }
  }
}

/**
 * 2. RENDER THANH ĐIỀU HƯỚNG (NAVIGATION BAR)
 */
function renderMenu() {
  const mainMenu = document.getElementById("main-menu");
  if (!mainMenu) return;

  let html = "";
  allCategories.forEach((cat) => {
    const hasChildren = cat.children && cat.children.length > 0;
    html += `
      <li>
        <a href="#" onclick="filterByCategory('${cat.id}', event)">${cat.title}</a>
        ${
          hasChildren
            ? `<ul class="submenu">
                ${cat.children
                  .map(
                    (child) => `
                  <li><a href="#" onclick="filterByCategory('${child.id}', event)">${child.title}</a></li>
                `
                  )
                  .join("")}
              </ul>`
            : ""
        }
      </li>
    `;
  });

  mainMenu.innerHTML = html;
}

/**
 * RENDER CHUYÊN MỤC DƯỚI FOOTER
 */
function renderFooterCategories() {
  const footerCatList = document.getElementById("footer-categories");
  if (!footerCatList) return;

  const displayCats = allCategories.filter((c) => c.type === "category").slice(0, 6);
  footerCatList.innerHTML = displayCats
    .map(
      (cat) => `
    <li><a href="#" onclick="filterByCategory('${cat.id}', event)">${cat.title}</a></li>
  `
    )
    .join("");
}

/**
 * 3. LỌC BÀI VIẾT THEO CHUYÊN MỤC
 */
function filterByCategory(catId, event) {
  if (event) event.preventDefault();
  currentCategory = catId;
  showHomeView();
  renderPosts(catId);
}

function showHomeView(event) {
  if (event) event.preventDefault();
  document.getElementById("category-view").classList.remove("hidden");
  document.getElementById("detail-view").classList.add("hidden");
}

/**
 * 4. RENDER DANH SÁCH BÀI VIẾT
 */
function renderPosts(catId) {
  // Lấy dữ liệu bài viết mới nhất từ LocalStorage
  const localPosts = localStorage.getItem(LOCAL_POSTS_KEY);
  if (localPosts) {
    allPosts = JSON.parse(localPosts);
  }

  let filtered = [...allPosts];

  // Nếu không phải trang chủ hay tin mới nhất thì lọc theo tên chuyên mục
  if (catId !== "home" && catId !== "latest") {
    let catTitle = "";
    allCategories.forEach((cat) => {
      if (cat.id === catId) catTitle = cat.title;
      if (cat.children) {
        cat.children.forEach((child) => {
          if (child.id === catId) catTitle = child.title;
        });
      }
    });

    if (catTitle) {
      document.getElementById("category-title").innerText = catTitle;
      filtered = allPosts.filter((post) => {
        if (!post.category) return false;
        if (Array.isArray(post.category)) {
          return post.category.some(
            (c) => c.toUpperCase() === catTitle.toUpperCase() || post.categoryId === catId
          );
        }
        return post.category.toUpperCase() === catTitle.toUpperCase();
      });
    }
  } else {
    document.getElementById("category-title").innerText = catId === "home" ? "TRANG CHỦ" : "TIN MỚI NHẤT";
  }

  // Sắp xếp bài viết theo thời gian đăng giảm dần (mới -> cũ)
  filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const topLeft = document.getElementById("featured-left");
  const topRight = document.getElementById("featured-right");
  const remainingList = document.getElementById("remaining-posts-list");

  if (filtered.length === 0) {
    topLeft.innerHTML = "<p>Chưa có bài viết nào trong chuyên mục này.</p>";
    topRight.innerHTML = "";
    remainingList.innerHTML = "";
    return;
  }

  // Top 1: Bài viết lớn bên trái (Featured)
  const mainPost = filtered[0];
  topLeft.innerHTML = `
    <div class="featured-card-large" onclick="viewPostDetail('${mainPost.id}')">
      <img src="${mainPost.image || 'https://via.placeholder.com/600x400'}" alt="${mainPost.title}">
      <h2>${mainPost.title}</h2>
      <p>${mainPost.excerpt}</p>
    </div>
  `;

  // Top 2 & Top 3: 2 bài viết nhỏ bên phải
  const rightPosts = filtered.slice(1, 3);
  topRight.innerHTML = rightPosts
    .map(
      (post) => `
    <div class="featured-card-small" onclick="viewPostDetail('${post.id}')">
      <img src="${post.image || 'https://via.placeholder.com/150'}" alt="${post.title}">
      <div>
        <h3>${post.title}</h3>
        <p class="post-meta-tag"><i class="fa-regular fa-clock"></i> ${post.publishedAt || ""}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Các bài còn lại (từ vị trí thứ 4 trở đi) hiển thị dạng danh sách dọc
  const restPosts = filtered.slice(3);
  remainingList.innerHTML = restPosts
    .map((post) => {
      const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author || "Dân Trí";
      const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category;
      return `
      <div class="post-item-horizontal" onclick="viewPostDetail('${post.id}')">
        <img src="${post.image || 'https://via.placeholder.com/200x130'}" alt="${post.title}">
        <div class="post-item-info">
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <div class="post-meta-tag">
            <span><i class="fa-solid fa-folder"></i> ${catName}</span> &nbsp;|&nbsp;
            <span><i class="fa-solid fa-user"></i> ${authorName}</span> &nbsp;|&nbsp;
            <span><i class="fa-regular fa-clock"></i> ${post.publishedAt || ""}</span>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * 5. TRANG CHI TIẾT BÀI VIẾT
 */
function viewPostDetail(postId) {
  const post = allPosts.find((p) => p.id === postId);
  if (!post) return;

  document.getElementById("category-view").classList.add("hidden");
  document.getElementById("detail-view").classList.remove("hidden");

  const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category;
  const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author || "Dân Trí";

  document.getElementById("detail-category").innerText = catName;
  document.getElementById("detail-title").innerText = post.title;
  document.getElementById("detail-author").innerHTML = `<i class="fa-solid fa-user"></i> ${authorName}`;
  document.getElementById("detail-time").innerHTML = `<i class="fa-regular fa-clock"></i> ${post.publishedAt || ""}`;
  document.getElementById("detail-source").innerHTML = `<i class="fa-solid fa-globe"></i> ${post.source || "dantri.com.vn"}`;
  document.getElementById("detail-excerpt").innerText = post.excerpt || "";
  document.getElementById("detail-image").src = post.image || "https://via.placeholder.com/600x400";
  document.getElementById("detail-content").innerText = post.content || post.excerpt || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToCategoryView() {
  document.getElementById("detail-view").classList.add("hidden");
  document.getElementById("category-view").classList.remove("hidden");
}