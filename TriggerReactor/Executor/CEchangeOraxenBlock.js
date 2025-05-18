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
var Location = Java.type("org.bukkit.Location");
var oraxenPlugin = Bukkit.getPluginManager().getPlugin("Oraxen");

function CEchangeOraxenBlock() {
    if (!oraxenPlugin) {
        Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Action was skipped because Oraxen plugin is missing!");
        return;
    } else {
        var oraxenBlock = Java.type("io.th0rgal.oraxen.api.OraxenBlocks");
        var ChangeOraxenBlockAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length < 3) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Invalid actionLine format! CORRECT FORMAT: change_oraxen_block: <mode (may be SET or REMOVE)>;<world,x,y,z>;<block_id (in case of SET) or forceDrop(true|false, in case of REMOVE)>;(optional, only in case of REMOVE) <player>");
                    return;
                }

                var mode = args[0].trim().toUpperCase();
                var locParts = args[1].split(",");
                var id = mode === "SET" ? args[2] : null;
                var forceDrop = mode === "REMOVE" ? args[2] === "true" : null;
                var playerName = mode === "REMOVE" ? args[3] : undefined;
                
                if (locParts.length !== 4) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Invalid location.");
                    return;
                }

                var worldName = locParts[0].trim();
                var x = parseFloat(locParts[1].trim());
                var y = parseFloat(locParts[2].trim());
                var z = parseFloat(locParts[3].trim());
                				
                var world = null;
                var location = null;
                try {
                    world = Bukkit.getWorld(worldName);
                    location = new Location(world, x, y, z);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Invalid location.");
                    return;
                }
                
                if (!location) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Invalid location.");
                    return;
                }
                
                switch (mode) {
                    case "SET":
                        try {
                            if (!id) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Invalid OraxenBlock id.");
                            	return;
                            }
                            
                            oraxenBlock.place(id, location);
                            break;
                        } catch (e) {
                    		Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Invalid OraxenBlock id.");
                            return;
                		}
                    case "REMOVE":
                        try {
                            var targetPlayer = Bukkit.getPlayer(playerName);
                            oraxenBlock.remove(location, targetPlayer, forceDrop);
                            break;
                        } catch (e) {
                    		Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Removing failed (perhaps it is not Oraxen block?).");
                            return;
                		}
                    default:
                        Bukkit.getLogger().warning("[CEActions] CHANGE_ORAXEN_BLOCK ACTION: Invalid mode, use SET or REMOVE.");
                        return;
                }
            }
        });

        var changeOraxenBlockInstance = new ChangeOraxenBlockAction("change_oraxen_block");
        
        return changeOraxenBlockInstance;
    }
}

CEchangeOraxenBlock();