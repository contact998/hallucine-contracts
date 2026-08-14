# @hallucine/contracts

Les contrats de la frontière **CRM → site** : schémas Zod et versions des
routes publiques (`/api/public/v1/…`). Aucune logique métier — les allowlists
et projections restent côté CRM ; ce paquet dit seulement la **forme** de ce
qui circule, des deux côtés.

## Règles

- **Additif uniquement.** On ajoute des champs, on n'en retire ni renomme
  jamais. Le consommateur lit avec les schémas tolérants (clés inconnues
  ignorées), le producteur valide avec les schémas stricts.
- **CRM déployé avant le site**, toujours.
- **Monter de version** : tag `vX.Y.Z` ici, puis mettre la MÊME référence
  `github:contact998/hallucine-contracts#vX.Y.Z` dans les `package.json` des
  deux dépôts + régénérer leurs lockfiles. Ne jamais déplacer un tag existant :
  les lockfiles épinglent le commit.
- **`dist/` est versionné, pas de script `prepare`** — le paquet s'installe en
  tarball GitHub sans build chez le consommateur (leçon Railway du 08/08/2026).
  `src/dist-a-jour.test.ts` garantit que `dist/` suit `src/`. Toute modif de
  `src/` exige `npm run build` dans le même commit.

## Contrats

| Contrat | Version | Producteur | Consommateur |
|---|---|---|---|
| `media` (GET `/api/public/v1/media`) | 1 | CRM `server/publicApiMedia.ts` | site `server/mediaCrmService.ts` |
