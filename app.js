const LOCAL_POSTS_KEY = "dantri_posts";
const LOCAL_CATEGORIES_KEY = "dantri_categories";

let allPosts = [];
let allCategories = [];
let currentCategory = "latest";

document.addEventListener("DOMContentLoaded", async () => {
  await initData();
  renderMenu();
  renderFooterCategories();
  renderPosts(currentCategory);
});

async function initData() {
  // 1. Đọc Chuyên mục từ LocalStorage hoặc file json
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

  // 2. Đọc Bài viết từ LocalStorage hoặc file json
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

  // SẮP XẾP BÀI VIẾT THEO THỜI GIAN GIẢM DẦN (MỚI -> CŨ)
  filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const topLeft = document.getElementById("featured-left");
  const topRight = document.getElementById("featured-right");
  const remainingList = document.getElementById("remaining-posts-list");

  if (filtered.length === 0) {
    topLeft.innerHTML = "<p>Chưa có bài viết nào thuộc chuyên mục này.</p>";
    topRight.innerHTML = "";
    remainingList.innerHTML = "";
    return;
  }

  // TOP SECTION: 1 Bài viết lớn bên trái (Featured)
  const mainPost = filtered[0];
  topLeft.innerHTML = `
    <div class="featured-card-large" onclick="viewPostDetail('${mainPost.id}')">
      <img src="${mainPost.image || 'https://via.placeholder.com/600x400'}" alt="${mainPost.title}">
      <h2>${mainPost.title}</h2>
      <p>${mainPost.excerpt}</p>
    </div>
  `;

  // TOP SECTION: 2 Bài viết nhỏ bên phải
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

  // CÁC BÀI VIẾT CÒN LẠI (LIST DỌC)
  const restPosts = filtered.slice(3);
  remainingList.innerHTML = restPosts
    .map((post) => {
      const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author || "Dân Trí";
      const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category;
      return `
      <div class="post-item-horizontal" onclick="viewPostDetail('${post.id}')">
        <img src="${post.image || 'https://via.placeholder.com/220x140'}" alt="${post.title}">
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
 * HIỂN THỊ TRANG CHI TIẾT BÀI VIẾT (ĐẦY ĐỦ 6 THÀNH PHẦN)
 */
function viewPostDetail(postId) {
  const post = allPosts.find((p) => p.id === postId);
  if (!post) return;

  document.getElementById("category-view").classList.add("hidden");
  document.getElementById("detail-view").classList.remove("hidden");

  // Xử lý Chuyên mục dạng mảng -> chuỗi
  const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category || "TIN TỨC";
  // Xử lý Tác giả dạng object -> chuỗi tên
  const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author || "Dân Trí";

  // 1. Chuyên mục
  document.getElementById("detail-category").innerText = catName;
  // 2. Tiêu đề
  document.getElementById("detail-title").innerText = post.title;
  // 3. Tác giả
  document.getElementById("detail-author").innerHTML = `<i class="fa-solid fa-user"></i> Tác giả: <strong>${authorName}</strong>`;
  // 4. Thời gian đăng
  document.getElementById("detail-time").innerHTML = `<i class="fa-regular fa-clock"></i> Ngày đăng: ${post.publishedAt || ""}`;
  // Nguồn tin
  document.getElementById("detail-source").innerHTML = `<i class="fa-solid fa-globe"></i> Nguồn: ${post.source || "dantri.com.vn"}`;
  
  // Tóm tắt sapo
  document.getElementById("detail-excerpt").innerText = post.excerpt || "";

  // 5. Ảnh bài viết
  const imgElement = document.getElementById("detail-image");
  if (post.image) {
    imgElement.src = post.image;
    document.getElementById("detail-image-wrapper").style.display = "block";
  } else {
    document.getElementById("detail-image-wrapper").style.display = "none";
  }

  // 6. Nội dung chi tiết
  document.getElementById("detail-content").innerHTML = `<p>${(post.content || post.excerpt || "").replace(/\n/g, "</p><p>")}</p>`;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToCategoryView() {
  document.getElementById("detail-view").classList.add("hidden");
  document.getElementById("category-view").classList.remove("hidden");
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

  const topLeft = document.getElementById("featured-left");
  const topRight = document.getElementById("featured-right");
  const remainingList = document.getElementById("remaining-posts-list");

  if (results.length === 0) {
    topLeft.innerHTML = "<p>Không tìm thấy bài viết nào phù hợp.</p>";
    topRight.innerHTML = "";
    remainingList.innerHTML = "";
    return;
  }

  topLeft.innerHTML = "";
  topRight.innerHTML = "";
  remainingList.innerHTML = results
    .map((post) => {
      const authorName = typeof post.author === "object" ? post.author.name || "Dân Trí" : post.author;
      const catName = Array.isArray(post.category) ? post.category.join(" - ") : post.category;
      return `
      <div class="post-item-horizontal" onclick="viewPostDetail('${post.id}')">
        <img src="${post.image}" alt="${post.title}">
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