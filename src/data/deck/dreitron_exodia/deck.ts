import { expandDeckList, type Deck } from "@/data/deckUtils";
import cardMap from "@/data/cards/cardMap";

const DECK_CONFIG = {
    deck_name: "ドライトロンエグゾディア",
    main_deck: [
        // Monsters
        { card_name: "封印されしエクゾディア", quantity: 1 },
        { card_name: "封印されし者の右腕", quantity: 1 },
        { card_name: "封印されし者の左腕", quantity: 1 },
        { card_name: "封印されし者の右足", quantity: 1 },
        { card_name: "封印されし者の左足", quantity: 1 },
        { card_name: "ジェネクス・コントローラー", quantity: 2 },
        { card_name: "大砲だるま", quantity: 2 },
        { card_name: "神聖なる魂", quantity: 1 },
        { card_name: "クリッター", quantity: 1 },
        { card_name: "宣告者の神巫", quantity: 3 },
        { card_name: "竜輝巧－エルγ", quantity: 3 },
        { card_name: "竜輝巧－アルζ", quantity: 3 },
        { card_name: "竜輝巧－バンα", quantity: 3 },
        { card_name: "サイバー・エンジェル－弁天－", quantity: 3 },
        { card_name: "サイバー・エンジェル－韋駄天－", quantity: 1 },

        // Spells
        { card_name: "ワン・フォー・ワン", quantity: 1 },
        { card_name: "おろかな埋葬", quantity: 1 },
        { card_name: "ジャック・イン・ザ・ハンド", quantity: 3 },
        { card_name: "エマージェンシー・サイバー", quantity: 3 },
        { card_name: "極超の竜輝巧", quantity: 3 },
        { card_name: "竜輝巧－ファフニール", quantity: 3 },
        { card_name: "テラ・フォーミング", quantity: 1 },
        { card_name: "チキンレース", quantity: 1 },
        { card_name: "盆回し", quantity: 1 },
        { card_name: "金満で謙虚な壺", quantity: 3 },
        { card_name: "流星輝巧群", quantity: 1 },
        { card_name: "高等儀式術", quantity: 1 },
        { card_name: "儀式の準備", quantity: 3 },
        // Traps
        { card_name: "補充要員", quantity: 3 },
    ],
    extra_deck: [
        { card_name: "虹光の宣告者", quantity: 1 },
        { card_name: "セイクリッド・トレミスM7", quantity: 1 },
        { card_name: "永遠の淑女 ベアトリーチェ", quantity: 2 },
        { card_name: "竜輝巧－ファフμβ'", quantity: 2 },
        { card_name: "幻獣機アウローラドン", quantity: 1 },
        { card_name: "警衛バリケイドベルグ", quantity: 1 },
        { card_name: "ユニオン・キャリアー", quantity: 1 },
        { card_name: "転生炎獣アルミラージ", quantity: 1 },
        { card_name: "リンクリボー", quantity: 1 },
        { card_name: "天霆號アーゼウス", quantity: 1 },
        { card_name: "FNo.0 未来皇ホープ", quantity: 1 },
        { card_name: "FNo.0 未来龍皇ホープ", quantity: 1 },
        { card_name: "旧神ヌトス", quantity: 1 },
    ],
    token: [{ card_name: "幻獣機トークン", quantity: 1 }],
};
export default {
    deck_name: DECK_CONFIG.deck_name,
    main_deck: expandDeckList(DECK_CONFIG.main_deck, cardMap),
    extra_deck: expandDeckList(DECK_CONFIG.extra_deck, cardMap),
    token: expandDeckList(DECK_CONFIG.token, cardMap),
    rules: [],
} satisfies Deck;
