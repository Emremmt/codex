const form = document.getElementById("new-post-form");
const postList = document.getElementById("post-list");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = form.title.value.trim();
  const category = form.category.value.trim();
  const content = form.content.value.trim();

  if (!title || !category || !content) {
    return;
  }

  const card = document.createElement("article");
  card.className = "post-card";

  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  card.innerHTML = `
    <h2>${title}</h2>
    <p class="meta">${today} • ${category}</p>
    <p>${content}</p>
    <a href="#" class="read-more">Devamını oku</a>
  `;

  postList.prepend(card);
  form.reset();
});
