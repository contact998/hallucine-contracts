/**
 * Le contrat coordonnées : tolérant chez le consommateur, strict chez le
 * producteur — et jamais la table des paramètres entière.
 */
import { describe, expect, it } from "vitest";
import {
  COORDONNEES_CONTRACT_VERSION,
  coordonneesEnveloppeV1Schema,
  coordonneesEnveloppeV1StrictSchema,
  coordonneesV1Schema,
  coordonneesV1StrictSchema,
} from "./coordonnees.js";

const coordonnees = {
  tel: "+33458212010",
  telDisplay: "+33 4 58 21 20 10",
  whatsapp: "+33775728902",
  whatsappDisplay: "+33 7 75 72 89 02",
  whatsappNom: "hallucinecran",
  whatsappNomDisplay: "@hallucinecran",
  email: "contact@hallucine.fr",
  siteWeb: "www.hallucinecran.fr",
};

const enveloppe = {
  contractVersion: COORDONNEES_CONTRACT_VERSION,
  generatedAt: "2026-09-08T09:00:00.000Z",
  digest: "a".repeat(64),
  coordonnees,
};

describe("consommateur (tolérant)", () => {
  it("accepte la forme nominale", () => {
    expect(coordonneesEnveloppeV1Schema.safeParse(enveloppe).success).toBe(true);
  });

  it("IGNORE une clé inconnue — un champ ajouté côté CRM ne casse pas le site", () => {
    const lu = coordonneesV1Schema.safeParse({ ...coordonnees, fax: "+33400000000" });
    expect(lu.success).toBe(true);
    expect(lu.success && "fax" in lu.data).toBe(false);
  });

  it("accepte une version de contrat SUPÉRIEURE", () => {
    expect(coordonneesEnveloppeV1Schema.safeParse({ ...enveloppe, contractVersion: 2 }).success).toBe(true);
  });

  it("exige chacune des huit clés — un numéro absent n'est pas un numéro vide", () => {
    const { whatsappNom: _nom, ...sansNom } = coordonnees;
    expect(coordonneesV1Schema.safeParse(sansNom).success).toBe(false);
    expect(coordonneesV1Schema.safeParse({ ...coordonnees, tel: 458212010 }).success).toBe(false);
  });
});

describe("producteur (strict)", () => {
  it("n'émet QUE la version du paquet", () => {
    expect(coordonneesEnveloppeV1StrictSchema.safeParse({ ...enveloppe, contractVersion: 2 }).success).toBe(false);
  });

  it("accepte la forme nominale", () => {
    expect(coordonneesEnveloppeV1StrictSchema.safeParse(enveloppe).success).toBe(true);
  });

  it("REFUSE une clé de trop — un paramètre privé ne sort pas par cette porte", () => {
    const fuite = { ...coordonnees, iban: "FR76…" };
    expect(coordonneesV1StrictSchema.safeParse(fuite).success).toBe(false);
    expect(coordonneesEnveloppeV1StrictSchema.safeParse({ ...enveloppe, coordonnees: fuite }).success).toBe(false);
  });
});
