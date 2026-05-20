# IF-052-chatgpt-direktlink

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `backlog`

---

## Zusammenfassung

Neben dem Kopier-Button auf der ChatGPT-Import-Seite gibt es einen
„In ChatGPT oeffnen"-Button, der den Prompt URL-kodiert direkt in einem
neuen ChatGPT-Tab oeffnet. Nutzer muss nur noch Fotos anhaengen.

---

## Kontext

Aktuell muessen Nutzer den Prompt erst aufklappen, dann kopieren, dann
ChatGPT manuell oeffnen und den Prompt einfuegen. Das sind vier Schritte
fuer eine Vorbedingung, bevor ueberhaupt analysiert werden kann.

ChatGPT unterstuetzt vorausgefuellte Prompts ueber den URL-Parameter `q`:
`https://chatgpt.com/?q=<URL-kodierter Text>`

Dieses Ticket ist ein kurzfristiger Quick-Win. Langfristig wird der
ChatGPT-Import durch direkte Vision-Integration (packages/vision) abgeloest.

---

## Anforderungen

- Auf der ChatGPT-Import-Seite (`/projects/[id]/import`) gibt es einen
  zweiten Button neben „Prompt kopieren": „In ChatGPT oeffnen".
- Klick oeffnet `https://chatgpt.com/?q=<encodeURIComponent(MANUAL_PROMPT)>`
  in einem neuen Tab (`target="_blank"`, `rel="noopener noreferrer"`).
- Der Button ist immer sichtbar (kein Aufklappen der Prompt-Sektion noetig).
- Beide Buttons — Kopieren und Direktlink — koennen nebeneinander existieren.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `apps/api/app/projects/[id]/import/page.tsx` | „In ChatGPT oeffnen"-Button hinzufuegen |

---

## Implementierungshinweis

```tsx
<a
  href={`https://chatgpt.com/?q=${encodeURIComponent(MANUAL_PROMPT)}`}
  target="_blank"
  rel="noopener noreferrer"
  style={secondaryButtonStyle}
>
  In ChatGPT oeffnen
</a>
```

Da es ein einfacher Link ist, wird kein `onClick`-Handler benoetigt.

---

## Akzeptanzkriterien

- [ ] Button „In ChatGPT oeffnen" ist auf der Import-Seite sichtbar, ohne
      die Prompt-Sektion aufklappen zu muessen.
- [ ] Klick oeffnet ChatGPT in einem neuen Tab mit vorausgefuelltem Prompt.
- [ ] Bestehender „Prompt kopieren"-Button ist nicht beeintraechtigt.
- [ ] `pnpm typecheck` und `pnpm lint` laufen fehlerfrei durch.

---

## Abhaengigkeiten

- Hinweis: IF-047 (Prompt direkt kopieren ohne Aufklappen) sollte zusammen
  oder zuerst implementiert werden — beide Tickets verbessern denselben
  Bereich der Import-Seite.

---

## Review: REVIEW-IF-052 (nach Implementierung)