#!/usr/bin/env python3
"""Puntúa lo anticuada que está una web (0 = moderna, 100 = muy legacy).

Uso:
    python3 tools/audit_web.py https://ejemplo.com [https://otra.es ...]
    python3 tools/audit_web.py --csv urls.txt > resultado.csv   (una URL por línea)

Cada señal suma puntos y queda anotada en "motivos", para poder explicarle
al dueño del negocio qué falla en su web con datos concretos.
"""
import csv
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from urllib.parse import urlparse

import requests

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
# Cabeceras de navegador completas: con solo el User-Agent, algunos hostings
# (SiteGround) sirven su página anti-bot y la web parece rota.
HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}
THIS_YEAR = date.today().year

# Motores de reserva habituales en hoteles/hostales españoles.
BOOKING_ENGINES = [
    "roiback", "mirai", "cloudbeds", "siteminder", "thebookingbutton",
    "hotetec", "neobookings", "avirato", "octorate", "beds24", "simplebooking",
    "synxis", "bookassist", "travelclick", "paraty", "witbooking", "dingus",
    "hotelinking", "littlehotelier", "sirvoy", "ulyses", "hotelgest",
    "bookingengine", "booking-engine", "motor de reservas", "reservas.",
    "secure-hotel-booking", "smoobu", "lodgify", "guesty", "mews.",
]

FIELDS = ["url", "final_url", "estado", "puntos", "https", "movil",
          "copyright", "cms", "tiempo_s", "kb", "reserva_online", "idiomas",
          "titulo", "motivos"]


def fetch(url):
    """Descarga la página probando https y luego http si hace falta."""
    if not url.startswith("http"):
        url = "https://" + url
    candidates = [url]
    if url.startswith("https://"):
        candidates.append("http://" + url[len("https://"):])
    last_err = None
    for u in candidates:
        try:
            t0 = time.time()
            r = requests.get(u, headers=HEADERS, timeout=20, allow_redirects=True)
            return r, time.time() - t0, last_err
        except requests.exceptions.SSLError as e:
            last_err = f"ssl_error: {type(e).__name__}"
        except Exception as e:  # noqa: BLE001 - cualquier fallo de red cuenta
            last_err = f"{type(e).__name__}"
    return None, None, last_err


def looks_blocked(r, low):
    """Páginas anti-bot (Cloudflare, hosting) que no son la web real."""
    if r.status_code == 202 and len(r.content) < 4096:
        return True
    return any(s in low for s in ("cf-chl", "challenge-platform", "just a moment...",
                                  "checking your browser", "captcha-delivery",
                                  "sgcaptcha"))


def detect_cms(html, headers):
    m = re.search(r'<meta[^>]+name=["\']generator["\'][^>]+content=["\']([^"\']+)',
                  html, re.I)
    if m:
        return m.group(1)[:60]
    low = html.lower()
    for needle, name in [("wp-content", "WordPress"), ("joomla", "Joomla"),
                         ("wix.com", "Wix"), ("squarespace", "Squarespace"),
                         ("jimdo", "Jimdo"), ("webnode", "Webnode"),
                         ("prestashop", "PrestaShop"), ("drupal", "Drupal"),
                         ("shopify", "Shopify"), ("_next/", "Next.js"),
                         ("framer", "Framer"), ("webflow", "Webflow")]:
        if needle in low:
            return name
    return headers.get("X-Powered-By", "")[:60]


