import type { LeveledMonsterCard } from "@/types/card";
import { withUserSummon } from "@/utils/effectUtils";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "ライトロード・ビースト ウォルフ",
    card_type: "モンスター" as const,
    text: "このカードは通常召喚できない。このカードがデッキから墓地に送られた時、このカードを自分フィールド上に特殊召喚する。",
    image: "card100004179_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "獣戦士" as const,
    attack: 2100,
    defense: 300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onDeckToGraveyard: (state, card) => {
            // デッキから墓地に送られた時、特殊召喚する
            if (!hasEmptyMonsterZone(state)) {
                return;
            }
            withUserSummon(
                state,
                card,
                card,
                {
                    canSelectPosition: true,
                    optionPosition: ["attack", "defense"],
                },
                () => {}
            );
        },
    },
} satisfies LeveledMonsterCard;
