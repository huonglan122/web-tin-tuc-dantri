const LOCAL_POSTS_KEY = "dantri_posts";
const LOCAL_CATEGORIES_KEY = "dantri_categories";
const DATA_VERSION = "v3.0_dantri_exact";

let allPosts = [];
let allCategories = [];
let currentCategory = "home";

document.addEventListener("DOMContentLoaded", async () => {
  await initData();
  renderMenu();
  renderFooterCategories();
  renderPosts(currentCategory);
});

async function initData() {
  const currentVer = localStorage.getItem("dantri_version");
  if (currentVer !== DATA_VERSION) {
    localStorage.removeItem(LOCAL_POSTS_KEY);
    localStorage.removeItem(LOCAL_CATEGORIES_KEY);
    localStorage.setItem("dantri_version", DATA_VERSION);
  }

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
      console.error("Lỗi đọc categories.json:", err);
    }
  }

  const localPosts = localStorage.getItem(LOCAL_POSTS_KEY);
  if (localPosts) {
    allPosts = JSON.parse(localPosts);
  } else {
    try {
      const res = await fetch("posts.json");
      allPosts = await res.json();
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(allPosts));
    } catch (err) {
      console.error("Lỗi đọc posts.json:", err);
    }
  }
}

/**
 * RENDER THANH MENU: CHỈ HIỂN THỊ CHỦ ĐỀ CHÍNH,
 * CÁC Ý NHỎ NẰM ẨN TRONG DROPDOWN HOVER
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

function renderPosts(catId) {
  const localPosts = localStorage.getItem(LOCAL_POSTS_KEY);
  if (localPosts) {
    allPosts = JSON.parse(localPosts);
  }

  let filtered = [...allPosts];

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

  // Sắp xếp bài viết giảm dần theo thời gian (Mới -> Cũ)
  filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const colLeft = document.getElementById("featured-left");
  const colCenter = document.getElementById("featured-center");
  const colRight = document.getElementById("featured-right");
  const remainingList = document.getElementById("remaining-posts-list");

  if (filtered.length === 0) {
    colLeft.innerHTML = "";
    colCenter.innerHTML = "<p>Chưa có bài viết nào thuộc chuyên mục này.</p>";
    colRight.innerHTML = "";
    remainingList.innerHTML = "";
    return;
  }

  // BÀI TRUNG TÂM (LỚN NHẤT): Ngân hàng Nhà nước giảm lãi suất
  const centerPost = filtered[0];
  colCenter.innerHTML = `
    <div class="card-center-main" onclick="viewPostDetail('${centerPost.id}')">
      <img src="${centerPost.image}" alt="${centerPost.title}" referrerpolicy="no-referrer">
      <h2>${centerPost.title}</h2>
      <p>${centerPost.excerpt}</p>
    </div>
  `;

  // CỘT TRÁI (Bài Quảng Ninh & Video)
  const leftPosts = filtered.slice(1, 3);
  colLeft.innerHTML = leftPosts
    .map(
      (post, idx) => `
    <div class="card-left-item" onclick="viewPostDetail('${post.id}')">
      <div class="${idx === 1 ? 'video-thumb-wrapper' : ''}">
        <img src="${post.image}" alt="${post.title}" referrerpolicy="no-referrer">
        ${idx === 1 ? '<span class="video-play-badge"><i class="fa-solid fa-play"></i> 01:47</span>' : ''}
      </div>
      <h3>${post.title}</h3>
    </div>
  `
    )
    .join("");

  // CỘT PHẢI (Danh sách bài nhỏ bên phải)
  const rightPosts = filtered.slice(3, 7);
  colRight.innerHTML = rightPosts
    .map(
      (post) => `
    <div class="card-right-horizontal" onclick="viewPostDetail('${post.id}')">
      <h3>${post.title}</h3>
      <img src="${post.image}" alt="${post.title}" referrerpolicy="no-referrer">
    </div>
  `
    )
    .join("");

  // CÁC BÀI CÒN LẠI (LIST DỌC BÊN DƯỚI)
  const restPosts = filtered.slice(7);
  remainingList.innerHTML = restPosts
    .map((post) => {
      const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author || "Dân Trí";
      const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category;
      return `
      <div class="post-item-horizontal" onclick="viewPostDetail('${post.id}')">
        <img src="${post.image}" alt="${post.title}" referrerpolicy="no-referrer">
        <div class="post-item-info">
          <div>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
          </div>
          <div class="post-meta-tag">
            <span class="cat-name">${catName}</span> &nbsp;|&nbsp;
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
 * HIỂN THỊ TRANG CHI TIẾT BÀI VIẾT (HIỂN THỊ ĐẦY ĐỦ 6 THÀNH PHẦN)
 */
