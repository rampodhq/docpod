Document title: {{ document_title }}
Section title: {{ section_title }}
Section instructions: {{ section_instructions }}
Allowed styles: {{ allowed_styles }}
Required style implementation:
{{ style_requirements }}

Available context:
{{ context_text }}

Output schema:
{
  "section_title": "string",
  "objective": "string",
  "styles_to_apply": ["every allowed style, each listed once"],
  "outline": ["bullet 1", "bullet 2"],
  "key_points": ["point 1", "point 2"],
  "risks_or_gaps": ["gap 1", "gap 2"]
}
