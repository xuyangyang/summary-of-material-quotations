import re
import unicodedata


def normalize_text(value):
    if value is None or (isinstance(value, float) and value != value):
        return ""
    text = unicodedata.normalize("NFKC", str(value))
    text = text.replace("\u3000", " ").replace("\r", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def parse_material_spec(material, spec):
    m = normalize_text(material)
    s = normalize_text(spec)
    if not m or m in {"--", "-"}:
        return "", ""
    if s and s in m:
        idx = m.rfind(s)
        name = (m[:idx] + m[idx + len(s):]).strip(" \t*-—-_/·")
        if name:
            return name, s
    token_re = (
        r"(?i)(?:dn|de|d|φ|ф)?\s*\d+(?:\.\d+)?"
        r"(?:\s*[*x×]\s*\d+(?:\.\d+)?)*"
        r"\s*(?:mm|cm|m|米|寸|公斤|kg|g|ml|l|吨)?"
        r"|\b(?:常规|标准|无|次|桶|瓶|个|只|副|包|卷|台|套|根|片|支|盒|批|项|组|米)\b"
    )
    tokens = re.findall(token_re, m)
    if tokens:
        last = tokens[-1].strip()
        if m.endswith(last):
            return m[:-len(last)].strip(" \t*-—-_/·"), last
    return m, s


def normalize_spec(spec):
    s = normalize_text(spec)
    s = s.replace("×", "*").replace("x", "*").replace("X", "*").replace("ｘ", "*")
    s = re.sub(r"(?i)\b(φ|ф)\s*", "DN", s)
    s = re.sub(r"(?i)\b(DN|DE|D)\s*(?=\d)", "DN", s)
    return re.sub(r"\s+", "", s)


def spec_key(spec):
    return re.sub(r"DN(?=\d)", "", normalize_spec(spec))


def normalize_material_name(name):
    n = normalize_text(name)
    n = n.replace("×", "*").replace("x", "*").replace("X", "*")
    n = re.sub(r"(?<=\d)\s*度(?=(弯头|阀|角|管|接头|三通|四通))", "°", n)
    n = n.replace("（", "(").replace("）", ")").replace("，", ",").replace("。", ".")
    return re.sub(r"\s+", "", n)


def normalize_unit(unit):
    u = normalize_text(unit)
    if re.fullmatch(r"(?i)(?:DN|DE|D)?\d+(?:\.\d+)?(?:\s*[.*×]\s*\d+(?:\.\d+)?)*(?:mm|cm|m|米)?", u):
        return ""
    return {
        "m": "米",
        "M": "米",
        "M2": "平方",
        "㎡": "平方",
        "平方米": "平方",
        "KG": "公斤",
        "kg": "公斤",
        "Kg": "公斤",
        "个·": "个",
        "Pcs": "个",
        "pcs": "个",
    }.get(u, u)
