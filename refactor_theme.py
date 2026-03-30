import os
import re

COMPONENTS_DIR = r"d:\the-civic-authority\src\components"

REPLACEMENTS = [
    # Inline Dark Text Colors
    (r"#1a1a2e", r"#f4f4f5"),
    (r"rgba\(26,26,46,0\.3\)", r"rgba(161,161,170,0.7)"),
    (r"rgba\(26,26,46,0\.35\)", r"rgba(161,161,170,0.8)"),
    (r"rgba\(26,26,46,0\.4\)", r"rgba(161,161,170,0.9)"),
    (r"rgba\(26,26,46,0\.45\)", r"rgba(161,161,170,0.9)"),
    (r"rgba\(26,26,46,0\.5\)", r"rgba(161,161,170,1.0)"),
    (r"rgba\(26,26,46,0\.2\)", r"rgba(161,161,170,0.5)"),
    (r"rgba\(26, 26, 46,", r"rgba(161, 161, 170,"),
    
    # Tailwind Text Classes
    (r"text-neutral-900", r"text-white"),
    (r"text-neutral-800", r"text-zinc-100"),
    (r"text-gray-900", r"text-white"),
    (r"text-gray-800", r"text-zinc-100"),
    (r"text-neutral-600", r"text-zinc-300"),
    (r"text-neutral-500", r"text-zinc-400"),
    (r"text-gray-500", r"text-zinc-400"),
    
    # Tailwind Backgrounds & Borders
    (r"\bbg-white\b", r"glass-dark"),
    (r"\bbg-neutral-50\b", r"bg-zinc-900/50"),
    (r"\bbg-gray-50\b", r"bg-zinc-900/50"),
    (r"\bbg-neutral-100\b", r"bg-zinc-800/50"),
    (r"border-neutral-100", r"border-white/5"),
    (r"border-neutral-200", r"border-white/10"),
    (r"border-gray-100", r"border-white/5"),
    (r"border-gray-200", r"border-white/10"),
]

for root, _, files in os.walk(COMPONENTS_DIR):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in REPLACEMENTS:
                new_content = re.sub(pattern, replacement, new_content)
            
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Refactored: {file}")

print("Refactoring complete.")
