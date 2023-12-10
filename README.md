# Julias Website

Diese Website ist für dich. Sie soll dir helfen zu kontrollieren was man über dich auf Google findet und dafür sorgen, dass mehr Menschen einen positiven Eindruck von dir bekommen. Ich hoffe du hast etwas davon ❤️

## Wie du deine Website bearbeitest

Du befindest dich grade im Github deiner neuen Website.

Du brauchst Node. Das installierst du am besten mit [Homebrew](https://brew.sh/). Homebrew ist ein Paketmanager für Mac. Du kannst es mit diesem Befehl installieren:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Anschließend installierst du Node Version 18 mit diesem Befehl:

```bash
brew install node@18
```

Jetzt kannst du die Website bearbeiten. Dazu musst du sie zuerst auf deinen eigenen Rechner herunterladen. Navigiere erstmal in deinen Documents Folder und da dann noch an eine passende Stelle. Das könnte z.B. so ausshenen:

In den Documents Folder navigieren:

```bash
cd ~/Documents
```

Den Ordner "Websites" erstellen und in diesen navigieren:

```bash
mkdir Websites
cd Websites
```

Jetzt kannst du die Website herunterladen.
Das machst du mit diesem Befehl:

```bash
brew install git
git clone https://github.com/felkru/juliaswebsite.git
```

Anschließend öffnest du die Website in VSCode. Das machst du mit diesem Befehl:

```bash
brew install code-cli
code juliaswebsite
```

Im Terminal von VSCode kannst du jetzt die Website starten. Drücke einfach Control + Shift + ` (die liegen alle ganz unten links). Jetzt kannst du die notwendigen Pakete installieren und den Entwicklungsserver starten. Das machst du mit diesen Befehlen:

```bash
npm install
npm run dev
```

Sobald du jetzt Änderungen an der Website vornimmst und speicherst werden diese automatisch im Browser angezeigt. Du kannst die Website unter [http://localhost:4321](http://localhost:4321) aufrufen.

### Einen Blogartikel schreiben

Blogartikel liegen unter `/src/content/blog`. Bitte tue deine Blogs dort nicht in Unterordner. Um die Artikel und Links zu sortieren gibt es das Tag system. Klickt man auf die Tags unter dem Blog kann man alle Artikel in der selben Kategorie finden und z.B. nach Deutsch und Englisch sortieren ohne manuell Ordner erstellen zu müssen. Schau dir mal [diesen Post](https://juliaels.com/blog/demo) an um zu sehen was du z.B. so in deine Blogartikel einfügen kannst. Am besten duplizierst du einfach `demo.mdx` und benennst sie um. Die Datei muss mit `.mdx` enden. Du kannst sie z.B. `mein-blogartikel.mdx` nennen.
Um Markdown zu editieren empfehle ich dir [diese](https://marketplace.visualstudio.com/items?itemName=zaaack.markdown-editor) und [diese](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) Erweiterung in VS-Code zu installieren. Jetzt machst du einen Rechtsklick auf die `.mdx` Dateie die du editieren möchtest und klickst auf `Open with markdown editor`, um zusätzlich zum Code Editor den visuellen Editor zu öffnen. Der funktioniert fast wie Word. Wenn du fertig mit dem editieren bist speicher erst im visuellen Editor und dann noch einmal im Code Editor um die Änderungen im Browser sehen zu können.

### Einen Link veröffentlichen

Links sind wie Blogartikel. Nur, dass sie oben zwischen den zwei `---` ein zusätzliches Feld haben. Das sieht so aus:

```md
---
andere Felder: "können hier stehen"
link: "https://juliaels.com/first_publication.pdf"
---

Der Inhalt unter den 3 Strichen ist bei Link-Posts egal.
```

### Text der Startseite ändern

Die Startseite liegt unter `/src/pages/index.astro`. Lass dich nicht von den vielen Zeichen einschüchtern. Du kannst den Text einfach anpassen. Speicherst du, siehst du deine Änderungen sofort im Browser.

### Blogartikel zur Startseite hinzufügen

Die Homepage zeigt die Blogartikel an bei deinen `homepage: true` gesezt wurde. Die neusten Posts zuerst, dann die älteren. Es orientiert sich an `pubDate: "aktuelles Datum"`.

### Formeln

Ich dachte mir, für dich als Physikerin könnten Formeln hilfreich sein. Also: Habe ich die Möglichkeit eingebaut mit Latex Formeln zu generieren.
Das geht so:

```md
$E = mc^2$
```

### Bilder einfügen

Leider ist das einfügen von Bilder noch nicht 100% einfach. Alle Bilder liegen unter `/src/assets`. Du kannst sie einfach in diesen Ordner kopieren und dann in deinen Blogartikel einfügen. Das machst indem du im Code-Editor an der entsprechenden Stelle folgendes einfügst:

```md
![quark](../../assets/quark.jpeg)
```

### Deinen Lebenslauf aktualisieren oder PDFs einfügen

Tatsächlich musst du deinen Lebenlauf nicht einmal als PDF einbinden. Wenn du möchtest kannst du deinen [Lebenslauf interaktiv](http://localhost:4321/interactive-resume) machen und die PDF aus dem interaktiven Lebenslauf generieren. Frag mich einfach wie das geht, falls es dich interessiert.

Ansonsten kannst du deinen Lebenslauf aber auch einfach als PDF bei Google Drive hochladen. Die Datei machst du dann öffentlich sichtbar und kopierst dir den Link. Anfangs wird der Link etwa so aussehen `https://drive.google.com/file/d/11C9tvxWAewVAvQmOwsgkgaJjbEObS7r4/view?usp=drive_link` Du musst den Link aber noch etwas anpassen. Er sollte am Ende so aussehen: `https://drive.google.com/file/d/11C9tvxWAewVAvQmOwsgkgaJjbEObS7r4/preview` Du musst also nur `view?usp=drive_link` durch `preview` ersetzen.

Anschließend kannst du die URL der PDF Komponente in der Datei `src/pages/resume.astro` anpassen. Die sieht so aus:

```html
<PDF
    src="https://drive.google.com/file/d/11C9tvxWAewVAvQmOwsgkgaJjbEObS7r4/preview"
    number_of_pages="2"
/>
```

Wenn du PDFs z.B. in einen Blogartikel einfügen möchtest lädst du die Datei wieder auf Drive hoch, generierst die Link wie oben beschrieben und fügst dann unterhalb der 3 Striche `---` folgenden Code ein:

```js
import PDF from "@components/PDF.astro";
```

Anschließend kannst du die PDF Komponente einfügen:

```html
<PDF src="link" number_of_pages="5" />
```

Mögliche Werte für number_of_pages sind 1, 2, 3, 4, 5, 10, 20. Wenn du mehr Seiten hast solltest du 1 angeben.

### Ungewöhnlichere Dinge wie z.B. interatkive Charts aus Matplotlib in deine Posts einfügen

Deine Möglichkeiten coole interaktive Dinge in deinen Blog einzufügen sind nur auf das begrenzt was Browser könnend. Viele Dinge wurden sogar schon programmiert so, dass es fast keine Arbeit ist diese zu implementieren. Beispielsweise kannst du das wie [hier](https://juliaels.com/blog/demo#paper) benutzen um ansprechender zu anderen Seiten zu verlinken:

`<HorizontalCard
    title="Die 360° Kamera aus gebogenen Siliziumsensoren für Teilchenkollisionen am CERN"
    img="../assets/setup.png"
    desc="The paper I wrote while and after I was at CERN for the first time and published at Jugend Forscht"
    url="https://juliaels.com/first_publication.pdf"
    badge="German"
/>`

Frag mich einfach wenn du eine Idee hast was du machen möchtest oder es einfach interessant findest. Ich helfe dir gerne.

### Deine Änderungen veröffentlichen

Wenn du fertig mit deinen Änderungen bist kannst du sie automatisch veröffentlichen indem du sie auf Github hochlädst. Führe dazu folgende Befehle im obersten Projektordner aus:

```bash
git add .
git commit -m "Deine Nachricht"
git push
```

Nach etwa 20 Sekunden sollte sich deine Website auch auf [juliaels.com](https://juliaels.com) aktualisiert haben.
