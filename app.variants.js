(function(){
  const { useState, useEffect, useMemo } = React;

  const uniqSorted = (items) => {
    return Array.from(new Set(items.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'it', { sensitivity: 'base' })
    );
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const Badge = ({ children }) => (
    React.createElement('span', { className: 'badge bg-white text-neutral-700' }, children)
  );

  const Filters = ({
    query,
    onQueryChange,
    settore,
    onSettoreChange,
    tipologia,
    onTipologiaChange,
    linea,
    onLineaChange,
    onlySeasonal,
    onOnlySeasonalChange,
    onlyPatented,
    onOnlyPatentedChange,
    settori,
    tipologie,
    linee,
  }) => (
    React.createElement('section', { className: 'bg-white border rounded-xl p-4 sm:p-5 mb-5 card-shadow' }, [
      React.createElement('div', { className: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4' }, [
        React.createElement('div', { key: 'search', className: 'sm:col-span-2' }, [
          React.createElement('label', { className: 'block text-sm font-medium text-neutral-700 mb-1' }, 'Cerca una variante'),
          React.createElement('input', {
            type: 'search',
            value: query,
            onChange: (event) => onQueryChange(event.target.value),
            placeholder: 'Codice, articolo, linea, materiale…',
            className: 'w-full h-11 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
          }),
        ]),
        React.createElement('div', { key: 'settore' }, [
          React.createElement('label', { className: 'block text-sm font-medium text-neutral-700 mb-1' }, 'Settore'),
          React.createElement('select', {
            value: settore,
            onChange: (event) => onSettoreChange(event.target.value),
            className: 'w-full h-11 rounded-lg border px-3 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
          }, [
            React.createElement('option', { key: 'all', value: 'all' }, 'Tutti'),
            ...settori.map((option) => React.createElement('option', { key: option, value: option }, option)),
          ]),
        ]),
        React.createElement('div', { key: 'tipologia' }, [
          React.createElement('label', { className: 'block text-sm font-medium text-neutral-700 mb-1' }, 'Tipologia'),
          React.createElement('select', {
            value: tipologia,
            onChange: (event) => onTipologiaChange(event.target.value),
            className: 'w-full h-11 rounded-lg border px-3 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
          }, [
            React.createElement('option', { key: 'all', value: 'all' }, 'Tutte'),
            ...tipologie.map((option) => React.createElement('option', { key: option, value: option }, option)),
          ]),
        ]),
        React.createElement('div', { key: 'linea' }, [
          React.createElement('label', { className: 'block text-sm font-medium text-neutral-700 mb-1' }, 'Linea'),
          React.createElement('select', {
            value: linea,
            onChange: (event) => onLineaChange(event.target.value),
            className: 'w-full h-11 rounded-lg border px-3 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
          }, [
            React.createElement('option', { key: 'all', value: 'all' }, 'Tutte'),
            ...linee.map((option) => React.createElement('option', { key: option, value: option }, option)),
          ]),
        ]),
      ]),
      React.createElement('div', { className: 'mt-4 flex flex-wrap gap-4' }, [
        React.createElement('label', { key: 'stagionale', className: 'inline-flex items-center gap-2 text-sm text-neutral-700' }, [
          React.createElement('input', {
            type: 'checkbox',
            className: 'h-4 w-4 rounded border-neutral-300',
            checked: onlySeasonal,
            onChange: (event) => onOnlySeasonalChange(event.target.checked),
          }),
          'Solo stagionali',
        ]),
        React.createElement('label', { key: 'brevettato', className: 'inline-flex items-center gap-2 text-sm text-neutral-700' }, [
          React.createElement('input', {
            type: 'checkbox',
            className: 'h-4 w-4 rounded border-neutral-300',
            checked: onlyPatented,
            onChange: (event) => onOnlyPatentedChange(event.target.checked),
          }),
          'Solo brevettati',
        ]),
      ]),
    ])
  );

  const ProductCard = ({ product }) => {
    const image = product.image || 'assets/default.svg';
    const labels = [];
    if (product.palette) labels.push(product.palette);
    if (product.stagionale) labels.push('Stagionale');
    if (product.brevettato) labels.push('Brevettato');

    return React.createElement('article', { className: 'bg-white border rounded-xl p-5 card-shadow flex flex-col gap-4' }, [
      React.createElement('div', { key: 'header', className: 'flex items-start gap-4' }, [
        React.createElement('img', {
          key: 'image',
          src: image,
          alt: product.linea || product.tipologia,
          className: 'w-20 h-20 object-contain border rounded-lg bg-white',
          onError: (event) => {
            event.target.onerror = null;
            event.target.src = 'assets/default.svg';
          },
        }),
        React.createElement('div', { key: 'info', className: 'flex-1 min-w-0' }, [
          React.createElement('div', { className: 'flex flex-wrap items-center gap-2' }, [
            React.createElement('h2', { key: 'title', className: 'text-lg font-semibold text-neutral-900 truncate' }, product.articolo || 'Articolo senza nome'),
            React.createElement(Badge, { key: 'codice' }, product.codice),
          ]),
          React.createElement('p', { className: 'text-sm text-neutral-600 mt-1' }, [
            product.tipologia ? product.tipologia + ' · ' : '',
            product.linea || 'Linea non specificata',
          ]),
          React.createElement('div', { className: 'mt-2 flex flex-wrap gap-2 text-xs text-neutral-600' }, [
            product.settore && React.createElement(Badge, { key: 'settore' }, product.settore),
            product.materiale && React.createElement(Badge, { key: 'materiale' }, product.materiale),
            product.eco && React.createElement(Badge, { key: 'eco' }, 'Eco ' + product.eco),
            ...labels.map((label) => React.createElement(Badge, { key: label }, label)),
          ].filter(Boolean)),
        ]),
      ]),
      product.accessori && product.accessori.length > 0 && React.createElement('div', { key: 'accessori' }, [
        React.createElement('h3', { className: 'text-sm font-medium text-neutral-800' }, 'Accessori disponibili'),
        React.createElement('p', { className: 'text-sm text-neutral-600 mt-1' }, product.accessori.join(' · ')),
      ]),
      React.createElement('div', { key: 'varianti', className: 'overflow-x-auto' }, [
        React.createElement('table', { className: 'min-w-full border-t text-sm' }, [
          React.createElement('thead', { className: 'bg-neutral-50 text-neutral-600 uppercase text-xs tracking-wide' }, [
            React.createElement('tr', { key: 'head-row' }, [
              ['Codice', 'Formato', 'Confezione', 'Prezzo base', 'Prezzo personalizzato'].map((title) =>
                React.createElement('th', {
                  key: title,
                  className: 'text-left font-semibold px-3 py-2 border-b border-neutral-200',
                }, title)
              ),
            ]),
          ]),
          React.createElement('tbody', { className: 'divide-y divide-neutral-200' },
            (product.varianti || []).map((variant) => React.createElement('tr', { key: variant.codice }, [
              React.createElement('td', { className: 'px-3 py-2 font-medium text-neutral-800' }, variant.codice || '—'),
              React.createElement('td', { className: 'px-3 py-2 text-neutral-700' }, variant.size || '—'),
              React.createElement('td', { className: 'px-3 py-2 text-neutral-700' }, variant.confezione || '—'),
              React.createElement('td', { className: 'px-3 py-2 text-neutral-700' }, formatCurrency(variant.prezzoAnonimo)),
              React.createElement('td', { className: 'px-3 py-2 text-neutral-700' }, formatCurrency(variant.prezzoPersonalizzato)),
            ]))
          ),
        ]),
      ]),
      product.smaltimento &&
        React.createElement('div', { key: 'smaltimento', className: 'border-t pt-3 text-xs text-neutral-500 leading-relaxed' }, [
          React.createElement('h3', { className: 'text-sm font-medium text-neutral-700 mb-1' }, 'Guida allo smaltimento'),
          React.createElement('p', null, product.smaltimento),
        ]),
    ]);
  };

  const App = () => {
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);

    const [query, setQuery] = useState('');
    const [settore, setSettore] = useState('all');
    const [tipologia, setTipologia] = useState('all');
    const [linea, setLinea] = useState('all');
    const [onlySeasonal, setOnlySeasonal] = useState(false);
    const [onlyPatented, setOnlyPatented] = useState(false);

    useEffect(() => {
      let cancelled = false;
      setStatus('loading');
      fetch('data/catalogo.json')
        .then((response) => {
          if (!response.ok) {
            throw new Error('Impossibile caricare il catalogo (' + response.status + ')');
          }
          return response.json();
        })
        .then((data) => {
          if (!cancelled) {
            setProducts(Array.isArray(data) ? data : []);
            setStatus('ready');
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error(err);
            setError(err);
            setStatus('error');
          }
        });
      return () => {
        cancelled = true;
      };
    }, []);

    const settori = useMemo(() => uniqSorted(products.map((item) => item.settore)), [products]);
    const tipologie = useMemo(() => uniqSorted(products.map((item) => item.tipologia)), [products]);
    const linee = useMemo(() => uniqSorted(products.map((item) => item.linea)), [products]);

    const filteredProducts = useMemo(() => {
      const normalizedQuery = query.trim().toLowerCase();

      return products.filter((product) => {
        if (settore !== 'all' && product.settore !== settore) return false;
        if (tipologia !== 'all' && product.tipologia !== tipologia) return false;
        if (linea !== 'all' && product.linea !== linea) return false;
        if (onlySeasonal && !product.stagionale) return false;
        if (onlyPatented && !product.brevettato) return false;

        if (!normalizedQuery) return true;

        const searchable = [
          product.codice,
          product.articolo,
          product.tipologia,
          product.settore,
          product.linea,
          product.materiale,
          product.eco,
          product.palette,
          product.smaltimento,
          ...(product.varianti || []).flatMap((variant) => [variant.codice, variant.size]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      });
    }, [products, query, settore, tipologia, linea, onlySeasonal, onlyPatented]);

    if (status === 'loading') {
      return React.createElement('div', { className: 'py-24 text-center text-neutral-500' }, 'Caricamento del catalogo in corso…');
    }

    if (status === 'error') {
      return React.createElement('div', { className: 'py-24 text-center text-red-600' }, error?.message || 'Si è verificato un errore.');
    }

    return React.createElement(React.Fragment, null, [
      React.createElement(Filters, {
        key: 'filters',
        query,
        onQueryChange: setQuery,
        settore,
        onSettoreChange: setSettore,
        tipologia,
        onTipologiaChange: setTipologia,
        linea,
        onLineaChange: setLinea,
        onlySeasonal,
        onOnlySeasonalChange: setOnlySeasonal,
        onlyPatented,
        onOnlyPatentedChange: setOnlyPatented,
        settori,
        tipologie,
        linee,
      }),
      React.createElement('div', { key: 'summary', className: 'flex items-center justify-between mb-4 text-sm text-neutral-600' }, [
        React.createElement('span', { key: 'count' }, `${filteredProducts.length} articoli visibili su ${products.length}`),
        (onlySeasonal || onlyPatented || settore !== 'all' || tipologia !== 'all' || linea !== 'all' || query) &&
          React.createElement('button', {
            key: 'reset',
            className: 'text-neutral-700 underline hover:text-neutral-900',
            onClick: () => {
              setQuery('');
              setSettore('all');
              setTipologia('all');
              setLinea('all');
              setOnlySeasonal(false);
              setOnlyPatented(false);
            },
          }, 'Azzera filtri'),
      ].filter(Boolean)),
      filteredProducts.length === 0
        ? React.createElement('div', { key: 'empty', className: 'py-20 text-center text-neutral-500 border border-dashed rounded-xl' }, [
            React.createElement('p', { key: 'title', className: 'text-lg font-medium text-neutral-700' }, 'Nessun articolo trovato'),
            React.createElement('p', { key: 'hint', className: 'mt-2 text-sm' }, 'Modifica la ricerca o reimposta i filtri per vedere più risultati.'),
          ])
        : React.createElement('div', { key: 'grid', className: 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' },
            filteredProducts.map((product) => React.createElement(ProductCard, { key: product.codice, product }))
          ),
    ]);
  };

  const container = document.getElementById('root');
  if (!container) {
    console.error('Impossibile trovare il nodo root.');
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(App));
})();
