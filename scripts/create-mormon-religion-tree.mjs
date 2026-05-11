import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const treeId = "mormon-religion";
const rootDir = path.join(process.cwd(), "trees", treeId);
const now = "2026-05-09T00:00:00.000Z";
const dateAdded = "2026-05-09";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

const qas = [
  {
    id: "qa-founder-golden-plates-book",
    question: "First off lets start with the founder, Joseph Smith and the supposed golden plates book that he found. Please tell me the story of the book, and then the history of just his life and how this religion formed in the first place, then describe the Book of Mormons regarding what was said, the key points.",
    answer:
      "Joseph Smith founded the Latter Day Saint movement in early 1800s America. He grew up in western New York during the Second Great Awakening, a period filled with revivalism, visions, restoration movements, and folk spiritual practices. Smith claimed a First Vision in which God the Father and Jesus Christ appeared to him and told him existing churches had fallen into corruption. He later claimed the angel Moroni revealed hidden golden plates near his home, containing an ancient record written in Reformed Egyptian. Smith said he translated the plates by the gift and power of God, often through seer stones, and published the Book of Mormon in 1830. The book tells of ancient peoples in the Americas, especially Nephites and Lamanites, descended from a family that left Jerusalem around 600 BCE. Its climax is Jesus appearing in the Americas after his resurrection. Mormonism formed around claims of restored Christianity, new scripture, priesthood authority, continuing revelation, and Joseph Smith’s prophetic leadership.",
    linkedNodeIds: []
  },
  {
    id: "qa-three-witnesses",
    question: "Who were the 3 witnesses that saw the plates?",
    answer:
      "The Three Witnesses were Oliver Cowdery, David Whitmer, and Martin Harris. They claimed an angel showed them the plates and that they heard the voice of God affirming the translation.",
    linkedNodeIds: []
  },
  {
    id: "qa-eight-witnesses",
    question: "Who were the 8 that physically handled them?",
    answer:
      "The Eight Witnesses were Christian Whitmer, Jacob Whitmer, Peter Whitmer Jr., John Whitmer, Hiram Page, Joseph Smith Sr., Hyrum Smith, and Samuel H. Smith. They claimed Joseph Smith showed them the plates and that they physically handled them.",
    linkedNodeIds: []
  },
  {
    id: "qa-witnesses-left",
    question: "Who were the ones that later left, and why?",
    answer:
      "Notable witnesses or early insiders who later became estranged or left included Oliver Cowdery, David Whitmer, Martin Harris, and John Whitmer. Reasons included disagreements with Joseph Smith’s authority, financial failures, Missouri tensions, church governance disputes, polygamy-related accusations or controversies, political power struggles, and disillusionment with later developments. Many still maintained their testimony about the plates even after breaking with Smith personally.",
    linkedNodeIds: []
  },
  {
    id: "qa-american-miracles",
    question: "What miracles did the Book of Mormon claimed happened in the Americas?",
    answer:
      "The major miracle claim is Jesus Christ appearing in the Americas after his resurrection. The Book of Mormon describes Christ descending from heaven, allowing people to touch his wounds, healing the sick, calling disciples, teaching sermons similar to the Sermon on the Mount, and establishing ordinances such as baptism. Other miracle claims include angels, divine voices, prophetic visions, earthquakes, storms, darkness at Christ’s crucifixion, and mass destructions tied to divine judgment.",
    linkedNodeIds: []
  },
  {
    id: "qa-name-origin",
    question: "Whats the meaning and the origin of the name?",
    answer:
      "“Mormon” comes from the prophet-historian Mormon in the Book of Mormon. Mormon is said to have compiled or abridged ancient records, while his son Moroni finished and preserved them. “Book of Mormon” means the book compiled or abridged by Mormon. The term “Mormon” became an outsider nickname for members, though the modern LDS Church prefers the full name, The Church of Jesus Christ of Latter-day Saints.",
    linkedNodeIds: []
  },
  {
    id: "qa-persecution",
    question: "Who were the people to heavily prosecute and violently oppose the early mormons?",
    answer:
      "Early Mormons were opposed by local Protestant populations, state militias, anti-Mormon vigilantes, political rivals, newspapers, former insiders, and frontier settlers. Opposition was especially severe in Missouri and Illinois. Reasons included religious suspicion, prophetic authority claims, new scripture, bloc voting, economic cohesion, rapid growth, fear of theocracy, secrecy, polygamy rumors, and frontier violence culture. The 1838 Missouri Extermination Order by Governor Lilburn Boggs was one of the most extreme examples.",
    linkedNodeIds: []
  },
  {
    id: "qa-celestial-marriage",
    question: "What was celestial marriage that he introduced?",
    answer:
      "Celestial marriage means marriage sealed eternally by priesthood authority. Smith taught that marriages and families could continue after death through proper temple ordinances. It connects to Mormon exaltation theology. Plural marriage became tied to this system, with Joseph Smith secretly teaching that some men were commanded by God to enter plural marriages as part of a higher eternal law.",
    linkedNodeIds: []
  },
  {
    id: "qa-mob-killed-smith",
    question: "Who was the mob that killed him?",
    answer:
      "The mob that killed Joseph Smith in 1844 was composed mainly of anti-Mormon men from the surrounding Illinois region. They stormed Carthage Jail after Smith had been arrested following the destruction of the Nauvoo Expositor printing press. Joseph and Hyrum Smith were shot and killed. No one was successfully convicted.",
    linkedNodeIds: []
  },
  {
    id: "qa-brigham-young-succession",
    question: "Why did the largest group decide to follow Brigham Young?",
    answer:
      "After Joseph Smith’s death there was no universally accepted succession mechanism. Brigham Young had major advantages because he led the Quorum of the Twelve Apostles, was organizationally strong, controlled much of the church structure, and was seen by many as preserving Joseph Smith’s teachings most fully. He successfully led the largest group west to Utah, giving them stability and survival.",
    linkedNodeIds: []
  },
  {
    id: "qa-race-teachings",
    question: "What were the race teachings in earlier periods and how were they developed and formed in the first place, and why?",
    answer:
      "Earlier LDS teachings connected race to divine favor, curses, premortal existence, and priesthood eligibility. Black members of African descent were barred from priesthood and certain temple ordinances until 1978. Explanations included the curse of Cain, curse of Ham, premortal faithfulness theories, and Book of Mormon passages about Lamanites and a “skin of blackness.” These ideas developed inside 1800s American racial culture shaped by slavery, segregation, and racialized biblical interpretation. The LDS Church today disavows many earlier racial explanations.",
    linkedNodeIds: []
  },
  {
    id: "qa-smith-parents",
    question: "Were Smiths parents associated in the religion at all?",
    answer:
      "Yes. Joseph Smith’s family was deeply tied to the movement. Joseph Smith Sr. became an early Mormon leader and one of the Eight Witnesses. Hyrum Smith became a major early leader and died alongside Joseph. Lucy Mack Smith was heavily involved and later wrote an important early family history. The Smith family environment was religious, visionary, emotionally intense, and open to supernatural experiences before the Book of Mormon emerged.",
    linkedNodeIds: []
  },
  {
    id: "qa-mountain-meadows-netflix",
    question: "I watched a TV show on Netflix where indians were massacred and raped by Mormons, did this actually happen?",
    answer:
      "There were real episodes of frontier violence involving early Mormons, Native Americans, settlers, militias, and federal forces. The event likely referenced is the Mountain Meadows Massacre. In 1857, local Mormon militia members from the Nauvoo Legion, along with some Paiute Native Americans, attacked the Baker-Fancher wagon train in southern Utah. Around 120 emigrants were killed, including many women and children, while young children were spared. Some Mormon militia members disguised themselves as Native Americans, and blame was later shifted heavily onto Paiute groups. Modern scholarship acknowledges Mormon militia members played the central role. Claims of rape should be handled carefully: frontier sexual violence existed broadly, but Mountain Meadows is best documented as mass murder and deception, not as an official Mormon doctrine or centrally documented institutional rape campaign.",
    linkedNodeIds: []
  }
].map((qa) => ({ ...qa, dateAdded }));

