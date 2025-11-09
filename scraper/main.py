import os, time, csv, argparse, sys, traceback
from urllib.parse import urljoin
from datetime import datetime

import psycopg2
from psycopg2.extras import execute_batch

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

PAGE_URL = os.getenv("PAGE_URL", "https://xgscore.io/ru/")
REMOTE_URL = os.getenv("SELENIUM_REMOTE_URL", "http://chrome:4444/wd/hub")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://xgs:xgs@db:5432/xgs")

SCRAPE_INTERVAL_SECONDS = int(os.getenv("SCRAPE_INTERVAL_SECONDS", "86400"))
RUN_AT_STARTUP = os.getenv("RUN_AT_STARTUP", "true").lower() in ("1", "true", "yes")

def log(*a):
    print(datetime.utcnow().isoformat(timespec="seconds"), "|", *a, flush=True)

def clean_text(s: str) -> str:
    return " ".join((s or "").split()).strip()

def make_driver_remote() -> WebDriver:
    opts = webdriver.ChromeOptions()
    opts.add_argument("--window-size=1366,900")
    opts.add_argument("--lang=ru-RU")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    return webdriver.Remote(command_executor=REMOTE_URL, options=opts)

def wait_dom(driver: WebDriver):
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "xgs-public-forecasts-fixtures .xgs-fixtures"))
    )

def autoscroll(driver: WebDriver, pause=0.75, max_iters=20):
    last_h = 0
    for _ in range(max_iters):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(pause)
        h = driver.execute_script("return document.body.scrollHeight;")
        if h == last_h:
            break
        last_h = h

def extract_all(driver: WebDriver):
    base = driver.current_url
    container = driver.find_element(By.CSS_SELECTOR, "xgs-public-forecasts-fixtures .xgs-fixtures")
    children = container.find_elements(By.CSS_SELECTOR, ":scope > *")

    current_tournament = None
    rows = []

    for el in children:
        if el.find_elements(By.CSS_SELECTOR, ".xgs-fixtures_header"):
            try:
                t = el.find_element(By.CSS_SELECTOR, ".bold-text").text
            except:
                t = el.text
            current_tournament = clean_text(t)
            continue

        if el.find_elements(By.CSS_SELECTOR, "xgs-public-forecast-fixture, .xgs-public-forecast-fixture.xgs-fixture"):
            card = el
            try:
                card = el.find_element(By.CSS_SELECTOR, ".xgs-public-forecast-fixture.xgs-fixture")
            except:
                pass

            try:
                a = card.find_element(By.CSS_SELECTOR, "a.xgs-fixture_link")
                href = a.get_attribute("href") or ""
                link = urljoin(base, href)
            except:
                link = ""

            try:
                kickoff = clean_text(card.find_element(By.CSS_SELECTOR, ".xgs-fixture_datetime .text-muted").text)
            except:
                kickoff = ""

            teams = card.find_elements(By.CSS_SELECTOR, ".xgs-fixture_details .xgs-fixture_team")
            home_team = clean_text(teams[0].text) if len(teams) >= 1 else ""
            away_team = clean_text(teams[-1].text) if len(teams) >= 2 else ""

            home_xg = away_xg = ""
            try:
                xg_strongs = card.find_elements(By.CSS_SELECTOR, ".xgs-public-forecast-fixture-score .xgs-mark-group strong")
                if len(xg_strongs) >= 1:
                    home_xg = clean_text(xg_strongs[0].text)
                if len(xg_strongs) >= 2:
                    away_xg = clean_text(xg_strongs[1].text)
            except:
                pass

            odd = ""
            try:
                odd = clean_text(card.find_element(By.CSS_SELECTOR, ".xgs-public-forecast-fixture_odd strong").text)
            except:
                pass

            rows.append({
                "tournament": current_tournament or "",
                "kickoff": kickoff,
                "home_team": home_team,
                "away_team": away_team,
                "home_xg": home_xg,
                "away_xg": away_xg,
                "odd": odd,
                "link": link,
                "scraped_at": datetime.utcnow().isoformat(timespec="seconds"),
            })
    return rows

DDL = """
CREATE TABLE IF NOT EXISTS xgs_fixtures (
    id SERIAL PRIMARY KEY,
    tournament TEXT NOT NULL,
    kickoff TEXT,
    home_team TEXT,
    away_team TEXT,
    home_xg DOUBLE PRECISION,
    away_xg DOUBLE PRECISION,
    odd TEXT,
    link TEXT UNIQUE,
    scraped_at TIMESTAMPTZ DEFAULT now()
);
"""

UPSERT_SQL = """
INSERT INTO xgs_fixtures (tournament, kickoff, home_team, away_team, home_xg, away_xg, odd, link, scraped_at)
VALUES (%(tournament)s, %(kickoff)s, %(home_team)s, %(away_team)s,
        NULLIF(%(home_xg)s, '')::double precision,
        NULLIF(%(away_xg)s, '')::double precision,
        NULLIF(%(odd)s, ''),
        NULLIF(%(link)s, ''),
        NOW())
ON CONFLICT (link) DO UPDATE SET
    tournament = EXCLUDED.tournament,
    kickoff    = EXCLUDED.kickoff,
    home_team  = EXCLUDED.home_team,
    away_team  = EXCLUDED.away_team,
    home_xg    = EXCLUDED.home_xg,
    away_xg    = EXCLUDED.away_xg,
    odd        = EXCLUDED.odd,
    scraped_at = NOW();
"""

def save_to_db(rows):
    if not rows:
        log("Нет данных для сохранения")
        return
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(DDL)
                execute_batch(cur, UPSERT_SQL, rows, page_size=200)
        log(f"Сохранено/обновлено: {len(rows)}")
    finally:
        conn.close()

def run_once():
    driver = make_driver_remote()
    try:
        driver.get(PAGE_URL)
        wait_dom(driver)
        autoscroll(driver)
        data = extract_all(driver)
        log(f"Собрано матчей: {len(data)}")
        save_to_db(data)
    finally:
        driver.quit()

def run_daemon():
    first = RUN_AT_STARTUP
    while True:
        try:
            if first:
                log("Стартовый запуск скрапа…")
                run_once()
                first = False
            else:
                log(f"Ждём {SCRAPE_INTERVAL_SECONDS} секунд до следующего запуска…")
                time.sleep(SCRAPE_INTERVAL_SECONDS)
                log("Плановый запуск скрапа…")
                run_once()
        except Exception as e:
            log("Ошибка в цикле:", repr(e))
            traceback.print_exc()
            # маленькая пауза, чтобы не лупить бесконечно в случае постоянной ошибки
            time.sleep(30)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--daemon", action="store_true", help="Запускать бесконечный интервал скрапа")
    args = ap.parse_args()
    if args.daemon:
        run_daemon()
    else:
        run_once()

if __name__ == "__main__":
    main()
