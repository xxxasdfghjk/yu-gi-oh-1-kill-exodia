import type { DisplayField } from "@/const/card";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance, EffectType, Location, SummonedBy } from "@/types/card";
import { getPrioritySetSpellTrapZoneIndex, getCardInstanceFromId } from "./gameUtils";
import { isExtraDeckMonster, monsterFilter } from "./cardManagement";
import { withDelay } from "./effectUtils";

type Position = "back_defense" | "attack" | "back" | "defense" | undefined;

type NotifyType = Extract<keyof EffectType, "onCardEffect" | "onCardDeckToGraveyard" | "onCardToGraveyardByEffect">;
export const notifyCardEffect = (
    state: GameStore,
    card: CardInstance,
    key: NotifyType,
    option?: { effectId?: string }
) => {
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i]?.card.effect?.[key]) {
            withDelay(state, card, { order: 3000 }, (state, card) => {
                state.field.monsterZones[i]?.card.effect?.[key]?.(state, state.field.monsterZones[i]!, {
                    effectedByName: card.card.card_name,
                    effectedByField: card.location,
                    effectedById: card.id,
                    effectId: option?.effectId ?? "",
                });
            });
        }
    }
    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i]?.card.effect?.[key]) {
            state.field.extraMonsterZones[i]?.card.effect?.[key]?.(state, state.field.extraMonsterZones[i]!, {
                effectedByName: card.card.card_name,
                effectedByField: card.location,
                effectedById: card.id,
            });
        }
    }
};

// Trigger effects based on card movement
export const triggerEffects = (
    state: GameStore,
    card: CardInstance,
    from: Location,
    to: Location,
    context?: { equipCardId?: string; effectedBy?: CardInstance; effectId?: string }
) => {
    const effect = card.card.effect;

    // Field to Graveyard effects
    if (
        (from === "MonsterField" || from === "FieldZone" || from === "SpellField") &&
        to === "Graveyard" &&
        effect?.onFieldToGraveyard
    ) {
        withDelay(state, card, { order: 3000 }, (state, card) => {
            card.card?.effect?.onFieldToGraveyard?.(state, card, { equipCardId: context?.equipCardId ?? "" });
        });
    }

    if ((from === "SpellField" || from === "MonsterField" || from === "FieldZone") && card.card?.effect?.onLeaveField) {
        withDelay(state, card, { order: 3000 }, (state, card) => {
            card.card.effect?.onLeaveField?.(state, card, { equipCardId: context?.equipCardId ?? "" });
        });
        return;
    }

    // Deck to Graveyard effects
    if (from === "Deck" && to === "Graveyard" && effect?.onDeckToGraveyard) {
        withDelay(state, card, { order: 3000 }, (state, card) => {
            card.card?.effect?.onDeckToGraveyard?.(state, card);
        });
    }
    if (from === "Deck" && to === "Graveyard") {
        notifyCardEffect(state, card, "onCardDeckToGraveyard");
    }

    // Hand to Graveyard effects
    if (from === "Hand" && to === "Graveyard" && effect?.onHandToGraveyard) {
        withDelay(state, card, { order: 3000 }, (state, card) => {
            card.card?.effect?.onHandToGraveyard?.(state, card);
        });
    }

    // Anywhere to Graveyard effects
    if (to === "Graveyard" && effect?.onAnywhereToGraveyard) {
        withDelay(state, card, { order: 3000 }, (state, card) => {
            card.card?.effect?.onAnywhereToGraveyard?.(state, card);
        });
    }
    // Graveyard to Field effects
    if (from === "Graveyard" && to === "MonsterField" && effect?.onGraveyardToField) {
        withDelay(state, card, { order: 3000 }, (state, card) => {
            card.card?.effect?.onGraveyardToField?.(state, card, { equipCardId: context?.equipCardId ?? "" });
        });
    }
};
export type Buf = { attack: number; defense: number; level: number };
export const addBuf = (state: GameStore, card: CardInstance, buf: Buf) => {
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones?.[i]?.id === card.id) {
            const tar = state.field.monsterZones[i]!;
            const newBuf = {
                attack: buf.attack + tar.buf.attack,
                defense: buf.defense + tar.buf.defense,
                level: buf.level + tar.buf.level,
            };
            state.field.monsterZones[i] = { ...state.field.monsterZones[i], buf: newBuf } as CardInstance;
        }
    }

    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i]?.id === card.id) {
            const tar = state.field.extraMonsterZones[i]!;
            const newBuf = {
                attack: buf.attack + tar.buf.attack,
                defense: buf.defense + tar.buf.defense,
                level: buf.level + tar.buf.level,
            };
            const newInstance = {
                ...state.field.extraMonsterZones[i],
                buf: newBuf,
            };
            state.field.extraMonsterZones[i] = newInstance as CardInstance;
        }
    }
};

