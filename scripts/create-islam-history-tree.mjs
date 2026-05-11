import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const treeId = "islam-and-muslim-history";
const rootDir = path.join(process.cwd(), "trees", treeId);
const now = "2026-05-09T00:00:00.000Z";
const dateAdded = "2026-05-09";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

const qas = [
  {
    id: "qa_mecca_before_islam",
    question: "What was the religion in Mecca before Muhammad entered with a large Muslim force in 630 CE?",
    answer:
      "Before Muhammad’s conquest of Mecca in 630 CE, Mecca’s dominant public religion was Arabian polytheism. The Kaaba was already a major sanctuary, but it was associated with idols, tribal gods, sacred objects, pilgrimage rites, and local cult practices. Muhammad’s conquest is remembered in Islamic history as the moment when the Kaaba was cleansed of idols and rededicated to the worship of one God.",
    linkedNodeIds: []
  },
  {
    id: "qa_ali_relationship",
    question: "How was Ali ibn Abi Talib, Muhammad’s cousin and son-in-law?",
    answer:
      "Ali ibn Abi Talib was Muhammad’s cousin because Ali’s father, Abu Talib, was the brother of Muhammad’s father, Abd Allah. Abu Talib raised Muhammad after Muhammad’s grandfather died. Ali became Muhammad’s son-in-law because he married Fatimah, Muhammad’s daughter. This marriage made Ali central in Islamic history, especially in Shia Islam, where Ali is considered the first rightful Imam after Muhammad.",
    linkedNodeIds: []
  },
  {
    id: "qa_uthman_umayyads",
    question: "Who was Uthman ibn Affan and who were his Umayyad relatives?",
    answer:
      "Uthman ibn Affan was the third caliph after Abu Bakr and Umar. He belonged to the Umayyad clan of Quraysh. The Umayyads were a powerful Meccan family, and after Uthman’s death one of his kinsmen, Muawiyah ibn Abi Sufyan, eventually founded the Umayyad dynasty. Criticism of Uthman centered on claims that he appointed or empowered members of his extended Umayyad clan in important offices, especially governorships. This created accusations of nepotism and helped fuel unrest that ended with his assassination.",
    linkedNodeIds: []
  },
  {
    id: "qa_quran_revelation",
    question: "How was the direct word of God revealed to Muhammad over 23 years? And specifically in Arabic?",
    answer:
      "Muslims believe the Qur’an was revealed by God to Muhammad through the angel Gabriel over roughly 23 years, from around 610 CE until Muhammad’s death in 632 CE. It was revealed in Arabic because Muhammad preached in Arabic, his first audience was Arabic-speaking, and the Qur’an presents itself as an Arabic recitation. Historically, the Qur’an emerged as an Arabic recited and liturgical text before being collected into a written codex.",
    linkedNodeIds: []
  },
  {
    id: "qa_variant_quran_materials",
    question: "What were the earlier variant materials and how would they have disunited people if they were essentially the originals?",
    answer:
      "The earlier variant materials were not necessarily totally different Qur’ans. They were mainly companion codices, oral recitation differences, dialectal variants, ordering differences, marginal explanations, and readings associated with early figures such as Ibn Mas‘ud, Ubayy ibn Ka‘b, Abu Musa al-Ash‘ari, and others. The danger was not that everyone had a totally different religion. The danger was that the empire was expanding quickly, new Muslims were learning the Qur’an in different regions, and regional recitation differences could become sectarian or political markers. Uthman’s standardization created one official written consonantal text to prevent disputes over which recitation or codex had public authority.",
    linkedNodeIds: []
  },
  {
    id: "qa_jafari_jurisprudence",
    question: "What is Ja’fari jurisprudence?",
    answer:
      "Ja’fari jurisprudence is the main legal school of Twelver Shia Islam. It is named after Ja‘far al-Sadiq, the sixth Shia Imam. Sunni law usually traces authority through jurists and schools like Hanafi, Maliki, Shafi‘i, and Hanbali. Ja’fari law gives special authority to the teachings of the Imams from the family of Muhammad.",
    linkedNodeIds: []
  },
  {
    id: "qa_saint_veneration_critics",
    question: "What are some major examples of critics objecting to saint veneration, shrine practices, or metaphysical claims they saw as excessive?",
    answer:
      "Examples include visiting saints’ tombs for blessing, asking dead saints for intercession, making vows at shrines, shrine festivals, relic veneration, ecstatic rituals, music or dance ceremonies such as some sama practices, and metaphysical doctrines such as Ibn Arabi’s “oneness of being.” Critics, especially stricter traditionalist or reformist movements, argued that these practices risked shirk, associating partners with God, or bid‘ah, blameworthy religious innovation. Not all Muslims agreed. In many periods, shrine devotion and Sufism were mainstream.",
    linkedNodeIds: []
  },
  {
    id: "qa_pope_urban_ii",
    question: "Who was Pope Urban II?",
    answer:
      "Pope Urban II was the pope who launched the First Crusade in 1095. He called Western European Christians to armed pilgrimage to help Eastern Christians and take Jerusalem. That call eventually led to Crusader armies capturing Jerusalem in 1099.",
    linkedNodeIds: []
  },
  {
    id: "qa_mongol_conversion",
    question: "Why did many Mongol elites eventually convert to Islam, especially in the Ilkhanate and Golden Horde? And tell me more about Ilkhanate and Golden Horde.",
    answer:
      "Mongol conversion to Islam happened for practical and cultural reasons. The Mongols conquered heavily Muslim lands, especially Iran, Central Asia, and the Volga trade zone. Their rulers needed legitimacy among Muslim subjects, married into local elites, used Muslim administrators, joined trade networks, and absorbed Persian-Islamic court culture. In the Golden Horde, Berke Khan converted early and allied with Muslim powers like the Mamluks. In the Ilkhanate, Mongol rulers initially attacked Islamic institutions, including Baghdad, but later rulers converted, especially Ghazan Khan in 1295. The Ilkhanate ruled Persia/Iran, Iraq, parts of Anatolia, and the Caucasus. The Golden Horde ruled much of the western steppe, southern Russia, and the Volga region.",
    linkedNodeIds: []
  },
  {
    id: "qa_millet_system",
    question: "What is a millet system?",
    answer:
      "The millet system was the Ottoman way of organizing recognized religious communities, especially Orthodox Christians, Armenians, and Jews. These communities had their own religious leaders and handled many internal matters such as marriage, divorce, inheritance, schooling, and communal discipline. It was not modern equality. Muslims were politically dominant, while non-Muslims were protected but subordinate.",
    linkedNodeIds: []
  },
  {
    id: "qa_ataturk",
    question: "Who was Mustafa Kemal Atatürk?",
    answer:
      "Mustafa Kemal Atatürk was the founder and first president of the Republic of Turkey. He led the Turkish nationalist movement after World War I, abolished the Ottoman sultanate, helped establish the republic in 1923, and pushed aggressive secularizing reforms. The caliphate was abolished on March 3, 1924.",
    linkedNodeIds: []
  },
  {
    id: "qa_khadijah_history",
    question: "Tell me more about Khadijah and her history and family line.",
    answer:
      "Khadijah bint Khuwaylid was Muhammad’s first wife, a wealthy Meccan merchant, and the first person to accept his prophethood according to Islamic tradition. She belonged to Quraysh, the same broad tribal confederation as Muhammad, and came from a respected family. Her father was Khuwaylid ibn Asad of the Banu Asad clan of Quraysh. She had been married before Muhammad and was likely widowed. Sources differ, but earlier husbands usually named include Atiq ibn A’idh and Abu Halah al-Tamimi. She likely had children before Muhammad. She hired Muhammad for trade work, was impressed by his honesty and reliability, and proposed marriage through intermediaries. She became Muhammad’s primary emotional and financial support. After the first revelation, she reassured him and consulted her relative Waraqa ibn Nawfal, who was knowledgeable in earlier scripture. Muhammad remained monogamously married to Khadijah until her death. Her death, along with Abu Talib’s, occurred in the “Year of Sorrow.” Without Khadijah, the early Islamic movement may not have survived in the same way.",
    linkedNodeIds: []
  },
  {
    id: "qa_womens_rights_social_practice",
    question: "What do you mean those rights were often limited by social practices?",
    answer:
      "Islamic law may say a woman can own property, inherit, keep her dowry, consent to marriage, seek divorce under certain mechanisms, or conduct business. But in real societies, male relatives, judges, tribal custom, poverty, illiteracy, political power, and family pressure could block those rights. For example, a woman might legally inherit, but brothers could pressure her to waive her share. She might have a marriage contract right, but her guardian or family could override her in practice. She might have legal access to divorce, but courts, stigma, money, or fear of losing children could make it hard. The legal doctrine could be more favorable than the lived social reality.",
    linkedNodeIds: []
  },
  {
    id: "qa_ibn_arabi_oneness",
    question: "What was Ibn Arabi’s ‘oneness of being’ interpretation?",
    answer:
      "Ibn Arabi’s “oneness of being,” often associated with wahdat al-wujud, is one of the most influential and controversial ideas in Islamic mysticism. The basic idea is that God is the only true, absolute reality, while everything else exists as a manifestation, reflection, disclosure, or dependent appearance of God’s being. This does not simply mean “everything is God” in a crude pantheistic sense. Ibn Arabi maintained a distinction between God’s absolute essence and the created world as signs or disclosures of divine reality. Supporters argued creation has no independent existence apart from God and that the universe reflects divine names and attributes. Critics argued this blurred the line between Creator and creation and could drift into monism or pantheism.",
    linkedNodeIds: []
  },
  {
    id: "qa_urban_crusade_reasoning",
    question: "What was the reasoning behind Pope Urban II calling for the crusades?",
    answer:
      "Pope Urban II launched the First Crusade in 1095 at the Council of Clermont. Several motives overlapped. The Byzantine Empire had asked Western Europe for military aid against the Seljuk Turks after major territorial losses in Anatolia. Urban also saw an opportunity to increase papal authority, unite feuding European nobles under a religious cause, strengthen ties with Eastern Christianity, potentially heal the split between Eastern Orthodox and Roman Catholic Christianity, reclaim Jerusalem and important Christian pilgrimage sites, and channel knightly violence outward instead of into Europe. Religious motives included remission of sins, pilgrimage, defense of Christians, apocalyptic expectations, and sacred warfare ideology. Political ambition was also real.",
    linkedNodeIds: []
  },
  {
    id: "qa_ilkhans_detail",
    question: "Tell me more about Il-Khans in great detail.",
    answer:
      "The Ilkhanate emerged after the Mongol conquests under Hulegu Khan, grandson of Genghis Khan. Hulegu invaded the Middle East in the mid-1200s. The biggest event was the destruction of Baghdad in 1258, where the Mongols killed the Abbasid caliph and shattered the old Sunni imperial center. The Ilkhanate ruled Persia/Iran, Iraq, parts of Anatolia, and the Caucasus. At first, Mongol rulers were religiously mixed, including shamanist, Buddhist, Christian, and other influences. Over time, the Ilkhanate became Persianized and Islamized because the lands it ruled were deeply Islamic, with Muslim administrators, scholars, merchants, taxation systems, urban culture, and Persian bureaucratic traditions. Ghazan Khan’s conversion in 1295 was a major turning point. After that, Mongol elites increasingly became Muslim, Persian bureaucratic culture fused with Mongol military rule, Islamic scholarship revived, and Persian art and literature flourished.",
    linkedNodeIds: []
  },
  {
    id: "qa_khadijah_extreme_detail",
    question: "I want you to go into extreme detail about Khadijah bint Khuwaylid. It’s weird to me. This was her second marriage and almost seems like she influenced Muhammad heavily. I want to know everything there is to know about her, her previous marriage, her lineage, etc.",
    answer:
      "Khadijah bint Khuwaylid is one of the most important women in Islamic history. She was older than Muhammad, wealthy, experienced, socially respected, and economically powerful. She belonged to Quraysh, specifically the Banu Asad clan. Her father was Khuwaylid ibn Asad. She had been married before Muhammad, and sources differ on whether she was widowed once or twice. The earlier husbands commonly named are Atiq ibn A’idh and Abu Halah al-Tamimi. She likely had children before Muhammad. She employed Muhammad in trade caravans and was impressed by his honesty and reliability. She proposed marriage through intermediaries. She was the more socially established figure at the beginning of the relationship. She became Muhammad’s primary emotional and financial support. When Muhammad experienced the first revelations, Islamic tradition says he was terrified and uncertain. Khadijah reassured him and consulted her relative Waraqa ibn Nawfal, who was knowledgeable in earlier scriptures and possibly Christian or influenced by biblical traditions. Khadijah immediately believed Muhammad’s prophetic claim. Historically, it is reasonable to say that without Khadijah, the early movement may not have survived in the same way. She provided money, protection, emotional stability, legitimacy, and elite social connections. Muhammad remained monogamously married to her until her death. Her death deeply affected him and is remembered as part of the Year of Sorrow. It is historically reasonable to say Khadijah influenced Muhammad heavily in practical, emotional, and social ways. It is not historically responsible to claim she invented Islam or that Waraqa invented Islam without strong evidence.",
    linkedNodeIds: []
  },
  {
    id: "qa_berke_conversion",
    question: "Is there knowledge as to why Berke Khan converted and what his religion was before then?",
    answer:
      "There is some historical knowledge about why Berke Khan converted to Islam, though not a modern autobiographical explanation from him personally. Before converting, Berke was almost certainly raised within the traditional Mongol religious world: Tengrism, ancestor veneration, shamanic practices, belief in spirits and cosmic order, and broad religious pluralism. The core divine concept in older Mongol belief was Tengri, the Eternal Blue Sky, a supreme heavenly power associated with fate, legitimacy, and cosmic authority. Berke likely converted for overlapping reasons: geography and politics, Muslim trade networks around the Volga basin and Central Asia, personal influence from Muslim travelers or scholars, identity and legitimacy among Muslim subjects, and conflict with Hulegu after the destruction of Baghdad. Islamic sources often say a caravan from Bukhara influenced him. His conversion helped shape the conflict between the Golden Horde and the Ilkhanate.",
    linkedNodeIds: []
  },
  {
    id: "qa_religion_of_abraham",
    question: "When you said ‘the religion of Abraham’ earlier, what is that religion compared to that of just Christianity itself?",
    answer:
      "In Islam, “the religion of Abraham” means pure monotheistic submission to God before later religious divisions emerged. Abraham, called Ibrahim in Islam, is viewed as a model of primordial monotheism. Muslims believe Islam did not begin with Muhammad but was the same essential message preached by Adam, Noah, Abraham, Moses, Jesus, Muhammad, and other prophets: worship one God and submit to Him. The Qur’an says Abraham was neither Jew nor Christian because he historically predates both Judaism and Christianity as organized later traditions. Islam claims to restore or finalize Abraham’s original monotheism. Christianity differs because it centers on Jesus as the Son of God, the Trinity, crucifixion, resurrection, and salvation through Christ. Islam rejects the Trinity, rejects Jesus as divine, views Jesus as a prophet, and treats Muhammad as the final prophet. Judaism, Christianity, and Islam are all called Abrahamic religions because they trace spiritual ancestry to Abraham, but they disagree sharply about revelation, Jesus, law, and final religious authority.",
    linkedNodeIds: []
  }
].map((qa) => ({ ...qa, dateAdded }));

