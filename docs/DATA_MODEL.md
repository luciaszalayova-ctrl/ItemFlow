# Datenmodell

## Entitaeten

## User

Repraesentiert einen App-Nutzer.

Felder:

- id
- email
- createdAt
- settings

## Project

Eine Ausmist-Sitzung.

Felder:

- id
- userId
- title
- description
- status
- createdAt
- updatedAt

## Asset

Ein hochgeladenes Bild oder Video.

Felder:

- id
- projectId
- storageKey
- mimeType
- fileName
- sizeBytes
- width
- height
- durationSeconds
- createdAt

## ItemCandidate

Ein durch KI-Analyse erkannter moeglicher Gegenstand.

Felder:

- id
- projectId
- assetId
- rawLabel
- normalizedName
- category
- attributesJson
- confidence
- boundingBoxJson
- rawModelOutputJson
- status
- createdAt

Statuswerte:

- pending
- accepted
- rejected
- merged
- split

## InventoryItem

Ein gepruefter Gegenstand.

Felder:

- id
- projectId
- title
- category
- brand
- model
- condition
- quantity
- description
- defects
- completeness
- sourceCandidateIds
- status
- createdAt
- updatedAt

Statuswerte:

- draft
- ready_for_scoring
- scored
- listing_created
- handled

## Bundle

Eine Gruppe von Inventargegenstaenden.

Felder:

- id
- projectId
- title
- itemIds
- rationale
- status
- createdAt

## Recommendation

Eine Empfehlung fuer einen Gegenstand oder ein Bundle.

Felder:

- id
- projectId
- targetType
- targetId
- action
- expectedPriceCents
- minimumPriceCents
- effortScore
- demandScore
- confidence
- rationale
- createdAt

Aktionswerte:

- sell_individually
- bundle
- give_away
- donate
- recycle_dispose
- needs_review

## ListingDraft

Ein marktplatzreifer Entwurf.

Felder:

- id
- projectId
- targetType
- targetId
- platform
- title
- description
- priceCents
- minimumPriceCents
- category
- shippingMode
- pickupOnly
- photoAssetIds
- status
- createdAt
- updatedAt

Statuswerte:

- draft
- reviewed
- exported
- prefilled
- published_external
- archived

## MarketplaceActionLog

Protokolliert Exporte, Vorausfuellversuche oder API-Einreichungen.

Felder:

- id
- listingDraftId
- marketplace
- actionType
- status
- detailsJson
- createdAt

Aktionstypen:

- export
- copy
- prefill_started
- prefill_completed
- api_submission
- publish_confirmed
