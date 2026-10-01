# Lydskrift-trener

En liten app for øving på norsk fonemisk transkripsjon i forberedelse til fonetikkprøven ved norsk 1-7.

## Teknologi

- HTML
- CSS
- vanlig JavaScript
- JSON-data
- `localStorage` for enkel progresjon
- GitHub Pages for publisering

Ingen database og ingen backend er nødvendig.

## Mappestruktur

```text
lydskrift-trener/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── oppgaver.json
└── audio/
    └── (egne mp3/wav-filer)
```

## Starte lokalt

Åpne:

```text
http://localhost:8000
```

## Legge til en oppgave

I `data/oppgaver.json`:

```json
{
  "id": "eksempel",
  "type": "write-ipa",
  "word": "eksempel",
  "answers": ["2eksempel"]
}
```

Flere fasiter kan legges inn:

```json
{
  "id": "vannet",
  "type": "write-ipa",
  "word": "vannet",
  "answers": ["1vane", "2vanet"]
}
```

Dette er viktig fordi oppgavearkene dine faktisk har flere mulige løsninger på enkelte oppgaver.

## Lyd

Hvis du legger inn et opptak:

```text
audio/ord-001.mp3
```

kan oppgaven få:

```json
{
  "id": "ord-001",
  "type": "write-ipa",
  "word": "sær",
  "audio": "audio/ord-001.mp3",
  "answers": ["1sæ:r"]
}
```

Hvis `audio` mangler, prøver appen å bruke nettleserens norske talesyntese som fallback.

For trening på tonem og naturlig tonefall bør egne opptak brukes.

## Notasjon

Oppgavearkene bruker blant annet:

- `:` for vokallengde
- `1` og `2` for tonelag
- `'` for hovedtrykk i oppgaver som markerer trykk eksplisitt

Appen er lagt opp slik at dette kan håndteres som separate komponenter i neste utviklingssteg.

## GitHub Pages

1. Opprett et GitHub-repository.
2. Last opp filene.
3. Gå til `Settings → Pages`.
4. Velg deploy fra `main`-branch og `/ (root)`.
5. Vent på deploy.
6. Åpne GitHub Pages-adressen.

## Neste utviklingssteg

1. Gjør korrekturen smartere slik at trykk, tonem og lengde kan slås av/på uavhengig.
2. Lag egen oppgavetype for `lesing av lydskrift`.
3. Lag oppgavetype for konsonantbeskrivelse.
4. Lag oppgavetype for vokalbeskrivelse.
5. Legg inn fonotaksoppgavene.
6. Lag tilfeldig oppgavevalg og filtrering.
7. Legg inn egne lydopptak.
8. Lag import/eksport av JSON slik at du kan redigere oppgaver uten å endre JavaScript.
