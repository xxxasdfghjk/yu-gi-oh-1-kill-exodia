import type { GameStore } from "@/store/gameStore";
import type { Card, CardInstance, TrapCard } from "@/types/card";
import type { GameState } from "@/types/game";
import { getLinkMonsterSummonalble, placementPriority } from "@/components/SummonSelector";
import { isLinkMonster, isXyzMonster, isSynchroMonster } from "./cardManagement";
import { CardSelector } from "./CardSelector";
import { CardInstanceFilter } from "./CardInstanceFilter";

export const getLevel = (cardInstance: CardInstance) => {
    const level = (cardInstance.card as { level?: number })?.level ?? -9999;
    return cardInstance.buf.level + level;
};

export const getAttack = (cardInstance: CardInstance) => {
    const attack = (cardInstance.card as { attack?: number })?.attack ?? -9999;
    const equip = (cardInstance.equipment ?? []).reduce((prev, cur) => {
        return prev + (cur?.buf?.attack ?? 0);
    }, 0);

    return Math.max(cardInstance.buf.attack + attack + equip, 0);
};

export const getDefense = (cardInstance: CardInstance) => {
    const defense = (cardInstance.card as { defense?: number })?.defense ?? -9999;
    const equip = (cardInstance.equipment ?? []).reduce((prev, cur) => {
        return prev + (cur?.buf?.defense ?? 0);
    }, 0);

    return Math.max(cardInstance.buf.defense + defense + equip, 0);
};

export const hasEmptyMonsterZone = (state: GameStore) => {
    return state.field.monsterZones.filter((e) => e === null).length > 0;
};

export const hasEmptyMonsterZoneWithExclude = (state: GameStore, exclude: CardInstance[]) => {
    if (hasEmptyMonsterZone(state)) {
        return true;
    }
    const target = state.field.monsterZones;
    for (const card of exclude) {
        if (target.findIndex((e) => e?.id === card.id) !== -1) {
            return true;
        }
    }
    return true;
};

export const getAllMonsterInMonsterZones = (state: GameStore, includeExtraZones: boolean) => {
    if (includeExtraZones) {
        return [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
            (e): e is CardInstance => e !== null
        );
    } else {
        return [...state.field.monsterZones].filter((e): e is CardInstance => e !== null);
    }
};

export const getPrioritySetSpellTrapZoneIndex = (state: GameStore) => {
    const setable = [
        ...state.field.spellTrapZones.map((e, index) => ({ elem: e, index })).filter(({ elem }) => elem === null),
    ].map((e) => e.index);
    return placementPriority(setable);
};

export const getPrioritySetMonsterZoneIndex = (state: GameStore, includeExtra: boolean) => {
    const target = includeExtra
        ? [...state.field.extraMonsterZones, ...state.field.monsterZones]
        : state.field.monsterZones;
    const setable = target
        .map((e, index) => ({ elem: e, index }))
        .filter(({ elem }) => elem === null)
        .map((e) => e.index);
    return placementPriority(setable);
};

