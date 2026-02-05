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
      checkbox.checked = true; // Start with all checked
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + val));
      container.appendChild(label);
      
      checkbox.addEventListener("change", apply);
    });
  }

  createCheckboxes(els.productFilters, products, "product");
  createCheckboxes(els.categoryFilters, categories, "category");
  createCheckboxes(els.levelFilters, levels, "level");

  // Handle select all/none buttons
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const target = e.target.dataset.target;
      const checkboxes = document.querySelectorAll(`input[name="${target}"]`);
      
      checkboxes.forEach(cb => {
        cb.checked = action === 'select-all';
      });
      
      apply();
    });
  });

  function render(list) {
    const total = list.length;
    const shown = Math.min(total, 200);
    
    els.stats.innerHTML = `
      <strong>${total.toLocaleString()}</strong> rules found
      ${total > 200 ? `<span class="note">(showing first ${shown})</span>` : ''}
    `;
    
    els.results.innerHTML = list.slice(0, 200).map(r => `
      <div class="card">
        <div class="title">
          <a href="${r.url}" target="_blank" rel="noreferrer">${escapeHtml(r.title)}</a>
        </div>
        <div class="meta">
          ${r.level ? `<span class="badge badge-${r.level}">${escapeHtml(r.level)}</span>` : ''}
          ${r.status ? `<span class="badge">${escapeHtml(r.status)}</span>` : ''}
          ${r.logsource_product ? `<span class="badge">${escapeHtml(r.logsource_product)}</span>` : ''}
          ${r.logsource_category ? `<span class="badge">${escapeHtml(r.logsource_category)}</span>` : ''}
        </div>
        ${r.tags && r.tags.length > 0 ? `
          <div class="tags">
            ${r.tags.slice(0, 8).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
          </div>
        ` : ''}
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
      // If none selected, show all; otherwise filter by selection
      if (selectedProducts.length > 0 && r.logsource_product && !selectedProducts.includes(r.logsource_product)) return false;
      if (selectedCategories.length > 0 && r.logsource_category && !selectedCategories.includes(r.logsource_category)) return false;
      if (selectedLevels.length > 0 && r.level && !selectedLevels.includes(r.level)) return false;

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
