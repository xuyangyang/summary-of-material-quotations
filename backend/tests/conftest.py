import os
import tempfile
from pathlib import Path

_TEST_DB = Path(tempfile.gettempdir()) / "material_analysis_tests.sqlite"
if _TEST_DB.exists():
    _TEST_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB.as_posix()}"
