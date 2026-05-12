import { mkdir, readFile, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const date = "2026-05-11";
const updatedAt = `${date}T18:00:00.000Z`;

const evidenceLabels = {
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
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
}

async function loadTree(id) {
  return JSON.parse(await readFile(path.join(repo, "trees", id, "tree.json"), "utf8"));
}

async function saveTree(tree) {
  tree.updatedAt = updatedAt;
  await writeFile(path.join(repo, "trees", tree.id, "tree.json"), `${JSON.stringify(tree, null, 2)}\n`);
}

async function loadSources(treeId) {
  const sourcePath = path.join(repo, "trees", treeId, "sources", "sources.json");
  if (!fs.existsSync(sourcePath)) return [];
  return JSON.parse(await readFile(sourcePath, "utf8"));
}

async function saveSources(treeId, sources) {
  const sourcePath = path.join(repo, "trees", treeId, "sources", "sources.json");
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, `${JSON.stringify(sources, null, 2)}\n`);
}

function evidenceTag(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ensureTags(node, tags) {
  node.tags = [...new Set([...(node.tags ?? []), ...tags])];
}

function claim(id, text, evidence, confidence = "moderate", state = "partially_supported") {
  return { id, text, state, evidence, sourceIds: [], confidence, disputeNotes: "" };
}

function updateNode(tree, nodeId, patch) {
  const node = tree.nodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`Missing node ${tree.id}/${nodeId}`);
  Object.assign(node, patch);
  if (patch.evidenceLabels) ensureTags(node, patch.evidenceLabels.map(evidenceTag));
  return node;
}

function markdown({ title, summary, notes, questions = [], answer = "", connections = [], sources = [], openQuestions = [], claims = [], evidence = [] }) {
  return `# ${title}

## Summary
${summary}

## Notes
${notes}

Evidence labels: ${evidence.length ? evidence.join("; ") : evidenceLabels.inference}

## Related User Questions
${questions.map((item) => `- ${item}`).join("\n")}

## Assistant Answer Summary
${answer}

## Connections
${connections.map((item) => `- ${item}`).join("\n")}

## Sources
${sources.map((item) => `- ${item}`).join("\n")}

## Open Questions
${openQuestions.map((item) => `- ${item}`).join("\n")}

## Claims
${claims.map((item) => `- [${item.label}] ${item.text}`).join("\n")}
`;
}