export const releaseCardById = (state: GameStore, cardId: string) => {
    const card = getCardInstanceFromId(state, cardId);
    if (card === null || card === undefined) {
        return;
    }
    sendCard(state, card, "Graveyard");
    card.card.effect?.onRelease?.(state, card);
};

export const releaseCard = (state: GameStore, card: CardInstance) => {
    sendCard(state, card, "Graveyard");
    card.card.effect?.onRelease?.(state, card);
};

type EffectTarget = "onCardToGraveyardByEffect";
export const notifyFieldCard = (
    state: GameStore,
    card: CardInstance,
    effectTarget: EffectTarget,
    effectedByCard: CardInstance
) => {
    for (let i = 0; i < 5; i++) {
        state.field.monsterZones[i]?.card.effect?.[effectTarget]?.(state, card, {
            effectedBy: effectedByCard.card.card_name,
            effectedByField: effectedByCard.location,
        });
    }
    for (let i = 0; i < 2; i++) {
        state.field.extraMonsterZones[i]?.card.effect?.[effectTarget]?.(state, card, {
            effectedBy: effectedByCard.card.card_name,
            effectedByField: effectedByCard.location,
        });
    }
};

export const sendCardToGraveyardByEffect = (
    state: GameStore,
    card: CardInstance,
    effectedBy: CardInstance,
    notify: boolean = true
) => {
    sendCard(state, card, "Graveyard");
    const effectedByName = effectedBy.card.card_name;
    const effectedByField = effectedBy.location;
    const effectedById = effectedBy.id;
    withDelay(state, card, { order: 4000 }, (state, card) => {
        card.card.effect?.onAnywhereToGraveyardByEffect?.(state, card, {
            effectedByName,
            effectedByField,
            effectedById,
        });
    });
    if (notify) {
        notifyCardEffect(state, effectedBy, "onCardToGraveyardByEffect");
    }
};

export const equipCardById = (state: GameStore, equipMonster: CardInstance, equippedCardId: string) => {
    const equippedCard = getCardInstanceFromId(state, equippedCardId);
    if (equippedCard === null || equippedCard === undefined) {
        return;
    }
    equipCard(state, equipMonster, equippedCard);
};

export const equipCard = (state: GameStore, equipMonster: CardInstance, equippedCard: CardInstance) => {
    const equipment = { ...equippedCard, location: "FieldZone" as const };
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i] !== null && state.field.monsterZones[i]?.id === equipMonster.id) {
            state.field.monsterZones[i]!.equipment.push(equipment);
        }
    }
    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i] !== null && state.field.extraMonsterZones[i]?.id === equipMonster.id) {
            state.field.extraMonsterZones[i]!.equipment.push(equipment);
        }
    }
};

export const getEquipTarget = (state: GameStore, equippedCard: CardInstance) => {
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i] !== null) {
            const target = state.field.monsterZones[i]?.equipment.find((e) => e.id === equippedCard.id);
            if (target) {
                return target;
            }
        }
    }
    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i] !== null) {
            const target = state.field.extraMonsterZones[i]?.equipment.find((e) => e.id === equippedCard.id);
            if (target) {
                return target;
            }
        }
    }
    return null;
};