const nodes = [];
const edges = [];
const notes = new Map();
const titleToId = new Map();

function node(title, options = {}) {
  const existing = titleToId.get(title);
  if (existing) return existing;
  const id = options.id ?? slugify(title);
  titleToId.set(title, id);
  nodes.push({
    id,
    title,
    treeId,
    clusterId: treeId,
    parentId: options.parentId,
    type: options.type ?? "topic",
    category: options.category ?? "Concept",
    importance: options.importance ?? "detail",
    level: options.level ?? 2,
    fixedPosition: true,
    layoutHint: options.layoutHint ?? "leaf",
    dateRange: options.dateRange ?? "",
    shortSummary: options.summary ?? "",
    detailedSummary: options.notes ?? options.summary ?? "",
    relatedQuestions: options.qaIds ?? [],
    relatedAnswers: options.qaIds?.map((qaId) => qas.find((qa) => qa.id === qaId)?.answer ?? "").filter(Boolean) ?? [],
    status: options.status ?? "researching",
    x: options.x ?? 0,
    y: options.y ?? 0,
    notePath: `nodes/${id}.md`,
    tags: options.tags ?? []
  });
  notes.set(id, {
    title,
    summary: options.summary ?? `${title} is a research node in the Islam and Muslim History study tree.`,
    notes: options.notes ?? "Use this node to continue building the research trail with new questions, sources, claims, and relationships.",
    qaIds: options.qaIds ?? [],
    connections: []
  });
  return id;
}

