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
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");

function CEchangeFly() {
    var ChangeFlyAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length != 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_FLY ACTION: Invalid actionLine format! CORRECT FORMAT: change_fly: <player_name>;<CURRENT|GLOBAL>;<true|false>");
                return;
            }

            var playerName = args[0];
            var action = args[1].toUpperCase();
            var value = args[2].toLowerCase() === "true";

            var targetPlayer = Bukkit.getPlayer(playerName);

            if (targetPlayer == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_FLY ACTION: Player not found: " + playerName);
                return;
            }

            switch (action) {
                case "CURRENT":
                    targetPlayer.setFlying(value);
                    break;
                case "GLOBAL":
                    targetPlayer.setAllowFlight(value);
                    if (value) {
                        targetPlayer.setFlying(true);
                    } else {
                        targetPlayer.setFlying(false);
                    }
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_FLY ACTION: Invalid action: " + action + ". Use 'CURRENT' or 'GLOBAL'.");
            }
        }
    });

    var changeFlyInstance = new ChangeFlyAction("change_fly");

    return changeFlyInstance;
}

CEchangeFly();