// 装備カードが装備されているモンスターを取得する関数
export const getMonsterEquippedWith = (state: GameStore, equipmentCard: CardInstance): CardInstance | null => {
    // 通常モンスターゾーンをチェック
    for (let i = 0; i < 5; i++) {
        const monster = state.field.monsterZones[i];
        if (monster && monster.equipment.some((eq) => eq.id === equipmentCard.id)) {
            return monster;
        }
    }
    // エクストラモンスターゾーンをチェック
    for (let i = 0; i < 2; i++) {
        const monster = state.field.extraMonsterZones[i];
        if (monster && monster.equipment.some((eq) => eq.id === equipmentCard.id)) {
            return monster;
        }
    }
    return null;
};

export const getSpellTrapZoneIndex = (state: GameStore, card: CardInstance) => {
    for (let i = 0; i < 5; i++) {
        if (state.field?.spellTrapZones[i]?.id === card.id) {
            return i;
        }
    }
    return -1;
};

export const sendCardById = (state: GameStore, id: string, to: Location, option?: Parameters<typeof sendCard>[3]) => {
    const card = getCardInstanceFromId(state, id);
    if (card === null || card === undefined) {
        return;
    }
    sendCard(state, card, to, option);
};

export const sendCard = (
    state: GameStore,
    card: CardInstance,
    to: Location,
    option?: {
        reverse?: boolean;
        spellFieldIndex?: number;
        ignoreLeavingInstead?: boolean;
        position?: Position;
        zone?: number;
        deckTop?: boolean;
        effectedBy?: CardInstance;
        effectId?: string;
    }
) => {
    const originalLocation = card.location;
    // If the card is leaving the field and has equipment, send equipment to graveyard
    const isLeavingField =
        (card.location === "MonsterField" || card.location === "SpellField") &&
        to !== "MonsterField" &&
        to !== "SpellField";

    if (isExtraDeckMonster(card.card) && (to === "Deck" || to === "Hand")) {
        sendCard(state, { ...card, equipment: [], materials: [] }, "ExtraDeck");
        return;
    }

    if (isLeavingField) {
        // Send all equipped cards to graveyard using sendCard recursively
        const equipmentCopy = [...card.equipment]; // Make a copy to avoid modification during iteration
        const materialCopy = [...card.materials]; // Make a copy to avoid modification during iteration
        equipmentCopy.forEach((equipmentCard, i) => {
            withDelay(state, equipmentCard, { delay: 100 + i * 20 }, (state, card) => {
                sendCard(state, card, "Graveyard");
            });
        });
        materialCopy.forEach((materialCard, i) => {
            withDelay(state, materialCard, { delay: 100 + i * 20 }, (state, card) => {
                sendCard(state, card, "Graveyard");
            });
        });
        if (card.card?.effect?.onLeaveFieldInstead && option?.ignoreLeavingInstead !== true) {
            card.card.effect?.onLeaveFieldInstead(state, card);
            return;
        }
    }

    // Remove from current location
    const from = excludeFromAnywhere(state, card);

    state.currentFrom = { ...from, position: card.position };
    if (card.isToken === true && to === "Graveyard") {
        // トークンは墓地に送られる代わりにゲームから除外される（AnimatePresenceが削除を処理）
        // フィールドからは既に除外されているので、何もしない
        state.currentTo = { location: "TokenRemove", index: from.index };
        return;
    }

    // Update card location and add to new location
    const updatedCard = {
        ...card,
        location: to,
        position: option?.reverse ? "back" : undefined,
        // Only clear equipment and materials when leaving the field, not when entering
        // Always create new extensible arrays to prevent "object is not extensible" errors
        equipment: isLeavingField ? [] : [...(card.equipment || [])],
        materials: isLeavingField ? [] : [...(card.materials || [])],

        effectUse: [],
        card: { ...card.card, effect: card.card.originEffect ? card.card.originEffect : card.card.effect },
    } satisfies CardInstance;

    switch (to) {
        case "Deck":
            state.currentTo = { location: "Deck" };
            if (option?.deckTop) {
                state.deck.unshift(updatedCard);
            } else {
                state.deck.push(updatedCard);
            }
            break;
        case "Hand":
            state.currentTo = { location: "Hand", index: state.hand.length, length: state.hand.length + 1 };
            state.hand.push(updatedCard);

            break;
        case "Graveyard":
            state.currentTo = { location: "Graveyard" };
            state.graveyard.push(updatedCard);
            // Track monsters sent to graveyard this turn
            if (monsterFilter(updatedCard.card) && isLeavingField) {
                state.monstersToGraveyardThisTurn.push(updatedCard);
            }
            break;
        case "Exclusion":
            state.currentTo = { location: "Exclusion" };
            state.banished.push(updatedCard);
            break;
        case "ExtraDeck":
            state.currentTo = { location: "ExtraDeck" };
            state.extraDeck.push(updatedCard);
            break;
        case "MonsterField":
            state.currentTo = { location: "MonsterField" };
            if (option!.zone! >= 0 && option!.zone! <= 4) {
                state.currentTo = { location: "MonsterField", index: option!.zone, position: option!.position };
                state.field.monsterZones[option!.zone!] = { ...updatedCard, position: option!.position };
            } else if (option!.zone === 5 || option!.zone === 6) {
                state.currentTo = { location: "MonsterField", index: option!.zone, position: option!.position! };
                state.field.extraMonsterZones[option!.zone - 5] = { ...updatedCard, position: option!.position };
            }
            // This should be handled by summon function
            break;
        case "SpellField": {
            // Find empty spell/trap zone
            if (option?.spellFieldIndex !== undefined) {
                const position = option?.reverse ? "back" : ("attack" satisfies Position);
                state.currentTo = { location: "SpellField", index: option.spellFieldIndex, position };

                state.field.spellTrapZones[option.spellFieldIndex] = { ...updatedCard, position };
            } else {
                const emptyZone = getPrioritySetSpellTrapZoneIndex(state);
                if (emptyZone !== -1) {
                    const position = option?.reverse ? "back" : ("attack" satisfies Position);
                    state.currentTo = { location: "SpellField", index: emptyZone, position };
                    state.field.spellTrapZones[emptyZone] = { ...updatedCard, position };
                }
            }
            break;
        }
        case "FieldZone": {
            if (state.field.fieldZone !== null) {
                sendCard(state, state!.field!.fieldZone!, "Graveyard");
            }
            state.currentTo = { location: "FieldZone" };
            const position = option?.reverse ? "back" : ("attack" satisfies Position);

            state.field.fieldZone = { ...updatedCard, position };
            break;
        }
        case "OpponentField": {
            state.currentTo = { location: "OpponentField" };
            const position = option?.reverse ? "back" : ("attack" satisfies Position);

            state.opponentField.fieldZone = { ...updatedCard, position };
            break;
        }
        case "Throne": {
            const index = [
                "封印されしエクゾディア",
                "封印されし者の左腕",
                "封印されし者の左足",
                "封印されし者の右足",
                "封印されし者の右腕",
            ].indexOf(card.card.card_name);
            state.currentTo = {
                location: "Throne",
                index,
            };
            state.throne[index] = { ...updatedCard };
            break;
        }
    }
    // Trigger effects after the card has been moved
    triggerEffects(state, updatedCard, originalLocation, to, {
        equipCardId: from?.equipCard?.id ?? "",
        effectedBy: option?.effectedBy,
        effectId: option?.effectId,
    });
};