function edge(source, target, relationship = "connected_to", label = relationship.replaceAll("_", " "), explanation = "") {
  if (source === target) return;
  const id = `edge-${source}-${target}-${relationship}`.replace(/[^a-zA-Z0-9_-]+/g, "-");
  if (edges.some((item) => item.id === id)) return;
  edges.push({ id, source, target, type: relationship, label, notes: explanation });
  const note = notes.get(source);
  if (note) note.connections.push(`${label}: ${target}`);
}

function linkQa(qaId, nodeIds) {
  const qa = qas.find((item) => item.id === qaId);
  if (!qa) return;
  qa.linkedNodeIds = [...new Set([...qa.linkedNodeIds, ...nodeIds])];
  for (const id of nodeIds) {
    const note = notes.get(id);
    const nodeRecord = nodes.find((item) => item.id === id);
    if (!note || !nodeRecord) continue;
    note.qaIds = [...new Set([...note.qaIds, qaId])];
    nodeRecord.relatedQuestions = [...new Set([...(nodeRecord.relatedQuestions ?? []), qaId])];
    nodeRecord.relatedAnswers = [...new Set([...(nodeRecord.relatedAnswers ?? []), qa.answer])];
  }
}

function branch(title, angle, options = {}) {
  const radius = 680;
  return node(title, {
    ...options,
    parentId: root,
    importance: "major",
    level: 1,
    layoutHint: "branch",
    type: "topic",
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
    tags: [...(options.tags ?? []), "major-branch"]
  });
}

function typeForCategory(category) {
  if (category === "Person") return "person";
  if (category === "Place") return "place";
  if (category === "Event") return "event";
  if (category === "Text/scripture") return "source";
  if (category === "User question") return "question";
  if (category === "people_group") return "people_group";
  return "topic";
}

function normalizedCategory(category) {
  return category === "people_group" ? "Concept" : category;
}

function child(parentId, title, index, total, options = {}) {
  const parent = nodes.find((item) => item.id === parentId);
  const spread = Math.min(Math.PI * 0.9, Math.max(Math.PI / 4, total * 0.14));
  const base = Math.atan2(parent.y, parent.x);
  const angle = base - spread / 2 + (spread * (index + 0.5)) / total;
  const radius = options.radius ?? 360;
  const id = node(title, {
    ...options,
    parentId,
    type: options.type ?? typeForCategory(options.category),
    category: normalizedCategory(options.category),
    x: Math.round(parent.x + Math.cos(angle) * radius),
    y: Math.round(parent.y + Math.sin(angle) * radius)
  });
  edge(parentId, id, options.relationship ?? "connected_to", options.label ?? "branch detail", options.explanation ?? "");
  return id;
}

const root = node("Islam and Muslim History", {
  id: "islam_and_muslim_history",
  type: "root",
  category: "Concept",
  importance: "root",
  level: 0,
  layoutHint: "root",
  status: "researching",
  x: 0,
  y: 0,
  summary: "A connected research ledger for Islam, Muslim history, Qur’anic transmission, succession, law, mysticism, empires, reform, and Abrahamic religious concepts.",
  notes: "This tree preserves the Q&A flow from the study session as structured data while keeping each topic extensible for new sources, claims, and questions.",
  tags: ["islam", "muslim-history", "study-session", "research-map"]
});

const branchTitles = [
  "Pre-Islamic Arabia and Mecca",
  "Muhammad and the First Muslim Community",
  "Khadijah bint Khuwaylid",
  "Qur’an Revelation and Compilation",
  "Early Caliphs and Succession",
  "Ali ibn Abi Talib",
  "Uthman ibn Affan and the Umayyads",
  "Sunni, Shia, and Ja’fari Jurisprudence",
  "Sufism and Ibn Arabi",
  "Crusades and Pope Urban II",
  "Mongols, Berke Khan, Ilkhanate, and Golden Horde",
  "Ottoman Millet System",
  "Mustafa Kemal Atatürk",
  "Women’s Rights in Islamic Law and Social Practice",
  "Abrahamic Religion Concept"
];

const branches = new Map();
branchTitles.forEach((title, index) => {
  const id = branch(title, (Math.PI * 2 * index) / branchTitles.length - Math.PI / 2, {
    category: title.includes("Khadijah") || title.includes("Ali") || title.includes("Uthman") || title.includes("Urban") || title.includes("Atatürk") ? "Person" : "Concept",
    summary: `${title} is a major branch in this Islam and Muslim History research tree.`
  });
  branches.set(title, id);
  edge(root, id, "part_of", "major research branch");
});

