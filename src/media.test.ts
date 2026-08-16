/**
 * Le contrat média : tolérant chez le consommateur, strict chez le producteur.
 * Ces tests sont la définition exécutable de la règle « additif uniquement ».
 */
import { describe, expect, it } from "vitest";
import {
  MEDIA_CONTRACT_VERSION,
  mediaCollectionV1Schema,
  mediaCollectionV1StrictSchema,
  mediaItemV1Schema,
  mediaItemV1StrictSchema,
} from "./media.js";

const item = {
  id: 42,
  url: "https://crm.hallucinecran.fr/api/public-media/42",
  mimeType: "image/webp",
  width: 1600,
  height: 900,
  alt: "Écran gonflable au crépuscule",
  titre: null,
  alts: { de: "Aufblasbare Leinwand in der Dämmerung" },
  titres: {},
  posterUrl: null,
  categorie: "realisations",
};

const collection = {
  contractVersion: MEDIA_CONTRACT_VERSION,
  generatedAt: "2026-08-15T08:00:00.000Z",
  digest: "a".repeat(64),
  items: [item],
};

describe("consommateur (tolérant)", () => {
  it("accepte la forme nominale", () => {
    expect(mediaCollectionV1Schema.safeParse(collection).success).toBe(true);
  });

  it("IGNORE une clé inconnue — un champ ajouté côté CRM ne casse pas le site", () => {
    const avecChampFutur = { ...item, focale: "35mm" };
    const lu = mediaItemV1Schema.safeParse(avecChampFutur);
    expect(lu.success).toBe(true);
    expect(lu.success && "focale" in lu.data).toBe(false);
  });

  it("accepte une version de contrat SUPÉRIEURE — v2 additif reste lisible", () => {
    expect(
      mediaCollectionV1Schema.safeParse({ ...collection, contractVersion: 2 }).success,
    ).toBe(true);
  });

  it("refuse un média sans identifiant ou sans url — inutilisable côté site", () => {
    expect(mediaItemV1Schema.safeParse({ ...item, id: undefined }).success).toBe(false);
    expect(mediaItemV1Schema.safeParse({ ...item, url: 12 }).success).toBe(false);
  });

  it("exige null explicite, pas l'absence — la projection CRM écrit les 11 clés", () => {
    const { titre: _titre, ...sansTitre } = item;
    expect(mediaItemV1Schema.safeParse(sansTitre).success).toBe(false);
  });

  it("exige les cartes de traduction, même vides — absentes, le site croirait à un média sans langue", () => {
    const { alts: _alts, ...sansAlts } = item;
    expect(mediaItemV1Schema.safeParse(sansAlts).success).toBe(false);
    expect(mediaItemV1Schema.safeParse({ ...item, alts: {} }).success).toBe(true);
  });

  it("refuse une carte de traduction qui ne serait pas du texte", () => {
    expect(mediaItemV1Schema.safeParse({ ...item, alts: { de: 42 } }).success).toBe(false);
  });
});

describe("producteur (strict)", () => {
  it("n'émet QUE la version du paquet — le tolérant accepte l'avenir, pas le strict", () => {
    expect(
      mediaCollectionV1StrictSchema.safeParse({ ...collection, contractVersion: 2 }).success,
    ).toBe(false);
  });

  it("accepte la forme nominale", () => {
    expect(mediaCollectionV1StrictSchema.safeParse(collection).success).toBe(true);
  });

  it("REFUSE une clé de trop — une fuite d'allowlist doit échouer avant d'être émise", () => {
    const fuite = { ...item, fileKey: "r2/interne/42.webp" };
    expect(mediaItemV1StrictSchema.safeParse(fuite).success).toBe(false);
    expect(
      mediaCollectionV1StrictSchema.safeParse({ ...collection, items: [fuite] }).success,
    ).toBe(false);
  });
});
