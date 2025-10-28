# WebApp Confezioni (static, no-build)

Web app statica pronta per **GitHub Pages**. Filtri per *Settore → Tipologia → Linea/Colore → Materiale* e toggle **Anonimo/Personalizzato**. Carrello con **CSV**, **Stampa** e **Email**.

## Struttura
```
/
├─ index.html
├─ app.js
├─ /data
│  └─ prodotti.json
└─ /assets
   └─ logo.svg
```

## Deploy su GitHub Pages
1. Crea repo `confezioni-webapp` su GitHub.
2. Carica questi file (anche via drag&drop).
3. Vai su **Settings → Pages** → "Deploy from branch" → `main` / root. Attendi l'URL pubblico.

## Aggiornare il catalogo
- Modifica `data/prodotti.json` mantenendo i campi:  
  `codice, articolo, tipologia, settore, linea, colore, materiale, eco, personalizzabile, image, prezzoAnonimo, prezzoPersonalizzato, confezione, minOrdine, disponibilita, note`.

Suggerimenti:
- Se preferisci, usa **maggiorazione %** al posto di `prezzoPersonalizzato` e adattare `app.js` (variabile `viewPrezzo`). 
- Per PDF nativo, integra `jsPDF` o stampa del browser (già disponibile).

## Licenza
Uso interno/cliente. Immagini segnaposto Unsplash.
