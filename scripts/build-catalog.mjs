import { readFile, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const sourcePath = path.join(dataDir, 'prodotti.json');

const isHttpUrl = (value) => /^https?:\/\//i.test(value ?? '');

const normalizeString = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const ensureImagePath = async (foto, index) => {
  if (!foto) {
    return 'assets/default.svg';
  }

  if (isHttpUrl(foto)) {
    return foto;
  }

  const relativePath = foto.startsWith('assets/') ? foto : path.join('assets', foto);
  const absolute = path.join(rootDir, relativePath);

  try {
    await access(absolute);
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    const message = `Impossibile trovare l'immagine "${foto}" per il prodotto #${index + 1}`;
    throw new Error(message);
  }
};

const loadProducts = async () => {
  const raw = await readFile(sourcePath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error('Il file data/prodotti.json deve contenere un array di articoli.');
  }

  return data;
};

const validateCatalog = async () => {
  const rawProducts = await loadProducts();
  const seenCodes = new Set();
  const products = [];

  for (const [index, raw] of rawProducts.entries()) {
    const codice = normalizeString(raw.codice);
    const descrizione = normalizeString(raw.descrizione ?? raw.articolo);
    const formato = normalizeString(raw.formato ?? raw.size);
    const cartone = normalizeString(raw.cartone ?? raw.confezione);
    const variante = normalizeString(raw.variante ?? raw.tipologia);
    const linea = normalizeString(raw.linea);
    const colore = normalizeString(raw.colore) ?? linea;
    const foto = await ensureImagePath(normalizeString(raw.foto ?? raw.image), index);

    if (!codice) {
      throw new Error(`Prodotto #${index + 1}: il campo "codice" è obbligatorio.`);
    }

    if (seenCodes.has(codice)) {
      throw new Error(`Il codice articolo "${codice}" è duplicato.`);
    }
    seenCodes.add(codice);

    if (!descrizione) {
      throw new Error(`Prodotto ${codice}: il campo "descrizione" è obbligatorio.`);
    }

    if (!formato) {
      throw new Error(`Prodotto ${codice}: il campo "formato" è obbligatorio.`);
    }

    if (!cartone) {
      throw new Error(`Prodotto ${codice}: il campo "cartone" è obbligatorio.`);
    }

    products.push({
      codice,
      descrizione,
      formato,
      cartone,
      variante: variante ?? null,
      linea,
      colore: colore ?? null,
      foto,
    });
  }

  products.sort((a, b) => a.codice.localeCompare(b.codice, 'it', { sensitivity: 'base' }));

  return products;
};

validateCatalog()
  .then((products) => {
    console.log(`Catalogo validato: ${products.length} articoli in ${path.relative(rootDir, sourcePath)}`);
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