// Remove card from any location and return where it was
export const excludeFromAnywhere = (
    state: GameStore,
    card: CardInstance
): { location: DisplayField; index?: number; length?: number; equipCard?: CardInstance } => {
    let result: { location: DisplayField; index?: number; length?: number; equipCard?: CardInstance } = {
        location: card.location as DisplayField,
        index: undefined,
        length: undefined,
    };
    // Remove from hand
    const handIndex = state.hand.findIndex((c) => c.id === card.id);
    if (handIndex !== -1) {
        const length = state.hand.length;
        state.hand.splice(handIndex, 1);
        result = { location: "Hand", index: handIndex, length };
    }

    // Remove from deck
    const deckIndex = state.deck.findIndex((c) => c.id === card.id);
    if (deckIndex !== -1) {
        state.deck.splice(deckIndex, 1);
        result = { location: "Deck" };
    }

    // Remove from graveyard
    const graveyardIndex = state.graveyard.findIndex((c) => c.id === card.id);
    if (graveyardIndex !== -1) {
        state.graveyard.splice(graveyardIndex, 1);
        result = { location: "Graveyard" };
    }

    // Remove from banished
    const banishedIndex = state.banished.findIndex((c) => c.id === card.id);
    if (banishedIndex !== -1) {
        state.banished.splice(banishedIndex, 1);
        result = { location: "Exclusion" };
    }

    // Remove from extra deck
    const extraDeckIndex = state.extraDeck.findIndex((c) => c.id === card.id);
    if (extraDeckIndex !== -1) {
        state.extraDeck.splice(extraDeckIndex, 1);
        result = { location: "ExtraDeck" };
    }

    // Remove from monster zones
    for (let i = 0; i < state.field.monsterZones.length; i++) {
        if (state.field.monsterZones[i]?.id === card.id) {
            state.field.monsterZones[i] = null;
            result = { location: "MonsterField", index: i };
            break;
        }
    }

    // Remove from extra monster zones
    for (let i = 0; i < state.field.extraMonsterZones.length; i++) {
        if (state.field.extraMonsterZones[i]?.id === card.id) {
            state.field.extraMonsterZones[i] = null;
            result = { location: "MonsterField", index: i + 5 };

            break;
        }
    }

    // Remove from spell/trap zones
    for (let i = 0; i < state.field.spellTrapZones.length; i++) {
        if (state.field.spellTrapZones[i]?.id === card.id) {
            state.field.spellTrapZones[i] = null;
            result = { location: "SpellField", index: i };

            break;
        }
    }

    // Remove from field zone
    if (state.field.fieldZone?.id === card.id) {
        state.field.fieldZone = null;
        result = { location: "FieldZone" };
    }

    // materials
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i] && state.field.monsterZones[i]?.materials) {
            const materialIndex = state.field.monsterZones[i]!.materials.findIndex(
                (material) => material.id === card.id
            );
            if (materialIndex !== -1) {
                state.field.monsterZones[i]!.materials.splice(materialIndex, 1);
                result = { location: "MonsterField", index: i };
                break;
            }
        }
    }

    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i] && state.field.extraMonsterZones[i]?.materials) {
            const materialIndex = state.field.extraMonsterZones[i]!.materials.findIndex(
                (material) => material.id === card.id
            );
            if (materialIndex !== -1) {
                state.field.extraMonsterZones[i]!.materials.splice(materialIndex, 1);
                result = { location: "MonsterField", index: i + 5 };
                break;
            }
        }
    }

    // equipment
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i] && state.field.monsterZones[i]?.equipment) {
            const equipmentIndex = state.field.monsterZones[i]!.equipment.findIndex(
                (equipment) => equipment.id === card.id
            );
            if (equipmentIndex !== -1) {
                state.field.monsterZones[i]!.equipment.splice(equipmentIndex, 1);
                result.equipCard = state.field.monsterZones[i]!;
                break;
            }
        }
    }

    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i] && state.field.extraMonsterZones[i]?.equipment) {
            const equipmentIndex = state.field.extraMonsterZones[i]!.equipment.findIndex(
                (equipment) => equipment.id === card.id
            );
            if (equipmentIndex !== -1) {
                state.field.extraMonsterZones[i]!.equipment.splice(equipmentIndex, 1);
                result.equipCard = state.field.monsterZones[i]!;
                break;
            }
        }
    }
    return result;
};

