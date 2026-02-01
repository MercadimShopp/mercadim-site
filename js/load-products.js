// js/load-products.js
(function () {
  var GRID_ID = "product-grid";
  var DATA_DIR = "data";
  var DEFAULT_CATEGORY = "achadinhos-do-dia";
  var PLACEHOLDER = "images/placeholder.png";

  window.carregarCategoria = carregarCategoria;

  document.addEventListener("DOMContentLoaded", function () {
    carregarCategoria(DEFAULT_CATEGORY);
  });

  function showSkeletons(grid, count) {
    grid.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var skel = document.createElement('div');
      skel.className = 'skeleton-card';
      skel.innerHTML =
        '<div class="skeleton-image"></div>' +
        '<div class="skeleton-info">' +
          '<div class="skeleton-line"></div>' +
          '<div class="skeleton-line skeleton-line--short"></div>' +
          '<div class="skeleton-line skeleton-line--price"></div>' +
          '<div class="skeleton-line skeleton-line--cta"></div>' +
        '</div>';
      grid.appendChild(skel);
    }
  }

  async function carregarCategoria(categoria) {
    var grid = document.getElementById(GRID_ID);
    if (!grid) return;
    showSkeletons(grid, 8);

    var csvPath = DATA_DIR + "/" + categoria + ".csv";

    try {
      var res = await fetch(csvPath, { cache: "no-cache" });
      if (!res.ok) throw new Error("CSV não encontrado: " + csvPath + " (status " + res.status + ")");
      var text = await res.text();

      // Normaliza quebras de linha e remove BOM
      text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");

      // Detecta separador na primeira linha (tab, ; ou ,)
      var firstLine = text.split("\n", 1)[0] || "";
      var counts = {
        tab: (firstLine.match(/\t/g) || []).length,
        semicolon: (firstLine.match(/;/g) || []).length,
        comma: (firstLine.match(/,/g) || []).length
      };
      var sep = ",";
      if (counts.tab >= counts.semicolon && counts.tab >= counts.comma) sep = "\t";
      else if (counts.semicolon >= counts.comma) sep = ";";
      else sep = ",";

      // Separa linhas e remove vazias
      var rows = text.split("\n").filter(function(r) { return r.trim() !== ""; });
      if (rows.length <= 1) {
        grid.innerHTML = "<p>Nenhum produto encontrado nesta categoria.</p>";
        return;
      }

      // Cabeçalho
      parseCSVLine(rows.shift(), sep);

      grid.innerHTML = "";

      rows.forEach(function (row, index) {
        var cols = parseCSVLine(row, sep);
        if (cols.length === 0) return;

        var itemId = (cols[0] || "").trim();
        var itemName = (cols[1] || "").trim();
        var priceRaw = (cols[2] || "").trim();
        var offerLink = (cols[cols.length - 1] || "").trim();

        if (!itemId || !itemName || !offerLink) return;

        // Normaliza preço
        priceRaw = priceRaw.replace(/R\$\s*/i, "").replace(/\s/g, "");
        var priceNumber = priceRaw ? parseFloat(priceRaw.replace(",", ".")) : NaN;
        var priceDisplay = !isNaN(priceNumber)
          ? priceNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "";

        // Card
        var card = document.createElement("a");
        card.className = "card";
        card.href = offerLink;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.setAttribute("aria-label", itemName + (priceDisplay ? " - R$ " + priceDisplay : ""));

        // Imagem
        var imgWrap = document.createElement("div");
        imgWrap.className = "card-image";

        var img = document.createElement("img");
        var base = "images/" + categoria + "/" + itemId;
        img.src = base + ".webp";
        img.alt = itemName;
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

        // Info
        var info = document.createElement("div");
        info.className = "card-info";

        var nameEl = document.createElement("div");
        nameEl.className = "card-name";
        nameEl.textContent = itemName;

        var priceEl = document.createElement("div");
        priceEl.className = "card-price";
        priceEl.textContent = priceDisplay ? "R$ " + priceDisplay : "";

        // CTA - primeiros 2 cards usam "Acessar", demais "Ver oferta"
        var cta = document.createElement("div");
        cta.className = "card-cta";
        cta.textContent = index < 2 ? "Acessar" : "Ver oferta";

        info.appendChild(nameEl);
        info.appendChild(priceEl);
        info.appendChild(cta);

        card.appendChild(imgWrap);
        card.appendChild(info);

        grid.appendChild(card);

        // Animação de entrada escalonada
        var delay = Math.min(index * 30, 300);
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        requestAnimationFrame(function () {
          card.style.transition = 'opacity 0.3s ease ' + delay + 'ms, transform 0.3s ease ' + delay + 'ms';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      });

    } catch (err) {
      console.error("Erro ao carregar CSV:", err);
      grid.innerHTML = "<p>Erro ao carregar produtos: " + err.message + "</p>";
    }
  }

  // Parser de linha CSV/TSV que respeita aspas e separador informado
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
})();
