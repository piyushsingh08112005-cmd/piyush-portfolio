const state = { snippets: [], projects: [] };

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadData() {
  const [snippetsRes, projectsRes] = await Promise.all([
    fetch("data/snippets.json"),
    fetch("data/projects.json"),
  ]);
  const snippetsData = await snippetsRes.json();
  const projectsData = await projectsRes.json();
  state.snippets = snippetsData.snippets || [];
  state.projects = projectsData.projects || [];
}

function renderCards(list, container, type) {
  container.innerHTML = list.map(item => {
    const status = item.status === "coming_soon" ? "Coming soon" : "Ready";
    const linkLabel = item.code ? "View Code" : (item.status === "coming_soon" ? "Not done yet" : "Open Notebook");
    return `
      <article class="card">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="meta">
          <span class="pill">${escapeHtml(item.lang || "Code")}</span>
          <span class="pill gray">${escapeHtml(type === "snippet" ? (item.level || "snippet") : status)}</span>
        </div>
        <p>${escapeHtml(item.description || item.level || "")}</p>
        <div class="actions">
          <button class="small-btn" data-open="${escapeHtml(item.title)}">${escapeHtml(linkLabel)}</button>
          ${item.notebook ? `<a class="small-btn" href="${escapeHtml(item.notebook)}" target="_blank" rel="noreferrer">View file</a>` : ""}
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      const title = btn.getAttribute("data-open");
      const item = list.find(x => x.title === title);
      openDialog(item);
    });
  });
}

function openDialog(item) {
  const dialog = document.getElementById("detailDialog");
  const titleEl = document.getElementById("dialogTitle");
  const descEl = document.getElementById("dialogDesc");
  const codeEl = document.getElementById("dialogCode");
  const statusEl = document.getElementById("dialogStatus");
  const linkEl = document.getElementById("dialogLink");

  titleEl.textContent = item.title;
  descEl.textContent = item.description || item.level || "";

  if (item.code) {
    codeEl.style.display = "block";
    codeEl.textContent = item.code;
    statusEl.textContent = "Snippet ready for quick reference.";
    linkEl.style.display = "none";
  } else {
    codeEl.style.display = "none";
    codeEl.textContent = "";
    if (!item.notebook) {
      statusEl.textContent = "This code is not done yet. It will be done in future.";
      linkEl.style.display = "none";
    } else {
      statusEl.textContent = "Notebook is ready for GitHub / Colab upload.";
      linkEl.style.display = "inline-flex";
      linkEl.href = item.notebook;
    }
  }

  if (typeof dialog.showModal === "function") dialog.showModal();
  else alert(item.notebook ? item.notebook : "This code is not done yet. It will be done in future.");
}

function filterList(list, query, lang) {
  const q = query.trim().toLowerCase();
  return list.filter(item => {
    const text = `${item.title} ${item.description || ""} ${item.lang || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
    const okQuery = !q || text.includes(q);
    const okLang = lang === "all" || item.lang === lang;
    return okQuery && okLang;
  });
}

function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  const snippetGrid = document.getElementById("snippetsGrid");
  const projectGrid = document.getElementById("projectsGrid");
  const snippetSearch = document.getElementById("snippetSearch");
  const snippetLang = document.getElementById("snippetLang");
  const projectSearch = document.getElementById("projectSearch");
  const projectLang = document.getElementById("projectLang");
  const closeDialog = document.getElementById("closeDialog");
  const dialog = document.getElementById("detailDialog");

  const rerender = () => {
    const s = filterList(state.snippets.map(x => ({...x, description: x.code ? x.code.slice(0, 120).replaceAll("\n", " ") + (x.code.length > 120 ? "..." : "") : "", notebook: "", code: x.code})), snippetSearch.value, snippetLang.value);
    const p = filterList(state.projects, projectSearch.value, projectLang.value);
    renderCards(s, snippetGrid, "snippet");
    renderCards(p, projectGrid, "project");
  };

  snippetSearch.addEventListener("input", rerender);
  snippetLang.addEventListener("change", rerender);
  projectSearch.addEventListener("input", rerender);
  projectLang.addEventListener("change", rerender);

  closeDialog.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  rerender();
}

loadData().then(init).catch(err => {
  console.error(err);
  document.getElementById("snippetsGrid").innerHTML = '<div class="card"><p>Failed to load data.</p></div>';
  document.getElementById("projectsGrid").innerHTML = '<div class="card"><p>Failed to load data.</p></div>';
});