// Destroy a card by battle (triggers onDestroyByBattle effect)
export const destroyByBattle = (state: GameStore, card: CardInstance, to: Location = "Graveyard") => {
    // Trigger battle destruction effect before moving the card
    if (card.card.effect.onDestroyByBattle) {
        card.card.effect.onDestroyByBattle(state, card);
    }

    // Send the card to the specified location (usually graveyard)
    sendCard(state, card, to);
};

// Destroy a card by effect (triggers onDestroyByEffect effect)
export const destroyByEffect = (state: GameStore, card: CardInstance, to: Location = "Graveyard") => {
    sendCard(state, card, to);
    // Trigger effect destruction effect before moving the card
    if (card.card.effect.onDestroyByEffect) {
        card.card.effect.onDestroyByEffect(state, card);
    }

    // Send the card to the specified location (usually graveyard)
};

export const banish = (state: GameStore, card: CardInstance) => {
    const from = excludeFromAnywhere(state, card);
    state.currentFrom = { ...from, position: card.position };
    const banishedCard = { ...card, location: "Exclusion" as const };
    state.currentTo = { location: "Exclusion" };
    state.banished.push(banishedCard);
};

export const randomExtractDeck = (state: GameStore, excludeNum: number) => {
    const target = Array.from({ length: state.extraDeck.length })
        .map((_, i) => ({ i, rand: Math.random() }))
        .sort((a, b) => a.rand - b.rand)
        .slice(0, excludeNum)
        .map((e) => e.i);
    const targetCardList = state.extraDeck.filter((_, i) => target.includes(i));
    return targetCardList;
};

