from pathlib import Path
p = Path('assets/js/app.js')
s = p.read_text(encoding='utf-8')
s = s.replace("Стоимость продления — <span>' + escapeHtml(data.nextHourText) + '</span>", "Стоимость продления — <span>' + escapeHtml(data.nextHourText) + '/час</span>")
s = s.replace("pdf.save('kommercheskoe-predlozhenie-vladislav-hekolov.pdf');", "pdf.save('vystuplenie-muzykanta-vladislav-hekolov.pdf');")
p.write_text(s, encoding='utf-8')