const nodes = [];
const edges = [];
const notes = new Map();
const titleToId = new Map();

function categoryToType(category) {
  if (category === "Person") return "person";
  if (category === "Place") return "place";
  if (category === "Event") return "event";
  if (category === "Scripture/Text") return "source";
  if (category === "User question") return "question";
  if (category === "Controversy") return "claim";
  return "topic";
}

function node(title, options = {}) {
  const existing = titleToId.get(title);
  if (existing) return existing;
  const id = options.id ?? slugify(title);
  titleToId.set(title, id);
  const qaIds = options.qaIds ?? [];
  const linkedAnswers = qaIds.map((qaId) => qas.find((qa) => qa.id === qaId)?.answer).filter(Boolean);
  nodes.push({
    id,
    title,
    treeId,
    clusterId: treeId,
    parentId: options.parentId,
    type: options.type ?? categoryToType(options.category ?? "Concept"),
    category: options.category ?? "Concept",
    importance: options.importance ?? "detail",
    level: options.level ?? 2,
    fixedPosition: true,
    layoutHint: options.layoutHint ?? "leaf",
    dateRange: options.dateRange ?? "",
    shortSummary: options.summary ?? `${title} is part of the Mormon Religion research tree.`,
    detailedSummary: options.detail ?? options.summary ?? `${title} is a research node for continued study.`,
    relatedQuestions: qaIds,
    relatedAnswers: linkedAnswers,
    tags: options.tags ?? [],
    connections: [],
    status: options.status ?? "researching",
    x: options.x ?? 0,
    y: options.y ?? 0,
    notePath: `nodes/${id}.md`
  });
  notes.set(id, {
    title,
    summary: options.summary ?? `${title} is part of the Mormon Religion research tree.`,
    notes: options.detail ?? options.summary ?? "Use this node to attach sources, claims, and new questions as the Mormon Religion research thread expands.",
    qaIds,
    connections: []
  });
  return id;
}

function addConnectionToNode(sourceId, targetId, relationship, explanation) {
  const source = nodes.find((item) => item.id === sourceId);
  const note = notes.get(sourceId);
  if (source) source.connections.push({ targetId, relationship, explanation });
  if (note) note.connections.push(`${relationship}: ${targetId} — ${explanation}`);
}

function edge(source, target, relationship = "connected_to", label = relationship.replaceAll("_", " "), explanation = "") {
  if (!source || !target || source === target) return;
  const id = `edge-${source}-${target}-${relationship}`.replace(/[^a-zA-Z0-9_-]+/g, "-");
  if (edges.some((item) => item.id === id)) return;
  edges.push({ id, source, target, type: relationship, label, notes: explanation });
  addConnectionToNode(source, target, relationship, explanation || label);
}

function linkQa(qaId, nodeIds) {
  const qa = qas.find((item) => item.id === qaId);
  if (!qa) return;
  qa.linkedNodeIds = [...new Set([...qa.linkedNodeIds, ...nodeIds])];
  for (const nodeId of nodeIds) {
    const item = nodes.find((nodeItem) => nodeItem.id === nodeId);
    const note = notes.get(nodeId);
    if (!item || !note) continue;
    item.relatedQuestions = [...new Set([...(item.relatedQuestions ?? []), qaId])];
    item.relatedAnswers = [...new Set([...(item.relatedAnswers ?? []), qa.answer])];
    note.qaIds = [...new Set([...note.qaIds, qaId])];
  }
}

function addChild(parentId, title, index, total, options = {}) {
  const parent = nodes.find((item) => item.id === parentId);
  const base = Math.atan2(parent.y, parent.x);
  const spread = Math.min(Math.PI * 0.92, Math.max(Math.PI / 5, total * 0.13));
  const angle = base - spread / 2 + (spread * (index + 0.5)) / total;
  const radius = options.radius ?? 305;
  const id = node(title, {
    ...options,
    parentId,
    x: Math.round(parent.x + Math.cos(angle) * radius),
    y: Math.round(parent.y + Math.sin(angle) * radius),
    importance: options.importance ?? "detail",
    level: options.level ?? 2,
    layoutHint: options.layoutHint ?? "leaf"
  });
  edge(parentId, id, options.relationship ?? "connected_to", options.label ?? "branch detail", options.explanation ?? "");
  return id;
}