export const getHandIndex = (state: GameStore, card: CardInstance) => {
    if (card.location === "Hand") {
        for (let i = 0; i < state.hand.length; i++) {
            if (state.hand[i].id === card.id) {
                return { index: i, length: state.hand.length };
            }
        }
    }
};

export const summon = (
    state: GameStore,
    monster: CardInstance,
    zone: number,
    position: Position,
    option?: { summonedBy?: SummonedBy }
) => {
    // Remove from current location

    sendCard(state, { ...monster, ...(option?.summonedBy ? { summonedBy: option.summonedBy } : {}) }, "MonsterField", {
        position,
        zone,
    });
    // Create summoned monster instance with extensible arrays
    const summonedMonster = {
        ...monster,
        position,
        location: "MonsterField" as const,
        summonedBy: option?.summonedBy ?? ("Special" as const),
        equipment: [...(monster.equipment || [])],
        materials: [...(monster.materials || [])],
    };
    if (summonedMonster.position === "attack" || summonedMonster.position === "defense") {
        withDelay(state, summonedMonster, { order: 2000, delay: 100 }, (state, monster) => {
            if (monster.card.effect?.onSummon) {
                const result = monster.card.effect?.onSummon?.(state, monster);
                if (result !== false) {
                    withDelay(state, monster, {}, (state, monster) => {
                        notifyCardEffect(state, monster, "onCardEffect");
                    });
                }
            }
        });
    }
    return summonedMonster;
};

export const putMagicCounter = (state: GameStore, card: CardInstance, counterNum: number) => {
    for (let i = 0; i < state.field.monsterZones.length; i++) {
        if (state.field.monsterZones[i]?.id === card.id) {
            state.field.monsterZones[i]!.magicCounter = (state.field.monsterZones[i]?.magicCounter ?? 0) + counterNum;
            return;
        }
    }

    for (let i = 0; i < state.field.extraMonsterZones.length; i++) {
        if (state.field.extraMonsterZones[i]?.id === card.id) {
            state.field.extraMonsterZones[i]!.magicCounter =
                (state.field.extraMonsterZones[i]?.magicCounter ?? 0) + counterNum;
            return;
        }
    }

    // Remove from spell/trap zones
    for (let i = 0; i < state.field.spellTrapZones.length; i++) {
        if (state.field.spellTrapZones[i]?.id === card.id && state.field.spellTrapZones[i]?.position !== "back") {
            state.field.spellTrapZones[i]!.magicCounter =
                (state.field.spellTrapZones[i]!.magicCounter ?? 0) + counterNum;
            return;
        }
    }

    // Remove from field zone
    if (state.field.fieldZone?.id === card.id && state.field.fieldZone.position !== "back") {
        state.field.fieldZone.magicCounter = (state.field.fieldZone?.magicCounter ?? 0) + counterNum;
        return;
    }
};
