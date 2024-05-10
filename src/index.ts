"use strict";

import { Logger } from "sitka";
import puppeteer from "puppeteer";
import _ from "lodash";
import fs from "fs";

class Crawler {
  private _logger: Logger;
  private _url: string;
  private _target: string;
  private _ignorePages: string[] = [];
  private _outDir: string = "out";

  constructor(
    url: string,
    target: string,
    ignorePages: string[] = [],
    outDir: string = "out"
  ) {
    this._logger = Logger.getLogger({ name: this.constructor.name });
    this._url = url;
    this._target = target;
    this._ignorePages = ignorePages;
    this._outDir = outDir;
  }

  async run() {
    this._logger.debug("Starting Crawler");
    const browser = await puppeteer.launch({ headless: true });

    this._logger.debug(`Go to ${this._url}`);
    const page = await browser.newPage();
    await page.goto(this._url);

    this._logger.debug("Get all a tags element");
    const allHref = await page.evaluate(() => {
      // @ts-ignore
      return Array.from(document?.querySelectorAll("a")).map((a) => a.href);
    });

    this._logger.debug("Start crawling with each path");
    await page.close();

    for (const href of _.uniq(allHref)) {
      if (this._ignorePages.includes(href)) {
        continue;
      }

      const page = await browser.newPage();
      await page.goto(href);

      this._logger.debug(`Start crawling with ${href}`);

      const content = await page.content();

      this._logger.debug(`Done crawling with ${href}`);

      const directory = `${href
        .replaceAll("//", "_")
        .replaceAll("/", "_")}.html`;

      if (!fs.existsSync(this._outDir)) {
        fs.mkdirSync(this._outDir, { recursive: true });
      }

      fs.writeFileSync(`${this._outDir}/${directory}`, content, "utf-8");

      await page.close(); // Đóng trang sau khi hoàn thành việc crawling
    }

    browser.close();
  }
}

async function start() {
  const crawler = new Crawler(
    "https://gcore.com/docs/cloud",
    ".scully-container",
    [
      "https://gcore.com/docs/cloud",
      "https://api.gcore.com/docs",
      "https://gcore.com/",
      "https://gcore.com/docs/search",
      "https://gcore.com/docs",
    ],
    "out"
  );
  crawler.run();
}

start().catch((err) => {
  console.log(err);
});
