"""
Extrai as Coletas do Ano Cristão (LOC 1987, IEAB) do PDF para data/loc1987-coletas.json.

Uso:  python ferramentas/extrair_coletas.py "D:/LOC.pdf"
Requer: pip install pymupdf
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

PAGINA_INICIAL = 111  # "1º Domingo do Advento"
PAGINA_FINAL = 156    # fim das Coletas (antes do Lecionário)

RODAPE = re.compile(r"^\s*(\d+\s+Coletas|Coletas\s+\d+|\d+\s+Próprios do Ano Cristão)\s*$")


def linhas_do_pdf(caminho):
    doc = pymupdf.open(caminho)
    linhas = []
    for n in range(PAGINA_INICIAL - 1, PAGINA_FINAL):
        texto = doc[n].get_text()
        pagina = [l.rstrip() for l in texto.split("\n")]
        pagina = [l for l in pagina if not RODAPE.match(l)]
        # remove linhas vazias do início/fim da página
        while pagina and not pagina[0].strip():
            pagina.pop(0)
        while pagina and not pagina[-1].strip():
            pagina.pop()
        if linhas and pagina:
            anterior = linhas[-1].strip()
            primeira = pagina[0].strip()
            continua = (
                anterior
                and not anterior.startswith("*")
                and not re.search(r"[.!?]$|Amém\.?$", anterior)
                and primeira[:1].islower()
            )
            if not continua:
                linhas.append("")
        linhas.extend(pagina)
    return linhas


def paragrafos(linhas):
    atual = []
    for l in linhas:
        if l.strip():
            atual.append(l.strip())
        elif atual:
            yield atual
            atual = []
    if atual:
        yield atual


def juntar(partes):
    texto = " ".join(partes)
    texto = re.sub(r"(\w)- (\w)", r"\1-\2", texto)  # "bem- aventurados"
    texto = re.sub(r"\s+", " ", texto)
    texto = texto.replace(" ,", ",").replace(" ;", ";").replace("urna vida", "uma vida")
    texto = texto.replace("corri o Espírito", "com o Espírito").replace("uni só Deus", "um só Deus")
    return texto.strip()


def eh_titulo(par):
    texto = juntar(par)
    if texto.startswith("*"):
        return False
    if re.search(r"Amém\.?$", texto):
        return False
    if texto.startswith("("):
        return False
    return len(par) <= 2 and len(texto) <= 110 and not texto.endswith((";", ","))


def extrair(caminho):
    entradas = []
    atual = None
    secao = "Tempo"
    todos = []
    for par in paragrafos(linhas_do_pdf(caminho)):
        # "2º Domingo da Páscoa" + "(A mesma coleta da ...)" vêm colados no mesmo parágrafo
        i = next((k for k, l in enumerate(par) if k > 0 and l.startswith("(A mesma")), None)
        if i is not None:
            todos.extend([par[:i], par[i:]])
        else:
            todos.append(par)
    for par in todos:
        texto = juntar(par)
        if texto in ("Coletas",):
            continue
        if texto in ("Dias Santos", "Outras Comemorações", "Ocasiões Variadas"):
            secao = texto
            continue
        if texto.startswith("*"):
            rubrica = texto.lstrip("* ").strip()
            if atual is None:
                continue
            if rubrica.lower().startswith("prefácio"):
                atual["prefacio"] = rubrica.rstrip(".")
                if atual["coletas"] and "prefacio" not in atual["coletas"][-1]:
                    atual["coletas"][-1]["prefacio"] = rubrica.rstrip(".")
            elif rubrica.lower() == "ou":
                atual["_nova"] = True
            else:
                atual.setdefault("rubricas", []).append(rubrica)
            continue
        if texto.startswith("(") and atual is not None:
            m = re.match(r"\(A mesma coleta d[oa] (.+?)\)", texto, re.I)
            if m:
                atual["mesma_coleta_de"] = m.group(1)
            else:
                atual.setdefault("rubricas", []).append(texto)
            continue
        if eh_titulo(par):
            atual = {"titulo": texto, "secao": secao, "coletas": []}
            entradas.append(atual)
            continue
        if atual is None:
            continue
        # texto de coleta (pode vir em vários parágrafos)
        if atual["coletas"] and not atual.pop("_nova", False) and not re.search(
            r"Amém\.?$", atual["coletas"][-1]["texto"]
        ):
            atual["coletas"][-1]["texto"] = juntar([atual["coletas"][-1]["texto"], texto])
        else:
            atual.pop("_nova", None)
            atual["coletas"].append({"texto": texto})

    resultado = []
    for e in entradas:
        e.pop("_nova", None)
        if not e["coletas"] and "mesma_coleta_de" not in e:
            continue
        m = re.search(r",\s*(\d{1,2})º? de (\w+)\s*$", e["titulo"])
        if m and e["secao"] != "Tempo":
            e["data_fixa"] = f"{int(m.group(1))} de {m.group(2)}"
        m = re.match(r"Próprio (\d+), domingo mais próximo a (\d{1,2})º? de (\w+)", e["titulo"])
        if m:
            e["proprio"] = int(m.group(1))
            e["data_referencia"] = f"{int(m.group(2))} de {m.group(3)}"
        for c in e["coletas"]:
            c["texto"] = re.sub(r"Amém$", "Amém.", c["texto"])
        resultado.append(e)
    return resultado


if __name__ == "__main__":
    pdf = sys.argv[1] if len(sys.argv) > 1 else "D:/LOC.pdf"
    destino = Path(__file__).resolve().parent.parent / "data" / "loc1987-coletas.json"
    destino.parent.mkdir(exist_ok=True)
    dados = extrair(pdf)
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(dados)} entradas gravadas em {destino}")
