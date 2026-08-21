/**
 * Le contrat catalogue : la tolérance protège le site de l'avenir, le strict
 * protège le public des fuites — y compris DANS l'objet specs imbriqué, là où
 * un strict de surface ne regarde pas.
 */
import { describe, expect, it } from "vitest";
import {
  CATALOGUE_CONTRACT_VERSION,
  CATALOGUE_V1_PATH,
  CATALOGUE_V1_ROLES,
  catalogueCollectionV1Schema,
  catalogueCollectionV1StrictSchema,
  catalogueItemV1Schema,
  catalogueItemV1StrictSchema,
  urlCatalogueV1,
} from "./catalogue.js";

const specs = {
  tailleHorsTout: "2,22 m × 1,74 m",
  toile: "PVC 420D",
  toileLargeurM: 2.22,
  poidsPublicKg: 9.5,
  hauteurBaseImageM: 0.5,
  montageMinutes: 10,
  personnesMin: 1,
  personnesMax: 2,
  garantieAns: 5,
  driveIn: false,
  largeurCm: null, profondeurCm: null, hauteurCm: null, placesAssises: null, hauteurAssiseCm: null,
};

const item = {
  id: 42,
  reference: "ECR-SOUF-222",
  slugSite: "ecran-soufflerie-222",
  designation: "Écran gonflable 2,22 m",
  designations: { de: "Aufblasbare Leinwand 2,22 m" },
  prixHT: 890,
  tauxTVA: 20,
  categorie: "Écrans — Vente",
  unite: "unité",
  specs,
  caracteristiques: [{ libelle: "Toile", valeur: "avant/arrière" }],
  inclus: ["Sac de transport"],
  caracteristiquesTrad: { de: [{ libelle: "Leinwand", valeur: "vorne/hinten" }] },
  inclusTrad: { de: ["Transporttasche"] },
};

/** Un pack réel : slugSite null, designations vide, specs null. */
const pack = {
  ...item,
  id: 100,
  reference: "SOL-ESSENTIEL",
  slugSite: null,
  designations: {},
  specs: null,
  caracteristiques: [],
  inclus: [],
  caracteristiquesTrad: {},
  inclusTrad: {},
};

const collection = {
  contractVersion: 1,
  generatedAt: "2026-08-15T08:00:00.000Z",
  digest: "a".repeat(64),
  role: "ecran_vente",
  items: [item, pack],
};

describe("le chemin et les rôles appartiennent au contrat", () => {
  it("construit l'URL d'un rôle", () => {
    expect(urlCatalogueV1("https://crm.example.com/", "pack")).toBe(
      "https://crm.example.com/api/public/v1/catalogue?role=pack",
    );
    expect(CATALOGUE_V1_PATH).toBe("/api/public/v1/catalogue");
  });

  it("fige les cinq rôles publics — occasion n'y entrera jamais", () => {
    expect([...CATALOGUE_V1_ROLES]).toEqual([
      "ecran_vente",
      "pack",
      "location",
      "tente_vente",
      "mobilier_vente",
    ]);
    expect(CATALOGUE_V1_ROLES).not.toContain("occasion");
  });
});

describe("consommateur (tolérant)", () => {
  it("accepte les formes réelles — écran complet ET pack aux champs null/vides", () => {
    expect(catalogueItemV1Schema.safeParse(item).success).toBe(true);
    expect(catalogueItemV1Schema.safeParse(pack).success).toBe(true);
    expect(catalogueCollectionV1Schema.safeParse(collection).success).toBe(true);
  });

  it("IGNORE une clé inconnue — l'additif rendu mécanique", () => {
    const lu = catalogueItemV1Schema.safeParse({ ...item, delaiLivraisonJours: 15 });
    expect(lu.success).toBe(true);
    expect(lu.success && "delaiLivraisonJours" in lu.data).toBe(false);
  });

  it("tolère une version et un rôle FUTURS — c'est le producteur qui se fige, pas lui", () => {
    expect(
      catalogueCollectionV1Schema.safeParse({ ...collection, contractVersion: 2, role: "mobilier" }).success,
    ).toBe(true);
  });

  it("exige null explicite, pas l'absence — la projection CRM écrit les 14 clés", () => {
    const { slugSite: _s, ...sans } = item;
    expect(catalogueItemV1Schema.safeParse(sans).success).toBe(false);
  });

  it("refuse un prix en string — le symptôme d'une projection contournée", () => {
    expect(catalogueItemV1Schema.safeParse({ ...item, prixHT: "8200.00" }).success).toBe(false);
  });
});

describe("producteur (strict)", () => {
  it("accepte la forme nominale", () => {
    expect(catalogueCollectionV1StrictSchema.safeParse(collection).success).toBe(true);
  });

  it("REFUSE une clé de trop sur l'item — une fuite d'allowlist échoue avant d'être émise", () => {
    expect(catalogueItemV1StrictSchema.safeParse({ ...item, prixAchatEur: 320 }).success).toBe(false);
  });

  it("REFUSE une clé de trop DANS specs — le strict traverse l'objet imbriqué", () => {
    // Le piège précis : z.strictObject ne contrôle pas ses enfants. Un poids
    // LOGISTIQUE glissé dans specs passerait un strict de surface.
    expect(
      catalogueItemV1StrictSchema.safeParse({ ...item, specs: { ...specs, poids: 14.2 } }).success,
    ).toBe(false);
  });

  it("accepte les cotes d'encombrement et les places assises (mobilier)", () => {
    const specsMobilier = {
      ...specs,
      largeurCm: 200, profondeurCm: 80, hauteurCm: 85, placesAssises: 2,
    };
    expect(catalogueItemV1StrictSchema.safeParse({ ...item, specs: specsMobilier }).success).toBe(true);
  });

  it("exige les quatre clés d'encombrement, même à null (contrat en présence)", () => {
    const { largeurCm, ...sansLargeur } = { ...specs };
    expect(catalogueItemV1StrictSchema.safeParse({ ...item, specs: sansLargeur }).success).toBe(false);
  });

  it("REFUSE une clé de trop dans une caractéristique traduite — strict jusqu'aux feuilles", () => {
    expect(
      catalogueItemV1StrictSchema.safeParse({
        ...item,
        caracteristiquesTrad: { de: [{ libelle: "x", valeur: "y", note: "interne" }] },
      }).success,
    ).toBe(false);
  });

  it("n'émet QUE la version du paquet et les rôles d'aujourd'hui", () => {
    expect(
      catalogueCollectionV1StrictSchema.safeParse({ ...collection, contractVersion: 2 }).success,
    ).toBe(false);
    expect(
      catalogueCollectionV1StrictSchema.safeParse({ ...collection, role: "occasion" }).success,
    ).toBe(false);
  });
});

describe("version", () => {
  it("est la 1", () => {
    expect(CATALOGUE_CONTRACT_VERSION).toBe(1);
  });
});