const root = node("Mormon Religion", {
  id: "mormon-religion",
  type: "root",
  category: "Religious movement",
  importance: "root",
  level: 0,
  layoutHint: "root",
  x: 0,
  y: 0,
  summary: "Research tree covering Joseph Smith, the golden plates, the Book of Mormon, early Mormon history, witnesses, persecution, race teachings, Brigham Young, and Mountain Meadows.",
  detail: "Use this root as the research ledger for the Latter Day Saint movement and Mormon religious history. The tree preserves session Q&A while leaving room for sources, claims, and later branches.",
  tags: ["mormonism", "lds", "latter-day-saints", "joseph-smith", "book-of-mormon"]
});

const branchTitles = [
  "Joseph Smith Jr.",
  "Smith Family Background",
  "First Vision",
  "Angel Moroni and the Golden Plates",
  "Translation of the Book of Mormon",
  "Book of Mormon Witnesses",
  "Book of Mormon Narrative and Theology",
  "Early Church Formation",
  "Persecution and Opposition",
  "Celestial Marriage and Polygamy",
  "Joseph Smith’s Death",
  "Succession Crisis and Brigham Young",
  "Race Teachings and Priesthood Ban",
  "Mormon and Native American Relations",
  "Mountain Meadows Massacre",
  "Modern LDS Church"
];

const branches = new Map();
branchTitles.forEach((title, index) => {
  const angle = (Math.PI * 2 * index) / branchTitles.length - Math.PI / 2;
  const id = node(title, {
    category: title.includes("Smith") || title.includes("Brigham") ? "Person" : title.includes("Massacre") || title.includes("Death") || title.includes("Formation") ? "Event" : title.includes("Marriage") || title.includes("Race") ? "Legal/doctrinal teaching" : title.includes("Opposition") ? "Controversy" : "Concept",
    importance: "major",
    level: 1,
    layoutHint: "branch",
    x: Math.round(Math.cos(angle) * 620),
    y: Math.round(Math.sin(angle) * 620),
    summary: `${title} is a major Mormon Religion research branch.`,
    tags: ["major-branch"]
  });
  branches.set(title, id);
  edge(root, id, "part_of", "major research branch");
});

