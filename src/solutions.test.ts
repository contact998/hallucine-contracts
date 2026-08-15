/**
 * Le contrat solutions : la forme du producteur fait loi, et les champs
 * DÉRIVÉS (formule, audience, tailleM) sont nullables parce qu'une
 * désignation hors format les rend introuvables.
 */
import { describe, expect, it } from "vitest";
import {
  SOLUTIONS_CONTRACT_VERSION,
  SOLUTIONS_V1_PATH,
  solutionV1Schema,
  solutionV1StrictSchema,
  solutionsCollectionV1Schema,
  solutionsCollectionV1StrictSchema,
} from "./solutions.js";

const solution = {
  reference: "SOL-CONF-400",
  formule: "Confort",
  audience: 400,
  tailleM: 6,
  ecranDesignation: "Écran gonflable 6 m",
  projecteur: "Epson EB-L265F",
  son: "Enceinte 300 W",
  accessoires: "Kit d'ancrage",
  prixHT: 8900,
};

const collection = {
  contractVersion: 1,
  generatedAt: "2026-08-15T08:00:00.000Z",
  digest: "a".repeat(64),
  items: [solution],
};

describe("consommateur (tolérant)", () => {
  it("accepte une solution complète", () => {
    expect(solutionV1Schema.safeParse(solution).success).toBe(true);
    expect(solutionsCollectionV1Schema.safeParse(collection).success).toBe(true);
  });

  it("accepte les DÉRIVÉS absents — une désignation hors format les rend nuls", () => {
    // « Pack sur mesure » ne contient ni formule reconnue ni « ~400 » : les
    // regex ne trouvent rien, et c'est un cas normal, pas une anomalie.
    const surMesure = {
      ...solution,
      formule: null,
      audience: null,
      tailleM: null,
      ecranDesignation: null,
      projecteur: null,
      son: null,
      accessoires: null,
    };
    expect(solutionV1Schema.safeParse(surMesure).success).toBe(true);
  });

  it("exige audience en NOMBRE — le site le déclarait en chaîne", () => {
    expect(solutionV1Schema.safeParse({ ...solution, audience: "400 spectateurs" }).success).toBe(false);
  });

  it("refuse un prix en chaîne — le symptôme d'une projection contournée", () => {
    expect(solutionV1Schema.safeParse({ ...solution, prixHT: "8900.00" }).success).toBe(false);
  });

  it("IGNORE une clé inconnue — l'additif rendu mécanique", () => {
    const lu = solutionV1Schema.safeParse({ ...solution, garantieAns: 5 });
    expect(lu.success).toBe(true);
    expect(lu.success && "garantieAns" in lu.data).toBe(false);
  });

  it("exige null explicite, pas l'absence", () => {
    const { formule: _f, ...sans } = solution;
    expect(solutionV1Schema.safeParse(sans).success).toBe(false);
  });

  it("tolère une version future — le producteur se fige, pas lui", () => {
    expect(solutionsCollectionV1Schema.safeParse({ ...collection, contractVersion: 2 }).success).toBe(true);
  });
});

describe("producteur (strict)", () => {
  it("accepte la forme nominale", () => {
    expect(solutionsCollectionV1StrictSchema.safeParse(collection).success).toBe(true);
  });

  it("REFUSE une clé de trop — une fuite échoue avant d'être émise", () => {
    // Le pack est assemblé depuis la nomenclature : un coût de composant qui
    // remonterait dans la ligne doit échouer, pas partir en clair.
    expect(solutionV1StrictSchema.safeParse({ ...solution, coutAchatEstime: 5200 }).success).toBe(false);
    expect(solutionV1StrictSchema.safeParse({ ...solution, prixAchatEur: 5200 }).success).toBe(false);
  });

  it("n'émet QUE la version du paquet", () => {
    expect(solutionsCollectionV1StrictSchema.safeParse({ ...collection, contractVersion: 2 }).success).toBe(false);
  });
});

describe("le chemin et la version", () => {
  it("sont au contrat", () => {
    expect(SOLUTIONS_V1_PATH).toBe("/api/public/v1/solutions");
    expect(SOLUTIONS_CONTRACT_VERSION).toBe(1);
  });
});
