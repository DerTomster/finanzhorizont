# Finanzhorizont 2.3 — ETF-Spar- und Entnahmesimulator

## Version 2.3
Neu gegenüber 2.2:
- **Endvermögen bei konstanter Rendite**, im gleichen Modell mit denselben monatlichen Einzahlungen und bis zu zwei Entnahmephasen.
- **Monte-Carlo-Mittelwert** der 1.200 Endvermögen.
- Weiterhin **Monte-Carlo-Median** und **10.–90. Perzentilspanne**.
- Zusätzliche violette, gestrichelte Kurve **Konstante Rendite** in beiden Zeitreihendiagrammen.
- CSV-Export ergänzt um konstante Referenz und Monte-Carlo-Mittelwert pro Jahr.
- Eingaben aus 2.2 werden (wo browserseitig möglich) übernommen.

### Rechenkonvention
Einzahlungen erfolgen jeweils am Ende des Monats. Die konstante jährliche Rendite `r` wird monatlich mit `(1+r)^(1/12)` verzinst. Der Vergleich mit Finanztip/iShares erfolgt ohne Entnahmen, mit 0 % Inflation und nominaler Ansicht.

**Kontrollfall**: 100.000 € Startkapital, 500 € Sparrate/Monat, 4 % Effektivrendite/Jahr, 30 Jahre => 666.975,03 € (konstante Rendite).

Bei 15 % Volatilität ergibt das festgelegte 1.200-Pfade-Monte-Carlo-Modell ungefähr 667.260 € Mittelwert und 522.918 € Median. Der Mittelwert ist eine Zufallsstichprobe und stimmt nicht zwingend exakt mit dem konstanten Renditepfad überein.

Bei zwei Entnahmephasen gelten die eingestellten Monatsbeträge und die ggf. aktivierte Dynamisierung gleichermaßen für Monte Carlo und konstanten Pfad. Bei sehr schlechten Marktverläufen wird ein Depot nie unter 0 € geführt: nicht erfüllte Entnahmen werden separat als Zahlungslücke gewertet.

### Website auf GitHub Pages
1. Neues öffentliches Repository anlegen (z. B. `finanzhorizont`).
2. `index.html`, `styles.css`, `app.js` und diese `README.md` im **Hauptverzeichnis** hochladen.
3. Repository → Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.
4. Website-Adresse unter `https://BENUTZERNAME.github.io/finanzhorizont/` aufrufen.

### Offline-Nutzung
Die Datei `Finanzhorizont_2_3_Standalone.html` (separat bereitgestellt) kann auf einem PC direkt im Browser geöffnet werden. Auf iOS kann die Vorschau lokaler HTML-Dateien eingeschränkt sein; eine veröffentlichte HTTPS-Seite in Safari ist zuverlässiger.

### Einschränkungen
Reine Modellrechnung, keine Anlageberatung. Historische ETF- und Inflationskennzahlen sind fest hinterlegte Beispiele, keine Live-Daten. Annahmen zu Rendite und Volatilität sind keine Prognosen. Das Modell erfasst u. a. keine individuellen Steuern, Gebühren und Veränderungen der Korrelationen/Extremrisiken. Ein positiver Median garantiert keinen Kapitalerhalt.
