import { useAtom } from "jotai";
import { hoveredCardAtom } from "@/store/hoveredCardAtom";
import { getAttack, getDefense, getLevel } from "@/utils/gameUtils";
import { hasLevelMonsterFilter, isLinkMonster, isXyzMonster, monsterFilter, isMagicCard } from "@/utils/cardManagement";
import { getMonsterEquippedWith } from "@/utils/cardMovement";
import { useGameStore } from "@/store/gameStore";
export const HoveredCardDisplay = () => {
    const [hoveredCard] = useAtom(hoveredCardAtom);
    const gameState = useGameStore();
    const isBattleField = hoveredCard?.location === "MonsterField";
    return (
        <div className={`flex-1 flex flex-row justify-center h-[668px] w-[240px] mt-6 px-8`}>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-4 border-2 border-gray-300 h-full flex-1">
                {hoveredCard ? (
                    <>
                        {/* カード画像 */}
                        <div className="flex justify-center mb-4">
                            <img
                                src={
                                    hoveredCard.card.image
                                        ? `/yu-gi-oh-1-kill-simulator/card_image/${hoveredCard.card.image}`
                                        : ""
                                }
                                alt={hoveredCard.card.card_name}
                                className="w-40 h-auto rounded-lg shadow-md"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        </div>

                        {/* カード情報 */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-800 text-center">
                                {hoveredCard.card.card_name}
                            </h3>

                            <div className="text-sm text-gray-600 text-center">{hoveredCard.card.card_type}</div>

                            {/* モンスターカードの場合 */}
                            {monsterFilter(hoveredCard.card) && (
                                <div className="text-sm text-gray-700 text-center">
                                    <div className="flex flex-row justify-center">
                                        <div
                                            className={`${
                                                isBattleField && hoveredCard.buf.level > 0
                                                    ? "text-blue-600"
                                                    : hoveredCard.buf.level < 0
                                                    ? "text-red-500"
                                                    : ""
                                            }`}
                                        >
                                            {hasLevelMonsterFilter(hoveredCard.card) &&
                                                hoveredCard.card &&
                                                hoveredCard.card.level &&
                                                `レベル: ${getLevel(hoveredCard)} `}
                                        </div>
                                        <div>
                                            {isXyzMonster(hoveredCard.card) &&
                                                hoveredCard.card.rank &&
                                                `ランク: ${hoveredCard.card.rank} `}
                                        </div>
                                        {isLinkMonster(hoveredCard.card) &&
                                            hoveredCard.card.link &&
                                            `リンク: ${hoveredCard.card.link} `}
                                    </div>
                                    {monsterFilter(hoveredCard.card) &&
                                        hoveredCard.card.element &&
                                        `属性: ${hoveredCard.card.element} `}
                                    {monsterFilter(hoveredCard.card) &&
                                        hoveredCard.card.race &&
                                        `種族: ${hoveredCard.card.race}`}
                                    <div className="flex flex-row justify-center">
                                        <div
                                            className={`px-2 ${
                                                "attack" in hoveredCard.card && isBattleField
                                                    ? getAttack(hoveredCard) > hoveredCard.card.attack
                                                        ? "text-blue-600"
                                                        : getAttack(hoveredCard) < hoveredCard.card.attack
                                                        ? "text-red-500"
                                                        : ""
                                                    : ""
                                            }`}
                                        >
                                            {"attack" in hoveredCard.card &&
                                                hoveredCard.card.attack !== undefined &&
                                                `ATK: ${
                                                    isBattleField ? getAttack(hoveredCard) : hoveredCard.card.attack
                                                } `}
                                        </div>
                                        <div
                                            className={`px-2 ${
                                                hoveredCard.buf.defense > 0
                                                    ? "text-blue-600"
                                                    : hoveredCard.buf.defense < 0
                                                    ? "text-red-500"
                                                    : ""
                                            }`}
                                        >
                                            {"defense" in hoveredCard.card
                                                ? `DEF: ${
                                                      isBattleField ? getDefense(hoveredCard) : hoveredCard.card.defense
                                                  }`
                                                : ""}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* エクシーズモンスターのエクシーズ素材情報 */}
                            {isXyzMonster(hoveredCard.card) &&
                                hoveredCard.materials &&
                                hoveredCard.materials.length > 0 && (
                                    <div className="text-sm text-gray-700 border-t pt-2">
                                        <div className="font-semibold mb-2 text-center">エクシーズ素材:</div>
                                        <div className="space-y-1">
                                            {hoveredCard.materials.map((material) => (
                                                <div
                                                    key={material.id}
                                                    className="text-xs bg-gray-100 rounded px-2 py-1"
                                                >
                                                    {material.card.card_name}
                                                    {monsterFilter(material.card) && "attack" in material.card && (
                                                        <span className="ml-2 text-gray-500">
                                                            ATK: {material.card.attack}
                                                            {"defense" in material.card &&
                                                                ` / DEF: ${material.card.defense}`}
                                                            {hasLevelMonsterFilter(material.card) &&
                                                                ` / LV: ${material.card.level}`}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* モンスターの装備カード情報 */}
                            {monsterFilter(hoveredCard.card) &&
                                hoveredCard.equipment &&
                                hoveredCard.equipment.length > 0 && (
                                    <div className="text-sm text-gray-700 border-t pt-2">
                                        <div className="font-semibold mb-2 text-center">装備カード:</div>
                                        <div className="space-y-1">
                                            {hoveredCard.equipment.map((equipment) => (
                                                <div
                                                    key={equipment.id}
                                                    className="text-xs bg-blue-100 rounded px-2 py-1"
                                                >
                                                    {equipment.card.card_name}
                                                    {isMagicCard(equipment.card) && (
                                                        <span className="ml-2 text-gray-500">装備魔法</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* 装備カードが装備しているモンスター情報 */}
                            {isMagicCard(hoveredCard.card) &&
                                hoveredCard.card.magic_type === "装備魔法" &&
                                (() => {
                                    const equippedMonster = getMonsterEquippedWith(gameState, hoveredCard);
                                    return equippedMonster ? (
                                        <div className="text-sm text-gray-700 border-t pt-2">
                                            <div className="font-semibold mb-2 text-center">装備対象:</div>
                                            <div className="space-y-1">
                                                <div className="text-xs bg-green-100 rounded px-2 py-1">
                                                    {equippedMonster.card.card_name}
                                                    {monsterFilter(equippedMonster.card) &&
                                                        "attack" in equippedMonster.card && (
                                                            <span className="ml-2 text-gray-500">
                                                                ATK: {equippedMonster.card.attack}
                                                                {"defense" in equippedMonster.card &&
                                                                    ` / DEF: ${equippedMonster.card.defense}`}
                                                                {hasLevelMonsterFilter(equippedMonster.card) &&
                                                                    ` / LV: ${equippedMonster.card.level}`}
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                            {/* カードテキスト */}
                            <div className="text-[14px] text-gray-600 max-h-60 overflow-y-scroll border-t pt-2 whitespace-pre-wrap">
                                {hoveredCard.card.text}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-lg">カードの情報を表示します</p>
                    </div>
                )}
            </div>
        </div>
    );
};
