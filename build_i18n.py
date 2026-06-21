#!/usr/bin/env python3
"""
Generate localized static pages from the English source pages.

Run with the .srvenv python (has beautifulsoup4):
    /root/.srvenv/bin/python build_i18n.py

For each language it parses an English source page, swaps the inner HTML of
every [data-i18n] element with the matching translation (English fallback),
fixes paths to non-localized root resources, sets <html lang>, marks the
language dropdown, drops English-only blocks, and writes /<lang>/<page>.

The localized tree mirrors the root tree under /<lang>/, so links *between*
localized pages (home, deadline, guide, blog) are copied unchanged and resolve
correctly. Only references to resources that live ONLY at the site root
(styles.css, main.js, assets/, legal pages) get one extra ../ to reach root.

English pages are the editable source of truth. Translations live in
i18n/strings.json: { "fr": {key: "html"}, ... }.
"""
import json
import os
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.abspath(__file__))
LANGS = ["fr", "de", "es", "nl"]
ENDONYM = {"en": "English", "fr": "Français", "de": "Deutsch", "es": "Español", "nl": "Nederlands"}

PAGES = [
    "index.html", "deadline.html", "guide.html",
    "blog/index.html",
    "blog/snapchat-memories-2026-deadline.html",
    "blog/why-snapchat-export-has-no-dates.html",
    "blog/how-to-export-snapchat-memories.html",
    "blog/import-snapchat-into-google-apple-photos.html",
    "blog/import-snapchat-into-immich.html",
]

# Resources that exist ONLY at the site root (not duplicated per language).
# References to these get one extra ../ so a localized page reaches the root.
NON_LOCALIZED = ("styles.css", "main.js", "assets/", "privacy.html", "tos.html",
                 "success.html", "robots.txt", "sitemap.xml")


def needs_extra(v):
    if not v:
        return False
    if v.startswith(("http://", "https://", "//", "mailto:", "#", "data:")):
        return False
    s = v
    while s.startswith("../"):
        s = s[3:]
    return any(s.startswith(p) for p in NON_LOCALIZED)


def rewrite_paths(soup):
    for tag, attr in (("a", "href"), ("link", "href"), ("script", "src"),
                      ("img", "src"), ("source", "src")):
        for el in soup.find_all(tag):
            v = el.get(attr)
            if needs_extra(v):
                el[attr] = "../" + v


def set_dropdown(soup, lang):
    lbl = soup.find(id="langLabel")
    if lbl:
        lbl.string = ENDONYM[lang]
    for opt in soup.select(".lang-opt"):
        if opt.get("data-lang") == lang:
            opt["class"] = list(set(opt.get("class", []) + ["on"]))
        else:
            opt["class"] = [c for c in opt.get("class", []) if c != "on"]


def translate(soup, dic):
    for el in soup.select("[data-i18n]"):
        key = el.get("data-i18n")
        if key in dic and dic[key] is not None:
            el.clear()
            el.append(BeautifulSoup(dic[key], "html.parser"))
    # attribute translations: data-i18n-attr="key|attr;key2|attr2"
    for el in soup.select("[data-i18n-attr]"):
        for pair in el.get("data-i18n-attr").split(";"):
            if "|" not in pair:
                continue
            key, attr = pair.split("|", 1)
            if key in dic and dic[key] is not None:
                el[attr] = dic[key]


def main():
    with open(os.path.join(ROOT, "i18n", "strings.json"), encoding="utf-8") as f:
        strings = json.load(f)

    for lang in LANGS:
        dic = strings.get(lang, {})
        for page in PAGES:
            src = os.path.join(ROOT, page)
            if not os.path.exists(src):
                continue
            with open(src, encoding="utf-8") as f:
                soup = BeautifulSoup(f.read(), "html.parser")
            if soup.html:
                soup.html["lang"] = lang
            for el in soup.select(".i18n-drop"):
                el.decompose()
            translate(soup, dic)
            rewrite_paths(soup)
            set_dropdown(soup, lang)
            out = os.path.join(ROOT, lang, page)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, "w", encoding="utf-8") as f:
                f.write(str(soup))
            print(f"  wrote {lang}/{page}")
    print("done.")


if __name__ == "__main__":
    main()
