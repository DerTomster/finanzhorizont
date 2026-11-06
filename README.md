# Finanzhorizont 2.5 — ETF-Spar- und Entnahmesimulator

## Änderungen gegenüber 2.4

Die Ergebnisübersicht enthält **sechs** Kennzahlen in dieser Reihenfolge:

1. Monte-Carlo-Median-Endvermögen (hervorgehoben)
2. Monte-Carlo-Mittelwert (arithmetischer Durchschnitt der 1.200 Verläufe)
3. Endvermögen bei konstanter Rendite
4. Vermögen bei Ruhestand 1 (Median)
5. Vermögen bei Ruhestand 2 (Median)
6. 10.–90.-Perzentilspanne

Die beiden redundanten Einzelkarten für das 10. und 90. Perzentil sind entfallen. Der Mittelwert ist direkt sichtbar. Im aufklappbaren Bereich werden die Kennzahlen erläutert, aber nicht nochmals als Zahl angezeigt.

**Wichtig:** Der Schalter „Heutige Kaufkraft / Nominal“ wirkt auf **alle sechs Kennzahlen**, einschließlich der Vermögen bei Beginn von Ruhestand 1 und Ruhestand 2. Für die Kaufkraftdarstellung wird jeder Wert mit der kumulierten Inflation *bis zu seinem jeweiligen Zeitpunkt* deflationiert. Beide Diagramme zeigen wie bisher den Monte-Carlo-Median, die 10.–90.-Perzentilspanne und die Referenzkurve bei konstanter Rendite.

Alle bisherigen Modellannahmen und Funktionen der Version 2.4 (zwei Ruhestandsphasen, Kapitalerhalt, Entnahmen, ETF-/Inflationsannahmen, CSV-Export) bleiben erhalten.

## Kontrollrechnung

100.000 € Startkapital, 500 €/Monat, 4 % effektive Jahresrendite, 30 Jahre, keine Entnahme, 0 % Inflation: **666.975,03 €** bei konstanter Rendite (Einzahlungen am Monatsende).

## GitHub Pages aktualisieren

1. Die **vier entpackten Dateien** `index.html`, `app.js`, `styles.css` und `README.md` in das **Hauptverzeichnis** des bestehenden Repositories hochladen und gleichnamige Dateien ersetzen. Nicht die ZIP-Datei selbst hochladen.
2. Unter **Actions** auf einen erfolgreichen Pages-Deploy prüfen.
3. Die Website neu laden oder im privaten Browserfenster öffnen. Oben rechts muss **V2.5** stehen.
4. Die geänderten Pfade `styles.css?v=25` und `app.js?v=25` helfen gegen Browser-Caching alter Dateien.

## Offline-Nutzung

Die separate Standalone-HTML-Datei enthält CSS und JavaScript direkt im Dokument und benötigt auf dem PC keine Internetverbindung. Auf iPhones ist die über HTTPS gehostete Website zuverlässiger als eine HTML-Dateivorschau.

## Einschränkungen

Die Marktrenditen folgen einem vereinfachten lognormalen Modell mit 1.200 simulierten Pfaden. Die hinterlegten ETF- und Inflationsreferenzdaten sind statisch. Keine Steuern, zusätzlichen individuellen Depotgebühren oder sichere Renditeprognosen. Die Monte-Carlo-Werte sind modellabhängig, keine Garantie.
