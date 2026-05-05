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
var UUID = Java.type("java.util.UUID");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");

function CEchangeVisibility() {
    var ChangeVisibilityAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_VISIBILITY ACTION: Invalid format! Use: change_visibility: <player_name>;<action (SHOW or HIDE)>;<entity_uuids|player_names (may be many through comma, entities only from 1.18+, otherwise only players)>");
                return;
            }

            var targetPlayer = Bukkit.getPlayer(args[0].trim());
            if (!targetPlayer) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_VISIBILITY ACTION: Target player not found: " + args[0]);
                return;
            }

            var action = args[1].trim().toUpperCase();
            var entityList = args[2].split(",");
            var plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");

            entityList.forEach(function(id) {
                id = id.trim();
                var entity = null;

                try {
                    entity = Bukkit.getEntity(UUID.fromString(id));
                } catch (e) {
                    entity = Bukkit.getPlayer(id);
                }

                if (!entity) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_VISIBILITY ACTION: Entity not found: " + id);
                    return;
                }
				
                try {
                    switch (action) {
                        case "HIDE":
                        	targetPlayer.hideEntity ? targetPlayer.hideEntity(plugin, entity) : targetPlayer.hidePlayer(plugin, entity);
                            break;
                        case "SHOW":
                        	targetPlayer.showEntity ? targetPlayer.showEntity(plugin, entity) : targetPlayer.showPlayer(plugin, entity);
                            break;
                        default:
                        	Bukkit.getLogger().warning("[CEActions] CHANGE_VISIBILITY ACTION: Unknown action: " + action);
                            return;
                    }
                } catch (e) {}
            });
        }
    });

    var changeVisibilityInstance = new ChangeVisibilityAction("change_visibility");

    return changeVisibilityInstance;
}

CEchangeVisibility();