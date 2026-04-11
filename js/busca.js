// js/busca.js — página de teste: busca em /data e /listas/data (isolado; não altera load-products.js)
(function () {
  var DATA_DIR = "data";
  var LISTAS_DATA_DIR = "listas/data";
  var PLACEHOLDER = "images/placeholder.png";
  var GRID_ID = "product-grid";
  var INPUT_ID = "busca-input";

  // Deve coincidir com os .csv em /data e /listas/data (navegador não lista pastas)
  var CATEGORY_SOURCES = [
    { slug: "achadinhos-do-dia", label: "Achadinhos do Dia" },
    { slug: "eletronicos", label: "Eletrônicos" },
    { slug: "eletrodomesticos", label: "Eletrodomésticos" },
    { slug: "casa-cozinha", label: "Casa" },
    { slug: "moda-masculina", label: "Moda Masculina" },
    { slug: "moda-feminina", label: "Moda Feminina" },
    { slug: "beleza-cuidados", label: "Saúde e Beleza" },
    { slug: "utilidades", label: "Utilidades" },
    { slug: "pet-e-cia", label: "Pet & Cia" },
    { slug: "presentes-criativos", label: "Presentes Criativos" }
  ];

  var LISTAS_SOURCES = [
    { slug: "lista-dia-1", label: "Lista dia 1" },
    { slug: "lista-dia-2", label: "Lista dia 2" },
    { slug: "lista-dia-3", label: "Lista dia 3" },
    { slug: "lista-dia-4", label: "Lista dia 4" },
    { slug: "lista-dia-5", label: "Lista dia 5" },
    { slug: "lista-dia-6", label: "Lista dia 6" },
    { slug: "lista-dia-7", label: "Lista dia 7" },
    { slug: "lista-dia-8", label: "Lista dia 8" }
  ];

  var allProducts = [];
  var debounceTimer = null;
  var DEBOUNCE_MS = 120;

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById(GRID_ID);
    var input = document.getElementById(INPUT_ID);
    if (!grid || !input) return;

    showSkeletons(grid, 10);

    loadAllCSVs()
      .then(function (products) {
        allProducts = products;
        if ((input.value || "").trim()) {
          runFilter(grid, input.value);
        } else {
          renderPrompt(grid);
        }
      })
      .catch(function (err) {
        console.error(err);
        grid.innerHTML =
          "<p class=\"search-error\">Erro ao carregar dados: " +
          (err && err.message ? err.message : String(err)) +
          "</p>";
      });

    input.addEventListener("input", function () {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        runFilter(grid, input.value);
      }, DEBOUNCE_MS);
    });
  });

  function loadAllCSVs() {
    var tasks = [];

    CATEGORY_SOURCES.forEach(function (cat) {
      var path = DATA_DIR + "/" + cat.slug + ".csv";
      tasks.push(
        fetch(path, { cache: "no-cache" })
          .then(function (res) {
            if (!res.ok) throw new Error(path + " (" + res.status + ")");
            return res.text();
          })
          .then(function (text) {
            return parseProductsFromCSV(text, cat.slug, cat.label, "");
          })
      );
    });

    LISTAS_SOURCES.forEach(function (cat) {
      var path = LISTAS_DATA_DIR + "/" + cat.slug + ".csv";
      tasks.push(
        fetch(path, { cache: "no-cache" })
          .then(function (res) {
            if (!res.ok) throw new Error(path + " (" + res.status + ")");
            return res.text();
          })
          .then(function (text) {
            return parseProductsFromCSV(text, cat.slug, cat.label, "listas/");
          })
      );
    });

    return Promise.all(tasks).then(function (arrays) {
      var merged = [];
      arrays.forEach(function (arr) {
        for (var i = 0; i < arr.length; i++) merged.push(arr[i]);
      });
      return merged;
    });
  }

  function parseProductsFromCSV(text, categorySlug, categoryLabel, imageBasePrefix) {
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");
    var rows = text.split("\n").filter(function (r) {
      return r.trim() !== "";
    });
    if (rows.length <= 1) return [];

    var firstLine = rows[0] || "";
    var counts = {
      tab: (firstLine.match(/\t/g) || []).length,
      semicolon: (firstLine.match(/;/g) || []).length,
      comma: (firstLine.match(/,/g) || []).length
    };
    var sep = ",";
    if (counts.tab >= counts.semicolon && counts.tab >= counts.comma) sep = "\t";
    else if (counts.semicolon >= counts.comma) sep = ";";

    parseCSVLine(rows.shift(), sep);

    var out = [];
    rows.forEach(function (row) {
      var cols = parseCSVLine(row, sep);
      if (cols.length === 0) return;
      var itemId = (cols[0] || "").trim();
      var itemName = (cols[1] || "").trim();
      var priceRaw = (cols[2] || "").trim();
      var offerLink = (cols[cols.length - 1] || "").trim();
      if (!itemId || !itemName || !offerLink) return;

      priceRaw = priceRaw.replace(/R\$\s*/i, "").replace(/\s/g, "");
      var priceNumber = priceRaw ? parseFloat(priceRaw.replace(",", ".")) : NaN;
      var priceDisplay = !isNaN(priceNumber)
        ? priceNumber.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        : "";

      out.push({
        itemId: itemId,
        itemName: itemName,
        priceDisplay: priceDisplay,
        offerLink: offerLink,
        categorySlug: categorySlug,
        categoryLabel: categoryLabel,
        imageBasePrefix: imageBasePrefix || ""
      });
    });
    return out;
  }

  function parseCSVLine(line, sep) {
    sep = sep || ",";
    var result = [];
    var cur = "";
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === sep && !inQuotes) {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  }

  function normalize(s) {
    if (!s) return "";
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function runFilter(grid, rawQuery) {
    var q = normalize((rawQuery || "").trim());
    if (!q) {
      renderPrompt(grid);
      return;
    }

    var hits = [];
    for (var i = 0; i < allProducts.length; i++) {
      var p = allProducts[i];
      if (normalize(p.itemName).indexOf(q) !== -1) hits.push(p);
    }

    if (hits.length === 0) {
      grid.innerHTML =
        "<p class=\"search-empty-msg\">Nenhum produto encontrado com esse termo.</p>";
      return;
    }

    renderCards(grid, hits);
  }

  function renderPrompt(grid) {
    grid.innerHTML = "";
  }

  function showSkeletons(grid, count) {
    grid.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var skel = document.createElement("div");
      skel.className = "skeleton-card";
      skel.innerHTML =
        '<div class="skeleton-image"></div>' +
        '<div class="skeleton-info">' +
        '<div class="skeleton-line"></div>' +
        '<div class="skeleton-line skeleton-line--short"></div>' +
        '<div class="skeleton-line skeleton-line--price"></div>' +
        '<div class="skeleton-line skeleton-line--cta"></div>' +
        "</div>";
      grid.appendChild(skel);
    }
  }

  function renderCards(grid, products) {
    grid.innerHTML = "";
    products.forEach(function (p, index) {
      var card = document.createElement("a");
      card.className = "card";
      card.href = p.offerLink;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute(
        "aria-label",
        p.itemName + (p.priceDisplay ? " - R$ " + p.priceDisplay : "")
      );

      var imgWrap = document.createElement("div");
      imgWrap.className = "card-image";

      var img = document.createElement("img");
      var base = (p.imageBasePrefix || "") + "images/" + p.categorySlug + "/" + p.itemId;
      img.src = base + ".webp";
      img.alt = p.itemName;
      img.loading = "lazy";
      img.onerror = function () {
        this.onerror = null;
        this.src = base + ".jpg";
        this.onerror = function () {
          this.onerror = null;
          this.src = base + ".png";
          this.onerror = function () {
            this.onerror = null;
            this.src = PLACEHOLDER;
          };
        };
      };

      imgWrap.appendChild(img);

      var info = document.createElement("div");
      info.className = "card-info";

      var catEl = document.createElement("div");
      catEl.className = "card-category";
      catEl.textContent = p.categoryLabel;

      var nameEl = document.createElement("div");
      nameEl.className = "card-name";
      nameEl.textContent = p.itemName;

      var priceEl = document.createElement("div");
      priceEl.className = "card-price";
      priceEl.textContent = p.priceDisplay ? "R$ " + p.priceDisplay : "";

      var cta = document.createElement("div");
      cta.className = "card-cta";
      cta.textContent = index < 3 ? "Acessar" : "Ver oferta";

      info.appendChild(catEl);
      info.appendChild(nameEl);
      info.appendChild(priceEl);
      info.appendChild(cta);

      card.appendChild(imgWrap);
      card.appendChild(info);

      grid.appendChild(card);

      var delay = Math.min(index * 25, 280);
      card.style.opacity = "0";
      card.style.transform = "translateY(10px)";
      requestAnimationFrame(function () {
        card.style.transition =
          "opacity 0.3s ease " + delay + "ms, transform 0.3s ease " + delay + "ms";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      });
    });
  }
})();