def audit(url):
    row = dict.fromkeys(FIELDS, "")
    row["url"] = url
    r, elapsed, err = fetch(url)
    if r is None:
        row.update(estado=err or "sin_respuesta", puntos=-1)
        return row

    html = r.text or ""
    low = html.lower()
    if looks_blocked(r, low):
        # Puntuarla daría un falso positivo: revisar a mano con screenshot.js.
        row.update(final_url=r.url, estado=f"antibot_{r.status_code}", puntos=-1)
        return row
    reasons = []
    pts = 0
    if err and err.startswith("ssl_error"):
        reasons.append("certificado HTTPS roto o caducado")
    row["final_url"] = r.url
    row["estado"] = r.status_code
    row["tiempo_s"] = round(elapsed, 2)
    row["kb"] = round(len(r.content) / 1024)
    head = html.split("</head>", 1)[0] if "</head>" in low else html
    t = (re.search(r"<title[^>]*>(.*?)</title>", head, re.I | re.S)
         or re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S))
    row["titulo"] = re.sub(r"\s+", " ", t.group(1)).strip()[:80] if t else ""

    if r.status_code >= 400:
        reasons.append(f"responde con error {r.status_code}")
        pts += 30

    https = urlparse(r.url).scheme == "https"
    row["https"] = "sí" if https else "no"
    if not https:
        pts += 20
        reasons.append("sin HTTPS (el navegador la marca como 'No seguro')")

    mobile = bool(re.search(r'<meta[^>]+name=["\']viewport["\']', html, re.I))
    row["movil"] = "sí" if mobile else "no"
    if not mobile:
        pts += 25
        reasons.append("no está adaptada a móvil (sin viewport)")

    years = [int(y)
             for chunk in re.findall(r"(?:©|&copy;|copyright)([^<]{0,40})", html, re.I)
             for y in re.findall(r"(?<!\d)((?:19|20)\d{2})(?!\d)", chunk)]
    if years:
        last = max(years)
        row["copyright"] = last
        if last <= THIS_YEAR - 5:
            pts += 15
            reasons.append(f"copyright de {last}")
        elif last <= THIS_YEAR - 3:
            pts += 7
            reasons.append(f"copyright de {last}")

    if re.search(r"\.swf|shockwave-flash", low):
        pts += 20
        reasons.append("usa Flash")
    if "<frameset" in low or re.search(r"<frame\s", low):
        pts += 20
        reasons.append("usa frames")
    n_tables = low.count("<table")
    if n_tables >= 4:
        pts += 10
        reasons.append(f"maquetada con tablas ({n_tables})")
    if low.count("<font") >= 3 or "<marquee" in low or "<center>" in low:
        pts += 10
        reasons.append("etiquetas HTML obsoletas (font/center/marquee)")
    if re.search(r"<!--\[if (lt |lte )?ie [5-8]", low):
        pts += 5
        reasons.append("código para Internet Explorer antiguo")
    jq = re.search(r"jquery[.-]?(1\.[0-8](?:\.\d+)?)", low)
    if jq:
        pts += 5
        reasons.append(f"jQuery {jq.group(1)}")

    cms = detect_cms(html, r.headers)
    row["cms"] = cms
    m = re.search(r"wordpress\s*([0-9]+)\.", cms, re.I)
    if m and int(m.group(1)) < 5:
        pts += 10
        reasons.append(f"{cms} (versión muy antigua)")
    m = re.search(r"joomla!?\s*([0-9]+)\.", cms, re.I)
    if m and int(m.group(1)) < 4:
        pts += 10
        reasons.append(f"{cms} (versión muy antigua)")

    if elapsed and elapsed > 4:
        pts += 5
        reasons.append(f"tarda {elapsed:.1f}s en responder")
    if row["kb"] and row["kb"] < 3 and "location" not in low:
        pts += 5
        reasons.append("página casi vacía")

    row["reserva_online"] = "sí" if any(e in low for e in BOOKING_ENGINES) else "no"
    langs = set(re.findall(r'hreflang=["\']([a-z]{2})', low))
    if not langs and re.search(r'href=["\'][^"\']*/(en|english)(/|\.html|["\'])', low):
        langs.add("en")
    row["idiomas"] = ",".join(sorted(langs)) or "?"

    row["puntos"] = min(pts, 100)
    row["motivos"] = "; ".join(reasons)
    return row


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    if argv[0] == "--csv":
        urls = [l.strip() for l in open(argv[1]) if l.strip()]
        w = csv.DictWriter(sys.stdout, fieldnames=FIELDS)
        w.writeheader()
        with ThreadPoolExecutor(max_workers=12) as ex:
            for row in ex.map(audit, urls):
                w.writerow(row)
        return 0
    for u in argv:
        row = audit(u)
        print(f"\n{u}\n  puntos legacy: {row['puntos']}  ({row['estado']})")
        for k in FIELDS[4:-1]:
            print(f"  {k}: {row[k]}")
        print(f"  motivos: {row['motivos'] or '-'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
