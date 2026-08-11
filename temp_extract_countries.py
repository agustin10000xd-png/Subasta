from pathlib import Path
import re
text = Path('js/data.js').read_text(encoding='utf-8')
n = set(re.findall(r"nat:\s*'([^']+)'", text) + re.findall(r"nationality:\s*'([^']+)'", text) + re.findall(r"country:\s*'([^']+)'", text))
for x in sorted(n):
    print(x)
