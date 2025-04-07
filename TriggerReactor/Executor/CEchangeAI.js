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

function CEchangeAI() {
    var ChangeAIAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length != 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AI ACTION: Invalid actionLine format! CORRECT FORMAT: change_ai: <entity_uuid|player_name>;<true|false>");
                return;
            }

            var targetIdentifier = args[0].trim();
            var aiState = args[1].trim().toLowerCase();
            
            if (aiState !== "true" && aiState !== "false") {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AI ACTION: Invalid AI state value: " + aiState);
                return;
            }

            var target = Bukkit.getPlayer(targetIdentifier);
            if (target == null) {
                var worldEntities = [];
                var worlds = Bukkit.getWorlds();
                for (var i = 0; i < worlds.length; i++) {
                    var entities = worlds[i].getEntities();
                    for (var j = 0; j < entities.length; j++) {
                        worldEntities.push(entities[j]);
                    }
                }
                
                for (var k = 0; k < worldEntities.length; k++) {
                    if (worldEntities[k].getUniqueId().toString() === targetIdentifier) {
                        target = worldEntities[k];
                        break;
                    }
                }
            }
            
            if (target == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AI ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }
            
            if (target.hasMetadata && target.hasMetadata("NPC")) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AI ACTION: Target appears to be an NPC and AI cannot be modified.");
                return;
            }

            if (target.setAI) {
                target.setAI(aiState === "true");
            } else {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AI ACTION: Target entity does not support AI modification.");
            }
        }
    });

    var changeAIInstance = new ChangeAIAction("change_AI");

    return changeAIInstance;
}

CEchangeAI();