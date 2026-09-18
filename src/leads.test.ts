/**
 * Le contrat lead : le producteur se discipline, le consommateur n'exclut
 * personne. Un média refusé fait un bloc vide ; un lead refusé est un client
 * perdu — et le site classe tout 4xx comme définitif, sans nouvelle tentative.
 */
import { describe, expect, it } from "vitest";
import {
  LEADS_V1_PATH,
  LEAD_CONTRACT_VERSION,
  LEAD_LIMITES,
  leadReponseV1Schema,
  leadV1ConsommateurSchema,
  leadV1ProducteurSchema,
  LEAD_CONFIGURATEUR_LIMITES,
  configurateurSchema,
  panierSchema,
} from "./leads.js";

const lead = {
  entreprise: "Mairie de Saint-Genis",
  prenom: "Claire",
  personne: "Dupont",
  email: "claire@saint-genis.fr",
  telephone: "+33 6 12 34 56 78",
  produit: "Écran 10 m",
  notes: "Source : formulaire site web hallucinecran.fr\nSéance du 14 juillet",
  ville: "Saint-Genis",
  codePostal: "01630",
  pays: "France",
  contactType: "mail" as const,
  lang: "fr" as const,
  requestId: "11111111-1111-1111-1111-111111111111",
};

describe("producteur (le site) — strict avant l'envoi", () => {
  it("accepte un lead complet et un lead minimal", () => {
    expect(leadV1ProducteurSchema.safeParse(lead).success).toBe(true);
    // Le plus maigre des cinq émetteurs : documentLead.
    expect(
      leadV1ProducteurSchema.safeParse({
        entreprise: "Particulier - x@y.fr",
        email: "x@y.fr",
        notes: "Téléchargement document site",
        lang: "de",
        requestId: "abc",
        documentType: "brochure",
        documentSlug: "ecran-etanche",
      }).success,
    ).toBe(true);
  });

  it("borne le slug du document — un code court, pas un titre", () => {
    expect(leadV1ProducteurSchema.safeParse({ ...lead, documentSlug: "ecran-etanche" }).success).toBe(true);
    expect(leadV1ProducteurSchema.safeParse({ ...lead, documentSlug: "x".repeat(LEAD_LIMITES.documentSlug + 1) }).success).toBe(false);
  });

  it("exige entreprise, lang et requestId — les trois que l'émetteur garantit", () => {
    for (const cle of ["entreprise", "lang", "requestId"]) {
      const { [cle]: _retire, ...sans } = lead as Record<string, unknown>;
      expect(leadV1ProducteurSchema.safeParse(sans).success).toBe(false);
    }
  });

  it("REFUSE une clé de trop — un émetteur qui invente un champ est un bug", () => {
    expect(leadV1ProducteurSchema.safeParse({ ...lead, budgetEstime: 5000 }).success).toBe(false);
  });

  it("refuse une valeur hors énumération plutôt que de la faire tomber en 500 SQL", () => {
    // contactType hors enum = erreur MySQL côté CRM aujourd'hui.
    expect(leadV1ProducteurSchema.safeParse({ ...lead, contactType: "sms" }).success).toBe(false);
    expect(leadV1ProducteurSchema.safeParse({ ...lead, lang: "nl" }).success).toBe(false);
    expect(leadV1ProducteurSchema.safeParse({ ...lead, documentType: "devis" }).success).toBe(false);
  });

  it("borne en OCTETS, pas en caractères — l'unité de MySQL", () => {
    // « é » pèse 2 octets : 60 caractères accentués = 120 octets, au-delà
    // d'une colonne de 100. Une borne en caractères laissait passer.
    const villeAccentuee = "é".repeat(60);
    expect(villeAccentuee.length).toBeLessThan(LEAD_LIMITES.ville);
    expect(leadV1ProducteurSchema.safeParse({ ...lead, ville: villeAccentuee }).success).toBe(false);
  });

  it("borne les longueurs aux varchar réels de la base", () => {
    expect(
      leadV1ProducteurSchema.safeParse({ ...lead, ville: "x".repeat(LEAD_LIMITES.ville + 1) }).success,
    ).toBe(false);
    expect(
      leadV1ProducteurSchema.safeParse({ ...lead, ville: "x".repeat(LEAD_LIMITES.ville) }).success,
    ).toBe(true);
  });

  it("laisse passer des notes très longues — le configurateur en écrit", () => {
    expect(leadV1ProducteurSchema.safeParse({ ...lead, notes: "x".repeat(20000) }).success).toBe(true);
  });

  it("omet plutôt que null : le contrat suit l'émetteur historique", () => {
    // Dérogation assumée au patron des autres contrats — changer l'émetteur
    // aurait fait porter un risque au flux le plus précieux.
    expect(leadV1ProducteurSchema.safeParse({ ...lead, ville: null }).success).toBe(false);
    const { ville: _v, ...sansVille } = lead;
    expect(leadV1ProducteurSchema.safeParse(sansVille).success).toBe(true);
  });
});

