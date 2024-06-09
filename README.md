# Alarmmonitor

Der Alarmmonitor ist eine Art Dashboard, welches Alarmdaten übersichtlich anzeigen soll. Dabei setzt die Anwendung auf React und empfängt Daten über eine Webhook.

![](assets/ScreenshotAlarmmonitor.png)

Um die Anwendung zu bauen kann [pnpm](https://pnpm.io/) verwendet werden. Über den Befehl `pnpm run build` wird der Code über [vite](https://vitejs.dev/) in eine Javascript-Datei gepackt und ist über einen Webserver auslieferbar. 

Die Pipeline in diesem Repository baut das Projekt und deployed es als Container im Kubernetes-Cluster.