#!/usr/bin/env python3
"""Genera una vista previa de la web en un solo archivo (CSS, JS y fuentes dentro).

Uso:  python3 tools/build_preview.py <carpeta_salida>

Sirve para enseñar la web sin desplegarla. El chat funciona en modo guiado,
porque en la vista previa no hay servidor detrás (/api).
"""
import base64
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent / "web" / "public"


def css_con_fuentes():
    css = (RAIZ / "assets" / "styles.css").read_text(encoding="utf-8")

    def incrustar(m):
        ruta = RAIZ / "assets" / m.group(1)
        datos = base64.b64encode(ruta.read_bytes()).decode()
        return f'url("data:font/woff2;base64,{datos}")'

    return re.sub(r'url\("(fonts/[^"]+\.woff2)"\)', incrustar, css)


def favicon_data():
    svg = (RAIZ / "assets" / "favicon.svg").read_bytes()
    return "data:image/svg+xml;base64," + base64.b64encode(svg).decode()


def cuerpo(html):
    return re.search(r"<body>(.*)</body>", html, re.S).group(1).strip()


def titulo(html):
    return re.search(r"<title>(.*?)</title>", html, re.S).group(1)


def main(salida):
    out = pathlib.Path(salida)
    out.mkdir(parents=True, exist_ok=True)
    css = css_con_fuentes()
    js = (RAIZ / "assets" / "app.js").read_text(encoding="utf-8") + "\n" + (RAIZ / "assets" / "torno.js").read_text(encoding="utf-8")

    # Portada: el visor de Artifacts pone su propio doctype/head/body.
    index = (RAIZ / "index.html").read_text(encoding="utf-8")
    pagina = "\n".join([
        f"<title>{titulo(index)}</title>",
        '<meta name="claude:viewport-fit-sides" content="cover">',
        f"<style>\n{css}\n</style>",
        cuerpo(index),
        f"<script>\n{js}\n</script>",
    ])
    (out / "index.html").write_text(pagina, encoding="utf-8")

    # Páginas legales: archivos completos con el CSS dentro.
    for nombre in ("aviso-legal.html", "privacidad.html"):
        html = (RAIZ / nombre).read_text(encoding="utf-8")
        html = html.replace('<link rel="stylesheet" href="assets/styles.css">', f"<style>\n{css}\n</style>")
        html = html.replace('href="assets/favicon.svg"', f'href="{favicon_data()}"')
        (out / nombre).write_text(html, encoding="utf-8")

    print(f"Vista previa en {out}/index.html ({(out / 'index.html').stat().st_size // 1024} KB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1])
