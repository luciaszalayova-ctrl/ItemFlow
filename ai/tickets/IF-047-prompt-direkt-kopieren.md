# IF-047-prompt-direkt-kopieren

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Neben dem Button „Prompt anzeigen" einen zweiten Button „Prompt kopieren"
einblenden, damit der Prompt ohne vorheriges Aufklappen direkt in die
Zwischenablage kopiert werden kann.

---

## Kontext

Auf der ChatGPT-Import-Seite (`/projects/[id]/import`) gibt es eine
aufklappbare Sektion mit dem ChatGPT-Analyse-Prompt. Der Kopier-Button
erscheint erst nach dem Aufklappen (im geklappten Zustand nicht sichtbar).
Typischer Nutzer-Flow: Prompt kopieren → in ChatGPT einfügen. Dafür ist das
Aufklappen ein unnötiger Zwischenschritt.

Betroffene Datei: `apps/api/app/projects/[id]/import/page.tsx`, Zeilen 116–154.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/import/page.tsx    ÄNDERN
```

---

## Implementierungsdetails

Im Header-Bereich der Prompt-Sektion (aktuell `display: flex`, `justifyContent:
space-between`) den Button-Bereich auf zwei Buttons erweitern:

```tsx
<div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
  <button
    type="button"
    onClick={() => void handleCopyPrompt()}
    style={{
      ...secondaryButtonStyle,
      background: promptCopied ? '#1f6f5f' : '#efe6d6',
      color: promptCopied ? '#ffffff' : '#4e463b',
    }}
  >
    {promptCopied ? 'Prompt kopiert ✓' : 'Prompt kopieren'}
  </button>
  <button
    type="button"
    onClick={() => setShowPrompt((current) => !current)}
    style={secondaryButtonStyle}
  >
    {showPrompt ? 'Prompt ausblenden' : 'Prompt anzeigen'}
  </button>
</div>
```

Der bestehende „Prompt kopieren"-Button innerhalb des aufgeklappten Bereichs
(Zeilen 139–151) kann entfernt werden — er ist nach dieser Änderung redundant.

`handleCopyPrompt` und `promptCopied`-State sind bereits vorhanden und müssen
nicht angepasst werden.

---

## Akzeptanzkriterien

- [ ] „Prompt kopieren"-Button ist im Header sichtbar, unabhängig vom
      Aufklapptatus der Sektion
- [ ] Klick kopiert `MANUAL_PROMPT` in die Zwischenablage (identisches
      Verhalten wie der bisherige Button im aufgeklappten Bereich)
- [ ] Button wechselt für ~2 s auf „Prompt kopiert ✓" (grüner Hintergrund)
      — genau wie bisher
- [ ] „Prompt anzeigen" / „Prompt ausblenden" funktioniert weiterhin korrekt
- [ ] Der redundante Kopier-Button innerhalb der aufgeklappten Sektion ist
      entfernt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- IF-033 / IF-034 (ChatGPT-Import) — bereits gemergt

---

## Referenzen

Review: REVIEW-IF-047 (nach Implementierung)