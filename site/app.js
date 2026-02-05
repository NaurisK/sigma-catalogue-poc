async function main() {
  const res = await fetch("data/rules.json");
  const rules = await res.json();

  const els = {
    q: document.getElementById("q"),
    product: document.getElementById("product"),
    category: document.getElementById("category"),
    level: document.getElementById("level"),
    results: document.getElementById("results"),
    stats: document.getElementById("stats"),
  };

  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
  const products = uniq(rules.map(r => r.logsource_product));
  const categories = uniq(rules.map(r => r.logsource_category));
  const levels = uniq(rules.map(r => r.level));

  for (const p of products) els.product.add(new Option(p, p));
  for (const c of categories) els.category.add(new Option(c, c));
  for (const l of levels) els.level.add(new Option(l, l));

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

  function apply() {
    const q = els.q.value.trim().toLowerCase();
    const product = els.product.value;
    const category = els.category.value;
    const level = els.level.value;

    const filtered = rules.filter(r => {
      if (product && r.logsource_product !== product) return false;
      if (category && r.logsource_category !== category) return false;
      if (level && r.level !== level) return false;

      if (!q) return true;
      const hay = [
        r.title, r.status, r.level, r.logsource_product, r.logsource_category,
        ...(r.tags || [])
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    render(filtered);
  }

  ["input","change"].forEach(evt => {
    els.q.addEventListener(evt, apply);
    els.product.addEventListener(evt, apply);
    els.category.addEventListener(evt, apply);
    els.level.addEventListener(evt, apply);
  });

  apply();
}

main();

