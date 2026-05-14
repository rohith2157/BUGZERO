import fitz
doc = fitz.open(r'C:\testproject\testingfromligthhouse.pdf')
with open(r'C:\testproject\lighthouse_text.txt', 'w', encoding='utf-8') as f:
    for i, page in enumerate(doc):
        f.write(f"=== PAGE {i+1} ===\n")
        f.write(page.get_text())
        f.write("\n\n")
print(f"Extracted {len(doc)} pages")
