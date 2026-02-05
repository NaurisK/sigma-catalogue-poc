async function main() {
  const res = await fetch("data/rules.json");
  const rules = await res.json();

  const els = {
    q: document.getElementById("q"),
    productFilters: document.getElementById("product-filters"),
    serviceFilters: document.getElementById("service-filters"),
    categoryFilters: document.getElementById("category-filters"),
    levelFilters: document.getElementById("level-filters"),
    tagFilters: document.getElementById("tag-filters"),
    results: document.getElementById("results"),
    stats: document.getElementById("stats"),
  };

  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
  
  // Separate products and services
  const products = uniq(rules.map(r => r.logsource_product).filter(Boolean));
  const services = uniq(rules.map(r => r.logsource_service).filter(Boolean));
  const categories = uniq(rules.map(r => r.logsource_category));
  const levels = uniq(rules.map(r => r.level));
  
  // Extract and clean tags (remove "attack." prefix)
  const allTags = rules.flatMap(r => r.tags || []);
  const cleanedTags = allTags.map(tag => tag.replace(/^attack\./, ''));
  const tags = uniq(cleanedTags);

  // Create checkbox groups
  function createCheckboxes(container, values, name, cssClass = '') {
    values.forEach(val => {
      const label = document.createElement("label");
      label.className = "checkbox-label" + (cssClass ? ` ${cssClass}` : '');
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = name;
      checkbox.value = val;
      checkbox.checked = false;
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + val));
      container.appendChild(label);
      
      checkbox.addEventListener("change", apply);
    });
  }

  createCheckboxes(els.productFilters, products, "product", "checkbox-product");
  createCheckboxes(els.serviceFilters, services, "service", "checkbox-service");
  createCheckboxes(els.categoryFilters, categories, "category");
  createCheckboxes(els.levelFilters, levels, "level");
  createCheckboxes(els.tagFilters, tags, "tag");

  // Handle select all/none buttons
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent triggering the details toggle
      
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
          ${r.logsource_product ? `<span class="badge badge-product">${escapeHtml(r.logsource_product)}</span>` : ''}
          ${r.logsource_service ? `<span class="badge badge-service">${escapeHtml(r.logsource_service)}</span>` : ''}
          ${r.logsource_category ? `<span class="badge">${escapeHtml(r.logsource_category)}</span>` : ''}
        </div>
        ${r.tags && r.tags.length > 0 ? `
          <div class="tags">
            ${r.tags.slice(0, 8).map(t => {
              const cleanTag = t.replace(/^attack\./, '');
              return `<span class="tag">${escapeHtml(cleanTag)}</span>`;
            }).join("")}
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
    const selectedServices = getCheckedValues("service");
    const selectedCategories = getCheckedValues("category");
    const selectedLevels = getCheckedValues("level");
    const selectedTags = getCheckedValues("tag");

    const filtered = rules.filter(r => {
      // Product filter
      if (selectedProducts.length > 0) {
        if (!r.logsource_product || !selectedProducts.includes(r.logsource_product)) {
          return false;
        }
      }
      
      // Service filter
      if (selectedServices.length > 0) {
        if (!r.logsource_service || !selectedServices.includes(r.logsource_service)) {
          return false;
        }
      }
      
      // Category filter
      if (selectedCategories.length > 0) {
        if (!r.logsource_category || !selectedCategories.includes(r.logsource_category)) {
          return false;
        }
      }
      
      // Level filter
      if (selectedLevels.length > 0) {
        if (!r.level || !selectedLevels.includes(r.level)) {
          return false;
        }
      }
      
      // Tag filter - check if rule has ANY of the selected tags
      if (selectedTags.length > 0) {
        const ruleTags = (r.tags || []).map(t => t.replace(/^attack\./, ''));
        const hasMatchingTag = selectedTags.some(tag => ruleTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Search query filter
      if (!q) return true;
      
      const cleanTags = (r.tags || []).map(t => t.replace(/^attack\./, ''));
      const hay = [
        r.title, r.status, r.level, r.logsource_product, 
        r.logsource_service, r.logsource_category,
        ...cleanTags
      ].join(" ").toLowerCase();
      
      return hay.includes(q);
    });

    render(filtered);
  }

  els.q.addEventListener("input", apply);

  apply();
}

main();