export const shuffleDeck = (state: GameStore): void => {
    const shuffled = [...state.deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    state.deck = shuffled;
};

export const drawCards = (gameState: GameState, count: number): GameState => {
    const newDeck = [...gameState.deck];
    const newHand = [...gameState.hand];

    for (let i = 0; i < count && newDeck.length > 0; i++) {
        const drawnCard = newDeck.shift();
        if (drawnCard) {
            drawnCard.location = "Hand";
            newHand.push(drawnCard);
        }
    }

    return {
        ...gameState,
        deck: newDeck,
        hand: newHand,
    };
};

export const checkExodiaWin = (hand: CardInstance[]): boolean => {
    const exodiaPieces = [
        "封印されしエクゾディア",
        "封印されし者の右腕",
        "封印されし者の左腕",
        "封印されし者の右足",
        "封印されし者の左足",
    ];

    const handCardNames = hand.map((card) => card.card.card_name);
    return exodiaPieces.every((piece) => handCardNames.includes(piece));
};

export const isMonsterCard = (card: Card): boolean => {
    const monsterTypes = [
        "通常モンスター",
        "通常モンスター（チューナー）",
        "効果モンスター",
        "効果モンスター（チューナー）",
        "特殊召喚・効果モンスター",
        "儀式・効果モンスター",
        "融合モンスター",
        "シンクロモンスター",
        "エクシーズモンスター",
        "リンクモンスター",
    ];

    return monsterTypes.includes(card.card_type);
};

export const canLinkSummonAfterRelease = (
    materials: CardInstance[],
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
) => {
    const tempMonsterZones = [...monsterZones];
    const tempExtraMonsterZones = [...extraMonsterZones];

    for (const material of materials) {
        const monsterIndex = tempMonsterZones.findIndex((zone) => zone?.id === material.id);
        if (monsterIndex !== -1) {
            tempMonsterZones[monsterIndex] = null;
        } else {
            const extraIndex = tempExtraMonsterZones.findIndex((zone) => zone?.id === material.id);
            if (extraIndex !== -1) {
                tempExtraMonsterZones[extraIndex] = null;
            }
        }
    }
    const availableZones = getLinkMonsterSummonalble(tempExtraMonsterZones, tempMonsterZones);
    if (availableZones.length > 0) {
        return true;
    }
    return false;
};

export const searchCombinationLinkSummon = (
    linkCard: CardInstance,
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
): boolean => {
    if (!isLinkMonster(linkCard.card)) {
        return false;
    }
    const availableMaterials = [
        ...monsterZones.filter((zone) => zone !== null),
        ...extraMonsterZones.filter((zone) => zone !== null),
    ].filter((e) => e?.position === "attack" || e?.position === "defense") as CardInstance[];

    if (availableMaterials.length === 0) return false;

    const linkRating = (linkCard.card as { link?: number }).link;
    if (!linkRating) return false;

    const generateCombinations = (arr: CardInstance[], size: number): CardInstance[][] => {
        if (size === 0) return [[]];
        if (arr.length === 0) return [];

        const result: CardInstance[][] = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = arr.slice(i + 1);
            const combos = generateCombinations(rest, size - 1);
            for (const combo of combos) {
                result.push([arr[i], ...combo]);
            }
        }
        return result;
    };

    for (let materialCount = 1; materialCount <= Math.min(availableMaterials.length, linkRating); materialCount++) {
        const combinations = generateCombinations(availableMaterials, materialCount);

        for (const materials of combinations) {
            // Use the card's own materialCondition instead of canLinkSummonByMaterials
            const materialCondition = linkCard.card.materialCondition;
            if (materialCondition && materialCondition(materials)) {
                if (canLinkSummonAfterRelease(materials, extraMonsterZones, monsterZones)) {
                    return true;
                }
            }
        }
    }

    return false;
};

export const searchCombinationXyzSummon = (
    xyzCard: CardInstance,
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
): boolean => {
    if (!isXyzMonster(xyzCard.card)) {
        return false;
    }
    const availableMaterials = [
        ...monsterZones.filter((zone) => zone !== null),
        ...extraMonsterZones.filter((zone) => zone !== null),
    ].filter((e) => e?.position === "attack" || e?.position === "defense") as CardInstance[];

    if (availableMaterials.length === 0) return false;

    const generateCombinations = (arr: CardInstance[], size: number): CardInstance[][] => {
        if (size === 0) return [[]];
        if (arr.length === 0) return [];

        const result: CardInstance[][] = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = arr.slice(i + 1);
            const combos = generateCombinations(rest, size - 1);
            for (const combo of combos) {
                result.push([arr[i], ...combo]);
            }
        }
        return result;
    };

    // Check all possible combinations from 1 to all available materials
    for (let materialCount = 1; materialCount <= availableMaterials.length; materialCount++) {
        const combinations = generateCombinations(availableMaterials, materialCount);

        for (const materials of combinations) {
            // Use the card's own materialCondition
            const materialCondition = xyzCard.card.materialCondition;
            if (materialCondition && materialCondition(materials)) {
                // Check if there's an available zone after using these materials
                if (canXyzSummonAfterRelease(materials, extraMonsterZones, monsterZones)) {
                    return true;
                }
            }
        }
    }

    return false;
};

