# Lydskrift-trener

En responsiv øvingsapp for norsk lydskrift, fonemoversikt og fonetikk.

## Innhold

- **Lydskrifttrener:** oppgavene fra `data/oppgaver.json`, tilfeldig rekkefølge per runde, IPA-tastatur, fasit og valgfri kontroll av vokallengde, hovedtrykk og tonelag.
- **Fonemoversikt:** konsonanter sortert etter artikulasjonsmåte og artikulasjonssted, samt vokaler med artikulasjonssted, åpningsgrad og runding. Trykk på et fonem for beskrivelse og eksempelord.
- **Fonemtrening:** quiz med flervalgsoppgaver om artikulasjonsmåte, artikulasjonssted, stemthet og vokalegenskaper.
- **Lokal progresjon:** forsøk, riktige svar og runde/oppgaveposisjon lagres i nettleserens `localStorage`.
- **Mobiltilpasning og PWA-grunnlag:** responsivt grensesnitt, webmanifest og service worker for installasjon/offline-caching over HTTPS.

## Kjøre lokalt

Siden appen henter JSON-filer med `fetch`, må den åpnes via en lokal webserver, ikke ved å dobbeltklikke på `index.html`.

For eksempel med Python installert:

```bash
python -m http.server 8000
```

Åpne så `http://localhost:8000` i nettleseren fra prosjektmappen.

## Publisere på GitHub Pages

1. Last opp alle filer og mapper til rotmappen i GitHub-repositoriet.
2. Gå til **Settings → Pages**.
3. Velg **Deploy from a branch**, velg `main` og `/(root)`.
4. Lagre, og åpne GitHub Pages-adressen som vises.

For PWA/offline-funksjoner må appen kjøres via HTTPS, slik GitHub Pages gjør. Service worker-cacheversjonen kan oppdateres i `sw.js` når du gjør en større endring.

## Endre data

- Oppgaver og svar: `data/oppgaver.json`
- Fonemdata og eksempelord: `data/phonemer.json`

Fonemoversikten er lagt inn med utgangspunkt i standard østnorsk talemål, og er noe forenkelt i forhold til IPA fonemoversikten. 
