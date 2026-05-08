async function renderPosts(containerId, limit = null) {
  const res = await fetch("/data/posts.json");
  const posts = await res.json();

  const sorted = posts.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const data = limit ? sorted.slice(0, limit) : sorted;

  const container = document.getElementById(containerId);
  const template = document.getElementById("post-template");

  data.forEach(post => {
    const clone = template.content.cloneNode(true);

    const card = clone.querySelector(".post-card");
    card.id = `post-${post.id}`

    clone.querySelector(".date").textContent = post.createdAt;
    clone.querySelector(".title").textContent = post.title;
    clone.querySelector(".excerpt").textContent = post.excerpt;

    const tags = clone.querySelector(".tags");
    if(tags){
      post.tags.forEach(tag => {
        const span = document.createElement("span");
        span.classList.add("tag");
        span.textContent = tag;
        tags.appendChild(span);
      });
    }

    const content = clone.querySelector(".content");
    if(content){
      post.content.split("\n\n").forEach(paragraph => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        content.appendChild(p);
      });
    }

    const btn = clone.querySelector(".toggle-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        toggleCard(card)
      });
    }

    const a = clone.querySelector(".read-more");
    if (a) {
      a.href = `/posts.html?post=${post.id}`
    }

    container.appendChild(clone);
  });

  ScrollToPost();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("postsGrid")) {
    renderPosts("postsGrid", 3);
  }

  if (document.getElementById("postsList")) {
    renderPosts("postsList");
  }
});

function toggleCard(card) {
  if (!card) return;

  const btn = card.querySelector(".toggle-btn");
  if (!btn) return;

  card.classList.toggle("open");

  btn.textContent = card.classList.contains("open")
    ? "Show less"
    : "Read more";
}

function ScrollToPost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("post");
  if (!id) return

  const card = document.getElementById(`post-${id}`);
  console.log(card)
  if (!card) return;

  toggleCard(card);
  card.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}