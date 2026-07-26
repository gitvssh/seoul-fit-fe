from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from unittest import TestCase


SCRIPT = Path(__file__).parents[1] / "report_sonar_issues.py"
SPEC = spec_from_file_location("report_sonar_issues", SCRIPT)
assert SPEC and SPEC.loader
MODULE = module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ReportSonarIssuesTest(TestCase):
    def test_formats_project_relative_location(self) -> None:
        issue = {
            "severity": "MAJOR",
            "rule": "typescript:S1234",
            "component": "seoul-fit-frontend:src/example.ts",
            "line": 42,
            "message": "Example message",
        }

        result = MODULE.format_issue("seoul-fit-frontend", issue)

        self.assertIn("src/example.ts:42", result)
        self.assertIn("typescript:S1234", result)
        self.assertNotIn("seoul-fit-frontend:", result)