async function writeNodeNote(treeId, node, body) {
  const file = path.join(repo, "trees", treeId, node.notePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

function sourceLine(source) {
  return `${source.title}: ${source.url}`;
}

function ensureSource(sources, source) {
  if (!sources.some((item) => item.id === source.id)) sources.push(source);
}

function makeChild(tree, parentId, title, summary, details, evidence, index, type = "claim", category = "Controversy") {
  const id = slug(title);
  if (tree.nodes.some((node) => node.id === id)) return tree.nodes.find((node) => node.id === id);
  const parent = tree.nodes.find((node) => node.id === parentId);
  const node = {
    id,
    title,
    type,
    status: "researching",
    treeId: tree.id,
    clusterId: tree.id,
    parentId,
    importance: "detail",
    level: (parent?.level ?? 1) + 1,
    layoutHint: "leaf",
    fixedPosition: true,
    x: 140 + ((parent?.level ?? 1) + 1) * 260,
    y: 180 + index * 70,
    notePath: `nodes/${id}.md`,
    tags: ["evidence-aware", ...evidence.map(evidenceTag)],
    category,
    dateRange: "",
    shortSummary: summary,
    detailedSummary: details,
    relatedQuestions: [],
    relatedAnswers: [],
    connections: [],
    claims: [claim(`${id}_claim_1`, summary, evidence.join("; "), evidence.includes(evidenceLabels.weak) ? "weak" : "moderate")]
  };
  tree.nodes.push(node);
  tree.edges.push({ id: `edge-${parentId}-${id}`, source: parentId, target: id, label: "archive entry", type: "part_of", notes: "Navigation edge for archive analysis." });
  return node;
}

async function enrichUou() {
  const tree = await loadTree("uou-turkmenistan-ngo-networks");
  const sources = await loadSources(tree.id);
  const sourceLines = sources.map(sourceLine);
  const qUou = [
    "What exactly was the Union of Ufologists (UOU)?",
    "Was the UOU originally the Association of Ufologists in Chardzhou?",
    "Who was Ovezberdy Muradov?",
    "Why was a ufology organization functioning as a successful NGO in authoritarian Turkmenistan?",
    "Why was USAID/Counterpart involved with the UOU?",
    "Was the UOU genuinely a UFO organization, or had it evolved into something else?",
    "Why did the public trail around the UOU mostly disappear after 2004?",
    "Did the 2003 Law on Public Associations effectively suppress independent NGOs?"
  ];

  const root = updateNode(tree, "union_of_ufologists_of_turkmenabat_uou", {
    shortSummary: "The Union of Ufologists of Turkmenabat was a Turkmenistan ufology-labeled organization that also appears in NGO/civil-society and grant records.",
    detailedSummary: "UOU is treated as an organization-history problem: a local ufology network in Turkmenabat/Chardzhou whose public trail intersects with USAID/Counterpart-backed civic work, restrictive NGO law, and authoritarian information control. This tree separates verified organizational facts, document-based grant traces, plausible continuity inferences, and unresolved archival gaps.",
    relatedQuestions: qUou,
    relatedAnswers: ["The UOU appears to have been both a ufology organization and a practical civic/NGO platform. The evidence does not prove extraterrestrial claims or corruption; it raises a historically interesting question about legally tolerated civic infrastructure in an authoritarian state."],
    claims: [
      claim("uou_claim_identity", "UOU means Union of Ufologists of Turkmenabat.", evidenceLabels.primary, "strong", "strongly_supported"),
      claim("uou_claim_not_proof", "The UOU record does not confirm extraterrestrial claims.", evidenceLabels.inference, "strong", "strongly_supported"),
      claim("uou_claim_continuity_unresolved", "Continuity with the Association of Ufologists in Chardzhou is plausible but not legally proven.", evidenceLabels.unresolved, "moderate")
    ],
    evidenceLabels: [evidenceLabels.primary, evidenceLabels.inference, evidenceLabels.unresolved]
  });
  await writeNodeNote(tree.id, root, markdown({
    title: root.title,
    summary: root.shortSummary,
    notes: root.detailedSummary,
    evidence: [evidenceLabels.primary, evidenceLabels.inference, evidenceLabels.unresolved],
    questions: qUou,
    answer: root.relatedAnswers[0],
    connections: ["Connects to Chardzhou/Charjou ufology, Ovezberdy Muradov, USAID/Counterpart, the 2003 NGO law, and post-Soviet ufology history."],
    sources: sourceLines,
    openQuestions: qUou,
    claims: [
      { label: evidenceLabels.primary, text: "UOU is identified as the Union of Ufologists of Turkmenabat." },
      { label: evidenceLabels.inference, text: "Its ufology identity and NGO work may have coexisted rather than one simply replacing the other." },
      { label: evidenceLabels.unresolved, text: "The post-2004 disappearance of its public footprint remains unresolved." }
    ]
  }));

  const uouHistory = updateNode(tree, "uou_historical_timeline", {
    shortSummary: "Timeline linking Charjou/Chardzhou ufology, the 1991 publication trail, Muradov, the later UOU, and the post-2004 public-record gap.",
    detailedSummary: "Turkmenabat was formerly Chardzhou/Charjou. A 1991 Russian-language publication, UFOs: Fantastic Reality, connects Ovezberdy A. Muradov and V. V. Bondarenko to Charjou ufology. Later public records identify Muradov as UOU president in 2004. The Association of Ufologists in Chardzhou is likely part of the same local network, but exact legal continuity is unresolved.",
    evidenceLabels: [evidenceLabels.ufology, evidenceLabels.primary, evidenceLabels.inference, evidenceLabels.unresolved]
  });
  await writeNodeNote(tree.id, uouHistory, markdown({
    title: uouHistory.title,
    summary: uouHistory.shortSummary,
    notes: `${uouHistory.detailedSummary}\n\nImportant cautions: Russian-language publication in Soviet Central Asia does not prove Muradov was ethnically Russian. The UOU reportedly helped NGOs register, helped register 187 enterprises, provided business-registration assistance, and taught computer, accounting, massage, and ufology courses. The exact 187 enterprises are not identified. The shoe factory may have been Turkmenabat Shoe Factory, but that remains unproven. The planned newsletter may never have launched; no copies have been found in this ledger.`,
    evidence: [evidenceLabels.ufology, evidenceLabels.primary, evidenceLabels.inference, evidenceLabels.unresolved],
    questions: qUou,
    answer: "The best current model is cautious continuity: Chardzhou ufology and Turkmenabat UOU probably overlap as a local network, but legal identity and organizational continuity remain unproven.",
    connections: ["Association of Ufologists in Chardzhou", "Ovezberdy A. Muradov", "UFOs: Fantastic Reality (1991)", "UOU humanitarian and NGO work", "UOU grant trail"],
    sources: sourceLines,
    openQuestions: ["Can copies of the planned UOU newsletter be found?", "Can the 187 enterprises be identified?", "Was the shoe factory Turkmenabat Shoe Factory?"],
    claims: [
      { label: evidenceLabels.primary, text: "Muradov appears as UOU president in 2004 records." },
      { label: evidenceLabels.ufology, text: "UFOs: Fantastic Reality links Muradov and Bondarenko to Charjou ufology." },
      { label: evidenceLabels.unresolved, text: "Legal continuity between the Charjou association and UOU is not proven." }
    ]
  }));

  const muradov = updateNode(tree, "ovezberdy_a_muradov", {
    shortSummary: "Ovezberdy A. Muradov was associated with Charjou/Turkmenabat ufology and appears as UOU president in 2004.",
    detailedSummary: "Muradov is described in the UFOs: Fantastic Reality listing as a physicist and chairman of the Charjou City Association of Ufologists. Later records identify Ovezberdy A. Muradov as president of the UOU. The record supports organizational association, not ethnic inference or extraterrestrial conclusions.",
    evidenceLabels: [evidenceLabels.ufology, evidenceLabels.primary, evidenceLabels.unresolved]
  });
  await writeNodeNote(tree.id, muradov, markdown({
    title: muradov.title,
    summary: muradov.shortSummary,
    notes: muradov.detailedSummary,
    evidence: [evidenceLabels.ufology, evidenceLabels.primary, evidenceLabels.unresolved],
    questions: ["Who was Ovezberdy Muradov?", "Was Muradov part of a continuous Chardzhou/Turkmenabat ufology organization?"],
    answer: "Muradov is best treated as a documented ufology/NGO figure whose full biography remains incomplete.",
    connections: ["UFOs: Fantastic Reality (1991)", "Association of Ufologists in Chardzhou", "Union of Ufologists of Turkmenabat (UOU)"],
    sources: sourceLines,
    openQuestions: ["Can biographical records identify Muradov's later career?", "Can the 1991 publication be verified from library holdings?"],
    claims: [
      { label: evidenceLabels.ufology, text: "Muradov is described as a physicist and Charjou ufology chairman in a publication listing." },
      { label: evidenceLabels.unresolved, text: "The ledger does not infer Muradov's ethnicity from language of publication." }
    ]
  }));

  const ngo = updateNode(tree, "uou_humanitarian_and_ngo_work", {
    shortSummary: "The UOU reportedly performed practical civic work: NGO registration help, refugee support, enterprise registration help, and local training courses.",
    detailedSummary: "The UOU reportedly helped register 187 enterprises, assisted NGOs under restrictive law, helped with refugee and business-registration issues, and taught computer, accounting, massage, and ufology courses. The exact enterprises are unidentified. The massage courses are best read as ordinary vocational or therapeutic instruction; no evidence suggests sexual or illicit meaning. The location and students are not specified, but local residents, members, or civic participants using UOU infrastructure are the most likely audience.",
    evidenceLabels: [evidenceLabels.primary, evidenceLabels.inference, evidenceLabels.unresolved]
  });
  await writeNodeNote(tree.id, ngo, markdown({
    title: ngo.title,
    summary: ngo.shortSummary,
    notes: ngo.detailedSummary,
    evidence: [evidenceLabels.primary, evidenceLabels.inference, evidenceLabels.unresolved],
    questions: ["Was the UOU genuinely a UFO organization, or had it evolved into something else?", "Why was a ufology organization functioning as a successful NGO in authoritarian Turkmenistan?"],
    answer: "The most careful interpretation is hybrid function: UOU retained ufology identity while also operating as a local civil-society/vocational assistance node.",
    connections: ["2003 Law on Public Associations", "UOU grant trail", "USAID relationship"],
    sources: sourceLines,
    openQuestions: ["Which 187 enterprises were registered?", "Were the courses held at UOU offices or partner spaces?", "Who attended the courses?"],
    claims: [
      { label: evidenceLabels.primary, text: "UOU reportedly helped register 187 enterprises." },
      { label: evidenceLabels.unresolved, text: "The exact 187 enterprises are not identified." },
      { label: evidenceLabels.inference, text: "Massage courses likely refer to ordinary vocational/therapeutic instruction." }
    ]
  }));

  const grants = updateNode(tree, "uou_grant_trail", {
    shortSummary: "The UOU grant trail includes one confirmed active $8,532 grant and two larger discussed/proposed grants that are not proven awarded.",
    detailedSummary: "The confirmed active grant was $8,532. A $15,000 capacity-building grant and a $30,000 newsletter-equipment grant were discussed or proposed, but this ledger has no proof they were awarded. The newsletter may never have launched; no copies are currently known here.",
    evidenceLabels: [evidenceLabels.primary, evidenceLabels.unresolved]
  });
  await writeNodeNote(tree.id, grants, markdown({
    title: grants.title,
    summary: grants.shortSummary,
    notes: grants.detailedSummary,
    evidence: [evidenceLabels.primary, evidenceLabels.unresolved],
    questions: ["Why was USAID/Counterpart involved with the UOU?", "Why did the public trail around the UOU mostly disappear after 2004?"],
    answer: "The grant trail is useful but incomplete. Confirmed aid should not be inflated into proof of all proposed funding.",
    connections: ["USAID relationship", "Counterpart International", "Unresolved funding/public-record gaps"],
    sources: sourceLines,
    openQuestions: ["Were the $15,000 or $30,000 grants ever awarded?", "Did the newsletter print any issues?", "Can local or donor archives fill the gap?"],
    claims: [
      { label: evidenceLabels.primary, text: "$8,532 active grant is preserved as confirmed." },
      { label: evidenceLabels.unresolved, text: "$15,000 and $30,000 grants remain possible/proposed, not proven awarded." }
    ]
  }));

  const law = updateNode(tree, "2003_law_on_public_associations", {
    shortSummary: "The 2003 law illustrates how normal nonprofit paperwork can become dangerous inside authoritarian enforcement systems.",
    detailedSummary: "Charters, founder names, meeting minutes, legal addresses, and governing documents are normal in democratic nonprofit registration. In authoritarian Turkmenistan, the danger came from Ministry of Justice discretion, prohibition on unregistered activity, exposure of members and networks, selective denial/pressure, and foreign-funding scrutiny. UOU re-registration was therefore significant because the state could use registration as a civic filter.",
    evidenceLabels: [evidenceLabels.primary, evidenceLabels.secondary, evidenceLabels.inference]
  });
  await writeNodeNote(tree.id, law, markdown({
    title: law.title,
    summary: law.shortSummary,
    notes: law.detailedSummary,
    evidence: [evidenceLabels.primary, evidenceLabels.secondary, evidenceLabels.inference],
    questions: ["Did the 2003 Law on Public Associations effectively suppress independent NGOs?", "Why would charters, founder names, meeting minutes, and addresses be dangerous?"],
    answer: "The paperwork is not inherently authoritarian; enforcement context made it dangerous.",
    connections: ["NGO suppression in Turkmenistan", "UOU humanitarian and NGO work", "Saparmurat Niyazov complete political history"],
    sources: sourceLines,
    openQuestions: ["What specific registration criteria were used against independent groups?", "Why did UOU survive re-registration when other groups struggled?"],
    claims: [
      { label: evidenceLabels.inference, text: "Risk came from discretion, exposure, and prohibition of unregistered activity, not from paperwork alone." }
    ]
  }));

  await saveTree(tree);
}

const caseSummaries1914 = {
  smolensk_disappearing_children: ["Smolensk disappearing children", "A disappearance motif involving children, best read as folklore-adjacent material rather than verified contact evidence.", "This case belongs to the old pattern of children entering forbidden or liminal spaces and vanishing. In the archive, its value is not evidentiary proof of nonhuman actors but motif continuity: disappearance, vulnerability, and the little-people/fairy-adjacent structure later reframed by UFO catalogues."],
  pawtucket_singing_humanoids: ["Pawtucket singing humanoids", "A singing humanoid report showing musical/enchanted-being motifs more than technological UFO structure.", "The strongest analytical value is the overlap with older visitation folklore: sound, uncanny performers, strange figures, and witness disturbance. It illustrates how pre-saucer humanoid material often looks closer to folklore than machinery."],
  farmersville_green_humanoid: ["Farmersville little green man", "A green humanoid entry useful for tracking the early life of the 'little green man' motif.", "The case is valuable as a motif marker. It should not be promoted as a verified entity encounter; it is a reported claim that shows how color, small stature, and otherness become durable narrative elements."],
  hamburg_cigar_craft: ["Hamburg cigar craft", "A cigar-shaped craft report showing early technological reinterpretation before the flying-saucer era.", "This entry is important because it moves away from pure fairy/visitor folklore toward machine-like aerial framing. The cigar form later becomes common in airship and UFO lore."],
  finland_grandmother_sky_ship: ["Alastaro Finland grandmother sky-ship case", "A Finnish sky-ship visitation story that mixes family memory, folklore, and early technological imagery.", "This case is strongest as a folklore-to-technology bridge: a grandmother figure, sky vehicle, and wonder narrative rather than a clean modern UFO event."],
  spike_island_yellow_watcher: ["Spike Island yellow watcher", "A watcher figure with unusual coloration, useful for tracking surveillance and uncanny-presence motifs.", "The 'watcher' element matters more than literal interpretation. It connects to later Men in Black, silent observers, and liminal humanoid reports."],
  georgian_bay_water_collection_case: ["Georgian Bay water-collection case", "A water-collection motif that anticipates later UFO cases involving sampling behavior.", "This report is useful because it frames entities as task-performing collectors. The motif later appears in technological terms: sampling, surveys, and biological/environmental collection."],
  cochabamba_proto_abduction: ["Cochabamba proto-abduction", "A proto-abduction structure before the standardized modern abduction narrative.", "This case is useful because it shows coercive encounter structure before the later Betty and Barney Hill-era template. It should remain a witness-claim archive entry, not external-event proof."]
};

const caseSummaries1939 = {
  cordell_hull_sub_basement_story: ["Cordell Hull Capitol sub-basement story", "A culturally influential but weakly sourced story about bodies or entities allegedly kept under the U.S. Capitol.", "This is explicitly weak/unverified. Its value is mythological: it anticipates later crashed-saucer, hidden-body, and government-coverup structures. It should never be used as verified evidence without stronger primary documentation."],
  spain_upward_disappearance_case: ["Spain upward-disappearance case", "A disappearance/upward-removal motif useful for tracking abduction-like structures before Roswell.", "The case fits liminal removal narratives: a person or presence is taken upward or vanishes into the sky. The analytical value is pattern history, not confirmation."],
  finland_robot_worker_case: ["Finland robot-worker case", "A robot-worker motif showing mechanical humanoid imagery before the postwar saucer boom.", "This case is important because robotic beings appear before Roswell-era UFO culture, showing that mechanized humanoids were already available as narrative material."],
  alabama_psychic_other_world_woman: ["Alabama psychic other-world woman", "A psychic or other-world woman narrative showing occult, visionary, and contact motifs.", "The report sits between spiritualism, psychic experience, and contactee narrative. It is useful for studying how feminine otherworldly figures later overlap with space-being stories."],
  california_radiant_woman_marian_overlap: ["California radiant woman / Marian overlap", "A radiant-woman report that overlaps with Marian apparition and religious-vision imagery.", "This case belongs in the religion/folklore overlap zone: luminous woman, visitation, awe, and moral/spiritual framing. It should not be flattened into a spacecraft case."],
  delaware_river_hidden_door: ["Delaware River hidden door", "A hidden-door motif suggesting portals, liminal entrances, and concealed worlds.", "This entry is valuable because hidden entrances and thresholds are older than modern UFOs. It can be compared with fairy mounds, secret doors, underground worlds, and later portal language."],
  greek_mushroom_craft: ["Greek mushroom craft", "A mushroom-shaped craft motif showing early odd-vehicle imagery.", "The shape matters as imagery. It points to a transitional vocabulary in which strange aerial/landed objects are named through familiar analogies."],
  brazil_prospector_abduction: ["Brazil prospector abduction", "A reported abduction-like case involving a prospector, useful as a pre-Roswell coercive encounter motif.", "The case is useful for tracking isolation, frontier setting, and coercive removal. It should remain a witness claim pending source criticism."]
};

const caseSummaries1958 = {
  pre_hill_gray_like_abduction: ["Pre-Hill gray-like abduction", "A pre-Betty-and-Barney-Hill case with gray-like or examination motifs.", "This matters because it suggests some later abduction motifs were circulating before the most famous 1960s template. Still, it remains a witness/ufology compilation entry."],
  vietnam_retrieval_mythology: ["Vietnam retrieval mythology", "A weak/unverified retrieval-style story from the Vietnam context.", "This should be labeled weak. Its value is in showing how military retrieval mythology forms around conflict zones, not in proving recovered craft or bodies."],
  argentina_subway_humanoid: ["Argentina subway humanoid", "An urban underground humanoid report with liminal transit imagery.", "The subway setting makes this a modern hidden-world case: underground space, anonymous movement, and uncanny figures inside infrastructure."],
  phoenix_monkey_entities: ["Phoenix monkey-like entities", "A report involving monkey-like entities, useful for nonstandard entity taxonomy.", "This is valuable as a reminder that archives are not only 'grays' and Nordics. Reports preserve unstable entity categories shaped by culture, fear, animals, and misperception."],
  cynthia_appleton: ["Cynthia Appleton", "A contactee-style case involving cosmic instruction and domestic visitation.", "Appleton-type narratives matter because they blend home intrusion, cosmic teaching, spirituality, and contactee-era themes."],
  akart_narrative: ["Akart civilization narrative", "A civilization/contactee narrative linked to cosmic-spiritual themes.", "The Akart material is better handled as contactee mythology than proof. It illustrates how named civilizations and cosmic instruction became common in the period."],
  texas_repair_operation_case: ["Texas repair-operation case", "A repair-operation motif in which occupants appear to fix or service a craft.", "Repair cases frame entities as technicians. This makes them useful for studying how UFO occupants are imagined as workers inside a technological system."],
  robert_monroe_overlap: ["Robert Monroe consciousness-overlap case", "A consciousness/altered-state overlap relevant to out-of-body and anomalous-experience interpretation.", "Monroe-adjacent material belongs in the boundary between UFO reports, altered states, and consciousness studies. It should not be treated as ordinary physical evidence."]
};

const caseSummaries1990 = {
  moscow_biological_robot_case: ["Moscow biological robot case", "A biological-robot report from the Soviet/CIS paranormal explosion.", "The key motif is ambiguous personhood: something that looks biological but acts mechanical or programmed. This is especially important in late Soviet/post-Soviet reports."],
  reutov_biological_robot_hellenic_beings: ["Reutov biological robot / Hellenic beings", "A report combining biological robot language with classical/Hellenic imagery.", "The mixture of high-tech biology and ancient/classical imagery is analytically important: modern and archaic symbols coexist rather than replacing each other."],
  tashkent_humanoid: ["Tashkent humanoid", "A Central Asian humanoid report useful for regional comparison, but not verified external evidence.", "This case should be kept as regional archive material. Its value is comparative: how Soviet/Central Asian reports encode locality, uncertainty, and post-Soviet paranormal atmosphere."],
  mary_turkmenistan_case: ["Mary, Turkmenistan case", "A Turkmenistan humanoid claim best treated as likely psychological distress or weak external-event evidence.", "This is not a strong evidence case. The ledger preserves it to show how local humanoid claims enter archives, while emphasizing psychological distress/psychosis as a more plausible interpretive frame than a confirmed external encounter."],
  edinburgh_pizza_parlor_case: ["Edinburgh pizza-parlor human-mimicry case", "A human-mimicry case focused on uncanny social behavior rather than proof of aliens.", "The useful question is why violated social patterns disturb witnesses: wrong affect, wrong timing, mimicry, and almost-human behavior. It connects to changelings, Men in Black, doppelgangers, and android/AI anxiety."],
  soviet_cis_paranormal_explosion: ["Soviet/CIS paranormal explosion", "The early 1990s environment in which media, instability, archive openings, and paranormal claims surged.", "This context matters because reports do not emerge in a vacuum. Political collapse, weak institutions, new media markets, spiritual searching, and rumor networks all shaped the archive."]
};

const caseSummaries1951 = {
  nordic_beautiful_human_entities: ["Nordic / beautiful-human entities", "Beautiful human-like entities mark the early contactee/Nordic stream of UFO mythology.", "This motif differs sharply from later gray imagery. It reflects attractiveness, spiritual elevation, and contactee-era hopes projected onto human-like visitors."],
  halidon_south_australia: ["Halidon, South Australia", "A 1951 Australia-linked case useful as a regional early-contact motif.", "The case is preserved as a claim archive entry and should be used for motif comparison, not proof."],
  british_columbia_child_abduction_examination_case: ["British Columbia child-abduction/examination case", "A child-focused abduction/examination motif before the modern abduction template fully stabilizes.", "This is analytically important because vulnerability, child witnesses, examination, and missing-time-like structures appear before later standardized abduction accounts."],
  georgetown_guyana_landing_burned_circle: ["Georgetown Guyana landing with burned circle", "A landing-trace motif involving a burned circle.", "Landing traces often feel more physical than entity reports, but still require source criticism. Here the value is tracking trace narratives."],
  chirundu_zimbabwe_mermaid_folklore_case: ["Chirundu Zimbabwe mermaid/folklore case", "A mermaid/folklore-linked case showing that not all humanoid material is technological.", "This preserves the folklore side of the archive and resists forcing every report into a spacecraft frame."],
  mongolia_force_field_landing: ["Mongolia force-field landing", "A force-field landing motif connecting invisible barriers and technological imagination.", "Force-field language reflects Cold War and science-fiction vocabulary entering encounter narratives."],
  maumee_ohio_orphanage_gray_like_beings: ["Maumee Ohio orphanage gray-like beings", "An orphanage gray-like beings report useful for pre-Hill gray motif tracking.", "Child institutional settings intensify vulnerability and memory issues. This is a claim archive entry, not verified evidence."],
  moscow_loo_entity: ["Moscow 'Loo' entity", "A Moscow entity report with unusual naming and postwar Soviet context.", "The case is useful as Soviet-region motif material, especially because entity labels often preserve local or translator-mediated interpretation."],
  casteil_france_mountain_stranger_topographer: ["Casteil France mountain stranger/topographer", "A mountain stranger/topographer motif where the entity resembles a surveyor or technical worker.", "Topographer imagery frames the stranger as a mapper or measurer, connecting folklore stranger motifs to technical modernity."],
  korea_war_object_ray_illness_case: ["Korea War object/ray illness case", "A Korean War object/ray illness case connecting UFO reports to wartime fear and bodily harm.", "The key context is war: weapons anxiety, radiation/ray imagery, illness, and military uncertainty."],
  south_africa_gravity_craft_engineer_case: ["South Africa gravity-craft engineer case", "A gravity-craft/engineer narrative showing technical explanation motifs.", "Engineer figures and anti-gravity language show how witnesses or retellings interpret strangeness through available technical imagination."],
  manila_invisible_attacker_case: ["Manila invisible attacker case", "An invisible-attacker case at the boundary of haunting, assault narrative, and humanoid archive.", "This case should be handled carefully as anomalous-experience folklore rather than a clean UFO entity report."],
  ukiah_nane_moon_civilization_case: ["Ukiah 'Nane' moon-civilization case", "A moon-civilization/contact narrative showing early cosmic-contact mythology.", "Named civilizations and moon origins belong to contactee mythology. The value is studying cosmological storytelling, not verifying lunar inhabitants."]
};

async function enrichHumanoid() {
  const tree = await loadTree("humanoid-encounter-archives");
  const sources = await loadSources(tree.id);
  const sourceLines = sources.map(sourceLine);
  const root = updateNode(tree, "humanoid_encounter_archives", {
    shortSummary: "A research cluster for humanoid encounter catalogues as claim archives, folklore databases, mythology-evolution material, and anthropological datasets.",
    detailedSummary: "The archive is not treated as proof of aliens. It preserves reported claims, recurring motifs, chronology, and cultural transformations: folklore beings, religious visions, contactee entities, robotic figures, abduction structures, and post-Soviet paranormal narratives.",
    relatedQuestions: ["Are humanoid encounter archives useful as evidence, folklore databases, anthropological material, or all three?", "Why do recurring motifs appear repeatedly across decades and cultures?"],
    relatedAnswers: ["Humanoid archives are useful as claim archives and motif datasets. They are not automatically verified evidence of external beings."],
    evidenceLabels: [evidenceLabels.ufology, evidenceLabels.inference]
  });
  await writeNodeNote(tree.id, root, markdown({
    title: root.title,
    summary: root.shortSummary,
    notes: root.detailedSummary,
    evidence: [evidenceLabels.ufology, evidenceLabels.inference],
    questions: root.relatedQuestions,
    answer: root.relatedAnswers[0],
    connections: ["Albert Rosales", "International Catalogue of Humanoid Encounters", "1914 archive", "1939 archive", "1951 archive", "1958 archive", "1990 archive", "Consciousness / Mythology / Archetype Evolution"],
    sources: sourceLines,
    openQuestions: ["Which cases have traceable primary sources?", "Which motifs predate modern UFO media?", "Which cases are better explained psychologically or folklorically?"],
    claims: [{ label: evidenceLabels.ufology, text: "The archive is a catalogue of claims, not a verification engine." }]
  }));

  const archive1951 = makeChild(
    tree,
    root.id,
    "1951 archive",
    "Transition-year archive where folklore, religious vision, contactee mythology, missing time, child examination, and early gray/Nordic motifs overlap.",
    "1951 is treated as a transition year. It contains older folklore motifs alongside more technological or contactee-style structures: beautiful human/Nordic entities, child abduction and examination, landing traces, mermaid folklore, force fields, gray-like beings, wartime ray illness, technical engineers, invisible attackers, and moon-civilization narratives.",
    [evidenceLabels.ufology, evidenceLabels.witness, evidenceLabels.inference],
    6,
    "timeline",
    "Event"
  );
  archive1951.importance = "major";
  archive1951.level = 1;
  archive1951.layoutHint = "branch";

  for (const [id, [title, summary, details]] of Object.entries({ ...caseSummaries1914, ...caseSummaries1939, ...caseSummaries1958, ...caseSummaries1990 })) {
    const node = tree.nodes.find((item) => item.id === id);
    if (!node) continue;
    updateNode(tree, id, {
      title,
      shortSummary: summary,
      detailedSummary: details,
      relatedQuestions: ["How did UFO mythology evolve from folklore into modern technological-abduction narratives?", "Why do recurring motifs appear repeatedly across decades and cultures?"],
      relatedAnswers: ["This case is preserved as motif evidence and a witness/ufology-archive claim, not as confirmed external-event proof."],
      claims: [
        claim(`${id}_claim_archive`, summary, `${evidenceLabels.ufology}; ${evidenceLabels.witness}`, "moderate"),
        claim(`${id}_claim_caution`, "This entry should not be treated as verified proof of aliens or recovered nonhuman beings.", evidenceLabels.inference, "strong", "strongly_supported")
      ],
      evidenceLabels: [evidenceLabels.ufology, evidenceLabels.witness, id.includes("cordell") || id.includes("vietnam") || id.includes("mary") ? evidenceLabels.weak : evidenceLabels.inference]
    });
    await writeNodeNote(tree.id, node, markdown({
      title,
      summary,
      notes: details,
      evidence: [evidenceLabels.ufology, evidenceLabels.witness, id.includes("cordell") || id.includes("vietnam") || id.includes("mary") ? evidenceLabels.weak : evidenceLabels.inference],
      questions: node.relatedQuestions,
      answer: node.relatedAnswers[0],
      connections: ["Parent archive year", "Folklore continuity", "Humanoid Encounter Archives", "Consciousness / Mythology / Archetype Evolution"],
      sources: sourceLines,
      openQuestions: ["Can the original source be traced?", "What older folklore motifs does this resemble?", "What later UFO motifs does it anticipate?"],
      claims: [
        { label: evidenceLabels.ufology, text: "This is an archive claim, not a verified historical event." },
        { label: evidenceLabels.inference, text: summary }
      ]
    }));
  }

  for (const [id, [title, summary, details]] of Object.entries(caseSummaries1951)) {
    const n = makeChild(tree, archive1951.id, title, summary, details, [evidenceLabels.ufology, evidenceLabels.witness, evidenceLabels.inference], 20);
    updateNode(tree, n.id, {
      shortSummary: summary,
      detailedSummary: details,
      relatedQuestions: ["How did UFO mythology evolve from folklore into modern technological-abduction narratives?", "Why do recurring motifs appear repeatedly across decades and cultures?"],
      relatedAnswers: ["1951 is treated as a transitional motif year where folklore, contactee spirituality, early gray/Nordic imagery, and wartime anxieties overlap."],
      claims: [claim(`${n.id}_claim_archive`, summary, `${evidenceLabels.ufology}; ${evidenceLabels.witness}`, "moderate")],
      evidenceLabels: [evidenceLabels.ufology, evidenceLabels.witness, evidenceLabels.inference]
    });
    await writeNodeNote(tree.id, n, markdown({
      title,
      summary,
      notes: details,
      evidence: [evidenceLabels.ufology, evidenceLabels.witness, evidenceLabels.inference],
      questions: n.relatedQuestions,
      answer: n.relatedAnswers[0],
      connections: ["1951 archive", "Folklore-to-technology transition", "Contactee mythology", "Early abduction motifs"],
      sources: sourceLines,
      openQuestions: ["Can this entry be traced to a primary local report?", "Does it resemble older folklore, contactee literature, or later abduction reports?"],
      claims: [{ label: evidenceLabels.inference, text: summary }]
    }));
  }

  const archiveNotes = {
    "1914_archive": "1914 material strongly resembles folklore, little-people traditions, mystical visitation, and proto-technological interpretation. It is a high-value folklore-to-technology transition set.",
    "1939_archive": "1939 shows pre-Roswell technological motifs: robots, telepathy, upward disappearance, hidden doors, abduction structure, and proto-Men-in-Black/government-secret mythology.",
    "1951_archive": "1951 is a transition year where folklore, religious visions, contactee mythology, missing time, child examination, and early gray/Nordic motifs overlap. It shows older supernatural patterns being translated into technical, extraterrestrial, or contactee-era language.",
    "1958_archive": "1958 shows modern abduction/contactee mythology stabilizing: telepathy, examinations, missing time, hybrid or reproductive themes, cosmic spirituality, and Cold War nuclear anxiety.",
    "1990_archive": "1990 emphasizes post-Soviet/CIS paranormal explosion: biological robots, human mimicry, altered states, social instability, and cases that may be sincere but psychologically mediated."
  };
  for (const [nodeId, notes] of Object.entries(archiveNotes)) {
    const n = tree.nodes.find((item) => item.id === nodeId);
    if (!n) continue;
    n.detailedSummary = notes;
    await writeNodeNote(tree.id, n, markdown({
      title: n.title,
      summary: n.shortSummary,
      notes,
      evidence: [evidenceLabels.ufology, evidenceLabels.witness, evidenceLabels.inference],
      questions: ["How did UFO mythology evolve from folklore into modern technological-abduction narratives?", "Why do recurring motifs appear repeatedly across decades and cultures?"],
      answer: "The archive year is analyzed as a motif cluster, not as proof of external beings.",
      connections: tree.nodes.filter((item) => item.parentId === n.id).map((item) => item.title),
      sources: sourceLines,
      openQuestions: ["Which cases have primary-source trails?", "Which motifs recur in later decades?"],
      claims: [{ label: evidenceLabels.inference, text: notes }]
    }));
  }
  if (!tree.qas.some((qa) => qa.id === "qa_humanoid_1951_transition")) {
    tree.qas.push({
      id: "qa_humanoid_1951_transition",
      question: "Why is 1951 important in the humanoid archive sequence?",
      answer: "1951 functions as a transition year where folklore, religious vision, contactee mythology, child examination, missing time, early gray-like beings, Nordic/beautiful-human entities, and Cold War ray/force-field anxieties overlap.",
      linkedNodeIds: [archive1951.id, ...Object.keys(caseSummaries1951).map(slug)],
      dateAdded: date
    });
  }
  await saveTree(tree);
}

async function enrichSetkaAndConsciousness() {
  const setka = await loadTree("soviet-ufology-setka");
  const setkaSources = (await loadSources(setka.id)).map(sourceLine);
  for (const node of setka.nodes) {
    if (!node.relatedQuestions?.length) node.relatedQuestions = ["What parts of Soviet UFO research are historically verified?", "What parts remain speculative or mythologized?"];
    if (!node.relatedAnswers?.length) node.relatedAnswers = ["Soviet anomalous-phenomena study is historically significant, but extraterrestrial conclusions remain unverified."];
    if (!node.claims?.length) node.claims = [claim(`${node.id}_claim_boundary`, "Historical state/military interest does not equal proof of extraterrestrial craft or bodies.", evidenceLabels.inference, "strong", "strongly_supported")];
    await writeNodeNote(setka.id, node, markdown({
      title: node.title,
      summary: node.shortSummary,
      notes: node.detailedSummary,
      evidence: (node.tags ?? []).filter((tag) => /verified|primary|secondary|ufology|witness|weakly|analytical|unresolved/.test(tag)).map((tag) => tag.replaceAll("-", " ")),
      questions: node.relatedQuestions,
      answer: node.relatedAnswers[0],
      connections: ["SETKA-AN", "SETKA-MO", "Petrozavodsk incident", "Cold War context"].filter((title) => title !== node.title),
      sources: setkaSources,
      openQuestions: ["Which claims are backed by primary Soviet documents?", "Which claims are post-Soviet mythologizing?"],
      claims: [{ label: evidenceLabels.verified, text: "Soviet anomalous-phenomena research structures existed." }, { label: evidenceLabels.unresolved, text: "Alien craft/body claims remain unverified." }]
    }));
  }
  await saveTree(setka);

  const consciousness = await loadTree("consciousness-mythology-archetypes");
  const conSources = (await loadSources(consciousness.id)).map(sourceLine);
  for (const node of consciousness.nodes) {
    if (!node.relatedQuestions?.length) node.relatedQuestions = ["Why do consciousness, telepathy, altered states, and symbolic/archetypal imagery appear so often in these reports?"];
    if (!node.relatedAnswers?.length) node.relatedAnswers = ["This tree preserves the motif question without concluding that interdimensional beings are real."];
    if (!node.claims?.length) node.claims = [claim(`${node.id}_claim_motif`, "Motif recurrence can be studied without treating the reports as literal external encounters.", evidenceLabels.inference, "strong", "strongly_supported")];
    await writeNodeNote(consciousness.id, node, markdown({
      title: node.title,
      summary: node.shortSummary,
      notes: node.detailedSummary,
      evidence: (node.tags ?? []).filter((tag) => /verified|primary|secondary|ufology|witness|weakly|analytical|unresolved/.test(tag)).map((tag) => tag.replaceAll("-", " ")),
      questions: node.relatedQuestions,
      answer: node.relatedAnswers[0],
      connections: ["Humanoid Encounter Archives", "Folklore continuity", "Altered-state overlap", "Human mimicry motif"].filter((title) => title !== node.title),
      sources: conSources,
      openQuestions: ["What explains recurrence across folklore, religion, UFO reports, altered states, and technological anxiety?"],
      claims: [{ label: evidenceLabels.inference, text: "This is motif analysis, not a conclusion that interdimensional beings are real." }]
    }));
  }
  await saveTree(consciousness);
}

async function enrichExistingTrees() {
  const activeTurkmenistanPath = path.join(repo, "trees", "turkmenistan", "tree.json");
  const archivedTurkmenistanPath = path.join(repo, "trees", "_archived", "turkmenistan", "tree.json");
  const turkmenistanPath = fs.existsSync(activeTurkmenistanPath) ? activeTurkmenistanPath : fs.existsSync(archivedTurkmenistanPath) ? archivedTurkmenistanPath : null;
  const turkmenistan = turkmenistanPath ? JSON.parse(await readFile(turkmenistanPath, "utf8")) : null;
  if (turkmenistan) {
  turkmenistan.description = "Research tree for Turkmenistan, now bridged to the deeper UOU / NGO / authoritarian-state investigation.";
  turkmenistan.metadata = {
    ...(turkmenistan.metadata ?? {}),
    id: "turkmenistan",
    title: "Turkmenistan",
    themeColor: "purple",
    rootNodeId: "turkmenistan",
    preferredPosition: { x: 0.5, y: 0.22 },
    layoutRadius: 190,
    branchSpacing: 1,
    description: turkmenistan.description
  };
  turkmenistan.bridgeEdges = [
    ...(turkmenistan.bridgeEdges ?? []).filter((edge) => edge.id !== "bridge-turkmenistan-uou-investigation"),
    { id: "bridge-turkmenistan-uou-investigation", sourceTreeId: "turkmenistan", sourceNodeId: "turkmenistan", targetTreeId: "uou-turkmenistan-ngo-networks", targetNodeId: "union_of_ufologists_of_turkmenabat_uou", label: "deep UOU / NGO investigation", type: "cross_tree", notes: "The original Turkmenistan starter remains lightweight and links to the dedicated UOU/NGO cluster." }
  ];
  const root = turkmenistan.nodes.find((node) => node.id === "turkmenistan");
  root.shortSummary = "Turkmenistan country/root node, bridged to a dedicated UOU, NGO-law, Niyazov, and post-Soviet civil-society investigation.";
  root.detailedSummary = "This starter tree remains a country-level entry point. The deeper evidence-aware investigation is kept in the Turkmenistan / UOU / NGO Networks tree to preserve visual clarity and avoid burying the original country tree under a specialized archive project.";
  root.relatedQuestions = ["How did authoritarian Turkmenistan shape the UOU/NGO public trail?", "How did Soviet collapse and Niyazov's rule affect civic organizations?"];
  root.relatedAnswers = ["The dedicated UOU tree handles the detailed investigation while this root stays a clean country-level gateway."];
  root.tags = [...new Set([...(root.tags ?? []), "uou", "ngo-law", "authoritarianism", evidenceTag(evidenceLabels.inference)])];
  const turkmenistanTreeDir = path.dirname(turkmenistanPath);
  await writeFile(path.join(turkmenistanTreeDir, root.notePath), markdown({
    title: root.title,
    summary: root.shortSummary,
    notes: root.detailedSummary,
    evidence: [evidenceLabels.inference],
    questions: root.relatedQuestions,
    answer: root.relatedAnswers[0],
    connections: ["Turkmenistan / UOU / NGO Networks", "Union of Ufologists of Turkmenabat (UOU)", "Saparmurat Niyazov complete political history"],
    sources: ["CSCE referendum report: https://www.csce.gov/publications/report-turkmenistans-referendum-independence/", "Britannica — Saparmurad Niyazov: https://www.britannica.com/biography/Saparmurad-Niyazov"],
    openQuestions: ["Should future country-level material stay here while UOU-specific material remains in the dedicated cluster?"],
    claims: [{ label: evidenceLabels.inference, text: "The dedicated UOU tree is intentionally separate but bridged to preserve graph clarity." }]
  }));
  turkmenistan.updatedAt = updatedAt;
  await writeFile(turkmenistanPath, `${JSON.stringify(turkmenistan, null, 2)}\n`);
  }

  const ufos = await loadTree("ufos");
  ufos.description = "Gateway tree for UFO-related research, bridged to evidence-aware Soviet ufology, humanoid archive, and mythology analysis clusters.";
  ufos.metadata = {
    id: "ufos",
    title: "UFOs",
    themeColor: "blue",
    rootNodeId: "ufos",
    preferredPosition: { x: 0.74, y: 0.22 },
    layoutRadius: 190,
    branchSpacing: 1,
    description: ufos.description
  };
  ufos.bridgeEdges = [
    { id: "bridge-ufos-setka", sourceTreeId: "ufos", sourceNodeId: "ufos", targetTreeId: "soviet-ufology-setka", targetNodeId: "soviet_anomalous_phenomena_research", label: "Soviet anomalous-phenomena research", type: "cross_tree", notes: "Gateway bridge to verified/contested Soviet UFO research history." },
    { id: "bridge-ufos-humanoid-archives", sourceTreeId: "ufos", sourceNodeId: "ufos", targetTreeId: "humanoid-encounter-archives", targetNodeId: "humanoid_encounter_archives", label: "humanoid claim archives", type: "cross_tree", notes: "Gateway bridge to claim archives handled as folklore/anthropology evidence." },
    { id: "bridge-ufos-consciousness-motifs", sourceTreeId: "ufos", sourceNodeId: "ufos", targetTreeId: "consciousness-mythology-archetypes", targetNodeId: "consciousness_mythology_archetype_evolution", label: "motif and archetype analysis", type: "cross_tree", notes: "Gateway bridge to consciousness/mythology analysis." }
  ];
  const ufoRoot = ufos.nodes.find((node) => node.id === "ufos");
  Object.assign(ufoRoot, {
    treeId: "ufos",
    clusterId: "ufos",
    importance: "root",
    level: 0,
    layoutHint: "root",
    category: "Concept",
    shortSummary: "Gateway node for UFO research, explicitly separated from claims of proof and bridged to evidence-aware archive/history clusters.",
    detailedSummary: "This is no longer a placeholder. It is a top-level gateway to Soviet ufology/SETKA history, humanoid claim archives, and consciousness/mythology analysis. The UFO tree does not assert that aliens are confirmed; it routes research into source-critical clusters.",
    relatedQuestions: ["What parts of UFO history are verified?", "What parts are folklore, witness claims, or mythology development?"],
    relatedAnswers: ["The research ledger separates verified history, state research, ufology compilations, witness claims, and analytical inference."],
    tags: ["ufo", "evidence-aware", "archive-gateway", evidenceTag(evidenceLabels.inference)],
    claims: [claim("ufos_gateway_claim_no_confirmation", "This gateway does not claim aliens are confirmed.", evidenceLabels.inference, "strong", "strongly_supported")]
  });
  await writeNodeNote("ufos", ufoRoot, markdown({
    title: ufoRoot.title,
    summary: ufoRoot.shortSummary,
    notes: ufoRoot.detailedSummary,
    evidence: [evidenceLabels.inference],
    questions: ufoRoot.relatedQuestions,
    answer: ufoRoot.relatedAnswers[0],
    connections: ["Soviet Ufology / SETKA", "Humanoid Encounter Archives", "Consciousness / Mythology / Archetype Evolution"],
    sources: ["NICAP: https://www.nicap.org", "MUFON: https://mufon.com", "The Black Vault: https://www.theblackvault.com", "CIA Reading Room: https://www.cia.gov/readingroom/"],
    openQuestions: ["Which sources are primary documents versus compilations?", "Which reports have traceable provenance?"],
    claims: [{ label: evidenceLabels.inference, text: "UFO research in this repo is source-critical and does not treat all claims as equal." }]
  }));
  await saveTree(ufos);
}

async function auditNewTrees() {
  const ids = ["uou-turkmenistan-ngo-networks", "soviet-ufology-setka", "humanoid-encounter-archives", "consciousness-mythology-archetypes"];
  const problems = [];
  for (const id of ids) {
    const tree = await loadTree(id);
    for (const node of tree.nodes) {
      const notePath = path.join(repo, "trees", id, node.notePath);
      const note = fs.existsSync(notePath) ? await readFile(notePath, "utf8") : "";
      const generic = /is part of the .* research (cluster|tree)|Short plain-English summary|A new research tree/i;
      if (!node.shortSummary || !node.detailedSummary || generic.test(node.shortSummary) || generic.test(node.detailedSummary) || !note || note.length < 500 || generic.test(note)) {
        problems.push(`${id}/${node.id}`);
      }
    }
  }
  return problems;
}

await enrichUou();
await enrichHumanoid();
await enrichSetkaAndConsciousness();
await enrichExistingTrees();
const problems = await auditNewTrees();
if (problems.length) {
  console.error("Remaining thin/generic nodes:", problems.join(", "));
  process.exitCode = 1;
} else {
  console.log("UOU/Turkmenistan cleanup complete. No thin/generic new nodes remain.");
}
