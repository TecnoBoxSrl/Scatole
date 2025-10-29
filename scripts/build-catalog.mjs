import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(projectRoot, 'data');
const assetsDir = path.join(projectRoot, 'assets');
const outputFile = path.join(dataDir, 'catalogo.json');

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return ['true', '1', 'yes', 'y', 'si', 'sì', 'ok'].includes(normalized);
  }
  return false;
};

const normalizeOptionalBoolean = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return normalizeBoolean(value);
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const slugify = (value) =>
  value
    ? value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    : '';

const loadJSONSafely = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Impossibile leggere ${path.relative(projectRoot, filePath)}:`, error.message);
    }
    return [];
  }
};

const parseCSV = (content) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines.shift().split(',');

  return lines.map((line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index] : '';
    });
    return record;
  });
};

const loadCSVProducts = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return parseCSV(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Impossibile leggere ${path.relative(projectRoot, filePath)}:`, error.message);
    }
    return [];
  }
};

const loadPaletteAssignments = async () => {
  try {
    const raw = await fs.readFile(path.join(projectRoot, 'palette.json'), 'utf8');
    const palette = JSON.parse(raw);
    const assignments = new Map();
    Object.entries(palette).forEach(([group, lines]) => {
      if (Array.isArray(lines)) {
        lines.forEach((lineName) => {
          assignments.set(lineName.toUpperCase(), group);
        });
      }
    });
    return assignments;
  } catch (error) {
    return new Map();
  }
};

const loadRecyclingGuidance = async () => {
  try {
    const raw = await fs.readFile(path.join(projectRoot, 'guida_smaltimento.md'), 'utf8');
    return raw.trim();
  } catch (error) {
    return null;
  }
};

const listLineAssets = async () => {
  try {
    const entries = await fs.readdir(assetsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().startsWith('linea_'))
      .map((entry) => entry.name);
  } catch (error) {
    return [];
  }
};

const createLineAssetMatcher = async () => {
  const assets = await listLineAssets();
  return assets.map((fileName) => {
    const base = fileName
      .replace(/^linea_/i, '')
      .replace(/\.svg$/i, '')
      .toLowerCase();
    return { base, fileName: `assets/${fileName}` };
  });
};

const convertCSVRecordToProduct = (record) => {
  if (!record || Object.keys(record).length === 0) return null;
  const variant = {
    codice: record.codice || null,
    size: record.size || record.formato || null,
    confezione: record.confezione || null,
    prezzoAnonimo: toNumberOrNull(record.prezzoAnonimo),
    prezzoPersonalizzato: toNumberOrNull(record.prezzoPersonalizzato),
  };

  const product = {
    codice: record.codice || null,
    articolo: record.articolo || null,
    tipologia: record.tipologia || null,
    settore: record.settore || null,
    linea: record.linea || null,
    materiale: record.materiale || null,
    eco: record.eco || null,
    stagionale: normalizeBoolean(record.stagionale),
    brevettato: normalizeBoolean(record.brevettato),
    accessori: [],
    varianti: [variant],
  };

  return product;
};