const branchData = [
  ["Joseph Smith Jr.", "qa-founder-golden-plates-book", [
    ["Born in Vermont", "Event", "1805", "Joseph Smith Jr. was born in Vermont in 1805."],
    ["Western New York upbringing", "Place", "1810s-1820s", "Smith grew up in western New York during a period of intense religious activity."],
    ["Founder of Latter Day Saint movement", "Religious movement", "1830", "Smith founded the Latter Day Saint movement."],
    ["Prophetic visions", "Concept", "", "Smith claimed prophetic visions and divine authority."],
    ["Divine authority claims", "Concept", "", "Smith claimed authority to restore true Christianity."],
    ["Prophet and revelator", "Concept", "", "Smith became prophet and revelator to early followers."],
    ["Political leader and city builder", "Concept", "1830s-1840s", "Smith also became a political leader, military organizer, and city builder."]
  ]],
  ["Joseph Smith Jr.", "qa-founder-golden-plates-book", [
    ["Religious environment", "Concept", "early 1800s", "The religious environment around Smith included revivalism, restorationism, and supernatural folk practices."],
    ["Burned-over District", "Place", "early 1800s", "Western and central New York became known for intense revival activity."],
    ["Second Great Awakening", "Religious movement", "early 1800s", "A major Protestant revival movement that shaped Smith’s environment."],
    ["Protestant revivalism", "Religious movement", "early 1800s", "Revival preaching and conversion culture formed the surrounding religious world."],
    ["Restorationist movements", "Religious movement", "early 1800s", "Movements seeking restoration of primitive Christianity shaped Mormon origins."],
    ["Frontier visions", "Concept", "", "Visionary experiences were part of the broader frontier religious culture."],
    ["Folk magic", "Concept", "", "Folk supernatural practices existed alongside revival religion."],
    ["Treasure digging", "Concept", "", "Treasure seeking was part of Smith’s early cultural world."],
    ["Seer stones", "Concept", "", "Seer stones were used in folk visionary and treasure-seeking contexts."],
    ["Divining rods", "Concept", "", "Divining rods were another folk spiritual tool in the early environment."]
  ]],
  ["Smith Family Background", "qa-smith-parents", [
    ["Joseph Smith Sr.", "Person", "1771-1840", "Joseph Smith’s father, early Mormon participant, and one of the Eight Witnesses."],
    ["Lucy Mack Smith", "Person", "1775-1856", "Joseph Smith’s mother and an early family historian."],
    ["Hyrum Smith", "Person", "1800-1844", "Joseph Smith’s brother, early leader, and martyr at Carthage Jail."],
    ["Samuel H. Smith", "Person", "1808-1844", "Joseph Smith’s brother and one of the Eight Witnesses."],
    ["Family religious culture", "Concept", "", "The Smith family was religiously intense and open to supernatural experience."],
    ["Visionary supernatural worldview", "Concept", "", "The family world included visions, dreams, and supernatural interpretation."],
    ["Joseph Smith Sr. as one of the Eight Witnesses", "Concept", "1830", "Joseph Smith Sr. signed the Eight Witnesses testimony."],
    ["Hyrum Smith as early leader killed with Joseph", "Event", "1844", "Hyrum became an early leader and died beside Joseph."],
    ["Lucy Mack Smith as early family historian", "Concept", "", "Lucy Mack Smith later wrote an important family history."]
  ]],
  ["First Vision", "qa-founder-golden-plates-book", [
    ["Prayer in the woods", "Event", "c. 1820", "Joseph Smith claimed he prayed in the woods seeking religious truth."],
    ["Appearance of God the Father and Jesus Christ", "Event", "c. 1820", "Smith claimed God the Father and Jesus Christ appeared to him."],
    ["Existing churches described as corrupted", "Controversy", "", "The First Vision story presents existing churches as fallen into corruption."],
    ["Great Apostasy concept", "Legal/doctrinal teaching", "", "The idea that original Christianity had fallen away and needed restoration."],
    ["Restoration of true Christianity", "Religious movement", "", "The claimed restoration of true Christianity became central to Mormon identity."]
  ]],
  ["Angel Moroni and the Golden Plates", "qa-founder-golden-plates-book", [
    ["Angel Moroni", "Person", "1823", "Moroni is said to have appeared to Joseph Smith and revealed the plates."],
    ["Moroni appearing in 1823", "Event", "1823", "Smith said Moroni appeared to him in 1823."],
    ["Golden plates", "Scripture/Text", "1820s", "The plates were described as an ancient metal record."],
    ["Hill Cumorah", "Place", "", "The hill where the plates were said to have been hidden."],
    ["Ancient metal record", "Scripture/Text", "", "The plates were described as ancient metal records."],
    ["Reformed Egyptian", "Concept", "", "The script Joseph said was written on the plates."],
    ["Retrieved in 1827", "Event", "1827", "Smith said he retrieved the plates in 1827."],
    ["Taken back by angel", "Event", "", "Smith later said the plates were taken back by an angel."],
    ["No modern examination of plates", "Controversy", "", "No plates are available for modern examination."]
  ]],
  ["Translation of the Book of Mormon", "qa-founder-golden-plates-book", [
    ["By the gift and power of God", "Legal/doctrinal teaching", "", "Smith said the translation occurred by divine gift and power."],
    ["Dictation to scribes", "Event", "1820s", "The Book of Mormon was dictated to scribes."],
    ["Oliver Cowdery as major scribe", "Person", "1829", "Oliver Cowdery became a major scribe in the translation process."],
    ["Martin Harris and lost manuscript", "Event", "1828", "Martin Harris was tied to the lost manuscript episode."],
    ["Seer stone", "Concept", "", "Smith used a seer stone in the translation process."],
    ["Stone in a hat", "Concept", "", "Accounts describe Smith placing a seer stone in a hat."],
    ["Plates covered or not directly viewed", "Controversy", "", "Some accounts say the plates were covered or not directly viewed during dictation."],
    ["Book of Mormon publication 1830", "Event", "1830", "The Book of Mormon was published in 1830."]
  ]],
  ["Book of Mormon Witnesses", "qa-three-witnesses", [
    ["Three Witnesses", "Concept", "1829", "Oliver Cowdery, David Whitmer, and Martin Harris testified of an angelic showing of the plates."],
    ["Oliver Cowdery", "Person", "1806-1850", "One of the Three Witnesses and major scribe."],
    ["David Whitmer", "Person", "1805-1888", "One of the Three Witnesses."],
    ["Martin Harris", "Person", "1783-1875", "One of the Three Witnesses and early financier."],
    ["Angelic showing of plates", "Event", "1829", "The Three Witnesses claimed an angel showed them the plates."],
    ["Voice of God affirmed translation", "Event", "1829", "The Three Witnesses claimed God’s voice affirmed the translation."],
    ["Three Witnesses testimony printed", "Scripture/Text", "1830 onward", "Their testimony remains printed in LDS editions."]
  ]],
  ["Book of Mormon Witnesses", "qa-eight-witnesses", [
    ["Eight Witnesses", "Concept", "1829", "Eight men testified Joseph showed them the plates and that they handled them."],
    ["Christian Whitmer", "Person", "", "One of the Eight Witnesses."],
    ["Jacob Whitmer", "Person", "", "One of the Eight Witnesses."],
    ["Peter Whitmer Jr.", "Person", "", "One of the Eight Witnesses."],
    ["John Whitmer", "Person", "", "One of the Eight Witnesses."],
    ["Hiram Page", "Person", "", "One of the Eight Witnesses."],
    ["Joseph Smith Sr. witness", "Person", "", "Joseph Smith Sr. signed the Eight Witnesses testimony."],
    ["Hyrum Smith witness", "Person", "", "Hyrum Smith signed the Eight Witnesses testimony."],
    ["Samuel H. Smith witness", "Person", "", "Samuel H. Smith signed the Eight Witnesses testimony."],
    ["Physically handled the plates", "Event", "1829", "The Eight Witnesses claimed they physically handled the plates."]
  ]],
  ["Book of Mormon Witnesses", "qa-witnesses-left", [
    ["Witnesses who later left or became estranged", "Controversy", "1830s", "Several witnesses or insiders later left or became estranged."],
    ["Disagreements with Joseph Smith’s authority", "Controversy", "", "Authority disputes were one reason for estrangement."],
    ["Financial failures", "Controversy", "1830s", "Financial failures contributed to conflict."],
    ["Missouri tensions", "Controversy", "1830s", "Violence and political crisis in Missouri strained relationships."],
    ["Church governance disputes", "Controversy", "", "Governance disputes led some early insiders away."],
    ["Polygamy-related accusations", "Controversy", "", "Plural marriage accusations or later controversies shaped some breaks."],
    ["Political power struggles", "Controversy", "", "Political struggles contributed to disillusionment."],
    ["Disillusionment with later developments", "Controversy", "", "Some insiders rejected later developments while retaining plate testimony."],
    ["Maintained testimony after estrangement", "Concept", "", "Many still maintained their testimony about the plates after breaking with Smith personally."]
  ]],
  ["Book of Mormon Narrative and Theology", "qa-name-origin", [
    ["Meaning and origin of Mormon name", "Concept", "", "The name Mormon comes from the prophet-historian Mormon in the Book of Mormon."],
    ["Mormon prophet-historian", "Person", "", "Mormon is said to have compiled or abridged ancient records."],
    ["Mormon abridged ancient records", "Scripture/Text", "", "Mormon is described as compiler or abridger of records."],
    ["Moroni son of Mormon", "Person", "", "Moroni is Mormon’s son who finished and preserved the record."],
    ["Book compiled by Mormon", "Scripture/Text", "", "Book of Mormon means the book compiled or abridged by Mormon."],
    ["Mormon outsider nickname", "Concept", "", "Mormon became an outsider nickname for members."],
    ["The Church of Jesus Christ of Latter-day Saints name preference", "Religious movement", "modern", "The modern LDS Church prefers its full official name."]
  ]],
  ["Book of Mormon Narrative and Theology", "qa-founder-golden-plates-book", [
    ["Book of Mormon", "Scripture/Text", "1830", "New scripture published by Joseph Smith in 1830."],
    ["Ancient peoples in the Americas", "Concept", "", "The book presents itself as an ancient record of peoples in the Americas."],
    ["Lehi leaves Jerusalem", "Event", "c. 600 BCE", "Lehi’s family leaves Jerusalem around 600 BCE."],
    ["Family sails to the Americas", "Event", "", "Lehi’s family sails to the Americas."],
    ["Nephites", "Concept", "", "One descendant group in the Book of Mormon narrative."],
    ["Lamanites", "Concept", "", "Another descendant group in the Book of Mormon narrative."],
    ["Wars and sermons", "Event", "", "The narrative includes wars, sermons, visions, and political collapse."],
    ["Jesus appears in the Americas", "Event", "after resurrection", "The narrative climax includes Jesus appearing in the Americas."],
    ["Nephite civilization collapses", "Event", "", "The Nephite civilization collapses in the narrative."],
    ["Moroni buries the record", "Event", "", "Moroni buries the record for later recovery."],
    ["Joseph Smith retrieves record", "Event", "1827", "Smith retrieves the record centuries later."]
  ]],
  ["Book of Mormon Narrative and Theology", "qa-founder-golden-plates-book", [
    ["Jesus Christ as Savior", "Legal/doctrinal teaching", "", "The Book of Mormon centers Jesus Christ as Savior."],
    ["Repentance", "Legal/doctrinal teaching", "", "Repentance is a key theological theme."],
    ["Baptism", "Legal/doctrinal teaching", "", "Baptism is presented as a key ordinance."],
    ["Covenant theology", "Legal/doctrinal teaching", "", "Covenants structure the book’s theology."],
    ["Divine judgment", "Legal/doctrinal teaching", "", "Pride and corruption bring divine judgment."],
    ["Revelation", "Legal/doctrinal teaching", "", "Revelation is central to the text and movement."],
    ["Restoration of truth", "Legal/doctrinal teaching", "", "The book supports claims of restored truth."],
    ["America as sacred promised land", "Concept", "", "America is framed as a sacred/promised land."],
    ["Pride and corruption destroy societies", "Legal/doctrinal teaching", "", "The text treats pride and corruption as causes of destruction."],
    ["Protestant revival-era similarities", "Controversy", "", "Critics and scholars note similarities with revival-era Christianity."],
    ["King James Bible style", "Scripture/Text", "", "The Book of Mormon uses a style resembling the King James Bible."],
    ["Historicity and archaeology debates", "Controversy", "", "The book’s historicity and archaeology are major debates."]
  ]],
  ["Book of Mormon Narrative and Theology", "qa-american-miracles", [
    ["Claimed miracles in the Americas", "Concept", "", "The Book of Mormon includes miracle claims set in the Americas."],
    ["Christ descends from heaven", "Event", "", "Christ descends from heaven after the resurrection."],
    ["People touch Christ’s wounds", "Event", "", "People touch Christ’s wounds in the narrative."],
    ["Healing of the sick", "Event", "", "Christ heals the sick."],
    ["Calling of disciples", "Event", "", "Christ calls disciples in the Americas."],
    ["Sermons like Sermon on the Mount", "Scripture/Text", "", "Teachings resemble the Sermon on the Mount."],
    ["Baptismal ordinances", "Legal/doctrinal teaching", "", "Baptismal ordinances are established."],
    ["Angels appearing", "Event", "", "Angels appear in the narrative."],
    ["Divine voices from heaven", "Event", "", "Divine voices speak from heaven."],
    ["Prophetic visions", "Event", "", "Prophetic visions appear in the text."],
    ["Earthquakes", "Event", "", "Earthquakes accompany divine judgment."],
    ["Storms", "Event", "", "Storms accompany judgment scenes."],
    ["Darkness at Christ’s crucifixion", "Event", "", "Darkness covers the land at Christ’s crucifixion."],
    ["Mass destructions tied to divine judgment", "Event", "", "Destructions are tied to divine judgment."]
  ]],
  ["Early Church Formation", "qa-founder-golden-plates-book", [
    ["Church organized in 1830", "Event", "1830", "The church was organized in 1830."],
    ["Early converts", "Religious movement", "1830s", "Early converts were drawn by visions, prophecy, restoration claims, and community."],
    ["Joseph Smith as prophet and revelator", "Concept", "", "Smith’s prophetic role structured the early church."],
    ["Additional scripture", "Scripture/Text", "", "Mormonism developed around additional scripture."],
    ["Priesthood restoration", "Legal/doctrinal teaching", "", "Priesthood authority was claimed as restored."],
    ["Continuing revelation", "Legal/doctrinal teaching", "", "Continuing revelation became a core principle."]
  ]],
  ["Persecution and Opposition", "qa-persecution", [
    ["Local Protestant populations", "Religious movement", "", "Local Protestant populations often opposed early Mormons."],
    ["State militias", "Event", "", "State militias were involved in conflict with Mormons."],
    ["Anti-Mormon vigilantes", "Controversy", "", "Vigilante groups violently opposed Mormons."],
    ["Political rivals", "Controversy", "", "Political rivals opposed Mormon bloc power."],
    ["Newspapers", "Controversy", "", "Newspapers criticized Mormon claims and power."],
    ["Former insiders", "Controversy", "", "Former insiders became important critics."],
    ["Frontier settlers", "Controversy", "", "Settlers opposed Mormons in frontier conflict settings."],
    ["New York", "Place", "", "One early setting for opposition."],
    ["Ohio", "Place", "", "A major early Mormon settlement and conflict setting."],
    ["Missouri", "Place", "1830s", "The site of severe conflict and expulsion."],
    ["Illinois", "Place", "1840s", "The site of Nauvoo and Joseph Smith’s death."],
    ["Religious suspicion", "Controversy", "", "Suspicion of new scripture and prophetic authority fueled opposition."],
    ["Mormon bloc voting", "Controversy", "", "Bloc voting caused political fear."],
    ["Fear of theocracy", "Controversy", "", "Critics feared Mormon theocratic power."],
    ["Polygamy rumors", "Controversy", "", "Rumors and later facts of plural marriage intensified opposition."],
    ["1838 Missouri Extermination Order", "Event", "1838", "Governor Lilburn Boggs issued an order expelling or exterminating Mormons from Missouri."],
    ["Governor Lilburn Boggs", "Person", "1796-1860", "Missouri governor who issued the 1838 Extermination Order."]
  ]],
  ["Celestial Marriage and Polygamy", "qa-celestial-marriage", [
    ["Celestial marriage", "Legal/doctrinal teaching", "", "Marriage sealed eternally by priesthood authority."],
    ["Eternal sealing", "Legal/doctrinal teaching", "", "Marriage and family can continue after death."],
    ["Exaltation theology", "Legal/doctrinal teaching", "", "Celestial marriage connects to exaltation theology."],
    ["Temple ordinances", "Legal/doctrinal teaching", "", "Celestial marriage is connected to temple ordinances."],
    ["Joseph Smith secretly introduced plural marriage", "Controversy", "1840s", "Smith secretly introduced plural marriage."],
    ["Plural marriage under Brigham Young", "Controversy", "Utah period", "Plural marriage became more open under Brigham Young in Utah."],
    ["Official renunciation of polygamy 1890", "Event", "1890", "The LDS Church officially renounced plural marriage in 1890."]
  ]],
  ["Joseph Smith’s Death", "qa-mob-killed-smith", [
    ["Nauvoo, Illinois", "Place", "1840s", "Joseph Smith’s final city and power center."],
    ["Nauvoo Expositor", "Controversy", "1844", "Newspaper that published accusations including plural marriage claims."],
    ["Destruction of printing press", "Event", "1844", "Smith ordered destruction of the Nauvoo Expositor press."],
    ["Free speech and abuse of power criticism", "Controversy", "1844", "Critics saw destruction of the press as suppression and abuse."],
    ["Carthage Jail", "Place", "1844", "Joseph and Hyrum were jailed there."],
    ["Anti-Mormon mob from Illinois region", "Controversy", "1844", "The mob that stormed Carthage Jail came mainly from surrounding Illinois."],
    ["Joseph and Hyrum killed", "Event", "1844", "Joseph and Hyrum Smith were killed at Carthage Jail."],
    ["No successful convictions", "Controversy", "", "No one was successfully convicted for the killings."],
    ["Joseph Smith as martyr", "Concept", "", "Mormons remember Joseph as a martyr."]
  ]],
  ["Succession Crisis and Brigham Young", "qa-brigham-young-succession", [
    ["No universally accepted succession mechanism", "Controversy", "1844", "Joseph Smith left no universally accepted succession mechanism."],
    ["Competing claimants", "Controversy", "1844", "Multiple leaders claimed authority after Smith’s death."],
    ["Brigham Young", "Person", "1801-1877", "Leader of the Quorum of the Twelve and later Utah migration leader."],
    ["Quorum of the Twelve Apostles", "Religious movement", "1844", "The body Brigham Young led."],
    ["Organizational strength", "Concept", "", "Young had organizational advantages."],
    ["Controlled church structure", "Concept", "", "Young controlled much church structure."],
    ["Preserved Joseph Smith’s teachings", "Concept", "", "Many believed Young best preserved Smith’s teachings."],
    ["Transfiguration of Brigham Young tradition", "Event", "1844", "A tradition says Young appeared or sounded like Joseph during a succession speech."],
    ["Migration west to Utah", "Event", "1846-1847", "Young led the largest group west."],
    ["LDS settlement system in Utah", "Event", "Utah period", "Young built the LDS settlement system in Utah."]
  ]],
  ["Race Teachings and Priesthood Ban", "qa-race-teachings", [
    ["Race teachings in earlier LDS periods", "Legal/doctrinal teaching", "1800s-1978", "Earlier teachings connected race to divine favor, curses, premortal existence, and priesthood eligibility."],
    ["Priesthood ban", "Controversy", "until 1978", "Black members of African descent were barred from priesthood and certain temple ordinances until 1978."],
    ["Temple ordinance restrictions", "Controversy", "until 1978", "Certain temple ordinances were restricted alongside priesthood."],
    ["Curse of Cain", "Concept", "", "One explanation used for racial restrictions."],
    ["Curse of Ham", "Concept", "", "Another racialized biblical explanation used in wider Christian culture."],
    ["Premortal faithfulness theories", "Concept", "", "Some explanations invoked premortal existence."],
    ["Skin of blackness passages", "Scripture/Text", "", "Lamanite passages were interpreted racially by some earlier LDS teachers."],
    ["1800s American racial culture", "Controversy", "", "The teachings developed inside broader 19th-century American racial culture."],
    ["Slavery and segregation influence", "Controversy", "", "Slavery and segregation shaped broader religious racial thought."],
    ["LDS Church disavows earlier racial explanations", "Event", "modern", "The modern LDS Church disavows many earlier racial explanations."]
  ]],
  ["Mormon and Native American Relations", "qa-mountain-meadows-netflix", [
    ["Complicated Mormon and Native relations", "Controversy", "1800s", "Relations were contradictory and included diplomacy, violence, assimilation, and power imbalance."],
    ["Diplomacy with Native groups", "Event", "", "Mormons sometimes pursued diplomacy with Native groups."],
    ["Warfare in frontier Utah", "Event", "", "Violence occurred in the frontier Utah setting."],
    ["Assimilation attempts", "Controversy", "", "Assimilation efforts reflected paternalistic civilizing attitudes."],
    ["Child adoption programs", "Controversy", "", "Child adoption programs were part of Mormon-Native relations."],
    ["Paternalistic civilizing attitudes", "Controversy", "", "Mormon approaches often included paternalistic attitudes."],
    ["Power imbalances", "Controversy", "", "Relations were shaped by power imbalances."],
    ["Polygamous marriages involving Native women", "Controversy", "", "Some polygamous marriages involved Native women in certain contexts."],
    ["Violence and forced displacement", "Controversy", "", "Frontier Utah included violence and forced displacement."],
    ["Not simple official doctrine of violence", "Concept", "", "This history should not be flattened into one simple doctrine of violence."]
  ]],
  ["Mountain Meadows Massacre", "qa-mountain-meadows-netflix", [
    ["Mountain Meadows Massacre", "Event", "1857", "Massacre in southern Utah involving local Mormon militia and some Paiute Native Americans."],
    ["Southern Utah", "Place", "1857", "The location of the massacre."],
    ["Baker-Fancher wagon train", "Event", "1857", "The emigrant wagon train traveling toward California."],
    ["Utah War tensions", "Controversy", "1857", "Conflict between the U.S. government and Mormon leadership formed the backdrop."],
    ["Nauvoo Legion", "Event", "", "Local Mormon militia members were part of the Nauvoo Legion."],
    ["Paiute Native Americans", "Concept", "", "Some Paiute Native Americans participated, though later blame was shifted heavily onto Paiute groups."],
    ["Mormon militia central role", "Controversy", "1857", "Modern scholarship acknowledges Mormon militia leadership played a central role."],
    ["Around 120 emigrants killed", "Event", "1857", "Around 120 emigrants were killed."],
    ["Young children spared", "Event", "1857", "Young children were spared."],
    ["Militia disguise as Native Americans", "Controversy", "1857", "Some Mormon militia members disguised themselves as Native Americans."],
    ["Blame shifted onto Paiute groups", "Controversy", "", "For decades blame was shifted heavily onto Paiute groups."],
    ["Netflix dramatization caveat", "Concept", "modern", "Dramatizations may compress or exaggerate details."],
    ["Rape claim caution", "Controversy", "", "Claims of rape should be handled carefully; Mountain Meadows is best documented as mass murder and deception."]
  ]],
  ["Modern LDS Church", "", [
    ["Salt Lake City headquarters", "Place", "modern", "The LDS Church is headquartered in Salt Lake City."],
    ["Global LDS religion", "Religious movement", "modern", "The LDS Church is a global religion."],
    ["Family emphasis", "Legal/doctrinal teaching", "modern", "The church emphasizes family."],
    ["Missionary work", "Religious movement", "modern", "Missionary work is a central LDS emphasis."],
    ["Morality", "Legal/doctrinal teaching", "modern", "Moral standards are emphasized."],
    ["Temple worship", "Legal/doctrinal teaching", "modern", "Temple worship remains central."],
    ["Modern prophets", "Legal/doctrinal teaching", "modern", "The church teaches continuing revelation through modern prophets."],
    ["Book of Mormon historicity controversy", "Controversy", "modern", "Historicity remains a major debate."],
    ["Archaeology controversy", "Controversy", "modern", "Archaeological evidence is debated."],
    ["Polygamy history controversy", "Controversy", "modern", "Polygamy history remains controversial."],
    ["Race teachings controversy", "Controversy", "modern", "Earlier race teachings remain controversial."],
    ["Translation methods controversy", "Controversy", "modern", "Joseph Smith’s translation methods remain debated."],
    ["Mainstream Christianity differences", "Controversy", "modern", "LDS theology differs from mainstream Christianity."]
  ]]
];

