#!/usr/bin/env python3
"""Convierte el SRD público de Ysystem3 (HTML, © Walhalla Ediciones, CC BY 4.0) en _data/reglas-srd.json.

Uso:  python3 scripts/importar-srd.py [carpeta-con-los-html]
Sin argumento descarga los ocho capítulos de https://walhallaediciones.gitlab.io/ysystem/srd/ .
El JSON resultante se versiona: el build de los compendios no necesita red.
"""
import json, re, sys, urllib.request
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://walhallaediciones.gitlab.io/ysystem/srd/"
CAPITULOS = [
    ("1-concepto", "1 · Concepto"), ("2-glosario-de-terminos", "2 · Glosario de términos"),
    ("3-dados-tiradas-y-dificultades", "3 · Dados, tiradas y dificultades"), ("4-atributos-y-habilidades", "4 · Atributos y habilidades"),
    ("5-combates-salud-valor-resistencia-fisica", "5 · Combates, salud y Resistencia física"), ("6-otras-reglas", "6 · Otras reglas"),
    ("7-creacion-de-pjs", "7 · Creación de PJ"), ("8-anexo-pulp", "8 · Anexo Pulp")]
PERMITIDAS = {"h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br"}

class Conversor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.dentro, self.nivel, self.detalle = [], False, 0, 0
        self.omitir = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "div" and "post-body" in (a.get("class") or ""):
            self.dentro, self.nivel = True, 1; return
        if not self.dentro: return
        if tag == "div": self.nivel += 1
        if tag == "a" and "headerlink" in (a.get("class") or ""): self.omitir += 1; return
        if tag == "details": self.out.append("<blockquote>"); self.detalle += 1; return
        if tag == "summary": self.out.append("<strong>"); return
        if tag in ("script", "style", "svg"): self.omitir += 1; return
        if tag in PERMITIDAS and not self.omitir: self.out.append(f"<{tag}>")
    def handle_endtag(self, tag):
        if not self.dentro: return
        if tag == "div":
            self.nivel -= 1
            if self.nivel == 0: self.dentro = False
            return
        if tag == "a" and self.omitir: self.omitir -= 1; return
        if tag in ("script", "style", "svg") and self.omitir: self.omitir -= 1; return
        if tag == "details": self.out.append("</blockquote>"); self.detalle -= 1; return
        if tag == "summary": self.out.append("</strong>"); return
        if tag in PERMITIDAS and not self.omitir: self.out.append(f"</{tag}>")
    def handle_data(self, data):
        if self.dentro and not self.omitir: self.out.append(data.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

def paginas(html):
    html = re.sub(r"<p>\s*(<strong>.*?</strong>)\s*</p>(?=\s*</strong>)", r"\1", html, flags=re.S)
    html = re.sub(r"<strong><p>(.*?)</p>\s*</strong>", r"<strong>\1</strong>", html, flags=re.S)
    trozos = re.split(r"(?=<h1>)", html)
    res = []
    for t in trozos:
        m = re.match(r"<h1>(.*?)</h1>(.*)", t, flags=re.S)
        if m: res.append({"name": re.sub(r"<[^>]+>", "", m.group(1)).strip(), "html": m.group(2).strip()})
        elif t.strip(): res.append({"name": "Introducción", "html": t.strip()})
    return res

def leer(slug, carpeta):
    if carpeta: return (Path(carpeta) / f"{slug}.html").read_text()
    return urllib.request.urlopen(BASE + slug + ".html").read().decode()

carpeta = sys.argv[1] if len(sys.argv) > 1 else None
salida = []
for slug, titulo in CAPITULOS:
    c = Conversor(); c.feed(leer(slug, carpeta))
    html = re.sub(r"[ \t]+\n", "\n", "".join(c.out))
    html = re.sub(r"\n{2,}", "\n", html).replace("📌", "").replace("👊", "").replace("🎲", "")
    pags = paginas(html)
    salida.append({"slug": slug, "name": titulo, "url": BASE + slug + ".html", "pages": pags})
    print(f"{titulo}: {len(pags)} páginas, {len(html)} caracteres")
Path(__file__).resolve().parent.parent.joinpath("_data/reglas-srd.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1))
