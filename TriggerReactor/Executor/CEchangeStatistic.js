/*******************************************************************************
 *     Copyright (c) 2023 TriggerReactor Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var OfflinePlayer = Java.type("org.bukkit.OfflinePlayer");
var Material = Java.type("org.bukkit.Material");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var Statistic = Java.type("org.bukkit.Statistic");

function CEchangeStatistic() {
    var ChangeStatisticAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 5) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Invalid actionLine format! CORRECT FORMAT: change_statistic: <player (may be offline)>;<statistic_name (for example: KILL_ENTITY)>;<argument (where needed, for example: ZOMBIE)>;<new_value (for example: 100)>;<operation (may be SET, ADD, REMOVE, MULTIPLY, DIVIDE AND RESET)>");
                return;
            }

            var targetName = args[0].trim();
            var statName = args[1].trim();
            var arg = args[2].trim();
            var value = parseInt(args[3].trim());
            var operation = args[4].trim().toUpperCase();

            var targetPlayer = Bukkit.getPlayer(targetName);
            if (targetPlayer == null) {
                targetPlayer = Bukkit.getOfflinePlayer(targetName);
                if (!targetPlayer.hasPlayedBefore()) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Player '" + targetName + "' not found!");
                    return;
                }
            }

            var statistic;
            try {
                statistic = Statistic.valueOf(statName);
            } catch (e) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Statistic '" + statName + "' does not exist!");
                return;
            }

            var statType = statistic.getType();
            var argObject = null;

            switch (statType) {
                case Statistic.Type.BLOCK:
                    if (!Material[arg] || !Material[arg].isBlock()) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Invalid block type '" + arg + "' for statistic '" + statName + "'.");
                        return;
                    }
                    argObject = Material.valueOf(arg);
                    break;

                case Statistic.Type.ITEM:
                    if (!Material[arg]) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Invalid item type '" + arg + "' for statistic '" + statName + "'.");
                        return;
                    }
                    argObject = Material.valueOf(arg);
                    break;

                case Statistic.Type.ENTITY:
                    try {
                        argObject = EntityType.valueOf(arg);
                    } catch (e) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Invalid entity type '" + arg + "' for statistic '" + statName + "'.");
                        return;
                    }
                    break;

                default:
                    break;
            }

            this.applyOperation(targetPlayer, statistic, argObject, value, operation);
        },

        applyOperation: function(player, statistic, arg, value, operation) {
            var currentValue;

            if (arg) {
                currentValue = player.getStatistic(statistic, arg);
            } else {
                currentValue = player.getStatistic(statistic);
            }

            var newValue;

            switch (operation) {
                case "SET":
                    newValue = Math.max(0, value);
                    break;
                case "ADD":
                    newValue = Math.max(0, currentValue + value);
                    break;
                case "REMOVE":
                    newValue = Math.max(0, currentValue - value);
                    break;
                case "MULTIPLY":
                    newValue = Math.max(0, currentValue * value);
                    break;
                case "DIVIDE":
                    if (value != 0) {
                        newValue = Math.max(0, Math.floor(currentValue / value));
                    } else {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Cannot divide by zero!");
                        return;
                    }
                    break;
                case "RESET":
                    newValue = 0;
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_STATISTIC ACTION: Invalid operation: " + operation);
                    return;
            }

            if (arg) {
                player.setStatistic(statistic, arg, newValue);
            } else {
                player.setStatistic(statistic, newValue);
            }

        }
    });

    var changeStatisticInstance = new ChangeStatisticAction("change_statistic");
    return changeStatisticInstance;
}

CEchangeStatistic();