for (const [branchTitle, qaId, items] of branchData) {
  const parentId = branches.get(branchTitle);
  const createdIds = items.map(([title, category, dateRange, summary], index) =>
    addChild(parentId, title, index, items.length, {
      category,
      dateRange,
      summary,
      qaIds: qaId ? [qaId] : [],
      tags: [String(category).toLowerCase().replace(/[^a-z0-9]+/g, "-"), ...(qaId ? [qaId] : [])]
    })
  );
  if (qaId) linkQa(qaId, createdIds);
}

const qaBranchMap = {
  "qa-founder-golden-plates-book": "Joseph Smith Jr.",
  "qa-three-witnesses": "Book of Mormon Witnesses",
  "qa-eight-witnesses": "Book of Mormon Witnesses",
  "qa-witnesses-left": "Book of Mormon Witnesses",
  "qa-american-miracles": "Book of Mormon Narrative and Theology",
  "qa-name-origin": "Book of Mormon Narrative and Theology",
  "qa-persecution": "Persecution and Opposition",
  "qa-celestial-marriage": "Celestial Marriage and Polygamy",
  "qa-mob-killed-smith": "Joseph Smith’s Death",
  "qa-brigham-young-succession": "Succession Crisis and Brigham Young",
  "qa-race-teachings": "Race Teachings and Priesthood Ban",
  "qa-smith-parents": "Smith Family Background",
  "qa-mountain-meadows-netflix": "Mountain Meadows Massacre"
};