const normalizeProduct = (raw) => {
  if (!raw) return null;
  const product = {
    codice: raw.codice || null,
    articolo: raw.articolo || raw.nome || null,
    tipologia: raw.tipologia || raw.categoria || null,
    settore: raw.settore || null,
    linea: raw.linea || null,
    materiale: raw.materiale || null,
    eco: raw.eco || null,
    famiglia: raw.famiglia || null,
    colore: raw.colore || raw.color || null,
    stagionale: normalizeBoolean(raw.stagionale),
    brevettato: normalizeBoolean(raw.brevettato),
    personalizzabile: normalizeOptionalBoolean(raw.personalizzabile),
    disponibilita: raw.disponibilita || raw.disponibilità || null,
    minOrdine: toNumberOrNull(raw.minOrdine ?? raw.min_ordine ?? raw.minimoOrdine),
    note: Array.isArray(raw.note)
      ? raw.note.filter(Boolean).join(' · ')
      : raw.note || null,
    accessori: Array.isArray(raw.accessori)
      ? raw.accessori.filter(Boolean)
      : raw.accessori
      ? String(raw.accessori)
          .split(/[;•,]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    varianti: Array.isArray(raw.varianti)
      ? raw.varianti.map((variant) => ({
          codice: variant?.codice || null,
          size: variant?.size || variant?.formato || null,
          confezione: variant?.confezione || null,
          prezzoAnonimo: toNumberOrNull(variant?.prezzoAnonimo),
          prezzoPersonalizzato: toNumberOrNull(variant?.prezzoPersonalizzato),
        }))
      : [],
    image: raw.image || null,
  };

  const topLevelVariant = {
    codice: raw.codiceVariante || raw.variantCodice || raw.codiceVar || raw.codiceVariante || raw.codice || null,
    size: raw.size || raw.formato || null,
    confezione: raw.confezione || null,
    prezzoAnonimo: toNumberOrNull(raw.prezzoAnonimo),
    prezzoPersonalizzato: toNumberOrNull(raw.prezzoPersonalizzato),
  };

  const hasVariantData = Boolean(
    (topLevelVariant.codice && topLevelVariant.codice !== product.codice) ||
      topLevelVariant.size ||
      topLevelVariant.confezione ||
      topLevelVariant.prezzoAnonimo !== null ||
      topLevelVariant.prezzoPersonalizzato !== null
  );

  if (hasVariantData) {
    const existingKeys = new Set(
      product.varianti.map((variant) => [variant.codice, variant.size, variant.confezione].join('::'))
    );
    const key = [topLevelVariant.codice || product.codice, topLevelVariant.size, topLevelVariant.confezione].join('::');
    if (!existingKeys.has(key)) {
      product.varianti.push({
        codice: topLevelVariant.codice || product.codice || null,
        size: topLevelVariant.size || null,
        confezione: topLevelVariant.confezione || null,
        prezzoAnonimo: topLevelVariant.prezzoAnonimo,
        prezzoPersonalizzato: topLevelVariant.prezzoPersonalizzato,
      });
    }
  }

  return product;
};

const mergeProducts = (target, source) => {
  if (!target) return source;
  if (!source) return target;

  const primaryFields = [
    'codice',
    'articolo',
    'tipologia',
    'settore',
    'linea',
    'materiale',
    'eco',
    'famiglia',
    'colore',
    'disponibilita',
    'image',
  ];

  primaryFields.forEach((field) => {
    if (!target[field] && source[field]) {
      target[field] = source[field];
    }
  });

  target.stagionale = Boolean(target.stagionale || source.stagionale);
  target.brevettato = Boolean(target.brevettato || source.brevettato);
  const personalizzabileValues = [target.personalizzabile, source.personalizzabile].filter(
    (value) => value !== null && value !== undefined
  );
  if (personalizzabileValues.length) {
    target.personalizzabile = personalizzabileValues.includes(true)
      ? true
      : personalizzabileValues.includes(false)
      ? false
      : target.personalizzabile;
  }

  if (source.minOrdine !== null && source.minOrdine !== undefined) {
    if (target.minOrdine === null || target.minOrdine === undefined) {
      target.minOrdine = source.minOrdine;
    } else {
      target.minOrdine = Math.min(target.minOrdine, source.minOrdine);
    }
  }

  if (source.note) {
    const notes = new Set();
    if (target.note) {
      target.note
        .split(/\s*·\s*/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => notes.add(item));
    }
    source.note
      .split(/\s*·\s*/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => notes.add(item));
    target.note = notes.size ? Array.from(notes).join(' · ') : target.note;
  }

  if (Array.isArray(source.accessori) && source.accessori.length) {
    const set = new Set([...(target.accessori || []), ...source.accessori]);
    target.accessori = Array.from(set);
  }

  if (Array.isArray(source.varianti) && source.varianti.length) {
    const seen = new Set();
    const merged = [...(target.varianti || []), ...source.varianti]
      .filter((variant) => variant && (variant.codice || variant.size || variant.confezione))
      .map((variant) => ({
        codice: variant.codice || null,
        size: variant.size || null,
        confezione: variant.confezione || null,
        prezzoAnonimo: toNumberOrNull(variant.prezzoAnonimo),
        prezzoPersonalizzato: toNumberOrNull(variant.prezzoPersonalizzato),
      }))
      .filter((variant) => {
        const key = [variant.codice, variant.size, variant.confezione].join('::');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const byPackage = new Map();
    const prioritized = [];
    merged.forEach((variant) => {
      const code = variant.codice || '';
      const pack = variant.confezione || '';
      const key = `${code}::${pack}`;
      const score = [variant.size ? 1 : 0, variant.prezzoAnonimo !== null ? 1 : 0, variant.prezzoPersonalizzato !== null ? 1 : 0].reduce(
        (total, value) => total + value,
        0
      );
      const existing = byPackage.get(key);
      if (!existing) {
        byPackage.set(key, { variant, score });
        prioritized.push(variant);
      } else if (score > existing.score) {
        const index = prioritized.indexOf(existing.variant);
        prioritized[index] = variant;
        byPackage.set(key, { variant, score });
      }
    });
    target.varianti = prioritized;
  }

  return target;
};

const buildCatalog = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  const paletteAssignments = await loadPaletteAssignments();
  const recyclingGuidance = await loadRecyclingGuidance();
  const lineAssetMatchers = await createLineAssetMatcher();

  const productsMap = new Map();

  const dataDirEntries = await fs.readdir(dataDir, { withFileTypes: true }).catch(() => []);
  const jsonFiles = dataDirEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== path.basename(outputFile))
    .map((entry) => path.join(dataDir, entry.name));

  for (const jsonFile of jsonFiles) {
    const items = await loadJSONSafely(jsonFile);
    items
      .map((item) => normalizeProduct(item))
      .filter(Boolean)
      .forEach((product) => {
        const key = product.codice || slugify(product.articolo);
        if (!key) return;
        const existing = productsMap.get(key);
        productsMap.set(key, mergeProducts(existing, product));
      });
  }

  const csvCandidates = [path.join(projectRoot, 'prodotti_enriched.csv')];
  dataDirEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.csv') && !entry.name.toLowerCase().includes('schema'))
    .forEach((entry) => {
      csvCandidates.push(path.join(dataDir, entry.name));
    });

  for (const csvFile of csvCandidates) {
    const records = await loadCSVProducts(csvFile);
    records
      .map((record) => normalizeProduct(convertCSVRecordToProduct(record)))
      .filter(Boolean)
      .forEach((product) => {
        const key = product.codice || slugify(product.articolo);
        if (!key) return;
        const existing = productsMap.get(key);
        productsMap.set(key, mergeProducts(existing, product));
      });
  }

  const catalog = Array.from(productsMap.values()).map((product) => {
    const enriched = { ...product };

    if (!enriched.image && enriched.linea) {
      const normalizedLinea = enriched.linea.toLowerCase();
      const match = lineAssetMatchers.find((asset) => normalizedLinea.includes(asset.base));
      if (match) {
        enriched.image = match.fileName;
      }
    }

    if (enriched.linea) {
      const paletteGroup = paletteAssignments.get(enriched.linea.toUpperCase());
      if (paletteGroup) {
        enriched.palette = paletteGroup;
      }
    }

    if (recyclingGuidance) {
      enriched.smaltimento = recyclingGuidance;
    }

    enriched.varianti = Array.isArray(enriched.varianti) ? enriched.varianti : [];

    return enriched;
  });

  catalog.sort((a, b) => {
    const nameA = (a.articolo || a.codice || '').toLowerCase();
    const nameB = (b.articolo || b.codice || '').toLowerCase();
    return nameA.localeCompare(nameB, 'it');
  });

  await fs.writeFile(outputFile, JSON.stringify(catalog, null, 2));
  console.log(`Catalogo generato con ${catalog.length} articoli in ${path.relative(projectRoot, outputFile)}`);
};

buildCatalog();