const branchData = [
  ["Muhammad and the First Muslim Community", "", [
    ["Muhammad", "Person", "c. 570-632 CE", "The prophet of Islam and central figure of the first Muslim community.", "connected_to"],
    ["First Muslim Community", "Concept", "610s-632 CE", "The earliest community formed around Muhammad’s preaching and leadership.", "connected_to"],
    ["Conquest of Mecca", "Event", "630 CE", "Muhammad entered Mecca with a large Muslim force in 630 CE.", "caused"],
    ["Early believers", "Concept", "610s CE", "The earliest followers who accepted Muhammad’s prophetic claim.", "connected_to"],
    ["Year of Sorrow context", "Event", "c. 619 CE", "The deaths of Khadijah and Abu Talib marked a crisis in the early movement.", "caused"]
  ]],
  ["Early Caliphs and Succession", "", [
    ["Abu Bakr", "Person", "c. 573-634 CE", "The first caliph after Muhammad.", "political_succession"],
    ["Umar ibn al-Khattab", "Person", "c. 584-644 CE", "The second caliph after Abu Bakr.", "political_succession"],
    ["Caliphal succession", "Concept", "632 CE onward", "The question of political and religious leadership after Muhammad.", "political_succession"],
    ["First Fitna", "Event", "656-661 CE", "The first major Muslim civil war, linked to Uthman’s death and Ali’s caliphate.", "caused"],
    ["Imamate dispute", "Concept", "632 CE onward", "The theological-political dispute over rightful authority after Muhammad.", "theological_dispute"]
  ]],
  ["Pre-Islamic Arabia and Mecca", "qa_mecca_before_islam", [
    ["Mecca before Islam", "Place", "before 630 CE", "Pre-Islamic Mecca’s dominant public religion was Arabian polytheism.", "connected_to"],
    ["Arabian polytheism", "Concept", "", "The dominant public religious field in Mecca before Muhammad’s conquest.", "theological_dispute"],
    ["Kaaba before Islam", "Place", "before 630 CE", "The Kaaba was a sanctuary associated with idols, pilgrimage rites, and local cult practices.", "located_in"],
    ["Meccan pilgrimage", "Event", "pre-Islamic", "Pilgrimage rituals existed around Mecca before Islam and were later reoriented in Islamic memory.", "connected_to"],
    ["Cleansing of the Kaaba in 630 CE", "Event", "630 CE", "Islamic memory treats this as the moment the Kaaba was cleansed of idols and rededicated to one God.", "reform_standardization"]
  ]],
  ["Ali ibn Abi Talib", "qa_ali_relationship", [
    ["Ali ibn Abi Talib", "Person", "c. 600-661 CE", "Muhammad’s cousin, son-in-law, fourth caliph, and central figure in Shia Islam.", "genealogy"],
    ["Abu Talib", "Person", "d. c. 619 CE", "Ali’s father and Muhammad’s uncle and guardian.", "genealogy"],
    ["Abd Allah ibn Abd al-Muttalib", "Person", "d. before 570 CE", "Muhammad’s father and brother of Abu Talib.", "genealogy"],
    ["Fatimah bint Muhammad", "Person", "c. 605/615-632 CE", "Muhammad’s daughter and Ali’s wife.", "genealogy"],
    ["Ali as cousin", "Concept", "", "Ali was Muhammad’s cousin through Abu Talib and Abd Allah’s brotherhood.", "genealogy"],
    ["Ali as son-in-law", "Concept", "", "Ali became Muhammad’s son-in-law by marrying Fatimah.", "genealogy"],
    ["Ali in Shia Islam", "Concept", "", "Shia Islam treats Ali as the first rightful Imam after Muhammad.", "theological_dispute"]
  ]],
  ["Uthman ibn Affan and the Umayyads", "qa_uthman_umayyads", [
    ["Uthman ibn Affan", "Person", "c. 576-656 CE", "The third caliph and a member of the Umayyad clan of Quraysh.", "political_succession"],
    ["Third caliph", "Concept", "644-656 CE", "Uthman succeeded Umar as the third caliph.", "political_succession"],
    ["Umayyad clan", "Empire/state", "", "A powerful Meccan clan within Quraysh.", "genealogy"],
    ["Quraysh", "Empire/state", "", "The broad Meccan tribal confederation connected to Muhammad, Khadijah, and Uthman.", "genealogy"],
    ["Muawiyah ibn Abi Sufyan", "Person", "c. 602-680 CE", "Umayyad kinsman who eventually founded the Umayyad dynasty.", "political_succession"],
    ["Nepotism accusations", "Concept", "650s CE", "Criticism that Uthman empowered extended Umayyad relatives in offices.", "theological_dispute"],
    ["Assassination of Uthman", "Event", "656 CE", "Uthman’s killing fueled the first civil war and succession crisis.", "caused"],
    ["Rise of Umayyad dynasty", "Empire/state", "661 CE onward", "The Umayyad dynasty emerged after the conflicts following Uthman and Ali.", "empire_state_formation"]
  ]],
  ["Qur’an Revelation and Compilation", "qa_quran_revelation", [
    ["Qur’anic revelation", "Text/scripture", "610-632 CE", "Muslims believe the Qur’an was revealed by God to Muhammad through Gabriel.", "source_for"],
    ["Angel Gabriel", "Concept", "", "The angel understood in Islam as conveying revelation to Muhammad.", "connected_to"],
    ["610 CE first revelation", "Event", "610 CE", "The beginning of the Qur’anic revelation period in Islamic tradition.", "connected_to"],
    ["23-year revelation period", "Event", "610-632 CE", "The revelation unfolded over roughly 23 years.", "connected_to"],
    ["Arabic language", "Concept", "", "The Qur’an presents itself as an Arabic recitation for Muhammad’s Arabic-speaking first audience.", "connected_to"],
    ["Oral recitation", "Text/scripture", "610-632 CE", "The Qur’an first functioned as a recited and liturgical Arabic text.", "source_for"],
    ["Written codex", "Text/scripture", "7th century CE", "The Qur’an was later collected into a written codex.", "reform_standardization"]
  ]],
  ["Qur’an Revelation and Compilation", "qa_variant_quran_materials", [
    ["Uthmanic recension", "Text/scripture", "mid-7th century CE", "Uthman’s standardization created one official written consonantal text.", "reform_standardization"],
    ["Companion codices", "Text/scripture", "early 7th century CE", "Early written or remembered Qur’anic materials associated with Muhammad’s companions.", "connected_to"],
    ["Ibn Mas‘ud codex", "Text/scripture", "early 7th century CE", "A codex tradition associated with Ibn Mas‘ud.", "source_for"],
    ["Ubayy ibn Ka‘b codex", "Text/scripture", "early 7th century CE", "A codex tradition associated with Ubayy ibn Ka‘b.", "source_for"],
    ["Abu Musa al-Ash‘ari", "Person", "7th century CE", "An early figure associated with regional Qur’anic materials.", "source_for"],
    ["Oral recitation variants", "Text/scripture", "7th century CE", "Differences in recitation that could become regional markers.", "connected_to"],
    ["Dialectal variation", "Concept", "7th century CE", "Regional/dialectal differences in early recitation practice.", "connected_to"],
    ["Public authority of scripture", "Concept", "7th century CE", "The core issue behind standardizing one public text.", "theological_dispute"],
    ["Suppression of variant materials", "Event", "mid-7th century CE", "Non-official materials were suppressed to prevent disputes.", "reform_standardization"],
    ["Unity of the Muslim community", "Concept", "7th century CE", "Standardization aimed to prevent scripture from becoming a factional marker.", "reform_standardization"]
  ]],
  ["Sunni, Shia, and Ja’fari Jurisprudence", "qa_jafari_jurisprudence", [
    ["Ja’fari jurisprudence", "Legal tradition", "", "The main legal school of Twelver Shia Islam.", "legal_tradition"],
    ["Twelver Shia Islam", "Legal tradition", "", "The Shia tradition in which Ja’fari law is authoritative.", "legal_tradition"],
    ["Ja‘far al-Sadiq", "Person", "702-765 CE", "The sixth Shia Imam and namesake of Ja’fari jurisprudence.", "legal_tradition"],
    ["Sixth Imam", "Concept", "", "Ja‘far al-Sadiq’s place in the Shia Imam lineage.", "legal_tradition"],
    ["Shia legal authority", "Legal tradition", "", "Authority centered on the teachings of the Imams from Muhammad’s family.", "legal_tradition"],
    ["Teachings of the Imams", "Legal tradition", "", "A key source of authority in Ja’fari law.", "legal_tradition"],
    ["Comparison with Sunni legal schools", "Legal tradition", "", "Sunni authority usually runs through jurists and schools such as Hanafi, Maliki, Shafi‘i, and Hanbali.", "theological_dispute"]
  ]],
  ["Sufism and Ibn Arabi", "qa_saint_veneration_critics", [
    ["Sufism", "Concept", "", "Islamic mysticism and devotional practice, often mainstream but also criticized in reformist contexts.", "connected_to"],
    ["Saint veneration", "Concept", "", "Devotional attention to saints, often at tombs or shrines.", "theological_dispute"],
    ["Shrine practices", "Concept", "", "Practices around shrines, vows, blessings, and festivals.", "theological_dispute"],
    ["Intercession", "Concept", "", "Asking saints for intercession was criticized by stricter reformists.", "theological_dispute"],
    ["Shrine festivals", "Event", "", "Festival practice around saints’ shrines.", "theological_dispute"],
    ["Relic veneration", "Concept", "", "Devotion to relics or physical traces associated with holy figures.", "theological_dispute"],
    ["Sama", "Concept", "", "Music or dance listening ceremonies in some Sufi contexts.", "theological_dispute"],
    ["Bid‘ah", "Concept", "", "Blameworthy religious innovation in Islamic criticism.", "theological_dispute"],
    ["Shirk", "Concept", "", "Associating partners with God; a central accusation against excessive veneration.", "theological_dispute"],
    ["Reformist criticism", "Concept", "", "Traditionalist or reformist objection to practices seen as excessive.", "theological_dispute"]
  ]],
  ["Crusades and Pope Urban II", "qa_pope_urban_ii", [
    ["Pope Urban II", "Person", "c. 1035-1099", "The pope who launched the First Crusade in 1095.", "caused"],
    ["Council of Clermont", "Event", "1095", "The setting for Urban II’s crusade call.", "caused"],
    ["First Crusade", "Event", "1095-1099", "The armed pilgrimage that culminated in Crusader capture of Jerusalem.", "caused"],
    ["Jerusalem", "Place", "1099", "The city captured by Crusader armies in 1099.", "located_in"],
    ["Armed pilgrimage", "Concept", "", "Crusading framed as a religiously authorized armed journey.", "connected_to"],
    ["Byzantine appeal for help", "Event", "1090s", "Eastern Christian request for military support against Turkish pressure.", "caused"]
  ]],
  ["Mongols, Berke Khan, Ilkhanate, and Golden Horde", "qa_mongol_conversion", [
    ["Mongol conversion to Islam", "Event", "13th-14th centuries", "Mongol elites converted for legitimacy, culture, trade, politics, and local integration.", "conversion"],
    ["Ilkhanate", "Empire/state", "1256-1335", "The Mongol state ruling Persia/Iran, Iraq, parts of Anatolia, and the Caucasus.", "empire_state_formation"],
    ["Golden Horde", "Empire/state", "13th-15th centuries", "The Mongol state ruling much of the western steppe, southern Russia, and the Volga region.", "empire_state_formation"],
    ["Hulegu Khan", "Person", "c. 1217-1265", "Founder of the Ilkhanate and grandson of Genghis Khan.", "empire_state_formation"],
    ["Destruction of Baghdad 1258", "Event", "1258", "Mongol destruction of the Abbasid capital under Hulegu.", "caused"],
    ["Ghazan Khan conversion 1295", "Event", "1295", "A major turning point in Ilkhanate Islamization.", "conversion"],
    ["Berke Khan", "Person", "d. 1266", "Golden Horde ruler who converted to Islam and opposed Hulegu.", "conversion"],
    ["Mamluk alliance", "Empire/state", "13th century", "Berke’s alliance with Muslim powers including the Mamluks.", "allied_with"],
    ["Persian-Islamic court culture", "Concept", "", "Court culture absorbed by Mongol rulers in Muslim lands.", "influenced_by"],
    ["Volga trade routes", "Place", "", "Trade networks supporting Islamization in the Golden Horde zone.", "migrated_to"],
    ["Muslim administrators", "Concept", "", "Bureaucrats and administrators who helped integrate Mongol rule into Islamic societies.", "influenced_by"]
  ]],
  ["Ottoman Millet System", "qa_millet_system", [
    ["Ottoman millet system", "Legal tradition", "Ottoman period", "The Ottoman organization of recognized religious communities.", "legal_tradition"],
    ["Religious communities", "Concept", "", "Recognized groups governed through religious leadership.", "part_of"],
    ["Orthodox Christians", "people_group", "", "One major recognized non-Muslim community in the Ottoman system.", "part_of"],
    ["Armenians", "people_group", "", "A recognized community within Ottoman governance.", "part_of"],
    ["Jews", "people_group", "", "A recognized community within Ottoman governance.", "part_of"],
    ["Communal autonomy", "Legal tradition", "", "Internal authority over matters such as marriage, inheritance, schooling, and discipline.", "legal_tradition"],
    ["Dhimmi status", "Legal tradition", "", "Protected but subordinate non-Muslim status under Islamic rule.", "legal_tradition"],
    ["Ottoman governance", "Empire/state", "", "The political framework in which the millet system operated.", "empire_state_formation"]
  ]],
  ["Mustafa Kemal Atatürk", "qa_ataturk", [
    ["Mustafa Kemal Atatürk", "Person", "1881-1938", "Founder and first president of the Republic of Turkey.", "empire_state_formation"],
    ["Republic of Turkey", "Empire/state", "1923 onward", "The republic established after the Ottoman collapse.", "empire_state_formation"],
    ["Turkish nationalism", "Concept", "early 20th century", "The political movement Atatürk led after World War I.", "influenced_by"],
    ["Abolition of sultanate", "Event", "1922", "The end of the Ottoman sultanate.", "reform_standardization"],
    ["Abolition of caliphate 1924", "Event", "1924-03-03", "The caliphate was abolished on March 3, 1924.", "reform_standardization"],
    ["Secular reforms", "Event", "1920s-1930s", "Aggressive reforms pushing Turkey toward a secular republic.", "reform_standardization"]
  ]],
  ["Khadijah bint Khuwaylid", "qa_khadijah_history", [
    ["Khadijah bint Khuwaylid", "Person", "c. 555-619 CE", "Muhammad’s first wife, a wealthy Meccan merchant, and the first believer in Islamic tradition.", "influenced_by"],
    ["Banu Asad", "people_group", "", "Khadijah’s clan within Quraysh.", "genealogy"],
    ["Quraysh", "Empire/state", "", "The Meccan tribal confederation shared by Khadijah and Muhammad.", "genealogy"],
    ["Khuwaylid ibn Asad", "Person", "", "Khadijah’s father.", "genealogy"],
    ["Wealthy Meccan merchant", "Concept", "", "Khadijah’s economic and social position before marrying Muhammad.", "influenced_by"],
    ["Previous marriages", "Concept", "", "Khadijah had been married before Muhammad; sources differ on details.", "genealogy"],
    ["Atiq ibn A’idh", "Person", "", "One earlier husband commonly named in sources.", "genealogy"],
    ["Abu Halah al-Tamimi", "Person", "", "Another earlier husband commonly named in sources.", "genealogy"],
    ["Children before Muhammad", "Concept", "", "Khadijah likely had children before Muhammad.", "genealogy"],
    ["Marriage to Muhammad", "Event", "c. 595 CE", "Khadijah married Muhammad after employing him in trade.", "influenced_by"],
    ["Muhammad’s trade work", "Event", "", "Muhammad worked for Khadijah in trade caravans.", "influenced_by"],
    ["Khadijah’s proposal", "Event", "", "Khadijah proposed marriage through intermediaries.", "influenced_by"],
    ["First believer in Islam", "Concept", "610 CE", "Islamic tradition presents Khadijah as the first person to accept Muhammad’s prophethood.", "influenced_by"],
    ["First revelation support", "Event", "610 CE", "Khadijah reassured Muhammad after the first revelation.", "influenced_by"],
    ["Waraqa ibn Nawfal", "Person", "", "Khadijah’s relative, knowledgeable in earlier scripture.", "influenced_by"],
    ["Financial support", "Concept", "", "Khadijah’s wealth helped sustain Muhammad and the early movement.", "influenced_by"],
    ["Emotional support", "Concept", "", "Khadijah provided reassurance and stability.", "influenced_by"],
    ["Year of Sorrow", "Event", "c. 619 CE", "The year Khadijah and Abu Talib died, deeply affecting Muhammad.", "caused"],
    ["Khadijah’s influence on early Islam", "Concept", "", "Khadijah’s support may have been crucial to the movement’s survival.", "influenced_by"]
  ]],
  ["Women’s Rights in Islamic Law and Social Practice", "qa_womens_rights_social_practice", [
    ["Women in Islamic law", "Legal tradition", "", "Legal doctrines around property, inheritance, dowry, consent, divorce, and business.", "legal_tradition"],
    ["Inheritance rights", "Legal tradition", "", "Women may legally inherit, though social pressure can obstruct this.", "legal_tradition"],
    ["Property ownership", "Legal tradition", "", "Women may own property under Islamic law.", "legal_tradition"],
    ["Dowry / mahr", "Legal tradition", "", "A marriage payment or obligation owed to the bride.", "legal_tradition"],
    ["Marriage consent", "Legal tradition", "", "Legal consent can be limited by family or guardian pressure in practice.", "legal_tradition"],
    ["Divorce mechanisms", "Legal tradition", "", "Women may have legal divorce paths, but courts, stigma, money, and custody fears can block them.", "legal_tradition"],
    ["Social practice limitations", "Concept", "", "Family pressure, custom, poverty, illiteracy, and power can block formal rights.", "theological_dispute"],
    ["Family pressure", "Concept", "", "Relatives can pressure women to waive or avoid legal rights.", "influenced_by"],
    ["Tribal custom", "Concept", "", "Custom can override doctrine in lived practice.", "influenced_by"],
    ["Court access", "Legal tradition", "", "Legal rights depend on actual access to courts and enforcement.", "legal_tradition"],
    ["Legal doctrine vs lived reality", "Concept", "", "The distinction between rights on paper and rights available in society.", "theological_dispute"]
  ]],
  ["Sufism and Ibn Arabi", "qa_ibn_arabi_oneness", [
    ["Ibn Arabi", "Person", "1165-1240", "A major and controversial figure in Islamic mysticism.", "influenced_by"],
    ["Wahdat al-wujud", "Concept", "", "The doctrine often translated as oneness of being.", "theological_dispute"],
    ["Oneness of being", "Concept", "", "The idea that God is the only true absolute reality.", "theological_dispute"],
    ["God as absolute reality", "Concept", "", "In this interpretation, God alone has absolute being.", "theological_dispute"],
    ["Creation as manifestation", "Concept", "", "Creation is understood as reflection, disclosure, or dependent appearance.", "theological_dispute"],
    ["Divine names and attributes", "Concept", "", "The universe reflects divine names and attributes.", "theological_dispute"],
    ["Creator-creation distinction", "Concept", "", "Supporters maintain distinction between God’s essence and creation.", "theological_dispute"],
    ["Criticism of pantheism", "Concept", "", "Critics feared the doctrine blurred Creator and creation.", "theological_dispute"],
    ["Ibn Taymiyyah criticism", "Person", "1263-1328", "A major critic associated with objections to metaphysical excess.", "theological_dispute"]
  ]],
  ["Crusades and Pope Urban II", "qa_urban_crusade_reasoning", [
    ["Council of Clermont 1095", "Event", "1095", "Urban II’s speech launched the First Crusade.", "caused"],
    ["Byzantine request for aid", "Event", "1090s", "Byzantium asked Western Europe for military aid.", "caused"],
    ["Seljuk Turks", "people_group", "11th century", "Turkish powers pressing Byzantine Anatolia.", "caused"],
    ["Anatolia", "Place", "11th century", "A major theater of Byzantine territorial loss.", "located_in"],
    ["Papal authority", "Concept", "1095", "Urban saw crusade as a way to strengthen papal leadership.", "influenced_by"],
    ["Eastern Orthodox and Roman Catholic split", "Event", "1054 onward", "Urban may have hoped to strengthen or heal ties with Eastern Christianity.", "theological_dispute"],
    ["Jerusalem pilgrimage sites", "Place", "", "Holy sites were central to crusade rhetoric.", "located_in"],
    ["Remission of sins", "Concept", "", "A religious incentive tied to crusade participation.", "theological_dispute"],
    ["Knightly violence", "Concept", "", "Crusading channeled violence outward under a religious cause.", "caused"],
    ["Sacred warfare ideology", "Concept", "", "The ideology joining pilgrimage, warfare, and religious merit.", "theological_dispute"]
  ]],
  ["Mongols, Berke Khan, Ilkhanate, and Golden Horde", "qa_ilkhans_detail", [
    ["Il-Khans / Ilkhanate", "Empire/state", "1256-1335", "The Mongol dynasty in Iran and surrounding regions.", "empire_state_formation"],
    ["Genghis Khan lineage", "Concept", "", "Hulegu was a grandson of Genghis Khan.", "genealogy"],
    ["Middle East invasion", "Event", "mid-1200s", "Hulegu’s invasion created the basis for the Ilkhanate.", "caused"],
    ["Baghdad 1258", "Event", "1258", "The sack of Baghdad shattered the Abbasid imperial center.", "caused"],
    ["Abbasid caliph killed", "Event", "1258", "The Mongols killed the Abbasid caliph during Baghdad’s fall.", "caused"],
    ["Persianization", "Concept", "late 13th century", "Mongol rule absorbed Persian culture and bureaucracy.", "influenced_by"],
    ["Islamization", "Event", "late 13th century", "Ilkhanate elites increasingly became Muslim.", "conversion"],
    ["Persian bureaucracy", "Concept", "", "Persian administrative culture fused with Mongol military rule.", "influenced_by"],
    ["Ghazan Khan", "Person", "1271-1304", "Ilkhan whose conversion in 1295 accelerated Islamization.", "conversion"],
    ["Mongol military rule", "Empire/state", "", "Steppe military power fused with Persian-Islamic administration.", "empire_state_formation"],
    ["Revival after conquest", "Event", "late 13th-14th centuries", "Islamic scholarship, art, and Persian literature flourished after conversion.", "influenced_by"]
  ]],
  ["Khadijah bint Khuwaylid", "qa_khadijah_extreme_detail", [
    ["Khadijah’s status", "Concept", "", "Khadijah was older, respected, socially established, and economically powerful.", "influenced_by"],
    ["Khadijah’s wealth", "Concept", "", "Her wealth made her a major stabilizing force for Muhammad and the early movement.", "influenced_by"],
    ["Khadijah’s lineage", "Concept", "", "Her lineage connected her to Quraysh and Banu Asad.", "genealogy"],
    ["Banu Asad clan", "people_group", "", "The clan of Quraysh linked to Khadijah’s family.", "genealogy"],
    ["Quraysh network", "Empire/state", "", "Elite Meccan social network that shaped Muhammad’s early social world.", "genealogy"],
    ["Prior husbands", "Concept", "", "Sources differ on whether Khadijah was widowed once or twice.", "genealogy"],
    ["Trade caravans", "Event", "", "The commercial setting in which Khadijah hired Muhammad.", "influenced_by"],
    ["Proposal to Muhammad", "Event", "", "Khadijah proposed through intermediaries after observing Muhammad’s reliability.", "influenced_by"],
    ["Khadijah as stabilizing force", "Concept", "", "She provided practical, emotional, financial, and social stability.", "influenced_by"],
    ["First revelation", "Event", "610 CE", "Muhammad’s first revelation experience, after which Khadijah reassured him.", "connected_to"],
    ["Monotheistic influences in Arabia", "Concept", "", "Waraqa and other currents connect the story to wider scriptural traditions.", "influenced_by"],
    ["First believer", "Concept", "610 CE", "Khadijah immediately believed Muhammad’s prophetic claim in Islamic tradition.", "influenced_by"],
    ["Early Islam survival", "Concept", "610s CE", "Her support may have helped the early movement survive.", "influenced_by"],
    ["Responsible historical interpretation", "Concept", "", "It is reasonable to identify influence, but not to claim invention without evidence.", "theological_dispute"]
  ]],
  ["Mongols, Berke Khan, Ilkhanate, and Golden Horde", "qa_berke_conversion", [
    ["Berke Khan conversion", "Event", "13th century", "Berke converted to Islam for overlapping personal, commercial, political, and cultural reasons.", "conversion"],
    ["Tengrism", "Concept", "", "The traditional Mongol religious world before Berke’s conversion.", "theological_dispute"],
    ["Eternal Blue Sky / Tengri", "Concept", "", "A supreme heavenly power associated with fate and cosmic authority.", "theological_dispute"],
    ["Mongol religious pluralism", "Concept", "", "Mongol elites commonly tolerated and mixed religious traditions.", "theological_dispute"],
    ["Ancestor veneration", "Concept", "", "An element of traditional Mongol religious practice.", "theological_dispute"],
    ["Shamanic practices", "Concept", "", "Spirit and ritual practices in the older Mongol religious world.", "theological_dispute"],
    ["Bukhara influence", "Place", "", "Islamic sources often say a caravan from Bukhara influenced Berke.", "influenced_by"],
    ["Volga basin", "Place", "", "A trade and cultural region important for Golden Horde Islamization.", "located_in"],
    ["Central Asian Islam", "Concept", "", "Islamic networks around Central Asia influenced Mongol conversion.", "influenced_by"],
    ["Conflict with Hulegu", "Event", "1260s", "Berke’s conversion shaped his conflict with Hulegu after Baghdad.", "theological_dispute"],
    ["Berke vs Hulegu", "Event", "1260s", "Conflict between Golden Horde and Ilkhanate rulers.", "enemy_of"],
    ["Golden Horde Islamization", "Event", "13th-14th centuries", "The longer process by which the Golden Horde became Muslim.", "conversion"]
  ]],
  ["Abrahamic Religion Concept", "qa_religion_of_abraham", [
    ["Religion of Abraham", "Concept", "", "In Islam, pure monotheistic submission to God before later divisions.", "theological_dispute"],
    ["Ibrahim", "Person", "", "Abraham as understood in Islam.", "genealogy"],
    ["Primordial monotheism", "Concept", "", "The idea of original pure worship of one God.", "theological_dispute"],
    ["Islam as submission", "Concept", "", "Islam understands itself as submission to one God, not merely a new religion beginning with Muhammad.", "theological_dispute"],
    ["Abraham before Judaism and Christianity", "Concept", "", "The Qur’an says Abraham was neither Jew nor Christian because he predates both organized traditions.", "theological_dispute"],
    ["Prophetic continuity", "Concept", "", "Islam sees Adam, Noah, Abraham, Moses, Jesus, Muhammad, and others as preaching one essential message.", "theological_dispute"],
    ["Judaism", "Concept", "", "An Abrahamic religion with its own law, revelation, and authority claims.", "theological_dispute"],
    ["Christianity", "Concept", "", "An Abrahamic religion centered on Jesus, Trinity, crucifixion, resurrection, and salvation through Christ.", "theological_dispute"],
    ["Trinity", "Concept", "", "A central Christian doctrine rejected by Islam.", "theological_dispute"],
    ["Jesus in Islam", "Person", "", "Islam views Jesus as a prophet rather than divine Son of God.", "theological_dispute"],
    ["Muhammad as final prophet", "Person", "570-632 CE", "Islam treats Muhammad as the final prophet.", "theological_dispute"],
    ["Abrahamic religions", "Concept", "", "Judaism, Christianity, and Islam trace spiritual ancestry to Abraham but disagree over revelation and authority.", "theological_dispute"]
  ]]
];