qas.forEach((qa, index) => {
  const parentId = branches.get(qaBranchMap[qa.id]);
  if (!parentId) return;
  const title = `Q: ${qa.question.length > 54 ? `${qa.question.slice(0, 51)}...` : qa.question}`;
  const id = addChild(parentId, title, index % 4, 4, {
    type: "question",
    category: "User question",
    radius: 520,
    summary: qa.question,
    detail: qa.answer,
    qaIds: [qa.id],
    relationship: "same_as_question",
    label: "session question",
    tags: ["user-question", qa.id]
  });
  linkQa(qa.id, [id]);
});

function connectTitles(sourceTitle, targetTitle, relationship, label, explanation = "") {
  const source = titleToId.get(sourceTitle);
  const target = titleToId.get(targetTitle);
  edge(source, target, relationship, label, explanation);
}

connectTitles("Joseph Smith Jr.", "First Vision", "connected_to", "claimed vision");
connectTitles("Joseph Smith Jr.", "Angel Moroni and the Golden Plates", "connected_to", "golden plates claim");
connectTitles("Golden plates", "Translation of the Book of Mormon", "source_for", "source text claim");
connectTitles("Translation of the Book of Mormon", "Book of Mormon publication 1830", "caused", "published text");
connectTitles("Book of Mormon", "Book of Mormon Witnesses", "source_for", "witness testimony");
connectTitles("Three Witnesses", "Oliver Cowdery", "part_of", "witness");
connectTitles("Three Witnesses", "David Whitmer", "part_of", "witness");
connectTitles("Three Witnesses", "Martin Harris", "part_of", "witness");
connectTitles("Eight Witnesses", "Joseph Smith Sr. witness", "part_of", "witness");
connectTitles("Smith Family Background", "Joseph Smith Jr.", "genealogy", "family context");
connectTitles("Joseph Smith Sr.", "Joseph Smith Jr.", "genealogy", "father");
connectTitles("Lucy Mack Smith", "Joseph Smith Jr.", "genealogy", "mother");
connectTitles("Hyrum Smith", "Joseph Smith Jr.", "genealogy", "brother");
connectTitles("Samuel H. Smith", "Joseph Smith Jr.", "genealogy", "brother");
connectTitles("Celestial marriage", "Joseph Smith secretly introduced plural marriage", "legal_tradition", "secret introduction");
connectTitles("Joseph Smith secretly introduced plural marriage", "Nauvoo Expositor", "caused", "accusations published");
connectTitles("Nauvoo Expositor", "Destruction of printing press", "caused", "press destroyed");
connectTitles("Destruction of printing press", "Carthage Jail", "caused", "arrest context");
connectTitles("Carthage Jail", "Joseph and Hyrum killed", "caused", "mob attack");
connectTitles("Joseph Smith’s Death", "Succession Crisis and Brigham Young", "caused", "succession crisis");
connectTitles("Brigham Young", "Migration west to Utah", "caused", "westward migration");
connectTitles("Migration west to Utah", "LDS settlement system in Utah", "caused", "settlement system");
connectTitles("Utah War tensions", "Mountain Meadows Massacre", "caused", "massacre context");
connectTitles("Nauvoo Legion", "Mountain Meadows Massacre", "caused", "militia involvement");
connectTitles("Mormon militia central role", "Mountain Meadows Massacre", "connected_to", "responsibility");
connectTitles("Race teachings in earlier LDS periods", "Priesthood ban", "legal_tradition", "restriction");
connectTitles("Priesthood ban", "LDS Church disavows earlier racial explanations", "reform_standardization", "modern disavowal");
connectTitles("Modern LDS Church", "Salt Lake City headquarters", "located_in", "headquarters");
connectTitles("Modern LDS Church", "Missionary work", "connected_to", "modern emphasis");