function viewPostDetail(postId) {
  const post = allPosts.find((p) => p.id === postId);
  if (!post) return;

  document.getElementById("category-view").classList.add("hidden");
  document.getElementById("detail-view").classList.remove("hidden");

  // 1. Chuyên mục dạng mảng -> chuỗi
  const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category || "TIN TỨC";
  // 2. Tác giả dạng object -> tên
  const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author || "Dân Trí";

  document.getElementById("detail-category").innerText = catName;
  document.getElementById("detail-title").innerText = post.title;
  document.getElementById("detail-author").innerHTML = `<i class="fa-solid fa-user"></i> Tác giả: <strong>${authorName}</strong>`;
  document.getElementById("detail-time").innerHTML = `<i class="fa-regular fa-clock"></i> Ngày đăng: ${post.publishedAt || ""}`;
  document.getElementById("detail-source").innerHTML = `<i class="fa-solid fa-globe"></i> Nguồn: ${post.source || "dantri.com.vn"}`;
  document.getElementById("detail-excerpt").innerText = post.excerpt || "";

  // Ảnh bài viết
  const imgElement = document.getElementById("detail-image");
  if (post.image) {
    imgElement.src = post.image;
    document.getElementById("detail-image-wrapper").style.display = "block";
  } else {
    document.getElementById("detail-image-wrapper").style.display = "none";
  }

  // Nội dung chi tiết bài viết
  document.getElementById("detail-content").innerHTML = `<p>${(post.content || post.excerpt || "").replace(/\n/g, "</p><p>")}</p>`;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToCategoryView() {
  document.getElementById("detail-view").classList.add("hidden");
  document.getElementById("category-view").classList.remove("hidden");
}

function toggleSearchBox() {
  const box = document.getElementById("search-box-container");
  box.classList.toggle("search-box-hidden");
}

function handleSearch(event) {
  if (event.key === "Enter") executeSearch();
}

function executeSearch() {
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  if (!query) return;

  showHomeView();
  document.getElementById("category-title").innerText = `KẾT QUẢ TÌM KIẾM: "${query.toUpperCase()}"`;

  const results = allPosts.filter(
    (p) => p.title.toLowerCase().includes(query) || p.excerpt.toLowerCase().includes(query)
  );

  const colLeft = document.getElementById("featured-left");
  const colCenter = document.getElementById("featured-center");
  const colRight = document.getElementById("featured-right");
  const remainingList = document.getElementById("remaining-posts-list");

  colLeft.innerHTML = "";
  colCenter.innerHTML = "";
  colRight.innerHTML = "";

  if (results.length === 0) {
    remainingList.innerHTML = "<p>Không tìm thấy bài viết nào phù hợp.</p>";
    return;
  }

  remainingList.innerHTML = results
    .map((post) => {
      const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author;
      const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category;
      return `
      <div class="post-item-horizontal" onclick="viewPostDetail('${post.id}')">
        <img src="${post.image}" alt="${post.title}" referrerpolicy="no-referrer">
        <div class="post-item-info">
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <div class="post-meta-tag">
            <span class="cat-name">${catName}</span> | 
            <span>${authorName}</span> | 
            <span>${post.publishedAt}</span>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}