for (const [branchTitle, qaId, items] of branchData) {
  const parent = branches.get(branchTitle);
  const created = items.map(([title, category, dateRange, summary, relationship], index) =>
    child(parent, title, index, items.length, {
      category,
      dateRange,
      summary,
      relationship,
      label: relationship.replaceAll("_", " "),
      qaIds: [qaId],
      tags: [String(category).toLowerCase().replaceAll("/", "-").replaceAll(" ", "-"), qaId]
    })
  );
  if (qaId) linkQa(qaId, created);
}

const qaBranchMap = {
  qa_mecca_before_islam: "Pre-Islamic Arabia and Mecca",
  qa_ali_relationship: "Ali ibn Abi Talib",
  qa_uthman_umayyads: "Uthman ibn Affan and the Umayyads",
  qa_quran_revelation: "Qur’an Revelation and Compilation",
  qa_variant_quran_materials: "Qur’an Revelation and Compilation",
  qa_jafari_jurisprudence: "Sunni, Shia, and Ja’fari Jurisprudence",
  qa_saint_veneration_critics: "Sufism and Ibn Arabi",
  qa_pope_urban_ii: "Crusades and Pope Urban II",
  qa_mongol_conversion: "Mongols, Berke Khan, Ilkhanate, and Golden Horde",
  qa_millet_system: "Ottoman Millet System",
  qa_ataturk: "Mustafa Kemal Atatürk",
  qa_khadijah_history: "Khadijah bint Khuwaylid",
  qa_womens_rights_social_practice: "Women’s Rights in Islamic Law and Social Practice",
  qa_ibn_arabi_oneness: "Sufism and Ibn Arabi",
  qa_urban_crusade_reasoning: "Crusades and Pope Urban II",
  qa_ilkhans_detail: "Mongols, Berke Khan, Ilkhanate, and Golden Horde",
  qa_khadijah_extreme_detail: "Khadijah bint Khuwaylid",
  qa_berke_conversion: "Mongols, Berke Khan, Ilkhanate, and Golden Horde",
  qa_religion_of_abraham: "Abrahamic Religion Concept"
};

