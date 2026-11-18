from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--allow-file-access-from-files"])
    for m in ['back','front','frontns']:
        pg=b.new_page(viewport={"width":1440,"height":800},device_scale_factor=2)
        pg.goto("file:///home/claude/hero/scene.html#"+m); pg.wait_for_timeout(700)
        pg.screenshot(path=f"L-{m}.png",omit_background=(m!='back'))
    b.close()
