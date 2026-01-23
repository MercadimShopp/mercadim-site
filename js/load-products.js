// js/load-products.js
(function () {
  const GRID_ID = "product-grid";
  const DATA_DIR = "data";
  const DEFAULT_CATEGORY = "casa-cozinha"; // ajuste se quiser outra categoria padrão
  const PLACEHOLDER = "images/placeholder.png"; // coloque este arquivo no repositório

  window.carregarCategoria = carregarCategoria;

  document.addEventListener("DOMContentLoaded", () => {
    carregarCategoria(DEFAULT_CATEGORY);
  });

  async function carregarCategoria(categoria) {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;
    grid.innerHTML = `<p>Carregando ${categoria}...</p>`;

    const csvPath = `${DATA_DIR}/${categoria}.csv`;

    try {
      const res = await fetch(csvPath, { cache: "no-cache" });
      if (!res.ok) throw new Error(`CSV não encontrado: ${csvPath} (status ${res.status})`);
      let text = await res.text();

      // Normaliza quebras de linha e remove BOM
      text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");

      // Detecta separador na primeira linha (tab, ; ou ,)
      const firstLine = text.split("\n", 1)[0] || "";
      const counts = {
        tab: (firstLine.match(/\t/g) || []).length,
        semicolon: (firstLine.match(/;/g) || []).length,
        comma: (firstLine.match(/,/g) || []).length
      };
      let sep = ",";
      if (counts.tab >= counts.semicolon && counts.tab >= counts.comma) sep = "\t";
      else if (counts.semicolon >= counts.comma) sep = ";";
      else sep = ",";

      // Separa linhas e remove vazias
      const rows = text.split("\n").filter(r => r.trim() !== "");
      if (rows.length <= 1) {
        grid.innerHTML = "<p>Nenhum produto encontrado neste CSV.</p>";
        return;
      }

      // Cabeçalho (não usado para mapear colunas por nome, apenas para contar colunas)
      const headerCols = parseCSVLine(rows.shift(), sep);

      grid.innerHTML = ""; // limpa antes de renderizar

      rows.forEach((row) => {
        const cols = parseCSVLine(row, sep);
        if (cols.length === 0) return;

        // Usa colunas fixas: 0 = Item Id, 1 = Item Name, 2 = Price, last = Offer Link
        const itemId = (cols[0] || "").trim();
        const itemName = (cols[1] || "").trim();
        let priceRaw = (cols[2] || "").trim();
        const offerLink = (cols[cols.length - 1] || "").trim();

        if (!itemId || !itemName || !offerLink) return; // pula linhas incompletas

        // Normaliza preço: remove "R$" e espaços, troca vírgula por ponto para parseFloat
        priceRaw = priceRaw.replace(/R\$\s*/i, "").replace(/\s/g, "");
        const priceNumber = priceRaw ? parseFloat(priceRaw.replace(",", ".")) : NaN;
        const priceDisplay = !isNaN(priceNumber)
          ? priceNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "";

        // Cria card clicável
        const card = document.createElement("a");
        card.className = "card";
        card.href = offerLink;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.setAttribute("aria-label", `${itemName} - abre em nova aba`);

        // Imagem: images/<categoria>/<itemId>.webp (fallback .jpg, .png, placeholder)
        const imgWrap = document.createElement("div");
        imgWrap.className = "card-image";

        const img = document.createElement("img");
        const base = `images/${categoria}/${itemId}`;
        img.src = `${base}.webp`;
        img.alt = itemName;
        img.loading = "lazy";
        img.onerror = function () {
          this.onerror = null;
          this.src = `${base}.jpg`;
          this.onerror = function () {
            this.onerror = null;
            this.src = `${base}.png`;
            this.onerror = function () {
              this.onerror = null;
              this.src = PLACEHOLDER;
            };
          };
        };

        imgWrap.appendChild(img);

        const info = document.createElement("div");
        info.className = "card-info";

        const nameEl = document.createElement("div");
        nameEl.className = "card-name";
        nameEl.textContent = itemName;

        const priceEl = document.createElement("div");
        priceEl.className = "card-price";
        priceEl.textContent = priceDisplay ? `R$ ${priceDisplay}` : "";

        info.appendChild(nameEl);
        info.appendChild(priceEl);

        card.appendChild(imgWrap);
        card.appendChild(info);

        grid.appendChild(card);
      });

    } catch (err) {
      console.error("Erro ao carregar CSV:", err);
      grid.innerHTML = `<p>Erro ao carregar produtos: ${err.message}</p>`;
    }
  }

  // Parser de linha CSV/TSV que respeita aspas e separador informado
  function parseCSVLine(line, sep = ",") {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
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
