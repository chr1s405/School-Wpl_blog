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
    const params = new URLSearchParams(window.location.search);
    const id = params.get("post");
    history.replaceState(null, "", window.location.pathname);

    renderPosts("postsList");

    if (id)
      toggleCard(id);

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

  if (data.length === 0) {
    const emptyResult = document.createElement("div");
    emptyResult.classList.add("post-card", "empty-state");

    const title = document.createElement("h2");
    title.textContent = filters?.tags
      ? `No tags match '${filters.tags}'`
      : "No posts found";

    emptyResult.appendChild(title);


    const message = document.createElement("p");
    message.classList.add("excerpt")
    message.textContent = "Try searching for another tag";
    emptyResult.appendChild(message);

    container.appendChild(emptyResult);
    return;
  }

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
        toggleCard(post.id);
      });
    }

    const a = clone.querySelector(".read-more");
    if (a) {
      a.href = `/posts.html?post=${post.id}`
    }

    container.appendChild(clone);
  });
}

async function toggleCard(id) {
  const card = document.getElementById(`post-${id}`);
  if (!card) return;

  const btn = card.querySelector(".toggle-btn");
  if (!btn) return;

  const openCards = [...document.querySelectorAll(".post-card.open")]
    .filter(post => post !== card);

  openCards.forEach((post) => {
    post.classList.add("no-transition");
    post.classList.remove("open");
    post.offsetHeight;
    post.querySelector(".toggle-btn").textContent = "Read more";
  })
  await Promise.all(openCards.map((post) => waitForTransition(post)));

  const isOpening = !card.classList.contains("open");

  if (card.classList.contains("open")) {
    card.classList.remove("open");
    btn.textContent = "Read more"
  }
  else {
    const contentHeight = card.querySelector(".content").scrollHeight;
    card.parentElement.style.minHeight = `${card.parentElement.scrollHeight + contentHeight}px`;

    card.classList.add("open");
    btn.textContent = "Show less"
  }

  ScrollToPost(id);

  await waitForTransition(card);
  card.parentElement.style.minHeight = "";

  function waitForTransition(el) {
    if (el.classList.contains("no-transition")) {
      el.classList.remove("no-transition");
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const handler = (e) => {
        if (e.propertyName !== "max-height") return;
        el.removeEventListener("transitionend", handler);
        resolve();
      };

      el.addEventListener("transitionend", handler);
    });
  }
}

function ScrollToPost(id) {
  const card = document.getElementById(`post-${id}`);
  if (!card) return;

  card.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

function initPostsFilters(containerId) {
  let tags = null;
  let sort = null;
  let limit = null;

  const applyFilters = () => {
    renderPosts(containerId, { limit, sort, tags });
  }

  document.querySelectorAll(".filter-group")
    .forEach(filter => {
      const element = filter.querySelector(".filter");
      if (element)
        filter.addEventListener("click", () => element.focus());
    })


  const tagInput = document.getElementById("posts-filter-tag");
  if (tagInput) {
    const autocomplete = tagInput.parentElement;
    const autocompleteMenu = autocomplete.querySelector(".autocomplete-menu");

    document.addEventListener("click", (e) => {
      const isClicked = autocomplete.contains(e.target);
      if (!isClicked) {
        closeAutocomplete();;
      }
    })
    tagInput.addEventListener("focus", () => {
      const inputValue = tagInput.value.trim().toLowerCase()
      if (inputValue && !allTags.some(tag => tag === inputValue)) {
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
        input.value = value;
        setTags(value);
        applyFilters();
        closeAutocomplete();
      })
      return item;
    };

  }

  const sortInput = document.getElementById("posts-filter-sort");
  if (sortInput) {
    const dropdown = sortInput.parentElement;
    const dropdownMenu = dropdown.querySelector(".dropdown-menu");

    document.addEventListener("click", (e) => {
      const isClicked = dropdown.contains(e.target)
      if (!isClicked) {
        closeDropdown();
      }
    })

    dropdown.addEventListener("click", () => {
      dropdown.classList.toggle("open");
    })

    const dropdownItems = [...dropdownMenu.children]
    dropdownItems.forEach(element => {
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        const value = element.dataset.value
        sortInput.value = element.dataset.label;
        setSort(value);
        dropdownItems.forEach(item => item.classList.remove("active"));
        element.classList.add("active");
        closeDropdown();
      })
    });
    // helper functions
    const setSort = (value) => {
      sort = value;
      applyFilters();
    }

    const closeDropdown = () => {
      dropdown.classList.remove("open");
    }
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
        case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    }
  );

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}