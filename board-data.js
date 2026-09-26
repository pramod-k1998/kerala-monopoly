// Kerala-inspired board data. 28 tiles, corners at index 0, 7, 14, 21.
// group colors are purely original, not copied from any existing game.
const GROUP_COLORS = {
  beach:    "#2FA4A9", // sea teal
  backwater:"#3F7D4A", // paddy green
  cultural: "#C1543A", // terracotta
  hill:     "#6B4E9B", // tea-hill violet
  premium:  "#D9A441", // temple gold
  transport:"#4A3427", // coir brown
  special:  "#8A8F98"
};

const BOARD = [
  { i:0,  type:"go",       name:"Marina Muhurtham",        emoji:"🏁" },
  { i:1,  type:"property", name:"Kovalam Beach",           emoji:"🏖️", group:"beach",     price:600,  rent:40 },
  { i:2,  type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:3,  type:"property", name:"Varkala Cliff",           emoji:"🏖️", group:"beach",     price:700,  rent:50 },
  { i:4,  type:"tax",      name:"KSEB Bill",               emoji:"💡", amount:200 },
  { i:5,  type:"property", name:"Bekal Fort",              emoji:"🏰", group:"beach",     price:800,  rent:60 },
  { i:6,  type:"transport",name:"KSRTC Bus Stand",         emoji:"🚌", price:500,  rent:100 },
  { i:7,  type:"jail",     name:"Alappuzha — Just Visiting", emoji:"🚤" },
  { i:8,  type:"property", name:"Kumarakom",               emoji:"🌾", group:"backwater", price:1000, rent:70 },
  { i:9,  type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:10, type:"property", name:"Kollam Backwaters",       emoji:"🌾", group:"backwater", price:1100, rent:80 },
  { i:11, type:"transport",name:"Kochi Water Metro",       emoji:"⛴️", price:500,  rent:100 },
  { i:12, type:"property", name:"Kozhikode Beach Road",    emoji:"🕌", group:"cultural",  price:1300, rent:95 },
  { i:13, type:"property", name:"Thrissur Pooram Grounds", emoji:"🐘", group:"cultural",  price:1400, rent:100 },
  { i:14, type:"parking",  name:"Fort Kochi — Backwater Break", emoji:"🌅" },
  { i:15, type:"property", name:"Kannur Theyyam Grounds",  emoji:"🔥", group:"cultural",  price:1500, rent:110 },
  { i:16, type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:17, type:"transport",name:"Kochi Metro",             emoji:"🚇", price:500,  rent:100 },
  { i:18, type:"property", name:"Wayanad Hills",           emoji:"⛰️", group:"hill",      price:1700, rent:130 },
  { i:19, type:"property", name:"Thekkady Tea Estate",     emoji:"🍃", group:"hill",      price:1800, rent:140 },
  { i:20, type:"tax",      name:"Toddy Shop Tax",          emoji:"🥥", amount:150 },
  { i:21, type:"gotojail", name:"Police Checkpost",        emoji:"🚓" },
  { i:22, type:"property", name:"Munnar Tea Gardens",      emoji:"🍵", group:"hill",      price:2000, rent:160 },
  { i:23, type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:24, type:"property", name:"Athirappilly Falls",      emoji:"💦", group:"premium",   price:2100, rent:170 },
  { i:25, type:"transport",name:"Kerala Water Authority",  emoji:"🚰", price:500,  rent:100 },
  { i:26, type:"property", name:"Kochi Marine Drive",      emoji:"🏙️", group:"premium",   price:2300, rent:190 },
  { i:27, type:"property", name:"Thiruvananthapuram Fort", emoji:"👑", group:"premium",   price:2500, rent:210 }
];

const SURPRISE_CARDS = [
  { text: "Onam Sadya invitation! Collect ₹200.", money: 200 },
  { text: "Your houseboat needs repairs. Pay ₹150.", money: -150 },
  { text: "You won the Vallam Kali boat race! Collect ₹300.", money: 300 },
  { text: "Monsoon flooding damages your stall. Pay ₹100.", money: -100 },
  { text: "A tourist tips you generously. Collect ₹100.", money: 100 },
  { text: "Advance to Marina Muhurtham (GO). Collect ₹200.", move: 0, collectGo: true },
  { text: "Take a free houseboat ride to Munnar Tea Gardens.", moveTo: 22 },
  { text: "Kathakali performance fee. Pay ₹75.", money: -75 },
  { text: "Spice trade profits! Collect ₹150.", money: 150 },
  { text: "Go directly to the Police Checkpost jail.", toJail: true }
];

const TOKENS = ["🥥","🛶","🐘","🦚","🌴","🏵️"];
const START_MONEY = 15000;
const PASS_GO_BONUS = 2000;
const JAIL_INDEX = 7;
const GO_TO_JAIL_INDEX = 21;
