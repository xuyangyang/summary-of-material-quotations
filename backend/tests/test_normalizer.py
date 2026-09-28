from app.services.normalizer import (
    normalize_text,
    parse_material_spec,
    normalize_spec,
    spec_key,
    normalize_material_name,
)


def test_normalize_text_removes_wide_space_and_newlines():
    assert normalize_text("镀锌钢管　\n DN100") == "镀锌钢管 DN100"


def test_parse_material_spec_strips_spec_from_material():
    assert parse_material_spec("镀锌钢管 DN25", "DN25") == ("镀锌钢管", "DN25")


def test_parse_material_spec_without_spec_column_extracts_dimension():
    assert parse_material_spec("弯头 25", "") == ("弯头", "25")


def test_spec_aliases_are_normalized():
    assert normalize_spec("Dn100×65") == "DN100*65"


def test_spec_key_ignores_dn_prefixes():
    assert spec_key("DN25*15") == "25*15"


def test_material_degree_alias_is_normalized():
    assert normalize_material_name("90度弯头 DN100") == "90°弯头DN100"
