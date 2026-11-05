# Finanzhorizont 2.2

## Ergänzt gegenüber Version 2.1

Die App unterscheidet nun zwei verschiedene Fragen:

1. **Rechnerische Entnahme bei gleichmäßiger Rendite:** Annahme, die eingestellte Rendite wird ohne Schwankungen in jedem Monat erreicht. Für beide Entnahmephasen werden gemeinsame Beträge errechnet, die unter der eingestellten Kapitalerhaltsdefinition möglich wären. Diese Modellrechnung garantiert nichts über die tatsächliche Börsenentwicklung.
2. **Monte-Carlo-Entnahme bei gewählter Erfolgswahrscheinlichkeit:** Mit schwankenden Marktrenditen wird geprüft, ob eine Entnahme den realen oder nominalen Kapitalerhalt mit der gewählten Wahrscheinlichkeit erreicht. Wenn selbst 0 € nicht ausreichen, wird ausdrücklich „Ziel verfehlt“ gezeigt – nicht „0 € tragfähig“.

Zusätzlich wird als einfache Vergleichsgröße das Median-Depotvermögen beim Ruhestand 1 mit der effektiven realen Rendite multipliziert und auf zwölf Monate verteilt. Dies ist nur eine Orientierung und ignoriert spätere Zahlungen und unterschiedliche Entnahmephasen.

## Lokal nutzen

Die einzelne Datei `Finanzhorizont_2_2_Standalone.html` per Doppelklick im Browser öffnen. Keine Internetverbindung nötig. Eingaben werden lokal im Browser gespeichert.

## Veröffentlichung mit GitHub Pages

Die drei Dateien `index.html`, `app.js`, `styles.css` in das Stammverzeichnis eines öffentlichen GitHub-Repositories hochladen. Im Repository `Settings > Pages` die Option `Deploy from a branch`, Branch `main`, Ordner `/(root)` auswählen und speichern.

## Rechenmethodik

1.200 simulationsbasierte Renditepfade, modellierte Monatsrenditen lognormal verteilt, festes Seed für Vergleichbarkeit. Annahmen und Aktienrisiken sind stark vereinfacht. Keine Steuern, keine zusätzlichen Depotgebühren. ETF- und Inflationswerte sind statische Referenzannahmen und werden nicht live abgerufen.
