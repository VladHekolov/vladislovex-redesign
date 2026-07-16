from pathlib import Path

APP = Path('assets/js/app.js')
CSS = Path('assets/css/offer-refresh.css')
INDEX = Path('index.html')

app = APP.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')
index = INDEX.read_text(encoding='utf-8')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, found {count}')
    return source.replace(old, new, 1)


app = replace_once(
    app,
    "        '<div class=\"vh-offer-adv\">' +",
    "        '<div class=\"vh-offer-adv' + (item.note ? ' has-note' : '') + '\">' +",
    'advantage note class',
)

app = replace_once(
    app,
    """          '<div class=\"vh-offer-advantages\">' + advantagesHtml + '</div>' +
          '<div class=\"vh-offer-small-info\">Дата закрепляется после подтверждения бронирования.</div>' +
        '</div>' +""",
    """          '<div class=\"vh-offer-advantages\">' + advantagesHtml + '</div>' +
        '</div>' +
        '<div class=\"vh-offer-small-info\">Дата закрепляется после подтверждения бронирования.</div>' +""",
    'booking note placement',
)

css_addition = r'''

/* Offer final spacing polish */
.vh-offer-option > div:last-child {
  font-size: 15px !important;
  line-height: 1.12 !important;
  font-weight: 800 !important;
  letter-spacing: .01em !important;
}

.vh-offer-value-card {
  padding: 18px 22px 20px !important;
  background: linear-gradient(135deg, rgba(246, 138, 31, .14), rgba(255, 255, 255, .05)) !important;
}

.vh-offer-value-copy {
  margin: 0 0 18px !important;
}

.vh-offer-adv {
  position: relative !important;
  min-height: 102px !important;
  padding: 12px 14px !important;
  row-gap: 6px !important;
}

.vh-offer-adv.has-note {
  padding-bottom: 28px !important;
}

.vh-offer-adv.has-note .vh-offer-adv-note {
  position: absolute;
  left: 50%;
  bottom: 7px;
  margin: 0 !important;
  transform: translateX(-50%);
  white-space: nowrap;
}

.vh-offer-cost-row--optional > b {
  display: grid !important;
  grid-template-columns: 64px max-content !important;
  column-gap: 7px !important;
  align-items: center !important;
  justify-content: start !important;
}

.vh-offer-optional-price {
  width: 64px;
  text-align: right;
}

.vh-offer-optional-status {
  justify-self: start;
}

.vh-offer-small-info {
  margin: 7px 10px 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: none !important;
  color: rgba(39, 35, 31, .42) !important;
  font-size: 7.2px !important;
  line-height: 1.3 !important;
  font-weight: 500 !important;
  letter-spacing: .02em !important;
  text-align: right !important;
}
'''

marker = '/* Offer final spacing polish */'
if marker in css:
    raise RuntimeError('CSS final spacing block already exists')
css = css.rstrip() + css_addition + '\n'

index = replace_once(
    index,
    '/assets/css/offer-refresh.css?v=20260716-5',
    '/assets/css/offer-refresh.css?v=20260716-6',
    'offer CSS cache version',
)

APP.write_text(app, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
INDEX.write_text(index, encoding='utf-8')
