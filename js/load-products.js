function carregarCategoria(categoria) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';

  fetch(`data/${categoria}.csv`)
    .then(response => {
      if (!response.ok) {
        throw new Error('CSV não encontrado');
      }
      return response.text();
    })
    .then(text => {
      const linhas = text.split('\n').slice(1); // ignora cabeçalho

      linhas.forEach(linha => {
        if (!linha.trim()) return;

        // Parser simples respeitando aspas
        const campos = linha.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!campos || campos.length < 9) return;

        const itemId = campos[0];
        const itemName = campos[1];
        const price = campos[2].replace(/"/g, '');
        const offerLink = campos[8];

        const card = document.createElement('a');
        card.className = 'card';
        card.href = offerLink;
        card.target = '_blank';

        const img = document.createElement('img');

        const basePath = `images/${categoria}/${itemId}`;
        img.src = `${basePath}.webp`;
        img.onerror = () => {
          img.onerror = null;
          img.src = `${basePath}.jpg`;
          img.onerror = () => {
            img.onerror = null;
            img.src = `${basePath}.png`;
          };
        };

        const name = document.createElement('span');
        name.textContent = itemName;

        const priceEl = document.createElement('strong');
        priceEl.textContent = `R$ ${price}`;

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(priceEl);

        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Erro ao carregar produtos.</p>';
    });
}