qas.forEach((qa, index) => {
  const branchId = branches.get(qaBranchMap[qa.id]);
  if (!branchId) return;
  const questionTitle = `Q: ${qa.question.length > 52 ? `${qa.question.slice(0, 49)}...` : qa.question}`;
  const questionId = child(branchId, questionTitle, index % 5, 5, {
    type: "question",
    category: "User question",
    radius: 580,
    summary: qa.question,
    notes: qa.answer,
    relationship: "same_as_question",
    label: "session question",
    qaIds: [qa.id],
    tags: ["user-question", qa.id]
  });
  linkQa(qa.id, [questionId]);
});

function connectTitles(sourceTitle, targetTitle, relationship, label, explanation = "") {
  const source = titleToId.get(sourceTitle);
  const target = titleToId.get(targetTitle);
  if (source && target) edge(source, target, relationship, label, explanation);
}

connectTitles("Khadijah bint Khuwaylid", "Quraysh", "genealogy", "tribal confederation");
connectTitles("Khadijah bint Khuwaylid", "Banu Asad", "genealogy", "clan lineage");
connectTitles("Banu Asad", "Quraysh", "part_of", "clan within Quraysh");
connectTitles("Khuwaylid ibn Asad", "Banu Asad", "genealogy", "family line");
connectTitles("Khadijah bint Khuwaylid", "Marriage to Muhammad", "influenced_by", "marriage and support");
connectTitles("Khadijah bint Khuwaylid", "First revelation support", "influenced_by", "reassures Muhammad");
connectTitles("Waraqa ibn Nawfal", "Monotheistic influences in Arabia", "influenced_by", "scriptural context");
connectTitles("Ali ibn Abi Talib", "Abu Talib", "genealogy", "son of Abu Talib");
connectTitles("Abu Talib", "Abd Allah ibn Abd al-Muttalib", "genealogy", "brothers");
connectTitles("Ali ibn Abi Talib", "Fatimah bint Muhammad", "genealogy", "married Fatimah");
connectTitles("Ali ibn Abi Talib", "Ali in Shia Islam", "theological_dispute", "first rightful Imam in Shia view");
connectTitles("Uthman ibn Affan", "Umayyad clan", "genealogy", "member of clan");
connectTitles("Umayyad clan", "Quraysh", "part_of", "clan within Quraysh");
connectTitles("Uthman ibn Affan", "Uthmanic recension", "reform_standardization", "standardized public Qur’an text");
connectTitles("Uthman ibn Affan", "Nepotism accusations", "theological_dispute", "governorship controversy");
connectTitles("Nepotism accusations", "Assassination of Uthman", "caused", "unrest escalated");
connectTitles("Assassination of Uthman", "Rise of Umayyad dynasty", "caused", "succession crisis");
connectTitles("Muawiyah ibn Abi Sufyan", "Rise of Umayyad dynasty", "empire_state_formation", "founds dynasty");
connectTitles("Qur’anic revelation", "Angel Gabriel", "source_for", "revelation mediator");
connectTitles("Qur’anic revelation", "Arabic language", "connected_to", "Arabic recitation");
connectTitles("Oral recitation", "Written codex", "reform_standardization", "collected into codex");
connectTitles("Companion codices", "Uthmanic recension", "reform_standardization", "standardization response");
connectTitles("Uthmanic recension", "Unity of the Muslim community", "reform_standardization", "prevents disputes");
connectTitles("Ja’fari jurisprudence", "Twelver Shia Islam", "legal_tradition", "main legal school");
connectTitles("Ja’fari jurisprudence", "Ja‘far al-Sadiq", "legal_tradition", "named after sixth Imam");
connectTitles("Ja‘far al-Sadiq", "Sixth Imam", "legal_tradition", "Imam lineage");
connectTitles("Ja’fari jurisprudence", "Comparison with Sunni legal schools", "theological_dispute", "compared authority models");
connectTitles("Sufism", "Saint veneration", "connected_to", "devotional practice");
connectTitles("Saint veneration", "Shirk", "theological_dispute", "criticized as risk");
connectTitles("Shrine practices", "Bid‘ah", "theological_dispute", "criticized as innovation");
connectTitles("Ibn Arabi", "Wahdat al-wujud", "influenced_by", "associated doctrine");
connectTitles("Wahdat al-wujud", "Oneness of being", "same_as_question", "translation / concept");
connectTitles("Oneness of being", "Criticism of pantheism", "theological_dispute", "critic objection");
connectTitles("Ibn Taymiyyah criticism", "Criticism of pantheism", "theological_dispute", "traditionalist critique");
connectTitles("Pope Urban II", "Council of Clermont", "caused", "calls crusade");
connectTitles("Council of Clermont", "First Crusade", "caused", "launches crusade");
connectTitles("Byzantine request for aid", "Council of Clermont 1095", "caused", "military aid context");
connectTitles("First Crusade", "Jerusalem", "located_in", "captured 1099");
connectTitles("Hulegu Khan", "Ilkhanate", "empire_state_formation", "founded Ilkhanate");
connectTitles("Hulegu Khan", "Destruction of Baghdad 1258", "caused", "Mongol campaign");
connectTitles("Destruction of Baghdad 1258", "Abbasid caliph killed", "caused", "shattered Sunni imperial center");
connectTitles("Ghazan Khan", "Ghazan Khan conversion 1295", "conversion", "conversion event");
connectTitles("Ghazan Khan conversion 1295", "Islamization", "conversion", "turning point");
connectTitles("Berke Khan", "Berke Khan conversion", "conversion", "personal conversion");
connectTitles("Berke Khan conversion", "Golden Horde Islamization", "conversion", "early turning point");
connectTitles("Berke Khan", "Conflict with Hulegu", "enemy_of", "post-Baghdad conflict");
connectTitles("Berke vs Hulegu", "Conflict with Hulegu", "same_as_question", "same conflict");
connectTitles("Berke Khan", "Mamluk alliance", "allied_with", "allied with Muslim powers");
connectTitles("Tengrism", "Eternal Blue Sky / Tengri", "theological_dispute", "core divine concept");
connectTitles("Ottoman millet system", "Religious communities", "part_of", "organized communities");
connectTitles("Ottoman millet system", "Dhimmi status", "legal_tradition", "protected subordinate status");
connectTitles("Ottoman millet system", "Ottoman governance", "part_of", "governance framework");
connectTitles("Mustafa Kemal Atatürk", "Republic of Turkey", "empire_state_formation", "founder");
connectTitles("Mustafa Kemal Atatürk", "Secular reforms", "reform_standardization", "political program");
connectTitles("Abolition of sultanate", "Republic of Turkey", "caused", "clears path to republic");
connectTitles("Abolition of caliphate 1924", "Secular reforms", "reform_standardization", "major secular reform");
connectTitles("Women in Islamic law", "Legal doctrine vs lived reality", "theological_dispute", "core distinction");
connectTitles("Inheritance rights", "Family pressure", "influenced_by", "social pressure can obstruct");
connectTitles("Divorce mechanisms", "Court access", "legal_tradition", "requires practical access");
connectTitles("Religion of Abraham", "Ibrahim", "genealogy", "Abraham in Islam");
connectTitles("Religion of Abraham", "Primordial monotheism", "theological_dispute", "pure monotheism");
connectTitles("Islam as submission", "Prophetic continuity", "theological_dispute", "same essential message");
connectTitles("Christianity", "Trinity", "theological_dispute", "central Christian doctrine");
connectTitles("Jesus in Islam", "Christianity", "theological_dispute", "different view of Jesus");
connectTitles("Muhammad as final prophet", "Islam as submission", "theological_dispute", "final prophet claim");

