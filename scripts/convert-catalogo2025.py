#!/usr/bin/env python3
"""Converte la tabella estratta dal PDF "Catalogo Confezioni 2025" nel formato prodotti.json."""

import csv
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
SOURCE_PATH = DATA_DIR / "catalogo_confezioni_2025.tsv"
OUTPUT_PATH = DATA_DIR / "prodotti.json"

ASSET_RULES = [
    ("FIBRA", "assets/linea_FIBRA.svg"),
    ("SETA", "assets/linea_SETA.svg"),
    ("SPOT", "assets/linea_SPOT.svg"),
    ("CRYSTAL", "assets/linea_CRYSTAL.svg"),
]

# Mappa di override per codici con immagini specifiche fornite manualmente.
CUSTOM_ASSETS = {
    "101007S": "assets/prodotti/101007S.svg",
}

PREFIX_MAP = [
    ("portapanettone + bott.", "Portapanettone + Bott."),
    ("portapanettone portapanettone", "Portapanettone"),
    ("portapanettone+bott.", "Portapanettone + Bott."),
    ("portapanettone", "Portapanettone"),
    ("vassoio conico", "Vassoio Conico"),
    ("vassoio esagono", "Vassoio Esagono"),
    ("cesto incollato", "Cesto Incollato"),
    ("cantinetta sicura", "Cantinetta"),
    ("cantinetta cantina", "Cantinetta"),
    ("cantinetta", "Cantinetta"),
    ("quadrella", "Quadrella"),
    ("tutto a posto", "Tutto A Posto"),
    ("baulotto", "Baulotto"),
    ("casetta", "Casetta"),
    ("coperchio", "Coperchio"),
    ("automatico", "Automatico"),
    ("magnum", "Magnum"),
    ("segret", "Segreto"),
    ("unica", "Unica"),
    ("cubotto", "Cubotto"),
    ("prestige", "Prestige"),
    ("maison", "Maison"),
    ("cofanetto", "Cofanetto"),
    ("shopperbox", "Shopperbox"),
    ("cassetta smart", "Cassetta Smart"),
    ("cassetta marmotta", "Cassetta Marmotta"),
    ("cassetta", "Cassetta"),
    ("liquore", "Liquore"),
    ("gourmet", "Gourmet"),
    ("valigetta", "Valigetta"),
    ("finestra", "Finestra"),
    ("saccotto", "Saccotto"),
    ("scatola salmone", "Scatola Salmone"),
    ("manuale", "Manuale"),
    ("libreria", "Arredo"),
    ("targhetta", "Targhetta"),
    ("cuore da appendere", "Decorazione"),
    ("strip", "Strip"),
    ("prestige c/cordini", "Prestige"),
    ("video montaggio", "Video"),
    ("baulotto new", "Baulotto"),
]


def format_dimension(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return value
    value = value.replace("x", "×")
    if value.endswith(("mm", "MM")):
        return value
    return f"{value} mm"


def simplify_tokens(descrizione: str) -> list[str]:
    tokens: list[str] = []
    previous = None
    for raw in descrizione.split():
        cleaned = raw.strip('.,')
        if not cleaned:
            continue
        if previous and cleaned.lower() == previous.lower():
            continue
        tokens.append(cleaned)
        previous = cleaned
    return tokens


def derive_variante(descrizione: str) -> str:
    if not descrizione:
        return ""
    tokens = simplify_tokens(descrizione)
    normalized = " ".join(tokens).lower()

    for pattern, label in PREFIX_MAP:
        if normalized.startswith(pattern):
            return label

    if not tokens:
        return ""

    if tokens[0] == "+" and len(tokens) > 1:
        tokens = tokens[1:]

    if len(tokens) >= 3 and tokens[1].lower() in {"+", "a", "al", "alla", "di", "da"}:
        return " ".join(tokens[:3])

    return " ".join(tokens[:2]) if len(tokens) > 1 else tokens[0]


def derive_colore(linea: str) -> str:
    return linea.strip()


def derive_foto(linea: str) -> str:
    key = linea.upper()
    for marker, asset in ASSET_RULES:
        if marker in key:
            return asset
    return "assets/default.svg"


def main() -> None:
    if not SOURCE_PATH.exists():
        raise SystemExit(f"File sorgente non trovato: {SOURCE_PATH}")

    with SOURCE_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        records = []
        for row in reader:
            codice = (row.get("Codice Articolo") or "").strip()
            if not codice:
                continue
            linea = (row.get("Linea") or "").strip()
            descrizione = (row.get("Descrizione") or "").strip()
            dimensioni = (row.get("Dimensioni") or "").strip()

            record = {
                "codice": codice,
                "descrizione": descrizione,
                "variante": derive_variante(descrizione) or None,
                "linea": linea,
                "colore": derive_colore(linea) or None,
                "formato": format_dimension(dimensioni),
                "cartone": "Non specificato",
                "foto": CUSTOM_ASSETS.get(codice) or derive_foto(linea),
            }
            records.append(record)

    records.sort(key=lambda item: item["codice"])

    OUTPUT_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Scritti {len(records)} articoli in {OUTPUT_PATH.relative_to(BASE_DIR)}")


if __name__ == "__main__":
    main()
