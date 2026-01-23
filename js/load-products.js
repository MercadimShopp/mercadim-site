const grid = document.getElementById("product-grid");

// categoria padrão (home)
let categoriaAtual = "casa-cozinha";

function carregarCategoria(categoria) {
  categoriaAtual = categoria;
  grid.innerHTML = "";

  fetch(`data/${categoria}.csv`)
    .then(res => res.text())
    .then(text => {
      const linhas = text.split("\n").slice(1); // ignora cabeçalho

      linhas.forEach(linha => {
        if (!linha.trim()) return;

        const colunas = linha.split(",");

        const itemId = colunas[0]?.trim();
        const nome = colunas[1]?.trim();
        const preco = colunas[2]?.trim();
        const link = colunas[colunas.length - 1]?.trim();

        if (!itemId || !nome || !preco || !link) return;

        const card = document.createElement("a");
        card.href = link;
        card.target = "_blank";
        card.className = "card";

        card.innerHTML = `
          <img src="images/${categoria}/${itemId}.jpg"
               onerror="this.src='images/${categoria}/${itemId}.webp'">
          <div class="info">
            <h4>${nome}</h4>
            <p class="price">R$ ${preco}</p>
          </div>
        `;

        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Erro ao carregar CSV:", err);
    });
}

// carrega a home
carregarCategoria(categoriaAtual);