function markdownFor(note) {
  const linkedQas = note.qaIds.map((qaId) => qas.find((qa) => qa.id === qaId)).filter(Boolean);
  return `# ${note.title}

## Summary
${note.summary}

## Notes
${note.notes}

## Related User Questions
${linkedQas.map((qa) => `- ${qa.question}`).join("\n")}

## Assistant Answer Summary
${linkedQas.map((qa) => qa.answer).join("\n\n")}

## Connections
${note.connections.map((item) => `- ${item}`).join("\n")}

## Sources

## Open Questions
- Which primary LDS, historical, and scholarly sources should be attached to this node?
- Which claims here need evidence grading?

## Claims
${linkedQas.map((qa) => `- Session answer: ${qa.answer.split(".")[0]}.`).join("\n")}
`;
}

const bridgeEdges = [
  {
    id: "bridge-mormon-christianity",
    sourceTreeId: treeId,
    sourceNodeId: root,
    targetTreeId: "islam-and-muslim-history",
    targetNodeId: "christianity",
    type: "cross_tree",
    label: "Christian restoration claim",
    notes: "Mormonism frames itself as restored Christianity while differing from mainstream Christianity."
  },
  {
    id: "bridge-mormon-abrahamic-religion",
    sourceTreeId: treeId,
    sourceNodeId: root,
    targetTreeId: "islam-and-muslim-history",
    targetNodeId: "religion_of_abraham",
    type: "cross_tree",
    label: "Abrahamic religion context",
    notes: "Mormonism belongs in the wider Abrahamic/Christian research context."
  },
  {
    id: "bridge-restorationism-christianity",
    sourceTreeId: treeId,
    sourceNodeId: titleToId.get("Restorationist movements"),
    targetTreeId: "islam-and-muslim-history",
    targetNodeId: "christianity",
    type: "cross_tree",
    label: "restorationist Christianity",
    notes: "Restorationist movements are part of the Christian reform/restoration landscape."
  }
];