function markdownFor(note) {
  const relatedQas = note.qaIds.map((qaId) => qas.find((qa) => qa.id === qaId)).filter(Boolean);
  return `# ${note.title}

## Summary
${note.summary}

## Notes
${note.notes}

## Related User Questions
${relatedQas.map((qa) => `- ${qa.question}`).join("\n")}

## Assistant Answer Summary
${relatedQas.map((qa) => qa.answer).join("\n\n")}

## Connections
${note.connections.map((item) => `- ${item}`).join("\n")}

## Sources

## Open Questions
- What primary sources or scholarly works should be attached to this node next?
- Which claims here need evidence grading?

## Claims
${relatedQas.map((qa) => `- Session answer: ${qa.answer.split(".")[0]}.`).join("\n")}
`;
}

const tree = {
  id: treeId,
  title: "Islam and Muslim History",
  description: "Interactive research tree preserving an Islam and Muslim history study session as connected topics, subtopics, Q&A, and relationship metadata.",
  createdAt: now,
  updatedAt: now,
  qas,
  nodes,
  edges
};

await mkdir(path.join(rootDir, "nodes"), { recursive: true });
await mkdir(path.join(rootDir, "sources"), { recursive: true });
await mkdir(path.join(rootDir, "attachments"), { recursive: true });
await mkdir(path.join(rootDir, "exports"), { recursive: true });
await writeFile(path.join(rootDir, "tree.json"), `${JSON.stringify(tree, null, 2)}\n`);
await writeFile(path.join(rootDir, "sources", "sources.json"), "[]\n");
await writeFile(
  path.join(rootDir, "README.md"),
  `# Islam and Muslim History Research Tree

This folder is a file-backed Research tree. The visual graph comes from \`tree.json\`; the readable study notes come from \`nodes/*.md\`.

## Adding Future Q&A

1. Add the exact question and answer to the \`qas\` array in \`tree.json\`.
2. Add or reuse node objects in \`tree.json\`.
3. Put the new Q&A id in each linked node's \`relatedQuestions\` array, and place the answer in \`relatedAnswers\` if useful.
4. Add edges that explain how the new topic connects to existing research.
5. Create or update the matching Markdown file under \`nodes/\` with:
   - \`## Related User Questions\`
   - \`## Assistant Answer Summary\`
   - \`## Connections\`

The app can also add new nodes interactively; use this file when you want to preserve exact session Q&A as structured data.
`
);

for (const [id, note] of notes.entries()) {
  await writeFile(path.join(rootDir, "nodes", `${id}.md`), markdownFor(note));
}

console.log(`Created ${tree.title}: ${nodes.length} nodes, ${edges.length} edges, ${qas.length} Q&A items`);
