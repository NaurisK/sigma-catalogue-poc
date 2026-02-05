async function main() {
  const res = await fetch("data/rules.json");
  const rules = await res.json();

  const els = {
    q: document.getElementById("q"),
    productFacet: document.getElementById("productFacet"),
    categoryFacet: document.getElementById("categoryFacet"),
    levelFacet: document.getElementById("levelFacet"),
    clear: document.getElementById("clear"),
    results: document.getElementById("results"),
    stats: document.getElementById("stats"),
  };

  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();

  const values = {
    product: uniq(rules.map(r => r.logsource_product)),
    category: uniq(rules.map(r => r.logsource_category)),
    level: uniq(rules.map(r => r.level)),
  };

  function escapeHtml(s) {
    return (s ?? "").toString().replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  // Build a checkbox facet. Returns a function that reads checked values as a Set.
  function buildFacet(container, name, options) {
    container.innerHTML = options.map(v => {
      const id = `${name}_${v}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      return `
        <label>
          <input type="checkbox" data-facet="${name}" value="${escapeHtml(v)}" id="${id}">
          <span>${escapeHtml(v)}</span>
        </label>
      `;
    }).join("");

    return () => {
      const checked = [...container.querySelectorAll('input[type="checkbox"]:checked')];
      return new Set(checked.map(x => x.value));
    };
  }

  const getCheckedProducts = buildFacet(els.productFacet, "product", values.product);
  const getCheckedCategories = buildFacet(els.categoryFacet, "category", values.category);
  const getCheckedLevels = buildFacet(els.levelFacet, "level", values.level);

  function render(list) {
    els.stats.textContent = `${list.length} rules`;
    els.results.innerHTML = list.slice(0, 200).map(r => `
      <div class="card">
        <div class="title">
          <a href="${r.url}" target="_blank" rel="noreferrer">${escapeHtml(r.title)}</a>
        </div>
        <div class="meta">
          <span>${escapeHtml(r.level || "")}</span>
          <span>${escapeHtml(r.status || "")}</span>
          <span>${escapeHtml(r.logsource_product || "")}</span>
          <span>${escapeHtml(r.logsource_category || "")}</span>
        </div>
        <div class="tags">${
          (r.tags || []).slice(0, 8).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")
        }</div>
      </div>
    `).join("");
  }

  function apply() {
    const q = els.q.value.trim().toLowerCase();

    const products = getCheckedProducts();
    const categories = getCheckedCategories();
    const levels = getCheckedLevels();

    const filtered = rules.filter(r => {
      // Multi-select facets:
      // If nothing checked in a facet, treat as "any".
      if (products.size && !products.has(r.logsource_product || "")) return false;
      if (categories.size && !categories.has(r.logsource_category || "")) return false;
      if (levels.size && !levels.has(r.level || "")) return false;

      // Full text search
      if (!q) return true;
      const hay = [
        r.title, r.status, r.level, r.logsource_product, r.logsource_category,
        ...(r.tags || [])
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    render(filtered);
  }

  // Recompute when typing or ticking boxes
  els.q.addEventListener("input", apply);
  for (const c of [els.productFacet, els.categoryFacet, els.levelFacet]) {
    c.addEventListener("change", apply);
  }

  // Optional clear button
  if (els.clear) {
    els.clear.addEventListener("click", () => {
      els.q.value = "";
      for (const cb of document.querySelectorAll('input[type="checkbox"][data-facet]')) {
        cb.checked = false;
      }
      apply();
    });
  }

  apply();
}

main();