const tree = {
  id: treeId,
  title: "Mormon Religion",
  description: "Research tree covering Joseph Smith, the golden plates, the Book of Mormon, early Mormon history, witnesses, persecution, race teachings, Brigham Young, and Mountain Meadows.",
  createdAt: now,
  updatedAt: now,
  metadata: {
    id: treeId,
    title: "Mormon Religion",
    themeColor: "gold",
    rootNodeId: root,
    preferredPosition: { x: 0.78, y: 0.78 },
    layoutRadius: 260,
    branchSpacing: 1.12,
    description: "Research tree covering Joseph Smith, the golden plates, the Book of Mormon, early Mormon history, witnesses, persecution, race teachings, Brigham Young, and Mountain Meadows."
  },
  qas,
  bridgeEdges,
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
  `# Mormon Religion Research Tree

This is a file-backed Research tree. The graph lives in \`tree.json\`; node notes live in \`nodes/*.md\`.

## Adding Future Mormon Research

1. Add a Q&A object to the \`qas\` array in \`tree.json\`.
2. Add new node objects with \`treeId: "mormon-religion"\`, a category, summaries, tags, and connections.
3. Link the Q&A id in each relevant node's \`relatedQuestions\` array.
4. Add normal edges for internal Mormon relationships.
5. Add \`bridgeEdges\` only for meaningful cross-tree links to other research clusters.
6. Create a matching Markdown file under \`nodes/\` with the same sections used by the current nodes.
`
);

for (const [id, note] of notes.entries()) {
  await writeFile(path.join(rootDir, "nodes", `${id}.md`), markdownFor(note));
}

console.log(`Created ${tree.title}: ${nodes.length} nodes, ${edges.length} edges, ${qas.length} Q&A items, ${bridgeEdges.length} bridge edges`);
