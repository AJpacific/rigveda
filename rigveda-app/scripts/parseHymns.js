const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function parseHymn(filePath, mandala, sukta, meta = {}) {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  const title = $('h2').text().trim();
  const audioSrc = $('#hymn_audio').attr('src');

  const prevLink = $('.btn-nav').filter(function() { return $(this).find('.fa-arrow-left').length > 0; }).attr('href');
  const nextLink = $('.btn-nav').filter(function() { return $(this).find('.fa-arrow-right').length > 0; }).attr('href');

  const verses = [];
  $('.card.shadow-lg.my-5').each((i, card) => {
    const sanskritDiv = $(card).find('.hymn-sanskrit');

    const words = [];
    sanskritDiv.find('a.sanskrit-word').each((j, a) => {
      const word = $(a).clone().children('span.transliteration-word').remove().end().text().trim();
      const translit = $(a).find('span.transliteration-word').text().trim();
      words.push({ word, translit });
    });

    const lines = [];
    let currentLine = [];
    sanskritDiv.contents().each((idx, node) => {
      if (node.type === 'tag' && node.name === 'a' && $(node).hasClass('sanskrit-word')) {
        const word = $(node).clone().children('span.transliteration-word').remove().end().text().trim();
        const translit = $(node).find('span.transliteration-word').text().trim();
        currentLine.push({ word, translit });
      } else if (node.type === 'text') {
        const text = $(node).text();
        const matches = text.match(/(\|\||\|)/g);
        if (matches) {
          matches.forEach((m) => {
            if (m === '||' || m === '|') {
              currentLine.push({ sep: m });
            }
          });
        }
      } else if (node.type === 'tag' && node.name === 'br') {
        if (currentLine.length) {
          lines.push(currentLine);
          currentLine = [];
        }
      }
    });
    if (currentLine.length) {
      lines.push(currentLine);
    }
    if (!lines.length && words.length) {
      lines.push(words);
    }

    const translationHtml = $(card).find('.hymn-translation-en').html();
    const translation = translationHtml ? translationHtml.replace(/<br\s*\/?>(\s*<br\s*\/?>)?/g, '\n').replace(/<[^>]+>/g, '').trim() : '';

    const number = $(card).find('.card-footer').text().trim();

    verses.push({ number, sanskrit: words, sanskrit_lines: lines, translation });
  });

  return {
    mandala,
    sukta,
    title,
    audio: audioSrc,
    verses,
    prev: prevLink,
    next: nextLink,
    group: meta.group || null,
    stanzas: meta.stanzas || verses.length,
  };
}

function parseMandalaMeta(mandalaDir, mandala) {
  const indexPath = path.join(mandalaDir, 'index.html');
  const map = {};
  if (!fs.existsSync(indexPath)) {
    return map;
  }
  const $ = cheerio.load(fs.readFileSync(indexPath, 'utf8'));
  $('.card-body').each((_, card) => {
    const anchor = $(card).find('a.stretched-link').attr('href');
    if (!anchor) return;
    const match = anchor.match(/\/(\d+)\/(\d+)\.html$/);
    if (!match) return;
    const [, mandalaId, suktaId] = match;
    if (parseInt(mandalaId) !== mandala) return;

    const info = { group: null, stanzas: null };
    $(card).find('.hymn-info b').each((__, bold) => {
      const label = $(bold).text().replace(':', '').trim().toLowerCase();
      const valueNode = bold.nextSibling;
      const value = valueNode && valueNode.nodeValue ? valueNode.nodeValue.trim() : '';
      if (label === 'hymn group') {
        info.group = value;
      } else if (label === 'stanzas') {
        const parsed = parseInt(value, 10);
        info.stanzas = Number.isFinite(parsed) ? parsed : null;
      }
    });
    map[parseInt(suktaId, 10)] = info;
  });
  return map;
}

function processMandala(mandala) {
  const dir = path.join(__dirname, '../..', mandala.toString());
  const metaMap = parseMandalaMeta(dir, mandala);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');
  const hymns = files.map(file => {
    const sukta = parseInt(file.replace('.html', ''));
    const filePath = path.join(dir, file);
    return parseHymn(filePath, mandala, sukta, metaMap[sukta] || {});
  }).sort((a, b) => a.sukta - b.sukta);

  const output = { mandala, hymns };
  const outputPath = path.join(__dirname, '../src/data', `mandala${mandala}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Processed mandala ${mandala}`);

  return hymns;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function main() {
  const srcDataDir = path.join(__dirname, '../src/data');
  const pubDataDir = path.join(__dirname, '../public/data');
  ensureDir(srcDataDir);
  ensureDir(pubDataDir);

  const searchIndex = [];
  for (let m = 1; m <= 10; m++) {
    const hymns = processMandala(m);
    hymns.forEach((hymn) => {
      hymn.verses.forEach((verse) => {
        searchIndex.push({
          mandala: hymn.mandala,
          sukta: hymn.sukta,
          verse: verse.number,
          title: hymn.title,
          group: hymn.group,
          stanzas: hymn.stanzas,
          text: [
            verse.translation,
            ...verse.sanskrit.map((w) => `${w.word} ${w.translit}`)
          ].filter(Boolean).join(' '),
        });
      });
    });
  }
  const searchPathSrc = path.join(srcDataDir, 'searchIndex.json');
  const searchPathPub = path.join(pubDataDir, 'searchIndex.json');
  fs.writeFileSync(searchPathSrc, JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(searchPathPub, JSON.stringify(searchIndex, null, 2));
}

main();
