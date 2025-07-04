import type { GameStore } from "@/store/gameStore";
import type { CardInstance, TrapCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withUserSummon } from "@/utils/effectUtils";

export default {
    card_name: "機械じかけのマジックミラー",
    card_type: "罠" as const,
    text: "①：相手モンスターの攻撃宣言時に、相手の墓地の魔法カード１枚を対象として発動できる。そのカードを自分フィールドにセットする。②：墓地のこのカードを除外し、手札及び自分フィールドにセットされたカードの中から、「死者蘇生」１枚を墓地へ送って発動できる。自分の墓地から「オベリスクの巨神兵」１体を選んで守備表示で特殊召喚する。この効果を相手ターンに発動した場合、このターンこの効果で特殊召喚したモンスターが自分フィールドに存在する限り、攻撃可能な相手モンスターはそのモンスターを攻撃しなければならない。",
    image: "card100262721_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return (
                    new CardSelector(state).spellTrap().hand().filter().include("死者蘇生").len() > 0 &&
                    card.location === "Graveyard" &&
                    new CardSelector(state).graveyard().filter().include("オベリスクの巨神兵").len() > 0
                );
            },
            effect: (state: GameStore, card: CardInstance) => {
                sendCard(state, card, "Exclusion");
                withUserSelectCard(
                    state,
                    card,
                    (state) => {
                        return new CardSelector(state).spellTrap().hand().filter().include("死者蘇生").get();
                    },
                    { select: "single" },
                    (state, _card, selected) => {
                        sendCard(state, selected[0], "Graveyard");
                        withUserSelectCard(
                            state,
                            card,
                            (state) => {
                                return new CardSelector(state).graveyard().filter().include("オベリスクの巨神兵").get();
                            },
                            { select: "single" },
                            (state, card, selected) => {
                                withUserSummon(state, card, selected[0], {}, () => {});
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies TrapCard;
