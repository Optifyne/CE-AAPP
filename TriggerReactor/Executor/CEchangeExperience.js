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

function CEchangeExperience() {
    var ChangeExperienceAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_EXPERIENCE ACTION: Invalid format! Use: change_experience: <player_name>;<action (may be SET, ADD, REMOVE, MULTIPLY, DIVIDE or RESET)>;<value>");
                return;
            }

            var targetPlayer = Bukkit.getPlayer(args[0].trim());
            if (!targetPlayer) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_EXPERIENCE ACTION: Target player not found: " + args[0]);
                return;
            }

            var action = args[1].trim().toUpperCase();
            var value = parseFloat(args[2]);
            
            if (isNaN(value)) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_EXPERIENCE ACTION: Invalid value: " + value);
                return;
            }
            
            var cur = targetPlayer.getExp() * 100;
            switch (action) {
                case "SET":
                    break;
                case "ADD":
                    value = cur + value;
                    break;
                case "REMOVE":
                    value = cur - value;
                    break;
                case "MULTIPLY":
                    value = cur * value;
                    break;
                case "DIVIDE":
                    if (value === 0) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_EXPERIENCE ACTION: Cannot divide by zero!");
                        return;
                    }
                    value = cur / value;
                    break;
                case "RESET":
                    value = 0;
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_EXPERIENCE ACTION: Invalid action: " + action);
                    return;
            }
            
            value = value / 100;
            if (value < 0) value = 0;
            if (value > 1) value = 1;
            targetPlayer.setExp(value);
        }
    });

    var changeExperienceInstance = new ChangeExperienceAction("change_experience");

    return changeExperienceInstance;
}

CEchangeExperience();