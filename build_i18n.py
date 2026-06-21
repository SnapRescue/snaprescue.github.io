#!/usr/bin/env python3
"""
Generate localized static pages from the English source pages.

Run with the .srvenv python (has beautifulsoup4):
    /root/.srvenv/bin/python build_i18n.py

For each language it parses an English source page, swaps the inner HTML of
every element carrying a data-i18n="key" attribute with the matching
translation (falling back to the English source when a key is missing),
rewrites root-relative asset/link paths to ../, sets <html lang>, marks the
language dropdown, and writes the result to /<lang>/<page>.

English pages are the editable source of truth and are never rewritten here.
Translations live in i18n/strings.json: { "fr": {key: "html"}, ... }.
"""
import json
import os
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.abspath(__file__))
LANGS = ["fr", "de", "es", "nl"]
ENDONYM = {"en": "English", "fr": "Français", "de": "Deutsch", "es": "Español", "nl": "Nederlands"}
# Only pages that are instrumented (data-i18n + dropdown + hreflang) are
# generated. deadline.html/guide.html are not localized yet, so their links
# from the localized homepage point back to the English originals (below).
PAGES = ["index.html", "deadline.html", "guide.html"]

# root-relative things that must become ../ inside a /<lang>/ page
PREFIX = ("styles.css", "main.js", "assets/", "blog/",
          "privacy.html", "tos.html", "success.html", "robots.txt", "sitemap.xml")


def needs_prefix(v):
    if not v:
        return False
    if v.startswith(("http://", "https://", "//", "mailto:", "#", "../", "data:")):
        return False
    return any(v.startswith(p) for p in PREFIX)


def rewrite_paths(soup):
    for tag, attr in (("a", "href"), ("link", "href"), ("script", "src"),
                      ("img", "src"), ("source", "src")):
        for el in soup.find_all(tag):
            v = el.get(attr)
            if needs_prefix(v):
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
            frag = BeautifulSoup(dic[key], "html.parser")
            el.append(frag)


def main():
    with open(os.path.join(ROOT, "i18n", "strings.json"), encoding="utf-8") as f:
        strings = json.load(f)

    for lang in LANGS:
        dic = strings.get(lang, {})
        outdir = os.path.join(ROOT, lang)
        os.makedirs(outdir, exist_ok=True)
        for page in PAGES:
            src = os.path.join(ROOT, page)
            if not os.path.exists(src):
                continue
            with open(src, encoding="utf-8") as f:
                soup = BeautifulSoup(f.read(), "html.parser")
            soup.html["lang"] = lang
            # Drop blocks that only make sense in English (e.g. the inline
            # detailed export guide, which the localized guide.html replaces).
            for el in soup.select(".i18n-drop"):
                el.decompose()
            translate(soup, dic)
            rewrite_paths(soup)
            set_dropdown(soup, lang)
            out = os.path.join(outdir, page)
            with open(out, "w", encoding="utf-8") as f:
                f.write(str(soup))
            print(f"  wrote {lang}/{page}")
    print("done.")


if __name__ == "__main__":
    main()
