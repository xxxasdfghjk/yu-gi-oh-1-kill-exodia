import type { CardInstance, Element, Race } from "@/types/card";
import { isFusionMonster, isMagicCard, isTrapCard, monsterFilter } from "./cardManagement";
import { getLevel } from "./gameUtils";

export class CardInstanceFilter<T extends (CardInstance | null)[]> {
    private cardList: T;
    constructor(cardList: T) {
        this.cardList = cardList;
    }

    monster() {
        const monsterList = this.cardList.filter((e): e is CardInstance => e !== null && monsterFilter(e.card));
        return new CardInstanceFilter<CardInstance[]>(monsterList);
    }

    race(race: Race) {
        const monsterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.race === race
        );
        return new CardInstanceFilter<CardInstance[]>(monsterList);
    }

    level(level: number) {
        const leveledMonterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && getLevel(e) === level
        );
        return new CardInstanceFilter<CardInstance[]>(leveledMonterList);
    }

    hasLevel() {
        const leveledMonterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.hasLevel
        );
        return new CardInstanceFilter<CardInstance[]>(leveledMonterList);
    }

    upperLevel(level: number) {
        const leveledMonterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && getLevel(e) >= level
        );
        return new CardInstanceFilter<CardInstance[]>(leveledMonterList);
    }

    underLevel(level: number) {
        const leveledMonterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && getLevel(e) <= level && 0 <= getLevel(e)
        );
        return new CardInstanceFilter<CardInstance[]>(leveledMonterList);
    }

    fusionMonster() {
        const monsterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && isFusionMonster(e.card)
        );
        return new CardInstanceFilter<CardInstance[]>(monsterList);
    }

    spellOrTrap() {
        const spellOrTrapList = this.cardList.filter((e): e is CardInstance => e !== null && isMagicCard(e.card));
        return new CardInstanceFilter<CardInstance[]>(spellOrTrapList);
    }

    magic() {
        const magicList = this.cardList.filter((e): e is CardInstance => e !== null && isMagicCard(e.card));
        return new CardInstanceFilter<CardInstance[]>(magicList);
    }

    trap() {
        const trapList = this.cardList.filter((e): e is CardInstance => e !== null && isTrapCard(e.card));
        return new CardInstanceFilter<CardInstance[]>(trapList);
    }

    equipSpell() {
        const magicList = this.cardList.filter(
            (e): e is CardInstance => e !== null && isMagicCard(e.card) && e.card.magic_type === "装備魔法"
        );
        return new CardInstanceFilter<CardInstance[]>(magicList);
    }

    nonNull() {
        const nonNull = this.cardList.filter((e): e is CardInstance => e !== null);
        return new CardInstanceFilter<CardInstance[]>(nonNull);
    }

    canNormalSummon() {
        const nonNull = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.canNormalSummon
        );
        return new CardInstanceFilter<CardInstance[]>(nonNull);
    }

    noSummonLimited() {
        const limited = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.summonLimited !== true
        );
        return new CardInstanceFilter<CardInstance[]>(limited);
    }

    null() {
        const nullList = this.cardList.filter((e): e is null => e === null);
        return new CardInstanceFilter<null[]>(nullList);
    }

    element(element: Element) {
        const list = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.element === element
        );
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    lightsworn() {
        const list = this.cardList.filter(
            (e): e is CardInstance =>
                e !== null && (e.card.card_name.includes("ライトロード") || e.card.card_name.includes("光道の龍"))
        );
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    include(str: string) {
        const list = this.cardList.filter((e): e is CardInstance => e !== null && e.card.card_name.includes(str));
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    excludeId(id: string) {
        const list = this.cardList.filter((e): e is CardInstance => e !== null && e.id !== id);
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    exclude(name: string) {
        const list = this.cardList.filter((e): e is CardInstance => e !== null && !e.card.card_name.includes(name));
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    faceup() {
        const list = this.cardList.filter(
            (e): e is CardInstance => e !== null && (e.position === "attack" || e.position === "defense")
        );
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    hasAttackBelow(attack: number) {
        const list = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.attack <= attack
        );
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    unique() {
        const nonNull = this.cardList.filter((e) => e !== null);
        const unique = Array.from(new Map(nonNull.map((e) => [e?.card.card_name, e])).values());
        return new CardInstanceFilter<CardInstance[]>(unique);
    }

    len() {
        return this.cardList.length;
    }

    get() {
        return this.cardList;
    }

    clone() {
        return [...this.cardList];
    }
}
