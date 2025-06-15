import type { FusionMonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";

export default {
    card_name: "旧神ヌトス",
    card_type: "モンスター" as const,
    monster_type: "融合モンスター" as const,
    level: 4,
    element: "光" as const,
    race: "天使" as const,
    attack: 2500,
    defense: 1200,
    filterAvailableMaterials: (e) =>
        monsterFilter(e.card) &&
        (e.card.monster_type === "エクシーズモンスター" || e.card.monster_type === "シンクロモンスター"),
    materialCondition: () => true,
    text: "Ｓモンスター＋Ｘモンスター\n自分フィールドの上記カードを墓地へ送った場合のみ特殊召喚できる（「融合」は必要としない）。自分は「旧神ヌトス」を１ターンに１度しか特殊召喚できない。(1)：１ターンに１度、自分メインフェイズに発動できる。手札からレベル４モンスター１体を特殊召喚する。(2)：このカードが墓地へ送られた場合、フィールドのカード１枚を対象として発動できる。そのカードを破壊する。",
    image: "card100065315_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasLink: false as const,
    hasRank: false as const,
    canNormalSummon: false,
    effect: {},
} satisfies FusionMonsterCard;
