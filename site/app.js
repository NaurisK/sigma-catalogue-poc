async function main() {
  const res = await fetch("data/rules.json");
  const rules = await res.json();

  const els = {
    q: document.getElementById("q"),
    productFilters: document.getElementById("product-filters"),
    categoryFilters: document.getElementById("category-filters"),
    levelFilters: document.getElementById("level-filters"),
    results: document.getElementById("results"),
    stats: document.getElementById("stats"),
  };

  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
  const products = uniq(rules.map(r => r.logsource_product));
  const categories = uniq(rules.map(r => r.logsource_category));
  const levels = uniq(rules.map(r => r.level));

  // Create checkbox groups
  function createCheckboxes(container, values, name) {
    values.forEach(val => {
      const label = document.createElement("label");
      label.className = "checkbox-label";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = name;
      checkbox.value = val;
      checkbox.checked = true; // All checked by default
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + val));
      container.appendChild(label);
      
      checkbox.addEventListener("change", apply);
    });
  }

  createCheckboxes(els.productFilters, products, "product");
  createCheckboxes(els.categoryFilters, categories, "category");
  createCheckboxes(els.levelFilters, levels, "level");

  function render(list) {
    els.stats.textContent = `${list.length} rules`;
    els.results.innerHTML = list.slice(0, 200).map(r => `
      <div class="card">
        <div class="title"><a href="${r.url}" target="_blank" rel="noreferrer">${escapeHtml(r.title)}</a></div>
        <div class="meta">
          <span>${escapeHtml(r.level || "")}</span>
          <span>${escapeHtml(r.status || "")}</span>
          <span>${escapeHtml(r.logsource_product || "")}</span>
          <span>${escapeHtml(r.logsource_category || "")}</span>
        </div>
        <div class="tags">${(r.tags || []).slice(0, 8).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      </div>
    `).join("");
  }

  function escapeHtml(s) {
    return (s ?? "").toString().replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
      .map(cb => cb.value);
  }

  function apply() {
    const q = els.q.value.trim().toLowerCase();
    const selectedProducts = getCheckedValues("product");
    const selectedCategories = getCheckedValues("category");
    const selectedLevels = getCheckedValues("level");

    const filtered = rules.filter(r => {
      // If checkboxes exist but none are selected, show nothing for that filter
      if (selectedProducts.length > 0 && !selectedProducts.includes(r.logsource_product)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(r.logsource_category)) return false;
      if (selectedLevels.length > 0 && !selectedLevels.includes(r.level)) return false;

      if (!q) return true;
      const hay = [
        r.title, r.status, r.level, r.logsource_product, r.logsource_category,
        ...(r.tags || [])
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    render(filtered);
  }

  els.q.addEventListener("input", apply);

  apply();
}

main();
