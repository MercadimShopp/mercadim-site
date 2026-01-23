const grid = document.getElementById("product-grid");

let categoriaAtual = "casa-cozinha";

/**
 * Parser CSV que respeita aspas
 */
function parseCSV(text) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let dentroAspas = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && dentroAspas && next === '"') {
      campo += '"';
      i++;
    } else if (char === '"') {
      dentroAspas = !dentroAspas;
    } else if (char === "," && !dentroAspas) {
      linha.push(campo);
      campo = "";
    } else if ((char === "\n" || char === "\r") && !dentroAspas) {
      if (campo || linha.length) {
        linha.push(campo);
        linhas.push(linha);
        linha = [];
        campo = "";
      }
    } else {
      campo += char;
    }
  }

  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas;
}

function carregarCategoria(categoria) {
  categoriaAtual = categoria;
  grid.innerHTML = "";

  fetch(`data/${categoria}.csv`)
    .then(res => res.text())
    .then(text => {
      const dados = parseCSV(text);

      // remove cabeçalho
      dados.slice(1).forEach(colunas => {
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
               onerror="this.onerror=null;this.src='images/${categoria}/${itemId}.webp';">
          <div class="info">
            <h4>${nome}</h4>
            <p class="price">R$ ${preco}</p>
          </div>
        `;

        grid.appendChild(card);
      });
    })
    .catch(err => console.error("Erro CSV:", err));
}

// carrega página inicial
carregarCategoria(categoriaAtual);
