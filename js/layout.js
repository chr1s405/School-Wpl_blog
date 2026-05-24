loadPartial("header", "/partials/header.html");
loadPartial("footer", "/partials/footer.html");

async function loadPartial(id, file) {
  const res = await fetch(file);
  const html = await res.text();

  document.getElementById(id).innerHTML = html;


  if(id === "header"){
    setActiveNav();
    setNavDropdown();
  }
}

function setActiveNav() {
  [...document.querySelectorAll("nav a")].find(link => {
      const href = new URL(link.href).pathname;
      return (window.location.pathname === href)
    })?.classList.add("active");
}

function setNavDropdown() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("nav");

  toggle.addEventListener("click", () =>
    nav.classList.toggle("open"));

  document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => 
      nav.classList.remove("open"));
  });
}