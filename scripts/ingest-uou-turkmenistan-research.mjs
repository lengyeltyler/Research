import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repo = process.cwd();
const date = "2026-05-11";
const timestamp = `${date}T12:00:00.000Z`;

const evidence = {
  verified: "Verified historical fact",
  primary: "Primary document",
  secondary: "Secondary historical source",
  ufology: "Ufology compilation",
  witness: "Witness claim",
  weak: "Weakly sourced claim",
  inference: "Analytical inference",
  unresolved: "Unresolved question"
};

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function node(treeId, title, parentId, options = {}) {
  const id = options.id ?? slug(title);
  const level = options.level ?? (parentId ? 1 : 0);
  return {
    treeId,
    clusterId: treeId,
    importance: options.importance ?? (level === 0 ? "root" : level === 1 ? "major" : "detail"),
    level,
    layoutHint: level === 0 ? "root" : level === 1 ? "branch" : "leaf",
    fixedPosition: true,
    id,
    title,
    type: options.type ?? (level === 0 ? "root" : "topic"),
    status: options.status ?? "researching",
    x: 140 + level * 260,
    y: 180 + (options.index ?? 0) * 70,
    notePath: `nodes/${id}.md`,
    tags: [...(options.tags ?? []), ...(options.evidence ?? []).map((label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-"))],
    parentId,
    category: options.category ?? "Concept",
    dateRange: options.dateRange ?? "",
    shortSummary: options.summary ?? `${title} is part of the ${treeId} research cluster.`,
    detailedSummary: options.details ?? options.summary ?? `${title} is part of the ${treeId} research cluster.`,
    relatedQuestions: options.questions ?? [],
    relatedAnswers: options.answers ?? [],
    connections: options.connections ?? [],
    claims: (options.claims ?? []).map((claim, index) => ({
      id: `${id}_claim_${index + 1}`,
      text: claim.text,
      state: claim.state ?? "partially_supported",
      evidence: claim.evidence,
      sourceIds: claim.sourceIds ?? [],
      confidence: claim.confidence ?? "moderate",
      disputeNotes: claim.disputeNotes ?? ""
    }))
  };
}

function edge(source, target, label = "branch", type = "part_of", notes = "") {
  return { id: `edge-${source}-${target}`, source, target, label, type, notes };
}

function mdFor(n, options = {}) {
  const labels = options.evidence ?? [];
  const sources = options.sources ?? [];
  const open = options.open ?? [];
  const claims = options.claims ?? [];
  const questions = options.questions ?? n.relatedQuestions ?? [];
  const answer = options.answer ?? n.relatedAnswers?.[0] ?? "";
  return `# ${n.title}

## Summary
${options.summary ?? n.shortSummary}

## Notes
${options.notes ?? n.detailedSummary}

Evidence labels: ${labels.length ? labels.join("; ") : "Analytical inference"}

## Related User Questions
${questions.map((item) => `- ${item}`).join("\n")}

## Assistant Answer Summary
${answer}

## Connections
${(options.connections ?? []).map((item) => `- ${item}`).join("\n")}

## Sources
${sources.map((item) => `- ${item}`).join("\n")}

## Open Questions
${open.map((item) => `- ${item}`).join("\n")}

## Claims
${claims.map((item) => `- [${item.label}] ${item.text}`).join("\n")}
`;
}

function makeTree({ id, title, description, themeColor, position, nodes, edges, qas, bridgeEdges, sources, notes }) {
  return {
    id,
    title,
    description,
    createdAt: timestamp,
    updatedAt: timestamp,
    qas,
    nodes,
    edges,
    bridgeEdges,
    metadata: {
      id,
      title,
      themeColor,
      rootNodeId: nodes[0].id,
      preferredPosition: position,
      layoutRadius: 260,
      branchSpacing: 1.12,
      description
    },
    sources,
    notes
  };
}

const questionThreads = [
  "What exactly was the Union of Ufologists (UOU)?",
  "Was the UOU originally the Association of Ufologists in Chardzhou?",
  "Who was Ovezberdy Muradov?",
  "Why was a ufology organization functioning as a successful NGO in authoritarian Turkmenistan?",
  "Why was USAID/Counterpart involved with the UOU?",
  "Was the UOU genuinely a UFO organization, or had it evolved into something else?",
  "Why did the public trail around the UOU mostly disappear after 2004?",
  "Did the 2003 Law on Public Associations effectively suppress independent NGOs?",
  "What was the actual role of Soviet/post-Soviet ufology organizations?",
  "How did UFO mythology evolve from folklore into modern technological-abduction narratives?",
  "Why do recurring motifs appear repeatedly across decades and cultures?",
  "Are humanoid encounter archives useful as evidence, folklore databases, anthropological material, or all three?",
  "What parts of Soviet UFO research are historically verified?",
  "What parts remain speculative or mythologized?",
  "Why do consciousness, telepathy, altered states, and symbolic/archetypal imagery appear so often in these reports?"
];

function uouTree() {
  const id = "uou-turkmenistan-ngo-networks";
  const root = node(id, "Union of Ufologists of Turkmenabat (UOU)", undefined, {
    id: "union_of_ufologists_of_turkmenabat_uou",
    type: "root",
    level: 0,
    category: "Religious movement",
    tags: ["turkmenistan", "uou", "ngo", "ufology", "civil-society"],
    evidence: [evidence.primary, evidence.inference, evidence.unresolved],
    summary: "Evidence-aware research cluster on the UOU as a Turkmenabat ufology organization that also appears in NGO/civil-society records.",
    details: "The UOU is treated here as a historically situated organization, not as proof of extraterrestrial claims. The research question is how a ufology-labeled group intersected with post-Soviet civic networks, USAID/Counterpart programs, and authoritarian Turkmenistan's tightening NGO environment."
  });
  const specs = [
    ["Turkmenistan independence and Soviet collapse", "event", "Event", [evidence.verified, evidence.secondary], "USSR collapse, Turkmen SSR continuity, October 1991 independence referendum, and transformation of Soviet political authority."],
    ["Saparmurat Niyazov complete political history", "person", "Person", [evidence.verified, evidence.secondary], "Niyazov's life, Soviet rise, post-Soviet consolidation, Turkmenbashi personality cult, censorship, and NGO suppression context."],
    ["Soviet -> post-Soviet power transition", "event", "Event", [evidence.inference, evidence.secondary], "Continuity between Communist Party command structures and presidential authoritarian rule after independence."],
    ["Niyazov personality cult", "concept", "Concept", [evidence.verified, evidence.secondary], "Turkmenbashi title, cultic public symbolism, censorship, and state ideology."],
    ["Ruhnama and state ideology", "source", "Scripture/Text", [evidence.verified, evidence.secondary], "Niyazov's Ruhnama as a state ideological text and civic loyalty marker."],
    ["2003 Law on Public Associations", "event", "Legal tradition", [evidence.primary, evidence.secondary], "Law and enforcement context that made registration requirements risky inside authoritarian Turkmenistan."],
    ["NGO suppression in Turkmenistan", "concept", "Controversy", [evidence.secondary, evidence.inference], "Selective registration, exposure of member networks, and chilling effects on independent civic groups."],
    ["UOU historical timeline", "timeline", "Event", [evidence.primary, evidence.secondary, evidence.unresolved], "Timeline linking Chardzhou ufology, Turkmenabat UOU, NGO grants, and post-2004 disappearance of public records."],
    ["Association of Ufologists in Chardzhou", "topic", "Concept", [evidence.ufology, evidence.inference], "Earlier Charjou/Chardzhou ufology association possibly continuous with the later UOU, but not conclusively proven."],
    ["Ovezberdy A. Muradov", "person", "Person", [evidence.primary, evidence.ufology], "Physicist, chairman/president figure associated with Charjou/Turkmenabat ufology records."],
    ["UFOs: Fantastic Reality (1991)", "source", "Text/scripture", [evidence.ufology, evidence.primary], "Russian-language ufology publication associated with Muradov and Charjou City Association of Ufologists."],
    ["USAID relationship", "topic", "Concept", [evidence.primary, evidence.inference], "USAID-linked support should be studied as civil-society strategy, not automatic proof of corruption or covert intent."],
    ["Counterpart International", "topic", "Concept", [evidence.verified, evidence.secondary], "Counterpart as an NGO-development organization with South Pacific origins and later USAID-linked post-Soviet programs."],
    ["Father Stanley Hosie", "person", "Person", [evidence.secondary], "Co-founder figure in the Foundation for the Peoples of the South Pacific / Counterpart origin story."],
    ["Betty Bryant Silverstein", "person", "Person", [evidence.secondary], "Co-founder figure in Counterpart's South Pacific development history."],
    ["South Pacific origins of Counterpart", "event", "Event", [evidence.secondary], "Counterpart's origin as the Foundation for the Peoples of the South Pacific before later global development work."],
    ["UOU humanitarian and NGO work", "topic", "Concept", [evidence.primary, evidence.inference], "Reported work included refugee assistance, business-registration assistance, NGO registration help, and local classes."],
    ["UOU grant trail", "topic", "Concept", [evidence.primary, evidence.unresolved], "Confirmed and proposed grant trail: $8,532 confirmed, $15,000 discussed, $30,000 proposed but not proven awarded."],
    ["Unresolved funding/public-record gaps", "question", "User question", [evidence.unresolved], "Missing local records and unclear full extent of support after the available cable trail."],
    ["Disappearance of UOU public footprint after 2004", "question", "User question", [evidence.unresolved, evidence.inference], "The public trail mostly disappears after 2004; suppression, rebranding, inactivity, or archival gaps remain possible."]
  ];
  const nodes = [root, ...specs.map((s, index) => node(id, s[0], root.id, { type: s[1], category: s[2], level: 1, importance: "major", index, evidence: s[3], summary: s[4], tags: ["evidence-aware"] }))];
  const byTitle = new Map(nodes.map((n) => [n.title, n]));
  const edges = nodes.slice(1).map((n) => edge(root.id, n.id, "research branch"));
  edges.push(edge(byTitle.get("Turkmenistan independence and Soviet collapse").id, byTitle.get("Soviet -> post-Soviet power transition").id, "political continuity", "caused"));
  edges.push(edge(byTitle.get("Saparmurat Niyazov complete political history").id, byTitle.get("Niyazov personality cult").id, "consolidation / cult", "caused"));
  edges.push(edge(byTitle.get("Saparmurat Niyazov complete political history").id, byTitle.get("2003 Law on Public Associations").id, "authoritarian context", "connected_to"));
  edges.push(edge(byTitle.get("2003 Law on Public Associations").id, byTitle.get("NGO suppression in Turkmenistan").id, "registration pressure", "caused"));
  edges.push(edge(byTitle.get("Association of Ufologists in Chardzhou").id, byTitle.get("UOU historical timeline").id, "possible continuity", "connected_to", "Continuity is plausible but unresolved."));
  edges.push(edge(byTitle.get("Ovezberdy A. Muradov").id, byTitle.get("UFOs: Fantastic Reality (1991)").id, "publication association", "source_for"));
  edges.push(edge(byTitle.get("USAID relationship").id, byTitle.get("Counterpart International").id, "implementing partner context", "connected_to"));
  edges.push(edge(byTitle.get("Counterpart International").id, byTitle.get("South Pacific origins of Counterpart").id, "organizational origin", "descended_from"));
  edges.push(edge(byTitle.get("UOU grant trail").id, byTitle.get("Unresolved funding/public-record gaps").id, "missing records", "connected_to"));

  const qas = questionThreads.slice(0, 8).map((question, index) => ({
    id: `qa_uou_${index + 1}`,
    question,
    answer: "This thread is preserved as an evidence-aware research question. The working answer distinguishes documented organizational history from inference and unresolved archival gaps.",
    linkedNodeIds: index < 3 ? [root.id, byTitle.get("Association of Ufologists in Chardzhou").id, byTitle.get("Ovezberdy A. Muradov").id] : [root.id, byTitle.get("USAID relationship").id, byTitle.get("2003 Law on Public Associations").id, byTitle.get("Unresolved funding/public-record gaps").id],
    dateAdded: date
  }));
  const sources = [
    ["britannica_niyazov", "Encyclopaedia Britannica — Saparmurad Niyazov", "https://www.britannica.com/biography/Saparmurad-Niyazov", "Encyclopaedia Britannica", "encyclopedia", "moderate"],
    ["csce_turkmenistan_referendum", "CSCE — Report on Turkmenistan's Referendum on Independence", "https://www.csce.gov/publications/report-turkmenistans-referendum-independence/", "Commission on Security and Cooperation in Europe", "government", "strong"],
    ["osce_odihr_public_associations", "OSCE/ODIHR Comments on Turkmenistan Public Associations Law", "https://unece.org/DAM/env/pp/compliance/CC-32/Inf_3_OSCE_ODIHR_Comments_Eng.pdf", "OSCE/ODIHR", "government", "strong"],
    ["eurasianet_ngo_law_turkmenistan", "Eurasianet — New law on NGO activity in Turkmenistan greeted with caution", "https://eurasianet.org/new-law-on-ngo-activity-in-turkmenistan-greeted-with-caution", "Eurasianet", "article", "moderate"],
    ["counterpart_org", "Counterpart International", "https://www.counterpart.org", "Counterpart International", "article", "moderate"],
    ["counterpart_ar_2015", "Counterpart Annual Report 2015", "https://www.ngoadvisor.net/wp-content/uploads/2016/04/Counterpart-AR_15.pdf", "Counterpart International", "article", "moderate"],
    ["bryant_profile", "National Portrait Gallery — The life of Bryant", "https://www.portrait.gov.au/magazines/59/the-life-of-bryant", "National Portrait Gallery", "article", "moderate"],
    ["booktracker_ufo_fantastic_reality", "Booktracker — UFOs: Fantastic Reality listing", "http://booktracker.org/viewtopic.php?t=62529", "Booktracker", "forum", "weak"]
  ].map(([sid, title, url, authorPublisher, type, reliability]) => ({ id: sid, title, url, authorPublisher, accessDate: date, type, reliability, note: "Research source; assess context and provenance before treating as definitive." }));
  const notes = {};
  for (const n of nodes) {
    notes[n.id] = mdFor(n, {
      evidence: n.tags.filter((tag) => tag.includes("verified") || tag.includes("primary") || tag.includes("secondary") || tag.includes("ufology") || tag.includes("witness") || tag.includes("weakly") || tag.includes("analytical") || tag.includes("unresolved")).map((tag) => tag.replaceAll("-", " ")),
      sources: sources.slice(0, n.title.includes("Counterpart") ? 7 : n.title.includes("Niyazov") || n.title.includes("independence") ? 4 : n.title.includes("UFOs") ? 8 : 5).map((s) => `${s.title}: ${s.url}`),
      open: questionThreads.slice(0, 8),
      claims: [
        { label: evidence.inference, text: "The UOU appears to sit at an unusual intersection of ufology branding, civil-society work, and authoritarian-state regulation." },
        { label: evidence.unresolved, text: "The available record is not sufficient to prove the full continuity between Chardzhou ufology and the later Turkmenabat UOU." }
      ]
    });
  }
  notes[byTitle.get("Saparmurat Niyazov complete political history").id] = mdFor(byTitle.get("Saparmurat Niyazov complete political history"), {
    evidence: [evidence.verified, evidence.secondary],
    sources: ["Britannica — Saparmurad Niyazov: https://www.britannica.com/biography/Saparmurad-Niyazov", "CSCE referendum report: https://www.csce.gov/publications/report-turkmenistans-referendum-independence/"],
    notes: "Niyazov was born in 1940. His father died in World War II, and the 1948 Ashgabat earthquake killed his mother and siblings. He grew up in a Soviet orphanage, studied engineering, rose through the Communist Party, and was elevated under Gorbachev. Independence did not begin as a competitive democratic break: the October 1991 referendum concerned independence, while Niyazov was already the Soviet-era leader and later consolidated power through an uncontested 1992 election and authoritarian presidential rule. His Turkmenbashi personality cult, censorship, Ruhnama ideology, and post-2002 assassination-attempt crackdown form the necessary context for NGO vulnerability.",
    claims: [
      { label: evidence.verified, text: "October 1991 independence referendum is not equivalent to a competitive presidential mandate." },
      { label: evidence.secondary, text: "Niyazov's Soviet orphanage background, Communist Party rise, personality cult, censorship, and authoritarian consolidation are supported by mainstream historical summaries." }
    ]
  });
  notes[byTitle.get("2003 Law on Public Associations").id] = mdFor(byTitle.get("2003 Law on Public Associations"), {
    evidence: [evidence.primary, evidence.secondary, evidence.inference],
    sources: ["OSCE/ODIHR comments: https://unece.org/DAM/env/pp/compliance/CC-32/Inf_3_OSCE_ODIHR_Comments_Eng.pdf", "Eurasianet: https://eurasianet.org/new-law-on-ngo-activity-in-turkmenistan-greeted-with-caution"],
    notes: "Charters, founder names, meeting minutes, legal addresses, and governing documents are not inherently authoritarian in normal nonprofit registration systems. The risk came from enforcement context: Ministry of Justice discretion, prohibition of unregistered activity, exposure of members and networks, selective registration pressure, foreign-funding scrutiny, and a chilling effect on independent civic groups. UOU surviving re-registration therefore matters because registration itself could function as a state filter.",
    claims: [
      { label: evidence.inference, text: "The danger lies less in paperwork itself than in authoritarian enforcement, discretion, and exposure of independent networks." },
      { label: evidence.unresolved, text: "The exact way UOU navigated registration remains incompletely documented." }
    ]
  });
  notes[byTitle.get("UOU historical timeline").id] = mdFor(byTitle.get("UOU historical timeline"), {
    evidence: [evidence.primary, evidence.ufology, evidence.inference, evidence.unresolved],
    sources: ["Booktracker listing for UFOs: Fantastic Reality: http://booktracker.org/viewtopic.php?t=62529", "Counterpart: https://www.counterpart.org"],
    notes: "UOU refers to the Union of Ufologists of Turkmenabat. Turkmenabat was formerly Chardzhou/Charjou. The 1991 publication UFOs: Fantastic Reality describes Muradov as a physicist and chairman of the Charjou City Association of Ufologists. A later 2004 record names Ovezberdy A. Muradov as UOU president. Continuity between the earlier Association of Ufologists in Chardzhou and the later UOU is plausible but not proven conclusively. Russian-language publication in Soviet Central Asia does not establish Muradov's ethnicity. The known activities expand from ufology, conferences, and publications into NGO registration help, humanitarian/refugee work, business-registration help, computer/accounting/massage/ufology classes, and a planned independent newsletter. The massage classes are best read as ordinary vocational or therapeutic instruction; there is no evidence of sexual or illicit meaning. The teaching location and student identities are not specified, but local members, residents, or civic participants are the most likely audience.",
    open: questionThreads.slice(0, 8),
    claims: [
      { label: evidence.ufology, text: "UFOs: Fantastic Reality links Muradov to Charjou ufology." },
      { label: evidence.inference, text: "The Chardzhou association and later UOU may be continuous, but the evidence is not conclusive." },
      { label: evidence.unresolved, text: "The public trail after 2004 remains thin." }
    ]
  });
  notes[byTitle.get("Counterpart International").id] = mdFor(byTitle.get("Counterpart International"), {
    evidence: [evidence.verified, evidence.secondary, evidence.primary],
    sources: ["Counterpart: https://www.counterpart.org", "Counterpart Annual Report: https://www.ngoadvisor.net/wp-content/uploads/2016/04/Counterpart-AR_15.pdf", "The life of Bryant: https://www.portrait.gov.au/magazines/59/the-life-of-bryant"],
    notes: "Counterpart traces to the Foundation for the Peoples of the South Pacific, founded in 1965 by Father Stanley Hosie and Betty Bryant Silverstein. Its later post-Soviet work fits a USAID-linked civil-society and humanitarian development model. USAID involvement is not, by itself, proof of corruption or covert activity; it raises a historically useful question about how foreign-aid programs operated inside authoritarian states by working through legally tolerated local organizations.",
    claims: [
      { label: evidence.secondary, text: "Counterpart has South Pacific development origins before later global civil-society programming." },
      { label: evidence.inference, text: "UOU may have functioned as a legally tolerated local platform for civic work, regardless of its ufology label." }
    ]
  });
  notes[byTitle.get("UOU grant trail").id] = mdFor(byTitle.get("UOU grant trail"), {
    evidence: [evidence.primary, evidence.unresolved],
    notes: "Preserved funding trail: a confirmed $8,532 NGO-registration grant; a discussed $15,000 capacity-building grant; and a proposed $30,000 newsletter-equipment grant. The latter two should not be treated as awarded without further documentation.",
    claims: [
      { label: evidence.primary, text: "$8,532 NGO-registration grant is treated as confirmed in the research trail." },
      { label: evidence.unresolved, text: "$15,000 and $30,000 items remain discussed/proposed unless stronger award records are found." }
    ]
  });
  return makeTree({
    id,
    title: "Turkmenistan / UOU / NGO Networks",
    description: "Evidence-aware investigation of the Union of Ufologists of Turkmenabat, post-Soviet Turkmenistan, NGO law, USAID/Counterpart context, and archival gaps.",
    themeColor: "purple",
    position: { x: 0.18, y: 0.32 },
    nodes,
    edges,
    qas,
    bridgeEdges: [
      { id: "bridge-uou-setka-post-soviet-ufology", sourceTreeId: id, sourceNodeId: root.id, targetTreeId: "soviet-ufology-setka", targetNodeId: "soviet_anomalous_phenomena_research", label: "post-Soviet ufology context", type: "cross_tree", notes: "UOU should be read against Soviet/post-Soviet ufology institutions and mythologies." },
      { id: "bridge-uou-humanoid-mary-turkmenistan", sourceTreeId: id, sourceNodeId: root.id, targetTreeId: "humanoid-encounter-archives", targetNodeId: "mary_turkmenistan_case", label: "Turkmenistan humanoid claim context", type: "cross_tree", notes: "Mary case belongs in claim/folklore analysis, not as verified external-event evidence." }
    ],
    sources,
    notes
  });
}

function setkaTree() {
  const id = "soviet-ufology-setka";
  const root = node(id, "Soviet Anomalous Phenomena Research", undefined, {
    id: "soviet_anomalous_phenomena_research",
    type: "root",
    level: 0,
    category: "Concept",
    evidence: [evidence.verified, evidence.secondary],
    summary: "Research cluster on Soviet anomalous aerial phenomena study, SETKA-related programs, military anxiety, and post-Soviet ufology."
  });
  const titles = [
    ["SETKA-AN", "topic", "Concept", [evidence.verified, evidence.secondary], "Academy/scientific anomalous-phenomena channel associated with Soviet study."],
    ["SETKA-MO", "topic", "Empire/state", [evidence.verified, evidence.secondary], "Military/ministry side of Soviet anomalous-phenomena study."],
    ["Petrozavodsk incident", "event", "Event", [evidence.verified, evidence.secondary], "1977 incident often cited as a catalyst for Soviet anomalous-phenomena study."],
    ["Anomalous atmospheric phenomena terminology", "concept", "Concept", [evidence.verified], "Terminology that allowed investigation without extraterrestrial conclusions."],
    ["Soviet military concerns", "topic", "Empire/state", [evidence.inference, evidence.secondary], "Airspace, radar, missile, and Cold War security concerns."],
    ["Radar anomalies", "topic", "Concept", [evidence.witness, evidence.secondary], "Reports or concerns involving instrument anomalies should be separated from interpretation."],
    ["Missile-system interference claims", "claim", "Controversy", [evidence.witness, evidence.weak], "Claims require source-by-source review and should not be treated as established fact."],
    ["Secrecy structures", "concept", "Empire/state", [evidence.inference], "Soviet secrecy made later mythology easier to amplify."],
    ["Post-Soviet ufology explosion", "event", "Event", [evidence.secondary, evidence.inference], "Opening archives, media markets, and social disruption fed public UFO/paranormal interest."],
    ["Cold War context", "topic", "Event", [evidence.verified, evidence.secondary], "UFO study overlapped with air defense, weapons anxiety, intelligence, and misidentification risk."]
  ];
  const nodes = [root, ...titles.map((item, index) => node(id, item[0], root.id, { type: item[1], category: item[2], evidence: item[3], index, level: 1, importance: "major", summary: item[4] }))];
  const edges = nodes.slice(1).map((n) => edge(root.id, n.id, "research branch"));
  const byTitle = new Map(nodes.map((n) => [n.title, n]));
  edges.push(edge(byTitle.get("Petrozavodsk incident").id, byTitle.get("SETKA-AN").id, "institutional catalyst", "caused"));
  edges.push(edge(byTitle.get("Petrozavodsk incident").id, byTitle.get("SETKA-MO").id, "institutional catalyst", "caused"));
  edges.push(edge(byTitle.get("Soviet military concerns").id, byTitle.get("Cold War context").id, "airspace anxiety", "connected_to"));
  const qas = questionThreads.slice(8, 10).map((question, index) => ({
    id: `qa_setka_${index + 1}`,
    question,
    answer: "SETKA-related programs and Soviet anomalous-phenomena study are historically important, but extraterrestrial conclusions, recovered craft, bodies, or superweapon claims remain unverified unless stronger primary documentation is found.",
    linkedNodeIds: [root.id, byTitle.get("SETKA-AN").id, byTitle.get("SETKA-MO").id, byTitle.get("Cold War context").id],
    dateAdded: date
  }));
  const sources = [
    ["cia_reading_room", "CIA Reading Room", "https://www.cia.gov/readingroom/", "Central Intelligence Agency", "archive", "strong"],
    ["fbi_vault", "FBI Vault", "https://vault.fbi.gov", "Federal Bureau of Investigation", "archive", "strong"],
    ["national_archives", "U.S. National Archives", "https://www.archives.gov", "National Archives", "archive", "strong"],
    ["nicap", "NICAP", "https://www.nicap.org", "NICAP", "archive", "moderate"],
    ["black_vault", "The Black Vault", "https://www.theblackvault.com", "The Black Vault", "archive", "moderate"]
  ].map(([sid, title, url, authorPublisher, type, reliability]) => ({ id: sid, title, url, authorPublisher, accessDate: date, type, reliability, note: "Use as archive/research lead; verify document provenance." }));
  const notes = {};
  for (const n of nodes) notes[n.id] = mdFor(n, { evidence: n.tags, sources: sources.map((s) => `${s.title}: ${s.url}`), open: questionThreads.slice(8, 10), claims: [{ label: evidence.verified, text: "Soviet anomalous-phenomena programs existed." }, { label: evidence.unresolved, text: "Extraterrestrial interpretations are not established by the existence of state study programs." }] });
  notes.setka_an = notes["setka_an"];
  notes[root.id] = mdFor(root, {
    evidence: [evidence.verified, evidence.secondary, evidence.unresolved],
    sources: sources.map((s) => `${s.title}: ${s.url}`),
    notes: "Governments study anomalous aerial phenomena for many reasons that do not require extraterrestrial explanations: airspace defense, adversary technology, atmospheric phenomena, missile/radar reliability, pilot reports, classified systems, and public rumor control. SETKA-related work and Soviet military/scientific study are historically significant. Recovered alien craft, alien bodies, and superweapon conspiracy claims remain outside the verified evidence base here.",
    claims: [
      { label: evidence.verified, text: "SETKA-related Soviet anomalous-phenomena study occurred." },
      { label: evidence.unresolved, text: "Extraterrestrial conclusions, recovered alien craft, alien bodies, and superweapon claims are not verified by this record." }
    ]
  });
  notes[byTitle.get("SETKA-AN").id] = mdFor(byTitle.get("SETKA-AN"), {
    evidence: [evidence.verified, evidence.secondary],
    sources: sources.map((s) => `${s.title}: ${s.url}`),
    notes: "SETKA-AN is treated as the scientific/Academy-facing side of Soviet anomalous-phenomena work. It belongs in verified institutional history, while individual spectacular claims require separate evidence review.",
    claims: [{ label: evidence.verified, text: "A Soviet scientific anomalous-phenomena study channel existed." }]
  });
  return makeTree({
    id,
    title: "Soviet Ufology / SETKA",
    description: "Historical research on Soviet anomalous-phenomena programs, SETKA, military concerns, secrecy, and post-Soviet ufology.",
    themeColor: "blue",
    position: { x: 0.58, y: 0.28 },
    nodes,
    edges,
    qas,
    bridgeEdges: [
      { id: "bridge-setka-humanoid-post-soviet-explosion", sourceTreeId: id, sourceNodeId: byTitle.get("Post-Soviet ufology explosion").id, targetTreeId: "humanoid-encounter-archives", targetNodeId: "soviet_cis_paranormal_explosion", label: "post-Soviet paranormal explosion", type: "cross_tree", notes: "Connects Soviet institutional history to the 1990 humanoid/paranormal report environment." },
      { id: "bridge-setka-consciousness-altered-states", sourceTreeId: id, sourceNodeId: byTitle.get("Post-Soviet ufology explosion").id, targetTreeId: "consciousness-mythology-archetypes", targetNodeId: "altered_state_overlap", label: "paranormal narrative environment", type: "cross_tree", notes: "Bridge to altered-state and archetype analysis." }
    ],
    sources,
    notes
  });
}

function humanoidTree() {
  const id = "humanoid-encounter-archives";
  const root = node(id, "Humanoid Encounter Archives", undefined, { id: "humanoid_encounter_archives", type: "root", level: 0, category: "Concept", evidence: [evidence.ufology, evidence.inference], summary: "Claims catalogs studied as folklore, anomalous-experience archives, mythology evolution material, and anthropological datasets." });
  const major = [
    ["Albert Rosales", "person", "Person", [evidence.ufology], "Compiler associated with the International Catalogue of Humanoid Encounters."],
    ["International Catalogue of Humanoid Encounters", "source", "Text/scripture", [evidence.ufology], "A compilation of reports, not a verified evidence database."],
    ["1914 archive", "timeline", "Event", [evidence.ufology, evidence.witness], "Early humanoid claims showing folklore and proto-technological reinterpretation motifs."],
    ["1939 archive", "timeline", "Event", [evidence.ufology, evidence.witness], "Pre-Roswell claims containing robotic, telepathic, and abduction-like motifs."],
    ["1958 archive", "timeline", "Event", [evidence.ufology, evidence.witness], "Late-1950s reports where modern abduction mythology becomes more stable."],
    ["1990 archive", "timeline", "Event", [evidence.ufology, evidence.witness], "Soviet/CIS paranormal explosion, biological-robot motifs, and psychological-distress cases."]
  ];
  const childByArchive = {
    "1914 archive": ["Smolensk disappearing children", "Pawtucket singing humanoids", "Farmersville green humanoid", "Hamburg cigar craft", "Finland grandmother sky ship", "Spike Island yellow watcher", "Georgian Bay water-collection case", "Cochabamba proto-abduction"],
    "1939 archive": ["Cordell Hull sub-basement story", "Spain upward-disappearance case", "Finland robot-worker case", "Alabama psychic other-world woman", "California radiant woman / Marian overlap", "Delaware River hidden door", "Greek mushroom craft", "Brazil prospector abduction"],
    "1958 archive": ["Pre-Hill gray-like abduction", "Vietnam retrieval mythology", "Argentina subway humanoid", "Phoenix monkey entities", "Cynthia Appleton", "Akart narrative", "Texas repair-operation case", "Robert Monroe overlap"],
    "1990 archive": ["Moscow biological robot case", "Reutov biological robot / Hellenic beings", "Tashkent humanoid", "Mary, Turkmenistan case", "Edinburgh pizza-parlor case", "Soviet/CIS paranormal explosion"]
  };
  const nodes = [root, ...major.map((item, index) => node(id, item[0], root.id, { type: item[1], category: item[2], evidence: item[3], level: 1, importance: "major", index, summary: item[4] }))];
  const byTitle = new Map(nodes.map((n) => [n.title, n]));
  for (const [archive, children] of Object.entries(childByArchive)) {
    const parent = byTitle.get(archive);
    children.forEach((title, index) => {
      const n = node(id, title, parent.id, { type: title.includes("case") || title.includes("story") || title.includes("abduction") ? "claim" : "topic", category: "Controversy", evidence: [evidence.ufology, evidence.witness, title.includes("Cordell") ? evidence.weak : evidence.inference], level: 2, importance: "detail", index, summary: `${title} is treated as a reported claim or motif-bearing archive entry, not verified external-event evidence.` });
      nodes.push(n);
      byTitle.set(title, n);
    });
  }
  const edges = nodes.filter((n) => n.parentId).map((n) => edge(n.parentId, n.id, "archive branch"));
  const qas = questionThreads.slice(10, 13).map((question, index) => ({
    id: `qa_humanoid_${index + 1}`,
    question,
    answer: "Humanoid encounter archives are useful when handled as catalogs of claims and motif data. They can support folklore and anthropology questions without being treated as verified evidence of external beings.",
    linkedNodeIds: [root.id, byTitle.get("International Catalogue of Humanoid Encounters").id, byTitle.get("1914 archive").id, byTitle.get("1990 archive").id],
    dateAdded: date
  }));
  const sources = [
    ["nicap", "NICAP", "https://www.nicap.org", "NICAP", "archive", "moderate"],
    ["mufon", "MUFON", "https://mufon.com", "MUFON", "archive", "moderate"],
    ["black_vault", "The Black Vault", "https://www.theblackvault.com", "The Black Vault", "archive", "moderate"]
  ].map(([sid, title, url, authorPublisher, type, reliability]) => ({ id: sid, title, url, authorPublisher, accessDate: date, type, reliability, note: "Useful as research leads or ufology archives; not automatically verified evidence." }));
  const notes = {};
  for (const n of nodes) notes[n.id] = mdFor(n, { evidence: n.tags, sources: sources.map((s) => `${s.title}: ${s.url}`), open: questionThreads.slice(10, 13), claims: [{ label: evidence.ufology, text: "Archive entries are treated as reports/claims, not established facts." }, { label: evidence.inference, text: "Repeated motifs can be studied as folklore and mythology evolution data." }] });
  notes[byTitle.get("1914 archive").id] = mdFor(byTitle.get("1914 archive"), {
    evidence: [evidence.ufology, evidence.witness, evidence.inference],
    notes: "High-signal 1914 motifs include Smolensk disappearing children, Pawtucket singing humanoids, Farmersville green humanoid, Hamburg cigar craft, Finland grandmother sky ship, Spike Island yellow watcher, Georgian Bay water-collection case, and Cochabamba proto-abduction. The material strongly resembles folklore, little-people traditions, mystical visitation, and proto-technological interpretation. Key analytical concept: folklore -> technological reinterpretation transition.",
    claims: [{ label: evidence.inference, text: "1914 material is more useful as folklore-transition evidence than as external-event proof." }]
  });
  notes[byTitle.get("1939 archive").id] = mdFor(byTitle.get("1939 archive"), {
    evidence: [evidence.ufology, evidence.witness, evidence.weak, evidence.inference],
    notes: "Key entries include Cordell Hull sub-basement story, Spain upward-disappearance case, Finland robot-worker case, Alabama psychic other-world woman, California radiant woman / Marian overlap, Delaware River hidden door, Greek mushroom craft, and Brazil prospector abduction. The Cordell Hull story is highly unverified and weakly sourced, but culturally important mythologically. By 1939, robotic beings, telepathy, technological motifs, proto-Men-in-Black themes, and abduction structures appear before Roswell.",
    claims: [{ label: evidence.weak, text: "Cordell Hull sub-basement story is not treated as verified evidence." }, { label: evidence.inference, text: "Several motifs later associated with postwar UFO culture predate Roswell." }]
  });
  notes[byTitle.get("1958 archive").id] = mdFor(byTitle.get("1958 archive"), {
    evidence: [evidence.ufology, evidence.witness, evidence.inference],
    notes: "Entries include pre-Hill gray-like abduction, Vietnam retrieval mythology, Argentina subway humanoid, Phoenix monkey entities, Cynthia Appleton, Akart narrative, Texas repair-operation case, and Robert Monroe overlap. Analytical focus: modern abduction mythology stabilizes in the late 1950s with telepathy, examinations, missing time, hybrid themes, consciousness overlap, cosmic spirituality, and Cold War nuclear anxiety.",
    claims: [{ label: evidence.inference, text: "Late-1950s reports show stabilization of modern UFO-abduction motifs before their later mass-media consolidation." }]
  });
  notes[byTitle.get("1990 archive").id] = mdFor(byTitle.get("1990 archive"), {
    evidence: [evidence.ufology, evidence.witness, evidence.inference],
    notes: "Entries include Moscow biological robot case, Reutov biological robot/Hellenic beings, Tashkent humanoid, Mary, Turkmenistan case, Edinburgh pizza-parlor case, and Soviet/CIS paranormal explosion. This section distinguishes potentially sincere reports from likely hallucination or psychological cases. The Mary, Turkmenistan case is best analyzed as likely psychological distress/psychosis rather than strong external-event evidence. Major themes: biological robots, human mimicry, uncanny social behavior, post-Soviet instability, altered states, and folklore continuity.",
    claims: [{ label: evidence.inference, text: "Mary, Turkmenistan is likely better handled as psychological distress than as strong evidence of an external event." }]
  });
  return makeTree({
    id,
    title: "Humanoid Encounter Archives",
    description: "Evidence-aware archive analysis of humanoid encounter claims as folklore, anomalous-experience records, and mythology evolution material.",
    themeColor: "rose",
    position: { x: 0.78, y: 0.68 },
    nodes,
    edges,
    qas,
    bridgeEdges: [
      { id: "bridge-humanoid-consciousness-recurring-motifs", sourceTreeId: id, sourceNodeId: root.id, targetTreeId: "consciousness-mythology-archetypes", targetNodeId: "recurring_motifs_across_decades_and_cultures", label: "recurring motifs", type: "cross_tree", notes: "Archives feed motif/archetype analysis." }
    ],
    sources,
    notes
  });
}

function consciousnessTree() {
  const id = "consciousness-mythology-archetypes";
  const root = node(id, "Consciousness / Mythology / Archetype Evolution", undefined, { id: "consciousness_mythology_archetype_evolution", type: "root", level: 0, category: "Concept", evidence: [evidence.inference, evidence.unresolved], summary: "Research cluster for recurring motifs across folklore, religion, UFO reports, altered states, and technological anxiety." });
  const specs = [
    ["Telepathy motif", "concept", "Concept", [evidence.inference], "Reports often use telepathy as a boundary-crossing communication motif."],
    ["Human mimicry motif", "concept", "Concept", [evidence.inference], "Uncanny human imitation appears in changelings, Men in Black, doppelgangers, android anxiety, and humanoid reports."],
    ["Biological robot motif", "concept", "Concept", [evidence.inference], "Biological robot imagery appears strongly in late Soviet/CIS material."],
    ["Changeling/doppelganger continuity", "concept", "Concept", [evidence.inference], "Older folklore patterns of substitution, uncanny imitation, and ambiguous personhood."],
    ["Folklore continuity", "concept", "Concept", [evidence.inference], "Continuity between older supernatural folklore and modern technological framing."],
    ["Altered-state overlap", "concept", "Concept", [evidence.unresolved, evidence.inference], "Dreams, sleep paralysis, dissociation, grief, psychosis, and visionary states may overlap with some reports."],
    ["Consciousness interaction patterns", "question", "User question", [evidence.unresolved], "Why do telepathy, symbolism, and altered consciousness recur so often?"],
    ["Symbolic/archetypal behavior", "concept", "Concept", [evidence.inference], "Reports often act like symbolic dramas rather than straightforward technological encounters."],
    ["Recurring motifs across decades and cultures", "timeline", "Event", [evidence.inference], "Comparative pattern node linking folklore, religion, UFO reports, and modern anxieties."],
    ["Edinburgh pizza-parlor case", "claim", "Controversy", [evidence.ufology, evidence.witness, evidence.inference], "A focused case study in uncanny-human-imitation and social-pattern violation rather than proof of aliens."]
  ];
  const nodes = [root, ...specs.map((s, index) => node(id, s[0], root.id, { type: s[1], category: s[2], evidence: s[3], level: 1, importance: "major", index, summary: s[4] }))];
  const byTitle = new Map(nodes.map((n) => [n.title, n]));
  const edges = nodes.slice(1).map((n) => edge(root.id, n.id, "motif branch"));
  edges.push(edge(byTitle.get("Human mimicry motif").id, byTitle.get("Changeling/doppelganger continuity").id, "folklore continuity", "influenced_by"));
  edges.push(edge(byTitle.get("Biological robot motif").id, byTitle.get("Human mimicry motif").id, "uncanny imitation", "connected_to"));
  edges.push(edge(byTitle.get("Altered-state overlap").id, byTitle.get("Consciousness interaction patterns").id, "unresolved mechanism", "connected_to"));
  const qas = questionThreads.slice(10).map((question, index) => ({
    id: `qa_consciousness_${index + 1}`,
    question,
    answer: "The research question is preserved without concluding that interdimensional beings are real. Recurring motifs can be studied through folklore, psychology, anthropology, religion, media history, and anomalous-experience reporting.",
    linkedNodeIds: [root.id, byTitle.get("Telepathy motif").id, byTitle.get("Altered-state overlap").id, byTitle.get("Recurring motifs across decades and cultures").id],
    dateAdded: date
  }));
  const sources = [
    ["nicap", "NICAP", "https://www.nicap.org", "NICAP", "archive", "moderate"],
    ["mufon", "MUFON", "https://mufon.com", "MUFON", "archive", "moderate"],
    ["black_vault", "The Black Vault", "https://www.theblackvault.com", "The Black Vault", "archive", "moderate"]
  ].map(([sid, title, url, authorPublisher, type, reliability]) => ({ id: sid, title, url, authorPublisher, accessDate: date, type, reliability, note: "Useful as motif-comparison research leads; not proof of external events." }));
  const notes = {};
  for (const n of nodes) notes[n.id] = mdFor(n, { evidence: n.tags, sources: sources.map((s) => `${s.title}: ${s.url}`), open: questionThreads.slice(10), claims: [{ label: evidence.inference, text: "Motif recurrence is analytically important even when external-event claims remain unverified." }, { label: evidence.unresolved, text: "No conclusion is made that interdimensional beings are real." }] });
  notes[byTitle.get("Edinburgh pizza-parlor case").id] = mdFor(byTitle.get("Edinburgh pizza-parlor case"), {
    evidence: [evidence.ufology, evidence.witness, evidence.inference],
    notes: "This case is preserved as an uncanny-human-imitation study, not proof of aliens. The useful focus is social-pattern violation: why the interaction psychologically disturbs witnesses, how human mimicry produces threat perception, and how the motif connects with changelings, Men in Black, doppelgangers, AI/android anxieties, and biological-robot imagery.",
    claims: [{ label: evidence.inference, text: "The value of the case is motif analysis, especially uncanny imitation and violated social expectations." }, { label: evidence.witness, text: "The underlying event remains a reported claim." }]
  });
  return makeTree({
    id,
    title: "Consciousness / Mythology / Archetype Evolution",
    description: "Research tree for recurring motifs across folklore, religion, UFO reports, altered states, symbolic imagery, and modern technological anxieties.",
    themeColor: "teal",
    position: { x: 0.38, y: 0.78 },
    nodes,
    edges,
    qas,
    bridgeEdges: [
      { id: "bridge-consciousness-humanoid-edinburgh", sourceTreeId: id, sourceNodeId: byTitle.get("Edinburgh pizza-parlor case").id, targetTreeId: "humanoid-encounter-archives", targetNodeId: "edinburgh_pizza_parlor_case", label: "uncanny-human-imitation case", type: "cross_tree", notes: "Same case represented as archive entry and motif analysis." },
      { id: "bridge-consciousness-uou-mythology-development", sourceTreeId: id, sourceNodeId: byTitle.get("Folklore continuity").id, targetTreeId: "uou-turkmenistan-ngo-networks", targetNodeId: "union_of_ufologists_of_turkmenabat_uou", label: "ufology mythology development", type: "cross_tree", notes: "Connects organization history to mythology-analysis frame." }
    ],
    sources,
    notes
  });
}

const trees = [uouTree(), setkaTree(), humanoidTree(), consciousnessTree()];

for (const tree of trees) {
  const treeDir = path.join(repo, "trees", tree.id);
  await mkdir(path.join(treeDir, "nodes"), { recursive: true });
  await mkdir(path.join(treeDir, "sources"), { recursive: true });
  await mkdir(path.join(treeDir, "attachments"), { recursive: true });
  await mkdir(path.join(treeDir, "exports"), { recursive: true });
  const { sources, notes, ...treeJson } = tree;
  await writeFile(path.join(treeDir, "tree.json"), `${JSON.stringify(treeJson, null, 2)}\n`);
  await writeFile(path.join(treeDir, "sources", "sources.json"), `${JSON.stringify(sources, null, 2)}\n`);
  for (const n of tree.nodes) {
    await writeFile(path.join(treeDir, n.notePath), notes[n.id] ?? mdFor(n));
  }
}

console.log(`Ingested ${trees.length} Turkmenistan/UOU research clusters.`);
console.log(trees.map((tree) => `${tree.id}: ${tree.nodes.length} nodes, ${tree.edges.length} edges, ${tree.qas.length} Q&A`).join("\n"));
