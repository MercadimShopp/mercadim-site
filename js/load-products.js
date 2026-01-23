/**
 * Categoria inicial
 */
const DEFAULT_CATEGORY = 'achadinhos-do-dia';

/**
 * Função principal para carregar uma categoria
 */
function loadCategory(category) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '<p>Carregando produtos...</p>';

  const csvPath = `data/${category}.csv`;
  const imagePath = `images/${category}/`;

  fetch(csvPath)
    .then(response => {
      if (!response.ok) {
        throw new Error('CSV não encontrado');
      }
      return response.text();
    })
    .then(csvText => {
      const products = parseCSV(csvText);
      if (products.length === 0) {
        grid.innerHTML = '<p>Nenhum produto disponível no momento.</p>';
        return;
      }
      renderProducts(products, imagePath);
    })
    .catch(() => {
      grid.innerHTML = '<p>Novas ofertas em breve 🚀</p>';
    });
}

/**
 * Parser de CSV (aceita vírgulas dentro de campos)
 */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    let obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i] ? values[i].trim() : '';
    });
    return obj;
  });
}

function splitCSVLine(line) {
  const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
  return line.match(regex)?.map(v => v.replace(/^"|"$/g, '')) || [];
}

function renderProducts(products, imagePath) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';

  products.forEach(p => {
    const id = p['item id'];
    const name = p['item name'];
    const price = formatPrice(p['price']);
    const link = p['offer link'];

    const card = document.createElement('a');
    card.className = 'card';
    card.href = link;
    card.target = '_blank';

    const img = document.createElement('img');
    img.alt = name;
    loadImageWithFallback(img, imagePath, id);

    const title = document.createElement('span');
    title.textContent = name;

    const priceTag = document.createElement('strong');
    priceTag.textContent = price;

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(priceTag);
    grid.appendChild(card);
  });
}

function loadImageWithFallback(img, basePath, id) {
  const extensions = ['webp', 'jpg', 'png'];
  let index = 0;

  function tryNext() {
    if (index >= extensions.length) return;
    img.src = `${basePath}${id}.${extensions[index++]}`;
    img.onerror = tryNext;
  }

  tryNext();
}

function formatPrice(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadCategory(DEFAULT_CATEGORY);
});