describe("consommateur (le CRM) — n'exclut personne", () => {
  it("n'exige QUE entreprise, comme la route historique", () => {
    expect(leadV1ConsommateurSchema.safeParse({ entreprise: "Acme" }).success).toBe(true);
    expect(leadV1ConsommateurSchema.safeParse({ email: "x@y.fr" }).success).toBe(false);
    expect(leadV1ConsommateurSchema.safeParse({ entreprise: "   " }).success).toBe(false);
  });

  it("ACCEPTE ce que le producteur refuserait — un 400 ici est un client perdu", () => {
    // Longueurs hors bornes, enum inconnue, champ inventé : tout passe, le
    // handler tronque et ignore. Le rejet appartient au producteur.
    const abime = {
      entreprise: "Acme",
      ville: "x".repeat(500),
      contactType: "sms",
      champInvente: true,
    };
    expect(leadV1ConsommateurSchema.safeParse(abime).success).toBe(true);
  });

  it("garde les clés inconnues au lieu de les jeter — le handler décide", () => {
    const lu = leadV1ConsommateurSchema.safeParse({ entreprise: "Acme", nouveau: "champ" });
    expect(lu.success && "nouveau" in lu.data).toBe(true);
  });
});

describe("réponse du CRM", () => {
  it("lit une création et un doublon", () => {
    expect(
      leadReponseV1Schema.safeParse({
        success: true,
        prospect: { id: 42, entreprise: "Acme", column: "prospect", status: "en_cours" },
        emailConfirmationSent: true,
      }).success,
    ).toBe(true);
    expect(leadReponseV1Schema.safeParse({ success: true, duplicate: true }).success).toBe(true);
    expect(leadReponseV1Schema.safeParse({ success: false, error: "…" }).success).toBe(true);
  });
});

describe("le chemin et la version", () => {
  it("sont au contrat", () => {
    expect(LEADS_V1_PATH).toBe("/api/integrations/v1/leads");
    expect(LEAD_CONTRACT_VERSION).toBe(1);
  });
});

describe("la composition d'un configurateur", () => {
  const compo = {
    gamme: "lounge" as const,
    lien: "https://hallucinecran.fr/configurateur-lounge-gonflable?c=9-ban16",
    apercuUrl: "https://pub-dc19.r2.dev/devis/1787975421328-apercu.jpg",
    articles: [
      { slug: "canape-double", quantite: 4, designation: "Canapé 2 places", precision: "Habillage : Noir" },
      { slug: "tente-x-5x5", quantite: 3 },
    ],
  };

  it("accompagne un lead", () => {
    expect(leadV1ProducteurSchema.safeParse({ ...lead, configurateur: compo }).success).toBe(true);
    // Le champ reste facultatif : un lead ordinaire ne porte pas de composition.
    expect(leadV1ProducteurSchema.safeParse(lead).success).toBe(true);
  });

  it("ne transporte AUCUN prix — le montant se lit au catalogue du CRM", () => {
    const avecPrix = {
      ...compo,
      articles: [{ slug: "canape-double", quantite: 1, prixHT: 1 }],
    };
    // strictObject sur l'article : un prix soumis par un formulaire public est
    // refusé à l'émission, pas silencieusement ignoré.
    expect(configurateurSchema.safeParse(avecPrix).success).toBe(false);
  });

  it("borne la quantité, la liste et la gamme", () => {
    expect(configurateurSchema.safeParse({ ...compo, gamme: "portique" }).success).toBe(false);
    expect(configurateurSchema.safeParse({
      gamme: "tente",
      articles: [{ slug: "x", quantite: 0 }],
    }).success).toBe(false);
    expect(configurateurSchema.safeParse({
      gamme: "tente",
      articles: Array.from({ length: LEAD_CONFIGURATEUR_LIMITES.articles + 1 }, () => ({ slug: "x", quantite: 1 })),
    }).success).toBe(false);
  });

  it("laisse passer une composition sans article — le CRM décidera", () => {
    expect(configurateurSchema.safeParse({ gamme: "mobilier", articles: [] }).success).toBe(true);
  });
});

