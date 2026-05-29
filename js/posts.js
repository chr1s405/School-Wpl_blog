let allPosts = [];
let allTags = [];

document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/data/posts.json");
  allPosts = await res.json();
  allTags = [...new Set(allPosts.flatMap(post => post.tags))];

  if (document.getElementById("postsGrid")) {
    renderPosts("postsGrid", { limit: 3 });
  }

  if (document.getElementById("postsList")) {
    renderPosts("postsList");

    if (document.querySelector(".posts-filters")) {
      initPostsFilters("postsList");
    }
  }
});

async function renderPosts(containerId, filters = null) {
  const data = filterPosts(allPosts, filters);

  const container = document.getElementById(containerId);
  const template = document.getElementById("post-template");
  container.replaceChildren();
  // container.appendChild(template);

  data.forEach(post => {
    const clone = template.content.cloneNode(true);

    const card = clone.querySelector(".post-card");
    card.id = `post-${post.id}`

    clone.querySelector(".date").textContent = post.createdAt;
    clone.querySelector(".title").textContent = post.title;
    clone.querySelector(".excerpt").textContent = post.excerpt;

    const tags = clone.querySelector(".tags");
    if (tags) {
      post.tags.forEach(tag => {
        const span = document.createElement("span");
        span.classList.add("tag");
        span.textContent = tag;
        tags.appendChild(span);
      });
    }

    const content = clone.querySelector(".content");
    if (content) {
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
  if (!card) return;

  toggleCard(card);
  card.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

function initPostsFilters(containerId) {
  let tags = null;
  let sort = null;
  let sortDir = false;
  let limit = null;

  const applyFilters = () => {
    renderPosts(containerId, { limit, sort, sortDir, tags });
  }

  document.querySelectorAll(".filter-group")
    .forEach(filter => {
      const input = filter.querySelector("input");
      if (input)
        filter.addEventListener("click", () => input.focus())
    })

  const tagInput = document.getElementById("posts-filter-tag");
  if (tagInput) {
    const autocomplete = document.querySelector(".autocomplete");
    const autocompleteMenu = tagInput.parentElement.querySelector(".autocomplete-menu");

    document.addEventListener("click", (e) => {
      const isClicked = autocomplete.contains(e.target);
      if (!isClicked) {
        closeAutocomplete();;
      }
    })
    tagInput.addEventListener("focus", () => {
      const inputValue = tagInput.value.trim().toLowerCase()
      if(inputValue && !allTags.some(tag => tag === inputValue)){
        createAutocompleteMenu(inputValue, tagInput);
        autocomplete.classList.add("open");
      }
    })

    let timer = null;
    tagInput.addEventListener("input", (e) => {
      const value = e.target.value.trim().toLowerCase();
      if (!value) {
        clearTimeout(timer);
        setTags(null);
        closeAutocomplete();
        return;
      }

      if (timer) { clearTimeout(timer); }
      timer = setTimeout(() => {
        setTags(value);
      }, 300);
      
      createAutocompleteMenu(value, tagInput);

      if (autocompleteMenu.children.length === 0) {
        closeAutocomplete();
      }
      else {
        autocomplete.classList.add("open");
      }

    });
    // helper functions  
    const setTags = (value) => {
      tags = value;
      applyFilters();
    };

    const closeAutocomplete = () => {
      autocomplete.classList.remove("open");
      autocompleteMenu.replaceChildren();
    };

    const createAutocompleteMenu = (value, input) => {
      const items = allTags
        .filter(tag => tag.toLowerCase().includes(value))
        .slice(0, 5)
        .map(tag => createAutoCompleteitem(tag, input));
      
      autocompleteMenu.replaceChildren(...items);
    };
    
    const createAutoCompleteitem = (value, input) => {
      const item = document.createElement("button");
      item.textContent = value;
      item.classList.add("autocomplete-item");
      item.addEventListener("click", () => {
        setTags(value);
        applyFilters();
        closeAutocomplete();
        input.value = value;
      })
      return item;
    };

  }

  const sortInput = document.getElementById("posts-filter-sort");
  if (sortInput) {
    sortInput.addEventListener("input", (e) => {
      sort = e.target.value;
      sortDir = false;
      renderPosts(containerId, { limit, sort, sortDir, tags })
    })
  }

  const sortDirBtn = document.getElementById("posts-filter-sortDir");
  if (sortDirBtn) {
    sortDirBtn.addEventListener("click", (e) => {
      sortDir = !sortDir;
      renderPosts(containerId, { limit, sort, sortDir, tags })
    })
  }
}

function filterPosts(posts, filters) {
  let filtered = posts;

  if (filters?.tags) {
    filtered = filtered.filter(
      post => post.tags.some(tag => tag.toLowerCase().includes(filters.tags.toLowerCase()))
    );
  }

  filtered = filtered.sort(
    (a, b) => {
      switch (filters?.sort) {
        case "title": return a.title.localeCompare(b.title);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    }
  );

  if (filters?.sortDir) {
    filtered = filtered.reverse();
  }

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}