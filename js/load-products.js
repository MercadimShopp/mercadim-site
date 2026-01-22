fetch("data/casa-cozinha.csv")
  .then(response => response.text())
  .then(csv => {
    const linhas = csv.split("\n");
    const grid = document.getElementById("product-grid");

    // Remove cabeçalho
    const cabecalho = linhas.shift().split(",");

    // Localiza os índices das colunas que vamos usar
    const idxId = cabecalho.indexOf("item id");
    const idxName = cabecalho.indexOf("item name");
    const idxPrice = cabecalho.indexOf("price");
    const idxOffer = cabecalho.indexOf("offer link");

    linhas.forEach(linha => {
      if (!linha.trim()) return;

      // Parser simples respeitando aspas
      const colunas = linha.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!colunas) return;

      const itemId = colunas[idxId]?.replace(/"/g, "").trim();
      const itemName = colunas[idxName]?.replace(/"/g, "").trim();
      const priceRaw = colunas[idxPrice]?.replace(/"/g, "").trim();
      const offerLink = colunas[idxOffer]?.replace(/"/g, "").trim();

      if (!itemId || !offerLink) return;

      const price = Number(priceRaw).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

      const card = document.createElement("a");
      card.className = "card";
      card.href = offerLink;
      card.target = "_blank";

      const img = document.createElement("img");
      img.alt = itemName;

      const basePath = `images/casa-cozinha/${itemId}`;
      img.src = `${basePath}.webp`;

      img.onerror = () => {
        img.src = `${basePath}.jpg`;
        img.onerror = () => {
          img.src = `${basePath}.png`;
        };
      };

      const title = document.createElement("span");
      title.textContent = itemName;

      const priceEl = document.createElement("span");
      priceEl.className = "price";
      priceEl.textContent = price;

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(priceEl);

      grid.appendChild(card);
    });
  })
  .catch(err => console.error("Erro ao carregar produtos:", err));
