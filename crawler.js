/**
 * Hàm Crawler nhận vào URL bài viết tin tức từ dantri.com.vn
 * Trả về một object JSON đã chuẩn hóa theo đúng các trường yêu cầu của đề bài.
 * 
 * @param {string} url - URL bài viết
 * @returns {Promise<Object>} - Object thông tin bài viết
 */
async function crawlArticle(url) {
  try {
    // Sử dụng CORS Proxy miễn phí để lấy HTML của bài viết trên trình duyệt
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error("Không thể kết nối hoặc tải nội dung bài viết.");
    }

    const data = await response.json();
    const htmlString = data.contents;

    // Sử dụng DOMParser để biến chuỗi HTML thành tài liệu DOM dễ truy vấn
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    // 1. post.id (string) - Tách lấy ID số từ đuôi URL (ví dụ: 20260928122246655)
    const urlParts = url.split("/");
    const fileName = urlParts[urlParts.length - 1] || "";
    const idMatch = fileName.match(/(\d+)\.htm/);
    const postId = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;

    // 2. post.title (string) - Lấy tiêu đề chính
    const title = doc.querySelector("h1.title-page, h1.e-magazine__title")?.textContent?.trim() 
               || doc.querySelector("meta[property='og:title']")?.getAttribute("content") 
               || "Chưa có tiêu đề";

    // 3. post.slug (string) - Chuỗi URL thân thiện
    const slug = fileName.replace(".htm", "") || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // 4. post.excerpt (string) - Tóm tắt ngắn (sapo)
    const excerpt = doc.querySelector("h2.singular-sapo, .e-magazine__sapo")?.textContent?.trim()
                 || doc.querySelector("meta[name='description']")?.getAttribute("content")
                 || "Chưa có tóm tắt";

    // 5. post.content (string) - Nội dung chi tiết bài viết
    const contentElement = doc.querySelector("div.singular-content, div.e-magazine__body");
    let content = "";
    if (contentElement) {
      // Loại bỏ các thẻ quảng cáo/bài liên quan trong bài viết
      contentElement.querySelectorAll(".not-in-app, .relation-news, .gui-mail").forEach(el => el.remove());
      content = contentElement.innerText.trim();
    } else {
      content = excerpt;
    }

    // Lấy ảnh đại diện (phục vụ hiển thị giao diện web)
    const image = doc.querySelector("meta[property='og:image']")?.getAttribute("content")
               || "https://via.placeholder.com/600x400?text=DanTri+News";

    // 6. post.author (object) - Đúng kiểu dữ liệu object { name: "..." }
    const authorName = doc.querySelector(".author-name, .singular-author p, .author-name bold")?.textContent?.trim() 
                    || "Phóng viên Dân Trí";
    const author = {
      name: authorName
    };

    // 7. post.category (array) - Đúng kiểu dữ liệu mảng tên các chuyên mục
    const categoriesList = [];
    doc.querySelectorAll("ul.breadcrumbs li a").forEach(el => {
      const catText = el.textContent.trim();
      if (catText && catText !== "Trang chủ") {
        categoriesList.push(catText.toUpperCase());
      }
    });
    if (categoriesList.length === 0) {
      categoriesList.push("TIN TỨC");
    }

    // 8. post.publishedAt (string datetime)
    const publishedAt = doc.querySelector(".author-time, .singular-start time")?.textContent?.trim()
                     || new Date().toISOString().slice(0, 16).replace("T", " ");

    // 9. post.source (string)
    const source = "dantri.com.vn";

    // Trả về Object bài viết theo chuẩn yêu cầu của đề bài
    return {
      id: postId,
      title: title,
      slug: slug,
      excerpt: excerpt,
      content: content,
      image: image,
      author: author,        // Object
      category: categoriesList, // Array
      publishedAt: publishedAt,
      source: source,
      url: url
    };

  } catch (error) {
    console.error("Lỗi khi crawl bài viết:", error);
    throw error;
  }
}