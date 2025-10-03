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
var UUID = Java.type("java.util.UUID");

function CEchangeEntities() {
    var ChangeEntitiesAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length != 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ENTITIES ACTION: Invalid actionLine format! CORRECT FORMAT: change_entities: <entity_uuids|player_names>;<kill|remove>");
                return;
            }

            var targetIdentifiers = args[0].split(",");
            var action = args[1].toLowerCase();

            if (action !== "kill" && action !== "remove") {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ENTITIES ACTION: Invalid action: " + action);
                return;
            }

            targetIdentifiers.forEach(function(targetIdentifier) {
                var targetEntity = null;
                try {
                    targetEntity = Bukkit.getEntity(UUID.fromString(targetIdentifier));
                } catch (e) {
                    targetEntity = Bukkit.getPlayer(targetIdentifier);
                }

                if (targetEntity == null) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ENTITIES ACTION: Target entity or player not found: " + targetIdentifier);
                    return;
                }

                switch (action) {
                    case "kill":
                        if (targetEntity instanceof org.bukkit.entity.Damageable) {
                            var livingEntity = targetEntity;
                            livingEntity.damage(livingEntity.getHealth());
                        } else {
                            targetEntity.remove();
                        }
                        break;

                    case "remove":
                        targetEntity.remove();
                        break;
                }
            });
        }
    });

    var changeEntitiesInstance = new ChangeEntitiesAction("change_entities");

    return changeEntitiesInstance;
}

CEchangeEntities();