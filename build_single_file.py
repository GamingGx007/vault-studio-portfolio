import os
import base64
import re

# Source Paths
src_dir = r"C:\Users\lavah\.gemini\antigravity-ide\scratch\vault-studio"
index_path = os.path.join(src_dir, "index.html")
css_path = os.path.join(src_dir, "css", "styles.css")
assets_dir = os.path.join(src_dir, "assets")
js_dir = os.path.join(src_dir, "js")

# Target Path
target_dir = r"D:\web development\porrtfolio"
target_path = os.path.join(target_dir, "index.html")

print("Building single file portfolio...")

# 1. Read index.html
with open(index_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# 2. Read css/styles.css
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

# 3. Read image and convert to Base64
img_path = os.path.join(assets_dir, "agency-workspace.png")
with open(img_path, "rb") as f:
    img_data = f.read()
    img_base64 = base64.b64encode(img_data).decode("utf-8")
    img_data_url = f"data:image/png;base64,{img_base64}"

# Replace relative image reference in HTML with base64 data URL
html_content = html_content.replace("assets/agency-workspace.png", img_data_url)

# 4. Inline CSS (Replace stylesheet link)
stylesheet_link_pattern = r'<link rel="stylesheet" href="css/styles.css"\s*/?>'
style_tag = f"<style>\n{css_content}\n</style>"
html_content = re.sub(stylesheet_link_pattern, style_tag, html_content)

# 5. Inline JavaScript files (Replace script tags)
js_files = [
    ("js/supabase.js", "supabase.js"),
    ("js/nav.js", "nav.js"),
    ("js/animations.js", "animations.js"),
    ("js/portfolio.js", "portfolio.js"),
    ("js/contact.js", "contact.js"),
    ("js/cursor.js", "cursor.js")
]

# Read all script contents
inlined_scripts = ""
for rel_path, filename in js_files:
    file_path = os.path.join(js_dir, filename)
    with open(file_path, "r", encoding="utf-8") as f:
        script_code = f.read()
        inlined_scripts += f"\n// --- INLINED: {filename} ---\n{script_code}\n"

# Remove individual script tags from the original HTML
for rel_path, _ in js_files:
    script_tag_pattern = rf'<script src="{rel_path}"\s*></script>'
    html_content = re.sub(script_tag_pattern, "", html_content)
    # Also handle without spaces
    script_tag_pattern_alt = rf'<script src="{rel_path}"></script>'
    html_content = re.sub(script_tag_pattern_alt, "", html_content)

# Insert the single inlined script block before the closing body tag
combined_script_tag = f"<script>\n{inlined_scripts}\n</script>\n"
html_content = html_content.replace("</body>", f"{combined_script_tag}</body>")

# 6. Ensure target directory exists and write final file
if not os.path.exists(target_dir):
    os.makedirs(target_dir)

with open(target_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Successfully generated single-file HTML portfolio at: {target_path}")
print(f"File size: {os.path.getsize(target_path) / 1024:.2f} KB")