it("accepte un écran configuré sans prix fourni par le visiteur", () => {
  expect(configurateurSchema.safeParse({ gamme: "ecran", articles: [{slug: "ecran-soufflerie-9m", quantite: 1}] }).success).toBe(true);
  expect(configurateurSchema.safeParse({ gamme: "arche", articles: [{slug: "arche-pieds-4m-2-6m-45cm", quantite: 1, designation: "Arche à pieds 4 m"}] }).success).toBe(true);
});

describe("configuration visuelle opaque dans le lead", () => {
  it("conserve le JSON exact sans interpréter ses propriétés", () => {
    const configuration3d = JSON.stringify({ version: 1, gamme: "tente", viewer: { couleurs: { toit: "bleu" } } });
    expect(configurateurSchema.parse({ gamme: "tente", articles: [], configuration3d })).toMatchObject({ configuration3d });
  });
  it("refuse un JSON dépassant 750 ko", () => {
    expect(configurateurSchema.safeParse({ gamme: "tente", articles: [], configuration3d: "x".repeat(750001) }).success).toBe(false);
  });
});

describe("la demande groupée — plusieurs configurateurs, UNE demande (v0.18.0)", () => {
  const ecran = { gamme: "ecran" as const, lien: "https://hallucinecran.fr/configurateur?audience=p4", articles: [{ slug: "ecran-soufflerie-9m", quantite: 1 }] };
  const tente = { gamme: "tente" as const, lien: "https://hallucinecran.fr/tente-spider?c=abc", articles: [{ slug: "tente-spider-6x6", quantite: 1 }] };
  const arche = { gamme: "arche" as const, articles: [{ slug: "arche-4m-2-6m-45cm", quantite: 2 }] };

  it("accompagne un lead, avec ou sans `configurateur`", () => {
    expect(leadV1ProducteurSchema.safeParse({ ...lead, panier: [ecran, tente, arche] }).success).toBe(true);
    // La composition courante recopiée pour un CRM qui ne lit pas encore le panier.
    expect(leadV1ProducteurSchema.safeParse({ ...lead, configurateur: tente, panier: [ecran, tente] }).success).toBe(true);
  });

  it("borne le panier à dix compositions", () => {
    expect(LEAD_CONFIGURATEUR_LIMITES.panier).toBe(10);
    expect(panierSchema.safeParse(Array.from({ length: 10 }, () => arche)).success).toBe(true);
    expect(panierSchema.safeParse(Array.from({ length: 11 }, () => arche)).success).toBe(false);
  });

  it("chaque composition obéit au contrat d'un configurateur — aucun prix, même dans un panier", () => {
    const avecPrix = { ...arche, articles: [{ slug: "arche-4m-2-6m-45cm", quantite: 1, prixHT: 1 }] };
    expect(leadV1ProducteurSchema.safeParse({ ...lead, panier: [ecran, avecPrix] }).success).toBe(false);
    expect(panierSchema.safeParse([{ ...ecran, gamme: "portique" }]).success).toBe(false);
  });

  it("passe tel quel chez le consommateur — un CRM d'avant v0.18.0 garde la clé sans la lire", () => {
    const lu = leadV1ConsommateurSchema.safeParse({ entreprise: "Acme", panier: [ecran, tente] });
    expect(lu.success && "panier" in lu.data).toBe(true);
  });
});
