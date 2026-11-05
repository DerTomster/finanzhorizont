# Finanzhorizont 2.4 — ETF-Spar- und Entnahmesimulator

## Neue Darstellung in Version 2.4
- **Monte-Carlo-Median** bleibt der zentrale Endvermögenswert und die durchgezogene türkisfarbene Zeitreihenkurve.
- **10.–90. Perzentilbereich** zeigt die Modellunsicherheit als farbige Fläche (und als Ergebniswerte).
- **Konstante Rendite** bleibt die violette gestrichelte Referenzkurve in den zwei Zeitreihendiagrammen und die Vergleichszahl im Ergebnisbereich.
- **Monte-Carlo-Mittelwert** wird weiterhin berechnet, erscheint aber nur noch im aufklappbaren Abschnitt **„Weitere statistische Kennzahlen“** mit Einordnung.
- Die Monte-Carlo-Erfolgswahrscheinlichkeiten, alle Spar- und Entnahmephasen, ETF-Auswahl, Inflation und der CSV-Export bleiben erhalten.
- Neue Asset-Dateipfade mit `?v=24` vermeiden das Anzeigen einer veralteten Browser-Cache-Version bei GitHub Pages.
- Einstellungen von Version 2.3 und älteren Versionen werden soweit möglich übernommen.

## Kontrollfall
100.000 € Startkapital, 500 €/Monat, 4 % effektive Jahresrendite, 30 Jahre, keine Entnahme, 0 % Inflation: **666.975,03 €** konstante Rendite. Monatliche Zahlungen am Monatsende.

## GitHub Pages aktualisieren
1. Die Dateien `index.html`, `app.js`, `styles.css` und `README.md` aus diesem ZIP ins **Hauptverzeichnis** des bestehenden GitHub-Repositories hochladen und gleichnamige Dateien ersetzen.
2. Unter **Actions** den erfolgreichen Pages-Deploy prüfen.
3. Website neu laden oder in einem privaten Browserfenster testen. Oben rechts muss **V2.4** stehen.
4. GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`.

## Offline-Nutzung
Die separat gelieferte Standalone-HTML-Datei enthält CSS und JavaScript vollständig inline und ist auf Desktop-Browsern ohne Netzwerkverbindung ausführbar. Auf dem iPhone Safari die gehostete HTTPS-Seite verwenden.

## Einschränkungen
Keine Anlageberatung; Simulation mit vereinfachten lognormalen Renditen und fest hinterlegten ETF-/Inflationsreferenzdaten. Keine Steuern, individuellen Depotgebühren, Extreme-Risk-Modelle oder garantierten Renditen. Ein Median ist keine Garantie.
