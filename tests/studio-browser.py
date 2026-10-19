"""Interactive regression. python3 tests/studio-browser.py (requires Playwright + chromium)."""
import math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
from playwright.sync_api import sync_playwright
# No network access is needed: exercise static app HTML/CSS/JS directly in Chromium.
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1020})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((ROOT/'trussvision/workbench.html').read_text())
 page.add_style_tag(content=(ROOT/'trussvision/workbench.css').read_text())
 for script in ['core/engine.js','core/adapter.js','core/editor.js','core/examples.js','gemini-client.js','workbench.js']:
  page.add_script_tag(content=(ROOT/'trussvision'/script).read_text())
 assert page.locator('#modelCanvas').is_visible()
 assert 'FIXED' in page.locator('#model').input_value().upper() or 'fixed' in page.locator('#model').input_value()
 page.locator('#solve').click()
 assert 'EQUILIBRIUM CHECKED' in page.locator('#status').inner_text(),page.locator('#error').inner_text()
 assert '18,000' in page.locator('#result').inner_text(),page.locator('#result').inner_text()
 page.screenshot(path=str(Path('/tmp')/'trussvision-studio-browser.png'),full_page=True)
 print('PASS initial rigid-body example reaction')
 page.locator('#editMode').select_option('truss2d')
 page.locator('#newCanvas').click()
 def click_world(x,y):
  camera=page.evaluate('''() => { const ns=[...document.querySelectorAll('#modelCanvas line')]; return {bounds:document.querySelector('#modelCanvas').getBoundingClientRect().toJSON()};}''')
  # after new blank model, camera is 48px per m with 400,230 center
  b=page.locator('#modelCanvas').bounding_box();page.mouse.click(b['x']+(400+48*x)*b['width']/800,b['y']+(230-48*y)*b['height']/460)
 for x,y in [(0,0),(4,0),(2,3)]:click_world(x,y)
 assert page.locator('[data-kind="node"]').count()==3
 page.locator('[data-tool="member"]').click()
 def click_node(name):page.locator(f'[data-kind="node"][data-id="{name}"]').click(force=True)
 for a,b in [('A','B'),('A','C'),('B','C')]:click_node(a);click_node(b)
 assert page.locator('[data-kind="members"]').count()==3
 page.locator('[data-tool="pin"]').click();click_node('A')
 page.locator('[data-tool="roller"]').click();click_node('B')
 page.locator('#forceY').fill('-10');page.locator('#forceUnit').select_option('kN')
 page.locator('[data-tool="force"]').click();click_node('C')
 page.locator('#reviewed').check();page.locator('#solve').click()
 assert 'EQUILIBRIUM CHECKED' in page.locator('#status').inner_text()
 assert page.locator('#result').get_by_text('compression',exact=False).count()>0
 before=page.evaluate('JSON.parse(document.querySelector("#model").value).nodes[1].at.value[0]')
 page.locator('#lengthUnit').select_option('ft')
 after=page.evaluate('JSON.parse(document.querySelector("#model").value).nodes[1].at.value[0]')
 assert math.isclose(before,after*.3048,rel_tol=1e-8)
 print('PASS truss edit + physical unit conversion + solved tension/compression')
 page.locator('#editMode').select_option('spring');page.locator('#newCanvas').click()
 click_world(0,3);click_world(0,0)
 page.locator('[data-tool="spring"]').click();click_node('A');click_node('B')
 page.locator('[data-tool="force"]').click();click_node('B');page.locator('#reviewed').check();page.locator('#solve').click()
 assert 'EQUILIBRIUM CHECKED' in page.locator('#status').inner_text(),page.locator('#error').inner_text()
 print('PASS spring attachment + solved stiffness')
 page.locator('#editMode').select_option('ideal_pulley');page.locator('#newCanvas').click()
 click_world(0,2);click_world(0,0)
 page.locator('[data-tool="pulley"]').click();click_node('B')
 page.locator('[data-tool="force"]').click();click_node('B')
 page.locator('#reviewed').check();page.locator('#solve').click()
 assert 'EQUILIBRIUM CHECKED' in page.locator('#status').inner_text(),page.locator('#error').inner_text()
 assert 'Tension in each strand' in page.locator('#result').inner_text()
 print('PASS pulley attached + ideal rope tension')
 # Check every example through the actual browser button, not only the solver in Node.
 example_values=page.locator('#demo option').evaluate_all('(xs)=>xs.map(x=>x.value)')
 for ex in example_values:
  page.locator('#demo').select_option(ex);page.locator('#loadExample').click()
  page.locator('#reviewed').check();page.locator('#solve').click()
  assert page.locator('#status').inner_text()=='EQUILIBRIUM CHECKED', f'{ex}: {page.locator("#error").inner_text()}'
 print(f'PASS {len(example_values)} interactive browser examples')
 # A failed imported extraction must clear stale previous numerical results.
 page.locator('#sceneFile').set_input_files({'name':'incomplete.json','mimeType':'application/json','buffer':b'{"kind":"machine3d","nodes":[],"physics":null,"summary":"bearing reactions"}'})
 page.wait_for_function('document.querySelector("#status").textContent==="CHECK MODEL"', timeout=5000)
 assert not page.locator('#model').input_value(), 'Unsafe: previous successful model remained after a failed import'
 assert page.locator('#result').get_by_text('No verified numerical result',exact=False).count()==1
 print('PASS a failed scan cannot leave old answers visible')
 assert not errors,errors
 browser.close()
