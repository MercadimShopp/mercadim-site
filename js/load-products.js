function carregarCategoria(categoria) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  fetch("data/" + categoria + ".csv")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("CSV não encontrado");
      }
      return response.text();
    })
    .then(function (text) {
      const linhas = text.split("\n");
      linhas.shift();

      linhas.forEach(function (linha) {
        if (!linha.trim()) return;

        const campos = [];
        let atual = "";
        let dentroAspas = false;

        for (let i = 0; i < linha.length; i++) {
          const char = linha[i];

          if (char === '"') {
            dentroAspas = !dentroAspas;
          } else if (char === "," && !dentroAspas) {
            campos.push(atual);
            atual = "";
          } else {
            atual += char;
          }
        }
        campos.push(atual);

        if (campos.length < 9) return;

        const itemId = campos[0].trim();
        const itemName = campos[1].trim();
        const price = campos[2].replace(/"/g, "").trim();
        const offerLink = campos[8].trim();

        const card = document.createElement("a");
        card.className = "card";
        card.href = offerLink;
        card.target = "_blank";

        const img = document.createElement("img");
        const base = "images/" + categoria + "/" + itemId;

        img.src = base + ".webp";
        img.onerror = function () {
          this.onerror = null;
          this.src = base + ".jpg";
          this.onerror = function () {
            this.onerror = null;
            this.src = base + ".png";
          };
        };

        const name = document.createElement("span");
        name.textContent = itemName;

        const priceEl = document.createElement("strong");
        priceEl.textContent = "R$ " + price;

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(priceEl);

        grid.appendChild(card);
      });
    })
    .catch(function (err) {
      console.error(err);
      grid.innerHTML = "<p>Erro ao carregar produtos.</p>";
    });
}