export const canXyzSummonAfterRelease = (
    materials: CardInstance[],
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
): boolean => {
    const tempMonsterZones = [...monsterZones];
    const tempExtraMonsterZones = [...extraMonsterZones];

    // Remove materials from temporary zones
    for (const material of materials) {
        const monsterIndex = tempMonsterZones.findIndex((zone) => zone?.id === material.id);
        if (monsterIndex !== -1) {
            tempMonsterZones[monsterIndex] = null;
        } else {
            const extraIndex = tempExtraMonsterZones.findIndex((zone) => zone?.id === material.id);
            if (extraIndex !== -1) {
                tempExtraMonsterZones[extraIndex] = null;
            }
        }
    }

    // For Xyz monsters, check if there's any available monster zone
    const hasAvailableMonsterZone = tempMonsterZones.some((zone) => zone === null);
    const hasAvailableExtraZone = tempExtraMonsterZones.some((zone) => zone === null);

    return hasAvailableMonsterZone || hasAvailableExtraZone;
};

export const searchCombinationSynchroSummon = (
    synchroCard: CardInstance,
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
): boolean => {
    if (!isSynchroMonster(synchroCard.card)) {
        return false;
    }
    const availableMaterials = new CardInstanceFilter([
        ...monsterZones.filter((zone) => zone !== null),
        ...extraMonsterZones.filter((zone) => zone !== null),
    ])
        .hasLevel()
        .faceup()
        .get();

    if (availableMaterials.length === 0) return false;

    const generateCombinations = (arr: CardInstance[], size: number): CardInstance[][] => {
        if (size === 0) return [[]];
        if (arr.length === 0) return [];

        const result: CardInstance[][] = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = arr.slice(i + 1);
            const combos = generateCombinations(rest, size - 1);
            for (const combo of combos) {
                result.push([arr[i], ...combo]);
            }
        }
        return result;
    };

    // Check all possible combinations from 2 to all available materials
    for (let materialCount = 2; materialCount <= availableMaterials.length; materialCount++) {
        const combinations = generateCombinations(availableMaterials, materialCount);

        for (const materials of combinations) {
            // Use the card's own materialCondition
            const materialCondition = synchroCard.card.materialCondition;
            if (materialCondition && materialCondition(materials)) {
                // Check if there's an available zone after using these materials
                if (canSynchroSummonAfterRelease(materials, extraMonsterZones, monsterZones)) {
                    return true;
                }
            }
        }
    }

    return false;
};

export const canSynchroSummonAfterRelease = (
    materials: CardInstance[],
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
): boolean => {
    const tempMonsterZones = [...monsterZones];
    const tempExtraMonsterZones = [...extraMonsterZones];

    // Remove materials from temporary zones
    for (const material of materials) {
        const monsterIndex = tempMonsterZones.findIndex((zone) => zone?.id === material.id);
        if (monsterIndex !== -1) {
            tempMonsterZones[monsterIndex] = null;
        } else {
            const extraIndex = tempExtraMonsterZones.findIndex((zone) => zone?.id === material.id);
            if (extraIndex !== -1) {
                tempExtraMonsterZones[extraIndex] = null;
            }
        }
    }

    // For Synchro monsters, check if there's any available monster zone
    const hasAvailableMonsterZone = tempMonsterZones.some((zone) => zone === null);
    const hasAvailableExtraZone = tempExtraMonsterZones.some((zone) => zone === null);

    return hasAvailableMonsterZone || hasAvailableExtraZone;
};

export const calcCanSummonLink = (cards: CardInstance[]) => {
    let availableSummonLink: number[] = [0];
    for (const card of cards) {
        const link = (card.card as { link?: number }).link ?? 1;
        if (link >= 2) {
            availableSummonLink = availableSummonLink.map((e) => [e, e + 1, e + link]).flat();
        } else {
            availableSummonLink = availableSummonLink.map((e) => [e, e + 1]).flat();
        }
    }
    return availableSummonLink;
};

export const isSpellCard = (card: Card): boolean => {
    const spellTypes = ["通常魔法", "速攻魔法", "永続魔法", "フィールド魔法", "装備魔法", "儀式魔法"];

    return spellTypes.includes(card.card_type);
};

export const isTrapCard = (card: Card): card is TrapCard => {
    return card.card_type === "罠";
};

export const getCardInstanceFromId = (state: GameStore, id: string) => {
    return new CardSelector(state)
        .allFieldSpellTrap()
        .allMonster()
        .deck()
        .extraDeck()
        .hand()
        .graveyard()
        .materials()
        .get()
        .find((e) => e !== null && e.id === id);
};
