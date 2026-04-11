// header-busca-categoria.js — busca global (/data + /listas/data) + categorias (load-products.js)
(function () {
  function getPathConfig() {
    var file = ((window.location.pathname || "").split("/").pop() || "").toLowerCase();
    var isListaPage = /^listadia\d+\.html$/.test(file);
    if (isListaPage) {
      return {
        dataDir: "../data",
        listasDataDir: "data",
        categoryImagePrefix: "../",
        listaImagePrefix: ""
      };
    }
    return {
      dataDir: "data",
      listasDataDir: "listas/data",
      categoryImagePrefix: "",
      listaImagePrefix: "listas/"
    };
  }

  var pathConfig = getPathConfig();
  var PLACEHOLDER = "images/placeholder.png";
  var GRID_ID = "product-grid";
  var INPUT_ID = "busca-input";
  var DEBOUNCE_MS = 120;

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

  var origCarregarCategoria = window.carregarCategoria;
  if (typeof origCarregarCategoria !== "function") {
    return;
  }

  window.carregarCategoria = function (categoria) {
    window.mercadimCategoriaAtual = categoria;
    return origCarregarCategoria.apply(this, arguments);
  };

  var allProducts = [];
  var indexReady = false;
  var indexPromise = null;
  var debounceTimer = null;

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById(GRID_ID);
    var input = document.getElementById(INPUT_ID);
    if (!grid || !input) return;

    indexPromise = loadAllCSVs()
      .then(function (products) {
        allProducts = products;
        indexReady = true;
      })
      .catch(function (err) {
        console.error(err);
        indexReady = true;
        allProducts = [];
      });

    input.addEventListener("input", function () {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        handleInput(grid, input);
      }, DEBOUNCE_MS);
    });
  });

  function handleInput(grid, input) {
    var raw = (input.value || "").trim();
    if (!raw) {
      window.carregarCategoria(window.mercadimCategoriaAtual);
      return;
    }

    if (!indexReady) {
      indexPromise.then(function () {
        runFilter(grid, raw);
      });
      return;
    }

    runFilter(grid, raw);
  }

  function loadAllCSVs() {
    var tasks = [];

    CATEGORY_SOURCES.forEach(function (cat) {
      var path = pathConfig.dataDir + "/" + cat.slug + ".csv";
      tasks.push(
        fetch(path, { cache: "no-cache" })
          .then(function (res) {
            if (!res.ok) throw new Error(path + " (" + res.status + ")");
            return res.text();
          })
          .then(function (text) {
            return parseProductsFromCSV(text, cat.slug, cat.label, pathConfig.categoryImagePrefix);
          })
      );
    });

    LISTAS_SOURCES.forEach(function (cat) {
      var path = pathConfig.listasDataDir + "/" + cat.slug + ".csv";
      tasks.push(
        fetch(path, { cache: "no-cache" })
          .then(function (res) {
            if (!res.ok) throw new Error(path + " (" + res.status + ")");
            return res.text();
          })
          .then(function (text) {
            return parseProductsFromCSV(text, cat.slug, cat.label, pathConfig.listaImagePrefix);
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
    var q = normalize(rawQuery);
    var hits = [];
    for (var i = 0; i < allProducts.length; i++) {
      var p = allProducts[i];
      if (normalize(p.itemName).indexOf(q) !== -1) hits.push(p);
    }

    if (hits.length === 0) {
      grid.innerHTML =
        '<p class="search-empty-msg">Nenhum produto encontrado com esse termo.</p>';
      return;
    }

    renderCards(grid, hits);
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
