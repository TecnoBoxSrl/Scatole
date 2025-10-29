(function () {
  const { useState, useEffect, useMemo } = React;

  const uniqSorted = (items) =>
    Array.from(new Set(items.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'it', { sensitivity: 'base' })
    );

  const FilterBar = ({
    variante,
    onVarianteChange,
    colore,
    onColoreChange,
    varianti,
    colori,
    onReset,
  }) => {
    const hasFilters = variante !== 'all' || colore !== 'all';

    return React.createElement(
      'section',
      { className: 'bg-white border rounded-xl p-4 sm:p-5 mb-5 card-shadow' },
      [
        React.createElement(
          'div',
          { key: 'controls', className: 'grid gap-4 sm:grid-cols-2' },
          [
            React.createElement(
              'div',
              { key: 'variante' },
              [
                React.createElement(
                  'label',
                  { className: 'block text-sm font-medium text-neutral-700 mb-1' },
                  'Variante'
                ),
                React.createElement(
                  'select',
                  {
                    value: variante,
                    onChange: (event) => onVarianteChange(event.target.value),
                    className:
                      'w-full h-11 rounded-lg border px-3 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
                  },
                  [
                    React.createElement('option', { key: 'all', value: 'all' }, 'Tutte'),
                    ...varianti.map((value) =>
                      React.createElement('option', { key: value, value }, value)
                    ),
                  ]
                ),
              ]
            ),
            React.createElement(
              'div',
              { key: 'colore' },
              [
                React.createElement(
                  'label',
                  { className: 'block text-sm font-medium text-neutral-700 mb-1' },
                  'Colore'
                ),
                React.createElement(
                  'select',
                  {
                    value: colore,
                    onChange: (event) => onColoreChange(event.target.value),
                    className:
                      'w-full h-11 rounded-lg border px-3 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
                  },
                  [
                    React.createElement('option', { key: 'all', value: 'all' }, 'Tutti'),
                    ...colori.map((value) =>
                      React.createElement('option', { key: value, value }, value)
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),
        hasFilters &&
          React.createElement(
            'div',
            { key: 'reset', className: 'mt-4' },
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'text-sm text-neutral-700 underline hover:text-neutral-900',
                onClick: onReset,
              },
              'Azzera filtri'
            )
          ),
      ].filter(Boolean)
    );
  };

  const ImageLightbox = ({ image, onClose }) => {
    useEffect(() => {
      if (!image) return;
      const handler = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [image, onClose]);

    if (!image) return null;

    return React.createElement(
      'div',
      {
        className:
          'fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4',
        onClick: onClose,
        role: 'dialog',
        'aria-modal': true,
      },
      React.createElement('img', {
        src: image,
        alt: 'Anteprima ingrandita',
        className: 'max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl border border-white/10',
        onClick: (event) => event.stopPropagation(),
        onError: (event) => {
          event.target.onerror = null;
          event.target.src = 'assets/default.svg';
        },
      })
    );
  };

  const ProductCard = ({ product, onImageClick }) => {
    const image = product.foto || 'assets/default.svg';

    return React.createElement(
      'article',
      { className: 'bg-white border rounded-xl card-shadow overflow-hidden flex flex-col' },
      [
        React.createElement(
          'button',
          {
            key: 'image',
            type: 'button',
            className:
              'relative group h-40 bg-neutral-100 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40',
            onClick: () => onImageClick(image),
          },
          React.createElement('img', {
            src: image,
            alt: `Foto articolo ${product.codice}`,
            className: 'h-36 w-auto max-w-full object-contain transition-transform group-hover:scale-105',
            onError: (event) => {
              event.target.onerror = null;
              event.target.src = 'assets/default.svg';
            },
          })
        ),
        React.createElement(
          'div',
          { key: 'body', className: 'p-5 flex flex-col gap-4 flex-1' },
          [
            React.createElement(
              'p',
              { key: 'description', className: 'text-sm text-neutral-600 leading-relaxed' },
              product.descrizione || 'Descrizione non disponibile'
            ),
            React.createElement(
              'dl',
              {
                key: 'details',
                className:
                  'grid gap-3 text-sm text-neutral-700 sm:grid-cols-2 border-t pt-4 border-neutral-200',
              },
              [
                ['Codice', product.codice],
                ['Descrizione', product.descrizione],
                ['Formato', product.formato],
                ['Cartone', product.cartone],
              ].map(([label, value]) =>
                React.createElement(
                  'div',
                  { key: label },
                  [
                    React.createElement(
                      'dt',
                      { className: 'font-medium text-neutral-800 uppercase tracking-wide text-xs' },
                      label
                    ),
                    React.createElement(
                      'dd',
                      { className: 'mt-1 text-neutral-700' },
                      value || '—'
                    ),
                  ]
                )
              )
            ),
            React.createElement(
              'div',
              { key: 'tags', className: 'flex flex-wrap gap-2 text-xs text-neutral-600 mt-auto' },
              [
                product.variante &&
                  React.createElement(
                    'span',
                    { className: 'badge bg-white text-neutral-700 border-neutral-300' },
                    product.variante
                  ),
                (product.colore || product.linea) &&
                  React.createElement(
                    'span',
                    { className: 'badge bg-white text-neutral-700 border-neutral-300' },
                    product.colore || product.linea
                  ),
                product.linea && product.colore && product.linea !== product.colore &&
                  React.createElement(
                    'span',
                    { className: 'badge bg-white text-neutral-700 border-neutral-300' },
                    product.linea
                  ),
              ].filter(Boolean)
            ),
          ]
        ),
      ]
    );
  };

  const App = () => {
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const [variante, setVariante] = useState('all');
    const [colore, setColore] = useState('all');

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

    const varianti = useMemo(
      () => uniqSorted(products.map((item) => item.variante)),
      [products]
    );
    const colori = useMemo(
      () => uniqSorted(products.map((item) => item.colore || item.linea)),
      [products]
    );

    const filteredProducts = useMemo(() => {
      return products.filter((product) => {
        if (variante !== 'all' && product.variante !== variante) return false;
        if (colore !== 'all' && (product.colore || product.linea) !== colore) return false;
        return true;
      });
    }, [products, variante, colore]);

    if (status === 'loading') {
      return React.createElement(
        'div',
        { className: 'py-24 text-center text-neutral-500' },
        'Caricamento del catalogo in corso…'
      );
    }

    if (status === 'error') {
      return React.createElement(
        'div',
        { className: 'py-24 text-center text-red-600' },
        error?.message || 'Si è verificato un errore.'
      );
    }

    return React.createElement(
      React.Fragment,
      null,
      [
        React.createElement(FilterBar, {
          key: 'filters',
          variante,
          onVarianteChange: setVariante,
          colore,
          onColoreChange: setColore,
          varianti,
          colori,
          onReset: () => {
            setVariante('all');
            setColore('all');
          },
        }),
        React.createElement(
          'div',
          { key: 'summary', className: 'flex items-center justify-between mb-4 text-sm text-neutral-600' },
          [
            React.createElement(
              'span',
              { key: 'count' },
              `${filteredProducts.length} articoli visibili su ${products.length}`
            ),
          ]
        ),
        filteredProducts.length === 0
          ? React.createElement(
              'div',
              {
                key: 'empty',
                className:
                  'py-20 text-center text-neutral-500 border border-dashed rounded-xl',
              },
              [
                React.createElement(
                  'p',
                  { key: 'title', className: 'text-lg font-medium text-neutral-700' },
                  'Nessun articolo trovato'
                ),
                React.createElement(
                  'p',
                  { key: 'hint', className: 'mt-2 text-sm' },
                  'Modifica i filtri per visualizzare altri articoli.'
                ),
              ]
            )
          : React.createElement(
              'div',
              { key: 'grid', className: 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' },
              filteredProducts.map((product) =>
                React.createElement(ProductCard, {
                  key: product.codice,
                  product,
                  onImageClick: setSelectedImage,
                })
              )
            ),
        React.createElement(ImageLightbox, {
          key: 'lightbox',
          image: selectedImage,
          onClose: () => setSelectedImage(null),
        }),
      ]
    );
  };

  const container = document.getElementById('root');
  if (!container) {
    console.error('Impossibile trovare il nodo root.');
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(App));
})();
